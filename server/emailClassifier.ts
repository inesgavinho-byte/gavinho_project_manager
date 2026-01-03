import { invokeLLM } from "./_core/llm";

interface EmailClassificationResult {
  category: "order" | "adjudication" | "purchase" | "communication" | "other";
  confidence: number;
  reasoning: string;
  projectReferences: string[];
  suggestedActions: string[];
}

export class EmailClassifier {
  /**
   * Classify email using AI
   */
  async classifyEmail(
    subject: string,
    body: string,
    from: string,
    projectNames: string[]
  ): Promise<EmailClassificationResult> {
    const prompt = `Você é um assistente especializado em classificar e-mails de projetos de construção civil.

**E-mail para classificar:**
- Assunto: ${subject}
- De: ${from}
- Corpo: ${body.substring(0, 1000)}

**Projetos ativos:** ${projectNames.join(", ")}

**Categorias disponíveis:**
1. **order** (encomenda): E-mails sobre pedidos de materiais, equipamentos ou serviços
2. **adjudication** (adjudicação): E-mails sobre contratos, licitações, propostas aceitas
3. **purchase** (compra): E-mails sobre pagamentos, faturas, notas fiscais, cotações
4. **communication** (comunicação): E-mails sobre reuniões, atualizações, status, relatórios
5. **other** (outro): E-mails que não se encaixam nas categorias acima

Analise o e-mail e retorne a classificação em JSON.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um assistente especializado em classificar e-mails de projetos de construção civil. Sempre responda em JSON válido.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "email_classification",
            strict: true,
            schema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  enum: ["order", "adjudication", "purchase", "communication", "other"],
                  description: "Categoria do e-mail",
                },
                confidence: {
                  type: "number",
                  description: "Confiança da classificação (0-1)",
                },
                reasoning: {
                  type: "string",
                  description: "Explicação da classificação",
                },
                projectReferences: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Nomes de projetos mencionados no e-mail",
                },
                suggestedActions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Ações sugeridas baseadas no conteúdo",
                },
              },
              required: ["category", "confidence", "reasoning", "projectReferences", "suggestedActions"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("No response from AI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("[EmailClassifier] Error classifying email:", error);
      
      // Fallback to keyword-based classification
      return this.fallbackClassification(subject, body, projectNames);
    }
  }

  /**
   * Fallback classification using keywords
   */
  private fallbackClassification(
    subject: string,
    body: string,
    projectNames: string[]
  ): EmailClassificationResult {
    const content = `${subject} ${body}`.toLowerCase();

    // Keywords for each category
    const orderKeywords = ["pedido", "order", "encomenda", "solicitação", "requisição", "po ", "purchase order"];
    const adjudicationKeywords = ["adjudicação", "adjudication", "contrato", "contract", "acordo", "licitação", "proposta aceita"];
    const purchaseKeywords = ["compra", "purchase", "pagamento", "payment", "fatura", "invoice", "nota fiscal", "cotação", "orçamento"];
    const communicationKeywords = ["reunião", "meeting", "atualização", "update", "status", "progresso", "relatório", "report"];

    let category: EmailClassificationResult["category"] = "other";
    let confidence = 0.5;

    if (orderKeywords.some(keyword => content.includes(keyword))) {
      category = "order";
      confidence = 0.7;
    } else if (adjudicationKeywords.some(keyword => content.includes(keyword))) {
      category = "adjudication";
      confidence = 0.7;
    } else if (purchaseKeywords.some(keyword => content.includes(keyword))) {
      category = "purchase";
      confidence = 0.7;
    } else if (communicationKeywords.some(keyword => content.includes(keyword))) {
      category = "communication";
      confidence = 0.7;
    }

    // Find project references
    const projectReferences = projectNames.filter(name =>
      content.includes(name.toLowerCase())
    );

    return {
      category,
      confidence,
      reasoning: "Classificação baseada em palavras-chave",
      projectReferences,
      suggestedActions: [],
    };
  }

  /**
   * Batch classify multiple emails
   */
  async classifyBatch(
    emails: Array<{ subject: string; body: string; from: string }>,
    projectNames: string[]
  ): Promise<EmailClassificationResult[]> {
    const results: EmailClassificationResult[] = [];

    for (const email of emails) {
      const result = await this.classifyEmail(
        email.subject,
        email.body,
        email.from,
        projectNames
      );
      results.push(result);
    }

    return results;
  }
}

export const emailClassifier = new EmailClassifier();
