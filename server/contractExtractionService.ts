/**
 * Contract Extraction Service
 * Automatically extracts data from contract PDFs using LLM
 */

import { invokeLLM } from "./_core/llm";
import { readFileSync, statSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
const pdf = PDFParse;

/**
 * PDF validation result
 */
interface PDFValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'CORRUPTED_PDF' | 'EMPTY_FILE';
}

/**
 * Validate PDF file format and structure
 * Checks:
 * - Magic bytes (%PDF-)
 * - File size (max 50MB)
 * - Basic PDF structure (%%EOF)
 */
export function validatePDF(pdfPath: string): PDFValidationResult {
  try {
    // Check if file exists and get size
    const stats = statSync(pdfPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Check file size (max 50MB)
    const MAX_FILE_SIZE_MB = 50;
    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      return {
        valid: false,
        error: `Arquivo muito grande (${fileSizeInMB.toFixed(1)}MB). Tamanho máximo permitido: ${MAX_FILE_SIZE_MB}MB`,
        errorCode: 'FILE_TOO_LARGE'
      };
    }
    
    // Check if file is empty
    if (stats.size === 0) {
      return {
        valid: false,
        error: 'Arquivo vazio',
        errorCode: 'EMPTY_FILE'
      };
    }
    
    // Read first 1KB and last 1KB for validation
    const buffer = readFileSync(pdfPath);
    const header = buffer.slice(0, Math.min(1024, buffer.length)).toString('utf-8');
    const footer = buffer.slice(Math.max(0, buffer.length - 1024)).toString('utf-8');
    
    // Check PDF magic bytes (%PDF-)
    if (!header.startsWith('%PDF-')) {
      return {
        valid: false,
        error: 'Formato de arquivo inválido. Apenas arquivos PDF são permitidos.',
        errorCode: 'INVALID_FORMAT'
      };
    }
    
    // Check for PDF end marker (%%EOF)
    if (!footer.includes('%%EOF')) {
      return {
        valid: false,
        error: 'Arquivo PDF corrompido ou incompleto. Falta marcador de fim de arquivo.',
        errorCode: 'CORRUPTED_PDF'
      };
    }
    
    return { valid: true };
    
  } catch (error) {
    return {
      valid: false,
      error: `Erro ao validar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      errorCode: 'CORRUPTED_PDF'
    };
  }
}

interface ExtractedContractData {
  contractCode: string;
  projectName: string;
  projectCode?: string;
  location: string;
  contractDate?: string;
  
  client: {
    name: string;
    nif?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    email?: string;
    phone?: string;
  };
  
  projectDescription?: {
    type: string;
    scope: string[];
    program?: {
      description: string;
      buildingArea?: string;
      plotArea?: string;
    };
  };
  
  phases: Array<{
    phase: number;
    name: string;
    deadline?: string;
    deliverables?: string[];
    description?: string;
  }>;
  
  financialTerms: {
    values: {
      totalGlobal: number;
      currency: string;
      vat?: string;
      breakdown?: Record<string, any>;
    };
    paymentTerms: Array<{
      installment: number;
      description: string;
      percentage: number;
      amount: number;
    }>;
    paymentMethod?: {
      type: string;
      iban?: string;
      beneficiary?: string;
      terms?: string;
    };
  };
  
  contractTerms?: {
    validity?: string;
    approvalDeadline?: string;
    penaltyClause?: string;
    rescissionTerms?: string[];
  };
  
  inclusions?: string[];
  exclusions?: string[];
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  const dataBuffer = readFileSync(pdfPath);
  const parser = new pdf({ data: dataBuffer });
  const result = await parser.getText();
  await parser.destroy(); // Clean up resources
  return result.text;
}

/**
 * Extract contract data from PDF using LLM
 */
export async function extractContractData(pdfPath: string): Promise<ExtractedContractData> {
  // Validate PDF before processing
  const validation = validatePDF(pdfPath);
  if (!validation.valid) {
    throw new Error(validation.error || 'Arquivo PDF inválido');
  }
  
  // Extract text from PDF
  const pdfText = await extractTextFromPDF(pdfPath);
  
  // Use LLM to extract structured data
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `És um assistente especializado em extrair dados estruturados de contratos de arquitetura e engenharia em português.
        
Extrai os seguintes dados do contrato:
1. Código do contrato (ex: POP.001.2025)
2. Nome do projeto
3. Código do projeto (se mencionado, ex: GA00485)
4. Localização do projeto
5. Data do contrato
6. Dados completos do cliente (nome, NIF, morada, código postal, cidade, email, telefone)
7. Descrição do projeto (tipo, âmbito, programa funcional com áreas)
8. Fases do projeto (número, nome, prazo, entregáveis)
9. Termos financeiros (valor total, moeda, IVA, breakdown de valores, condições de pagamento com percentagens e valores)
10. Método de pagamento (tipo, IBAN, beneficiário)
11. Termos contratuais (validade, prazo de aprovação, cláusulas de penalização, condições de rescisão)
12. Inclusões e exclusões

Responde APENAS com um objeto JSON válido, sem texto adicional.`
      },
      {
        role: "user",
        content: `Extrai os dados estruturados deste contrato:\n\n${pdfText}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "contract_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            contractCode: { type: "string" },
            projectName: { type: "string" },
            projectCode: { type: "string" },
            location: { type: "string" },
            contractDate: { type: "string" },
            client: {
              type: "object",
              properties: {
                name: { type: "string" },
                nif: { type: "string" },
                address: { type: "string" },
                postalCode: { type: "string" },
                city: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" }
              },
              required: ["name"],
              additionalProperties: false
            },
            projectDescription: {
              type: "object",
              properties: {
                type: { type: "string" },
                scope: { type: "array", items: { type: "string" } },
                program: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    buildingArea: { type: "string" },
                    plotArea: { type: "string" }
                  },
                  required: [],
                  additionalProperties: false
                }
              },
              required: ["type", "scope"],
              additionalProperties: false
            },
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "number" },
                  name: { type: "string" },
                  deadline: { type: "string" },
                  deliverables: { type: "array", items: { type: "string" } },
                  description: { type: "string" }
                },
                required: ["phase", "name"],
                additionalProperties: false
              }
            },
            financialTerms: {
              type: "object",
              properties: {
                values: {
                  type: "object",
                  properties: {
                    totalGlobal: { type: "number" },
                    currency: { type: "string" },
                    vat: { type: "string" },
                    breakdown: { type: "object", additionalProperties: true }
                  },
                  required: ["totalGlobal", "currency"],
                  additionalProperties: false
                },
                paymentTerms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      installment: { type: "number" },
                      description: { type: "string" },
                      percentage: { type: "number" },
                      amount: { type: "number" }
                    },
                    required: ["installment", "description", "percentage", "amount"],
                    additionalProperties: false
                  }
                },
                paymentMethod: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    iban: { type: "string" },
                    beneficiary: { type: "string" },
                    terms: { type: "string" }
                  },
                  required: [],
                  additionalProperties: false
                }
              },
              required: ["values", "paymentTerms"],
              additionalProperties: false
            },
            contractTerms: {
              type: "object",
              properties: {
                validity: { type: "string" },
                approvalDeadline: { type: "string" },
                penaltyClause: { type: "string" },
                rescissionTerms: { type: "array", items: { type: "string" } }
              },
              required: [],
              additionalProperties: false
            },
            inclusions: { type: "array", items: { type: "string" } },
            exclusions: { type: "array", items: { type: "string" } }
          },
          required: ["contractCode", "projectName", "location", "client", "phases", "financialTerms"],
          additionalProperties: false
        }
      }
    }
  });
  
  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Failed to extract contract data: empty response");
  }
  
  return JSON.parse(content) as ExtractedContractData;
}

