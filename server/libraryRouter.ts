import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc.js";
import * as libraryDb from "./libraryDb.js";
import { storagePut } from "./storage.js";

export const libraryRouter = router({
  // ============================================================================
  // TAGS
  // ============================================================================
  
  tags: router({
    list: protectedProcedure
      .query(async () => {
        return await libraryDb.getAllTags();
      }),
    
    listByCategory: protectedProcedure
      .input(z.object({
        category: z.enum(["material", "model", "inspiration", "general"]),
      }))
      .query(async ({ input }) => {
        return await libraryDb.getTagsByCategory(input.category);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.enum(["material", "model", "inspiration", "general"]).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await libraryDb.createTag(input);
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await libraryDb.deleteTag(input.id);
        return { success: true };
      }),
  }),
  
  // ============================================================================
  // MATERIALS
  // ============================================================================
  
  materials: router({
    list: protectedProcedure
      .query(async () => {
        return await libraryDb.getAllMaterials();
      }),
    
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await libraryDb.getMaterialById(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.number()).optional(),
      }))
      .query(async ({ input }) => {
        return await libraryDb.searchMaterials(input);
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
        
        return await libraryDb.createMaterial({
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
        await libraryDb.updateMaterial(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await libraryDb.deleteMaterial(input.id);
        return { success: true };
      }),
  }),
  
  // ============================================================================
  // 3D MODELS
  // ============================================================================
  
  models3D: router({
    list: protectedProcedure
      .query(async () => {
        return await libraryDb.getAll3DModels();
      }),
    
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await libraryDb.get3DModelById(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        fileFormat: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await libraryDb.search3DModels(input);
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
        
        return await libraryDb.create3DModel({
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
        await libraryDb.update3DModel(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await libraryDb.delete3DModel(input.id);
        return { success: true };
      }),
  }),
  
  // ============================================================================
  // INSPIRATION
  // ============================================================================
  
  inspiration: router({
    list: protectedProcedure
      .query(async () => {
        return await libraryDb.getAllInspiration();
      }),
    
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await libraryDb.getInspirationById(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        tags: z.array(z.number()).optional(),
        projectId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await libraryDb.searchInspiration(input);
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
        
        return await libraryDb.createInspiration({
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
        await libraryDb.updateInspiration(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await libraryDb.deleteInspiration(input.id);
        return { success: true };
      }),
  }),
});
