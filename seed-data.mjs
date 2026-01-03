import { drizzle } from "drizzle-orm/mysql2";
import { projects, suppliers, orders, tasks, budgets, quantityMaps } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create sample projects
    console.log("Creating projects...");
    await db.insert(projects).values([
      {
        name: "Edifício Residencial Centro",
        description: "Construção de edifício residencial de 8 andares no centro da cidade",
        status: "in_progress",
        priority: "high",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2025-06-30"),
        progress: 45,
        budget: "2500000.00",
        actualCost: "1200000.00",
        clientName: "Construtora Silva & Filhos",
        location: "Rua das Flores, 123 - Centro",
        createdById: 1,
      },
      {
        name: "Reforma Comercial Shopping",
        description: "Reforma completa de loja no shopping center",
        status: "planning",
        priority: "medium",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-04-30"),
        progress: 10,
        budget: "450000.00",
        actualCost: "45000.00",
        clientName: "Grupo Varejo Premium",
        location: "Shopping Center Norte - Loja 205",
        createdById: 1,
      },
      {
        name: "Galpão Industrial Zona Leste",
        description: "Construção de galpão industrial para logística",
        status: "in_progress",
        priority: "urgent",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-03-31"),
        progress: 65,
        budget: "3200000.00",
        actualCost: "2100000.00",
        clientName: "Logística Express LTDA",
        location: "Av. Industrial, 4500 - Zona Leste",
        createdById: 1,
      },
    ]);

    console.log("Creating suppliers...");
    await db.insert(suppliers).values([
      {
        name: "Cimentos Fortes S.A.",
        contactPerson: "João Silva",
        email: "joao@cimentosfortes.com.br",
        phone: "+55 11 3456-7890",
        address: "Av. Paulista, 1000 - São Paulo",
        taxId: "12.345.678/0001-90",
        category: "Materiais de Construção",
        rating: 5,
        isActive: true,
      },
      {
        name: "Ferragens Premium",
        contactPerson: "Maria Santos",
        email: "maria@ferragenspremium.com.br",
        phone: "+55 11 2345-6789",
        address: "Rua do Comércio, 500 - São Paulo",
        taxId: "98.765.432/0001-10",
        category: "Ferragens e Ferramentas",
        rating: 4,
        isActive: true,
      },
      {
        name: "Madeiras Nobres",
        contactPerson: "Carlos Oliveira",
        email: "carlos@madeirasnobres.com.br",
        phone: "+55 11 4567-8901",
        address: "Estrada Rural, Km 15 - Interior",
        taxId: "11.222.333/0001-44",
        category: "Madeiras",
        rating: 5,
        isActive: true,
      },
    ]);

    console.log("Creating quantity maps...");
    await db.insert(quantityMaps).values([
      {
        projectId: 1,
        description: "Concreto estrutural FCK 30",
        category: "Estrutura",
        unit: "m³",
        plannedQuantity: "450.000",
        executedQuantity: "280.000",
        unitPrice: "450.00",
        totalPlanned: "202500.00",
        totalExecuted: "126000.00",
        importSource: "manual",
      },
      {
        projectId: 1,
        description: "Aço CA-50 para estrutura",
        category: "Estrutura",
        unit: "ton",
        plannedQuantity: "85.000",
        executedQuantity: "52.000",
        unitPrice: "6500.00",
        totalPlanned: "552500.00",
        totalExecuted: "338000.00",
        importSource: "manual",
      },
      {
        projectId: 1,
        description: "Tijolo cerâmico 8 furos",
        category: "Alvenaria",
        unit: "milheiro",
        plannedQuantity: "120.000",
        executedQuantity: "75.000",
        unitPrice: "850.00",
        totalPlanned: "102000.00",
        totalExecuted: "63750.00",
        importSource: "manual",
      },
    ]);

    console.log("Creating orders...");
    await db.insert(orders).values([
      {
        projectId: 1,
        supplierId: 1,
        orderNumber: "PO-2024-001",
        description: "Cimento Portland CP-II 50kg - 500 sacos",
        orderType: "material",
        status: "delivered",
        quantity: "500.000",
        unit: "sacos",
        unitPrice: "42.00",
        totalAmount: "21000.00",
        orderDate: new Date("2024-11-15"),
        expectedDeliveryDate: new Date("2024-11-25"),
        actualDeliveryDate: new Date("2024-11-24"),
        createdById: 1,
      },
      {
        projectId: 1,
        supplierId: 2,
        orderNumber: "PO-2024-002",
        description: "Ferragens diversas para estrutura",
        orderType: "material",
        status: "in_transit",
        quantity: "1.000",
        unit: "lote",
        unitPrice: "15000.00",
        totalAmount: "15000.00",
        orderDate: new Date("2024-12-01"),
        expectedDeliveryDate: new Date("2024-12-15"),
        createdById: 1,
      },
      {
        projectId: 3,
        supplierId: 3,
        orderNumber: "PO-2024-003",
        description: "Madeira para forma e escora",
        orderType: "material",
        status: "ordered",
        quantity: "250.000",
        unit: "m³",
        unitPrice: "1200.00",
        totalAmount: "300000.00",
        orderDate: new Date("2024-12-20"),
        expectedDeliveryDate: new Date("2025-01-10"),
        createdById: 1,
      },
    ]);

    console.log("Creating tasks...");
    await db.insert(tasks).values([
      {
        projectId: 1,
        title: "Concretagem da laje do 5º pavimento",
        description: "Executar concretagem completa da laje do quinto pavimento",
        status: "in_progress",
        priority: "high",
        urgency: "high",
        importance: "high",
        dueDate: new Date("2025-01-20"),
        kanbanOrder: 1,
        createdById: 1,
      },
      {
        projectId: 1,
        title: "Instalação elétrica 4º pavimento",
        description: "Passar tubulação e fiação elétrica do quarto andar",
        status: "todo",
        priority: "medium",
        urgency: "medium",
        importance: "high",
        dueDate: new Date("2025-01-25"),
        kanbanOrder: 2,
        createdById: 1,
      },
      {
        projectId: 3,
        title: "Montagem da estrutura metálica",
        description: "Montagem da estrutura metálica principal do galpão",
        status: "in_progress",
        priority: "urgent",
        urgency: "high",
        importance: "high",
        dueDate: new Date("2025-01-15"),
        kanbanOrder: 1,
        createdById: 1,
      },
    ]);

    console.log("Creating budgets...");
    await db.insert(budgets).values([
      {
        projectId: 1,
        category: "Materiais de Construção",
        description: "Cimento, areia, brita, tijolos",
        budgetedAmount: "450000.00",
        actualAmount: "380000.00",
        variance: "-70000.00",
        variancePercent: "-15.56",
      },
      {
        projectId: 1,
        category: "Mão de Obra",
        description: "Equipe de construção e engenheiros",
        budgetedAmount: "850000.00",
        actualAmount: "520000.00",
        variance: "-330000.00",
        variancePercent: "-38.82",
      },
      {
        projectId: 1,
        category: "Equipamentos",
        description: "Aluguel de equipamentos e ferramentas",
        budgetedAmount: "320000.00",
        actualAmount: "300000.00",
        variance: "-20000.00",
        variancePercent: "-6.25",
      },
      {
        projectId: 3,
        category: "Estrutura Metálica",
        description: "Aço estrutural e montagem",
        budgetedAmount: "1200000.00",
        actualAmount: "1250000.00",
        variance: "50000.00",
        variancePercent: "4.17",
      },
    ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
