import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { readFileSync } from "fs";
import { join } from "path";
import * as db from "./db";

export const importRouter = router({
  /**
   * Importar contratos do ficheiro JSON para a database
   */
  importContracts: protectedProcedure
    .input(z.object({
      dryRun: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ler dados extraídos
      const contractsPath = join(process.cwd(), 'contracts_extracted.json');
      const contractsData = JSON.parse(
        readFileSync(contractsPath, 'utf-8')
      );

      // Mapear status dos contratos para status de projetos
      const statusMap: Record<string, "planning" | "in_progress" | "on_hold" | "completed" | "cancelled"> = {
        'signed': 'in_progress',      // Assinado → Em progresso
        'in_progress': 'in_progress', // Em progresso → Em progresso
        'draft': 'planning'           // Rascunho → Planeamento
      };

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[],
        projects: [] as any[],
      };

      for (const contract of contractsData) {
        try {
          // Verificar se já existe projeto com este código
          const existing = await db.getAllProjects();
          const alreadyExists = existing.some(p => p.name.startsWith(contract.code));

          if (alreadyExists) {
            results.skipped++;
            continue;
          }

          const projectData = {
            name: `${contract.code} - ${contract.name}`,
            description: `Projeto ${contract.type}`,
            status: statusMap[contract.status as keyof typeof statusMap] || 'planning',
            priority: 'medium' as const,
            clientName: contract.client,
            location: contract.location,
            createdById: ctx.user.id,
            progress: contract.status === 'signed' ? 25 : 0,
          };

          if (!input.dryRun) {
            const inserted = await db.createProject(projectData);
            results.projects.push(inserted);
          } else {
            results.projects.push(projectData);
          }

          results.imported++;
        } catch (error: any) {
          results.errors.push(`${contract.code}: ${error.message}`);
        }
      }

      return results;
    }),
});