/**
 * Apply extracted contract data to project
 */
export async function applyContractDataToProject(
  projectId: number,
  contractData: ExtractedContractData
): Promise<{
  projectUpdated: boolean;
  clientCreated: boolean;
  clientId?: number;
  phasesCreated: number;
  deliverablesCreated: number;
}> {
  const { getDb } = await import("./db");
  const { projects, clients, projectPhases, deliverables } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const db = getDb();
  
  // 1. Create or update client
  let clientId: number | undefined;
  let clientCreated = false;
  
  if (contractData.client.nif) {
    // Check if client exists by NIF
    const existingClients = await db
      .select()
      .from(clients)
      .where(eq(clients.nif, contractData.client.nif))
      .limit(1);
    
    if (existingClients.length > 0) {
      clientId = existingClients[0].id;
    }
  }
  
  if (!clientId) {
    // Create new client
    const [newClient] = await db.insert(clients).values({
      name: contractData.client.name,
      nif: contractData.client.nif || null,
      address: contractData.client.address || null,
      postalCode: contractData.client.postalCode || null,
      city: contractData.client.city || null,
      email: contractData.client.email || null,
      phone: contractData.client.phone || null,
      type: "private",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    clientId = newClient.id;
    clientCreated = true;
  }
  
  // 2. Update project with contract data
  await db.update(projects)
    .set({
      clientId: clientId,
      location: contractData.location,
      contractValue: contractData.financialTerms.values.totalGlobal,
      contractSignedDate: contractData.contractDate ? new Date(contractData.contractDate) : null,
      contractType: contractData.projectDescription?.type || null,
      contractNotes: JSON.stringify({
        paymentTerms: contractData.financialTerms.paymentTerms,
        paymentMethod: contractData.financialTerms.paymentMethod,
        contractTerms: contractData.contractTerms,
        inclusions: contractData.inclusions,
        exclusions: contractData.exclusions
      }),
      updatedAt: new Date()
    })
    .where(eq(projects.id, projectId));
  
  // 3. Create project phases
  let phasesCreated = 0;
  let deliverablesCreated = 0;
  
  for (const phase of contractData.phases) {
    const [createdPhase] = await db.insert(projectPhases).values({
      projectId: projectId,
      name: phase.name,
      description: phase.description || null,
      startDate: null,
      endDate: phase.deadline ? null : null, // Would need to calculate from deadline string
      status: "pending",
      order: phase.phase,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    phasesCreated++;
    
    // Create deliverables for this phase
    if (phase.deliverables && phase.deliverables.length > 0) {
      for (const deliverable of phase.deliverables) {
        await db.insert(deliverables).values({
          projectId: projectId,
          phaseId: createdPhase.id,
          name: deliverable,
          description: null,
          dueDate: null,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        deliverablesCreated++;
      }
    }
  }
  
  return {
    projectUpdated: true,
    clientCreated,
    clientId,
    phasesCreated,
    deliverablesCreated
  };
}
