import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import mysql from "mysql2/promise";
import { users, projects, constructions, mqtCategories, mqtItems } from "./drizzle/schema.ts";
import fs from "fs";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: "default" });

console.log("🏗️  Populando MQT da GA00466_Penthouse SI...\n");

// Buscar obra GA00466 existente
const existingConstructions = await db.select().from(constructions).where(eq(constructions.code, "GA00466"));

if (existingConstructions.length === 0) {
  console.error("❌ Obra GA00466 não encontrada no banco!");
  await connection.end();
  process.exit(1);
}

const ga00466 = existingConstructions[0];
console.log(`✅ Obra encontrada: ${ga00466.code} - ${ga00466.name} (ID: ${ga00466.id})\n`);

// Limpar MQT existente (se houver)
const existingItems = await db.select().from(mqtItems).where(eq(mqtItems.constructionId, ga00466.id));
if (existingItems.length > 0) {
  await db.delete(mqtItems).where(eq(mqtItems.constructionId, ga00466.id));
  console.log(`🗑️  ${existingItems.length} itens MQT existentes removidos\n`);
}

const existingCategories = await db.select().from(mqtCategories).where(eq(mqtCategories.constructionId, ga00466.id));
if (existingCategories.length > 0) {
  await db.delete(mqtCategories).where(eq(mqtCategories.constructionId, ga00466.id));
  console.log(`🗑️  ${existingCategories.length} categorias MQT existentes removidas\n`);
}

// Dados das obras (não serão inseridos, apenas para referência)
const constructionsData_reference = [
  {
    code: "GB00433",
    name: "Ourique",
    projectId: null,
    client: "Cliente Ourique Lda",
    location: "Ourique, Beja",
    status: "in_progress",
    priority: "high",
    progress: 45,
    startDate: new Date("2024-03-15"),
    endDate: new Date("2025-06-30"),
    budget: "450000",
    actualCost: "202500",
    description: "Obra de construção residencial em Ourique",
    createdBy: 1,
  },
  {
    code: "GB00402",
    name: "Maria Residences",
    projectId: null,
    client: "Maria Residences SA",
    location: "Lisboa",
    status: "in_progress",
    priority: "urgent",
    progress: 72,
    startDate: new Date("2023-09-01"),
    endDate: new Date("2025-03-31"),
    budget: "1200000",
    actualCost: "864000",
    description: "Obra de remodelação de edifício residencial premium",
    createdBy: 1,
  },
  {
    code: "GB00462",
    name: "Restelo Villa",
    projectId: null,
    client: "Família Silva",
    location: "Restelo, Lisboa",
    status: "in_progress",
    priority: "high",
    progress: 38,
    startDate: new Date("2024-05-20"),
    endDate: new Date("2025-08-15"),
    budget: "680000",
    actualCost: "258400",
    description: "Obra de construção de moradia de luxo no Restelo",
    createdBy: 1,
  },
  {
    code: "GB00464",
    name: "Apartment IG",
    projectId: null,
    client: "IG Properties",
    location: "Avenida da Liberdade, Lisboa",
    status: "in_progress",
    priority: "medium",
    progress: 55,
    startDate: new Date("2024-01-10"),
    endDate: new Date("2025-04-30"),
    budget: "320000",
    actualCost: "176000",
    description: "Obra de remodelação de apartamento premium",
    createdBy: 1,
  },
  {
    code: "GA00466",
    name: "Penthouse SI",
    projectId: null,
    client: "SI Investments",
    location: "Parque das Nações, Lisboa",
    status: "in_progress",
    priority: "urgent",
    progress: 63,
    startDate: new Date("2023-11-15"),
    endDate: new Date("2025-05-30"),
    budget: "850000",
    actualCost: "535500",
    description: "Obra de remodelação completa de penthouse de luxo",
    createdBy: 1,
  },
];

// Carregar MQT extraído do JSON
const mqtData = JSON.parse(fs.readFileSync("./mqt-ga00466-extracted.json", "utf-8"));

// Popular MQT
  console.log("\n📊 Populando MQT da GA00466_Penthouse SI...");
  
  for (const category of mqtData.categories) {
    // Inserir categoria
    const [catResult] = await db.insert(mqtCategories).values({
      constructionId: ga00466.id,
      code: category.code,
      namePt: category.name_pt,
      nameEn: category.name_en,
      order: category.order,
      subtotal: "0", // Será calculado depois
    });
    const categoryId = catResult.insertId;
    console.log(`   📁 Categoria ${category.code} - ${category.name_pt} (${category.items.length} itens)`);
    
    // Inserir itens da categoria
    let categorySubtotal = 0;
    let itemOrder = 1;
    for (const item of category.items) {
      await db.insert(mqtItems).values({
        constructionId: ga00466.id,
        categoryId: categoryId,
        code: item.code,
        typePt: item.type_pt,
        typeEn: item.type_en,
        subtypePt: item.subtype_pt,
        subtypeEn: item.subtype_en,
        zone: item.zone,
        zoneEn: item.zone_en,
        descriptionPt: item.description_pt,
        descriptionEn: item.description_en,
        unit: item.unit,
        quantity: item.quantity.toString(),
        unitPrice: "0", // A definir
        totalPrice: "0", // A calcular
        status: "pending",
        order: itemOrder++,
      });
    }
    
    console.log(`      ✅ ${category.items.length} itens inseridos`);
  }
  
  console.log(`\n✅ MQT da GA00466 populado com sucesso!`);

console.log("\n🎉 Seed concluído!");
console.log(`   📋 ${mqtData.categories.reduce((sum, cat) => sum + cat.items.length, 0)} itens MQT inseridos na obra GA00466`);

await connection.end();
