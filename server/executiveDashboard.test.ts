import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  searchProjects,
  getExecutiveDashboardKPIs,
  getSearchSuggestions,
  getAvailableFilters,
  ExecutiveDashboardFilters,
} from './executiveDashboardService';

describe('Executive Dashboard Service', () => {
  describe('searchProjects', () => {
    it('deve retornar array de projetos', async () => {
      const filters: ExecutiveDashboardFilters = {
        limit: 10,
        offset: 0,
      };

      const results = await searchProjects(filters);
      expect(Array.isArray(results)).toBe(true);
    });

    it('deve filtrar por status', async () => {
      const filters: ExecutiveDashboardFilters = {
        status: ['active'],
        limit: 10,
      };

      const results = await searchProjects(filters);
      expect(Array.isArray(results)).toBe(true);
      
      // Se houver resultados, todos devem ter status 'active'
      if (results.length > 0) {
        results.forEach((project) => {
          expect(project.status).toBe('active');
        });
      }
    });

    it('deve filtrar por prioridade', async () => {
      const filters: ExecutiveDashboardFilters = {
        priority: ['high'],
        limit: 10,
      };

      const results = await searchProjects(filters);
      expect(Array.isArray(results)).toBe(true);
      
      // Se houver resultados, todos devem ter prioridade 'high'
      if (results.length > 0) {
        results.forEach((project) => {
          expect(project.priority).toBe('high');
        });
      }
    });

    it('deve buscar por texto', async () => {
      const filters: ExecutiveDashboardFilters = {
        searchQuery: 'test',
        limit: 10,
      };

      const results = await searchProjects(filters);
      expect(Array.isArray(results)).toBe(true);
    });

    it('deve respeitar limite de resultados', async () => {
      const filters: ExecutiveDashboardFilters = {
        limit: 5,
      };

      const results = await searchProjects(filters);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('deve ordenar por nome', async () => {
      const filters: ExecutiveDashboardFilters = {
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 10,
      };

      const results = await searchProjects(filters);
      expect(Array.isArray(results)).toBe(true);
      
      // Verificar se está ordenado
      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i].name >= results[i - 1].name).toBe(true);
        }
      }
    });

    it('deve incluir dados enriquecidos (teamCount, milestonesCount)', async () => {
      const filters: ExecutiveDashboardFilters = {
        limit: 10,
      };

      const results = await searchProjects(filters);
      
      if (results.length > 0) {
        const project = results[0];
        expect(project).toHaveProperty('teamCount');
        expect(project).toHaveProperty('milestonesCount');
        expect(project).toHaveProperty('overdueCount');
        expect(typeof project.teamCount).toBe('number');
        expect(typeof project.milestonesCount).toBe('number');
        expect(typeof project.overdueCount).toBe('number');
      }
    });
  });

  describe('getExecutiveDashboardKPIs', () => {
    it('deve retornar KPIs com estrutura correta', async () => {
      const kpis = await getExecutiveDashboardKPIs();
      
      expect(kpis).toHaveProperty('totalProjects');
      expect(kpis).toHaveProperty('activeProjects');
      expect(kpis).toHaveProperty('completedProjects');
      expect(kpis).toHaveProperty('overdueProjects');
      expect(kpis).toHaveProperty('averageProgress');
      expect(kpis).toHaveProperty('upcomingDeadlines');
      expect(kpis).toHaveProperty('teamMembersCount');
      expect(kpis).toHaveProperty('projectsByStatus');
      expect(kpis).toHaveProperty('projectsByPriority');
      expect(kpis).toHaveProperty('projectsByPhase');
    });

    it('deve ter valores numéricos válidos', async () => {
      const kpis = await getExecutiveDashboardKPIs();
      
      expect(typeof kpis.totalProjects).toBe('number');
      expect(typeof kpis.activeProjects).toBe('number');
      expect(typeof kpis.completedProjects).toBe('number');
      expect(typeof kpis.overdueProjects).toBe('number');
      expect(typeof kpis.averageProgress).toBe('number');
      expect(typeof kpis.upcomingDeadlines).toBe('number');
      expect(typeof kpis.teamMembersCount).toBe('number');
      
      // Validar ranges
      expect(kpis.totalProjects).toBeGreaterThanOrEqual(0);
      expect(kpis.activeProjects).toBeGreaterThanOrEqual(0);
      expect(kpis.completedProjects).toBeGreaterThanOrEqual(0);
      expect(kpis.overdueProjects).toBeGreaterThanOrEqual(0);
      expect(kpis.averageProgress).toBeGreaterThanOrEqual(0);
      expect(kpis.averageProgress).toBeLessThanOrEqual(100);
    });

    it('deve ter activeProjects <= totalProjects', async () => {
      const kpis = await getExecutiveDashboardKPIs();
      expect(kpis.activeProjects).toBeLessThanOrEqual(kpis.totalProjects);
    });

    it('deve ter completedProjects <= totalProjects', async () => {
      const kpis = await getExecutiveDashboardKPIs();
      expect(kpis.completedProjects).toBeLessThanOrEqual(kpis.totalProjects);
    });

    it('deve retornar objetos de distribuição', async () => {
      const kpis = await getExecutiveDashboardKPIs();
      
      expect(typeof kpis.projectsByStatus).toBe('object');
      expect(typeof kpis.projectsByPriority).toBe('object');
      expect(typeof kpis.projectsByPhase).toBe('object');
    });
  });

  describe('getSearchSuggestions', () => {
    it('deve retornar array de sugestões', async () => {
      const suggestions = await getSearchSuggestions('test');
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('deve retornar array vazio para query vazia', async () => {
      const suggestions = await getSearchSuggestions('');
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });

    it('deve retornar array vazio para query muito curta', async () => {
      const suggestions = await getSearchSuggestions('a');
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });

    it('deve retornar strings como sugestões', async () => {
      const suggestions = await getSearchSuggestions('test');
      
      if (suggestions.length > 0) {
        suggestions.forEach((suggestion) => {
          expect(typeof suggestion).toBe('string');
        });
      }
    });

    it('deve limitar número de sugestões', async () => {
      const suggestions = await getSearchSuggestions('test');
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getAvailableFilters', () => {
    it('deve retornar objeto com filtros disponíveis', async () => {
      const filters = await getAvailableFilters();
      
      expect(filters).toHaveProperty('statuses');
      expect(filters).toHaveProperty('priorities');
      expect(filters).toHaveProperty('phases');
      expect(filters).toHaveProperty('teamMembers');
    });

    it('deve retornar arrays para cada tipo de filtro', async () => {
      const filters = await getAvailableFilters();
      
      expect(Array.isArray(filters.statuses)).toBe(true);
      expect(Array.isArray(filters.priorities)).toBe(true);
      expect(Array.isArray(filters.phases)).toBe(true);
      expect(Array.isArray(filters.teamMembers)).toBe(true);
    });

    it('deve retornar strings em statuses', async () => {
      const filters = await getAvailableFilters();
      
      filters.statuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
    });

    it('deve retornar strings em priorities', async () => {
      const filters = await getAvailableFilters();
      
      filters.priorities.forEach((priority) => {
        expect(typeof priority).toBe('string');
      });
    });

    it('deve retornar objetos com id e name em teamMembers', async () => {
      const filters = await getAvailableFilters();
      
      filters.teamMembers.forEach((member) => {
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        // userId pode ser string ou número
        const idType = typeof member.id;
        expect(['string', 'number']).toContain(idType);
        expect(typeof member.name).toBe('string');
      });
    });
  });

  describe('Integração entre funções', () => {
    it('deve usar filtros disponíveis para buscar', async () => {
      const availableFilters = await getAvailableFilters();
      
      if (availableFilters.statuses.length > 0) {
        const filters: ExecutiveDashboardFilters = {
          status: [availableFilters.statuses[0]],
          limit: 10,
        };

        const results = await searchProjects(filters);
        expect(Array.isArray(results)).toBe(true);
      }
    });

    it('deve retornar KPIs consistentes com projetos', async () => {
      const kpis = await getExecutiveDashboardKPIs();
      const allProjects = await searchProjects({ limit: 1000 });
      
      // O número de projetos retornados não deve exceder o total
      expect(allProjects.length).toBeLessThanOrEqual(kpis.totalProjects);
    });
  });
});
