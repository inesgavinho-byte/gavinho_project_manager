import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { projects, suppliers, clientCompanyProjects, supplierProjects } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const relationshipsRouter = router({
  // Obter todos os dados de relacionamentos para o gráfico de rede
  getNetworkData: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar todos os projetos
    const allProjects = await db.select({
      id: projects.id,
      code: projects.code,
      name: projects.name,
      status: projects.status,
    }).from(projects);

    // Buscar todos os fornecedores
    const allSuppliers = await db.select({
      id: suppliers.id,
      name: suppliers.name,
      category: suppliers.category,
      status: suppliers.status,
    }).from(suppliers);

    // Buscar relacionamentos cliente-projeto
    const clientProjectLinks = await db.select({
      clientId: clientCompanyProjects.clientId,
      projectId: clientCompanyProjects.projectId,
    }).from(clientCompanyProjects);

    // Buscar relacionamentos fornecedor-projeto
    const supplierProjectLinks = await db.select({
      supplierId: supplierProjects.supplierId,
      projectId: supplierProjects.projectId,
    }).from(supplierProjects);

    // Separar clientes de fornecedores
    const clients = allSuppliers.filter(s => s.category === 'client');
    const suppliersOnly = allSuppliers.filter(s => s.category !== 'client');

    return {
      projects: allProjects,
      clients,
      suppliers: suppliersOnly,
      clientProjectLinks,
      supplierProjectLinks,
    };
  }),

  // Obter estatísticas de relacionamentos
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allProjects = await db.select().from(projects);
    const allSuppliers = await db.select().from(suppliers);
    const clientProjectLinks = await db.select().from(clientCompanyProjects);
    const supplierProjectLinks = await db.select().from(supplierProjects);

    const clients = allSuppliers.filter(s => s.category === 'client');
    const suppliersOnly = allSuppliers.filter(s => s.category !== 'client');

    return {
      totalProjects: allProjects.length,
      totalClients: clients.length,
      totalSuppliers: suppliersOnly.length,
      totalClientConnections: clientProjectLinks.length,
      totalSupplierConnections: supplierProjectLinks.length,
      totalConnections: clientProjectLinks.length + supplierProjectLinks.length,
    };
  }),
});
