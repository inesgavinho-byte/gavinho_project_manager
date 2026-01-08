import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc.js";
import {
  getAllTags,
  getTagsByCategory,
  createTag,
  deleteTag,
  getAllMaterials,
  getMaterialById,
  searchMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getAll3DModels,
  get3DModelById,
  search3DModels,
  create3DModel,
  update3DModel,
  delete3DModel,
  getAllInspiration,
  getInspirationById,
  searchInspiration,
  createInspiration,
  updateInspiration,
  deleteInspiration,
  addMaterialToProject,
  listProjectMaterials,
  updateProjectMaterial,
  removeProjectMaterial,
  getProjectMaterialsCost,
  addModelToProject,
  listProjectModels,
  removeProjectModel,
  addInspirationToProject,
  listProjectInspiration,
  removeProjectInspiration,
  generateSuggestionsForProject,
  getProjectSuggestions,
  respondToSuggestion,
  getSuggestionStats,
  getSupplierComparison,
  getSupplierPriceAlerts,
  bulkImportMaterials,
  generateImportTemplate,
  type MaterialImportRow,
} from "./libraryDb.js";
import { storagePut } from "./storage.js";
import { TRPCError } from "@trpc/server";

export const libraryRouter = router({
  // ============================================================================
  // TAGS
  // ============================================================================
  
  // ============================================================================
  // PROJECT-LIBRARY ASSOCIATIONS
  // ============================================================================

  projectMaterials: router({
    add: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          materialId: z.number(),
          quantity: z.string(),
          unitPrice: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await addMaterialToProject({
          ...input,
          addedById: ctx.user.id,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await listProjectMaterials(input.projectId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          quantity: z.string().optional(),
          unitPrice: z.string().optional(),
          notes: z.string().optional(),
          status: z.enum(["planned", "ordered", "delivered", "installed"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProjectMaterial(id, data);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await removeProjectMaterial(input.id);
        return { success: true };
      }),

    totalCost: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getProjectMaterialsCost(input.projectId);
      }),
  }),

  projectModels: router({
    add: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          modelId: z.number(),
          location: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await addModelToProject({
          ...input,
          addedById: ctx.user.id,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await listProjectModels(input.projectId);
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await removeProjectModel(input.id);
        return { success: true };
      }),
  }),

  projectInspiration: router({
    add: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          inspirationId: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await addInspirationToProject({
          ...input,
          addedById: ctx.user.id,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await listProjectInspiration(input.projectId);
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await removeProjectInspiration(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // TAGS
  // ============================================================================
  
  tags: router({
    list: protectedProcedure
      .query(async () => {
        return await getAllTags();
      }),
    
    listByCategory: protectedProcedure
      .input(z.object({
        category: z.enum(["material", "model", "inspiration", "general"]),
      }))
      .query(async ({ input }) => {
        return await getTagsByCategory(input.category);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.enum(["material", "model", "inspiration", "general"]).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createTag(input);
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await deleteTag(input.id);
        return { success: true };
      }),
  }),
  
  // ============================================================================
  // MATERIALS
  // ============================================================================
  
  materials: router({
    list: protectedProcedure
      .query(async () => {
        return await getAllMaterials();
      }),
    
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await getMaterialById(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.number()).optional(),
      }))
      .query(async ({ input }) => {
        return await searchMaterials(input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().min(1),
        tags: z.string().optional(),
        imageBase64: z.string().optional(),
        fileBase64: z.string().optional(),
        supplier: z.string().optional(),
        price: z.string().optional(),
        unit: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let imageUrl: string | undefined;
        let fileUrl: string | undefined;
        
        // Upload image to S3 if provided
        if (input.imageBase64) {
          const imageBuffer = Buffer.from(input.imageBase64.split(",")[1], "base64");
          const imageKey = `library/materials/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const imageResult = await storagePut(imageKey, imageBuffer, "image/jpeg");
          imageUrl = imageResult.url;
        }
        
        // Upload file to S3 if provided
        if (input.fileBase64) {
          const fileBuffer = Buffer.from(input.fileBase64.split(",")[1], "base64");
          const fileKey = `library/materials/${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
          const fileResult = await storagePut(fileKey, fileBuffer, "application/pdf");
          fileUrl = fileResult.url;
        }
        
        return await createMaterial({
          name: input.name,
          description: input.description,
          category: input.category,
          tags: input.tags,
          imageUrl,
          fileUrl,
          supplier: input.supplier,
          price: input.price,
          unit: input.unit,
          createdById: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        supplier: z.string().optional(),
        price: z.string().optional(),
        unit: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateMaterial(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await deleteMaterial(input.id);
        return { success: true };
      }),
  }),
  
  // ============================================================================
  // 3D MODELS
  // ============================================================================
  
  models3D: router({
    list: protectedProcedure
      .query(async () => {
        return await getAll3DModels();
      }),
    
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await get3DModelById(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        fileFormat: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await search3DModels(input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().min(1),
        tags: z.string().optional(),
        thumbnailBase64: z.string().optional(),
        modelBase64: z.string().min(1),
        fileFormat: z.string().min(1),
        fileSize: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let thumbnailUrl: string | undefined;
        
        // Upload thumbnail to S3 if provided
        if (input.thumbnailBase64) {
          const thumbnailBuffer = Buffer.from(input.thumbnailBase64.split(",")[1], "base64");
          const thumbnailKey = `library/models/${Date.now()}-thumb-${Math.random().toString(36).substring(7)}.jpg`;
          const thumbnailResult = await storagePut(thumbnailKey, thumbnailBuffer, "image/jpeg");
          thumbnailUrl = thumbnailResult.url;
        }
        
        // Upload model file to S3
        const modelBuffer = Buffer.from(input.modelBase64.split(",")[1], "base64");
        const modelKey = `library/models/${Date.now()}-${Math.random().toString(36).substring(7)}${input.fileFormat}`;
        const modelResult = await storagePut(modelKey, modelBuffer, "application/octet-stream");
        
        return await create3DModel({
          name: input.name,
          description: input.description,
          category: input.category,
          tags: input.tags,
          thumbnailUrl,
          modelUrl: modelResult.url,
          fileFormat: input.fileFormat,
          fileSize: input.fileSize,
          createdById: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await update3DModel(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await delete3DModel(input.id);
        return { success: true };
      }),
  }),
  
  // ============================================================================
  // INSPIRATION
  // ============================================================================
  
  inspiration: router({
    list: protectedProcedure
      .query(async () => {
        return await getAllInspiration();
      }),
    
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await getInspirationById(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        tags: z.array(z.number()).optional(),
        projectId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await searchInspiration(input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        tags: z.string().optional(),
        imageBase64: z.string().min(1),
        sourceUrl: z.string().optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Upload image to S3
        const imageBuffer = Buffer.from(input.imageBase64.split(",")[1], "base64");
        const imageKey = `library/inspiration/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const imageResult = await storagePut(imageKey, imageBuffer, "image/jpeg");
        
        return await createInspiration({
          title: input.title,
          description: input.description,
          tags: input.tags,
          imageUrl: imageResult.url,
          sourceUrl: input.sourceUrl,
          projectId: input.projectId,
          createdById: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        tags: z.string().optional(),
        sourceUrl: z.string().optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateInspiration(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await deleteInspiration(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // EXPORTAÇÃO DE MATERIAIS
  // ============================================================================

  exportMaterialsPDF: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        includePrice: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("[exportMaterialsPDF] Starting export for project:", input.projectId);
        
        const { generateMaterialsPDF } = await import("./materialExportService.js");
        const { getProjectById } = await import("./projectsDb.js");

        const project = await getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });
        }
        
        console.log("[exportMaterialsPDF] Project found:", project.name);

        const pdfBuffer = await generateMaterialsPDF({
          projectId: input.projectId,
          projectName: project.name,
          projectCode: project.code,
          includePrice: input.includePrice,
        });
        
        console.log("[exportMaterialsPDF] PDF generated successfully, size:", pdfBuffer.length);

        // Retornar base64 para o frontend fazer download
        return {
          filename: `${project.code}_materiais.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        console.error("[exportMaterialsPDF] Error:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error instanceof Error ? error.message : "Erro ao gerar PDF" 
        });
      }
    }),

  exportMaterialsExcel: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        includePrice: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { generateMaterialsExcel } = await import("./materialExportService.js");
      const { getProjectById } = await import("./projectsDb.js");

      const project = await getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });
      }

      const excelBuffer = await generateMaterialsExcel({
        projectId: input.projectId,
        projectName: project.name,
        projectCode: project.code,
        includePrice: input.includePrice,
      });

      // Retornar base64 para o frontend fazer download
      return {
        filename: `${project.code}_materiais.xlsx`,
        data: excelBuffer.toString("base64"),
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }),

  // ============================================================================
  // PRICE HISTORY
  // ============================================================================

  addPriceRecord: protectedProcedure
      .input(
        z.object({
          materialId: z.number(),
          price: z.string(),
          unit: z.string(),
          supplierName: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await addPriceRecord({
          ...input,
          recordedById: ctx.user.id,
        });
        return { success: true };
      }),

  getMaterialPriceHistory: protectedProcedure
    .input(
      z.object({
        materialId: z.number(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return getPriceHistory(input.materialId, input.limit);
    }),

  getLatestMaterialPrice: protectedProcedure
    .input(z.object({ materialId: z.number() }))
    .query(async ({ input }) => {
      return getLatestPrice(input.materialId);
    }),

  getMaterialPriceTrend: protectedProcedure
    .input(
      z.object({
        materialId: z.number(),
        days: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return calculatePriceTrend(input.materialId, input.days);
    }),

  getMaterialPriceAlerts: protectedProcedure
    .input(
      z.object({
        thresholdPercent: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return getMaterialsWithPriceAlerts(input.thresholdPercent);
    }),

  // ============================================================================
  // MATERIAL SUGGESTIONS (AI-powered)
  // ============================================================================

  generateSuggestions: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const count = await generateSuggestionsForProject(input.projectId);
      return { success: true, count };
    }),

  getProjectSuggestions: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        status: z.enum(["pending", "accepted", "rejected"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return getProjectSuggestions(input.projectId, input.status);
    }),

  respondToSuggestion: protectedProcedure
    .input(
      z.object({
        suggestionId: z.number(),
        status: z.enum(["accepted", "rejected"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await respondToSuggestion(input.suggestionId, input.status, ctx.user.id);
      return { success: true };
    }),

  getSuggestionStats: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return getSuggestionStats(input.projectId);
    }),

  // ============================================================================
  // SUPPLIER COMPARISON
  // ============================================================================

  getSupplierComparison: protectedProcedure
    .input(
      z.object({
        materialId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return getSupplierComparison(input.materialId);
    }),

  getSupplierPriceAlerts: protectedProcedure
    .input(
      z.object({
        thresholdPercent: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return getSupplierPriceAlerts(input.thresholdPercent);
    }),

  // ============================================================================
  // BULK IMPORT
  // ============================================================================

  bulkImportMaterials: protectedProcedure
    .input(
      z.object({
        materials: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            category: z.string(),
            supplier: z.string().optional(),
            price: z.string().optional(),
            unit: z.string().optional(),
            tags: z.string().optional(),
            imageUrl: z.string().optional(),
            fileUrl: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return bulkImportMaterials(input.materials, ctx.user.id);
    }),

  getImportTemplate: protectedProcedure.query(async () => {
    return generateImportTemplate();
  }),
});
