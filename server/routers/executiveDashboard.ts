import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  searchProjects,
  getExecutiveDashboardKPIs,
  getSearchSuggestions,
  getAvailableFilters,
  ExecutiveDashboardFilters,
} from '../executiveDashboardService';

export const executiveDashboardRouter = router({
  /**
   * Buscar projetos com filtros
   */
  searchProjects: protectedProcedure
    .input(
      z.object({
        searchQuery: z.string().optional(),
        status: z.array(z.string()).optional(),
        priority: z.array(z.string()).optional(),
        phase: z.array(z.string()).optional(),
        teamMemberId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sortBy: z.enum(['name', 'dueDate', 'progress', 'priority', 'createdAt']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      const filters: ExecutiveDashboardFilters = {
        searchQuery: input.searchQuery,
        status: input.status,
        priority: input.priority,
        phase: input.phase,
        teamMemberId: input.teamMemberId,
        startDate: input.startDate,
        endDate: input.endDate,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        limit: input.limit,
        offset: input.offset,
      };

      return await searchProjects(filters);
    }),

  /**
   * Obter KPIs do dashboard executivo
   */
  getKPIs: protectedProcedure.query(async () => {
    return await getExecutiveDashboardKPIs();
  }),

  /**
   * Obter sugestões de busca
   */
  getSearchSuggestions: protectedProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ input }) => {
      return await getSearchSuggestions(input.query);
    }),

  /**
   * Obter filtros disponíveis
   */
  getAvailableFilters: protectedProcedure.query(async () => {
    return await getAvailableFilters();
  }),

  /**
   * Busca rápida com sugestões
   */
  quickSearch: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      if (input.query.length < 2) {
        return { projects: [], suggestions: [] };
      }

      const projects = await searchProjects({
        searchQuery: input.query,
        limit: 5,
      });

      const suggestions = await getSearchSuggestions(input.query);

      return { projects, suggestions };
    }),
});
