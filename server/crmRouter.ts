import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import * as crmService from './crmIntegrationService';
import * as sentimentService from './sentimentAnalysisService';

export const crmRouter = router({
  // ============================================
  // CONTATOS CRM
  // ============================================

  // Obter contatos de um projeto
  getProjectContacts: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      type: z.enum(['client', 'supplier', 'partner', 'other']).optional(),
    }))
    .query(async ({ input }) => {
      return await crmService.getProjectContacts(input.projectId, input.type);
    }),

  // Obter detalhes de um contato
  getContactDetails: protectedProcedure
    .input(z.object({
      contactId: z.number(),
    }))
    .query(async ({ input }) => {
      return await crmService.getCRMContact(input.contactId);
    }),

  // Criar novo contato
  createContact: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      type: z.enum(['client', 'supplier', 'partner', 'other']),
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      role: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return await crmService.createCRMContact(input);
    }),

  // Atualizar contato
  updateContact: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      role: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { contactId, ...updates } = input;
      return await crmService.updateCRMContact(contactId, updates);
    }),

  // Buscar contatos por email
  searchContactsByEmail: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      email: z.string(),
    }))
    .query(async ({ input }) => {
      return await crmService.searchContactsByEmail(input.projectId, input.email);
    }),

  // Buscar contatos por nome
  searchContactsByName: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string(),
    }))
    .query(async ({ input }) => {
      return await crmService.searchContactsByName(input.projectId, input.name);
    }),

  // ============================================
  // HISTÓRICO DE COMUNICAÇÃO
  // ============================================

  // Obter histórico de comunicação com um contato
  getCommunicationHistory: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return await crmService.getContactCommunicationHistory(input.contactId, input.limit);
    }),

  // Vincular email a contato
  linkEmailToContact: protectedProcedure
    .input(z.object({
      emailId: z.number(),
      contactId: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await crmService.linkEmailToContact(input.emailId, input.contactId);
    }),

  // ============================================
  // ANÁLISE DE SENTIMENTO
  // ============================================

  // Obter análise de sentimento de um contato
  getContactSentimentAnalysis: protectedProcedure
    .input(z.object({
      contactId: z.number(),
    }))
    .query(async ({ input }) => {
      return await sentimentService.getContactSentimentAnalysis(input.contactId);
    }),

  // Obter tendência de sentimento de um projeto
  getProjectSentimentTrend: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return await sentimentService.getProjectSentimentTrend(input.projectId, input.days);
    }),

  // Detectar padrões de sentimento negativo
  detectNegativeSentimentPatterns: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      return await sentimentService.detectNegativeSentimentPatterns(input.projectId);
    }),

  // Obter alertas de sentimento de um projeto
  getProjectSentimentAlerts: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      return await sentimentService.getProjectSentimentAlerts(input.projectId, input.unreadOnly);
    }),

  // Marcar alerta como lido
  markAlertAsRead: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await sentimentService.markAlertAsRead(input.alertId);
    }),

  // Marcar alerta como resolvido
  markAlertAsResolved: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await sentimentService.markAlertAsResolved(input.alertId);
    }),

  // ============================================
  // TAGS E ORGANIZAÇÃO
  // ============================================

  // Adicionar tag a contato
  addTagToContact: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      tag: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await crmService.addTagToContact(input.contactId, input.tag);
    }),

  // Remover tag de contato
  removeTagFromContact: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      tag: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await crmService.removeTagFromContact(input.contactId, input.tag);
    }),

  // Obter contatos com sentimento negativo
  getNegativeSentimentContacts: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      return await crmService.getNegativeSentimentContacts(input.projectId);
    }),
});
