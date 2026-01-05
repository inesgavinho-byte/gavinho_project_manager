import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🎨 Populando dados ArchViz de teste...\n");

// Buscar obra Penthouse SI
const [constructions] = await connection.execute(
  "SELECT id, name FROM constructions WHERE name LIKE '%Penthouse SI%' AND deletedAt IS NULL LIMIT 1"
);

if (constructions.length === 0) {
  console.log("❌ Obra GA00466_Penthouse SI não encontrada!");
  process.exit(1);
}

const constructionId = constructions[0].id;
console.log(`✅ Obra encontrada: ${constructions[0].name} (ID: ${constructionId})\n`);

// Criar compartimentos
const compartments = [
  { name: "Sala de Estar", description: "Área social principal" },
  { name: "Cozinha", description: "Cozinha equipada" },
  { name: "Suite Principal", description: "Quarto principal com closet" },
  { name: "Casa de Banho", description: "WC social" },
  { name: "Varanda", description: "Varanda com vista" },
];

console.log("📁 Criando compartimentos...");
const compartmentIds = [];

for (const comp of compartments) {
  const [result] = await connection.execute(
    `INSERT INTO archvizCompartments (constructionId, name, description, \`order\`, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [constructionId, comp.name, comp.description, compartmentIds.length]
  );
  compartmentIds.push(result.insertId);
  console.log(`  ✓ ${comp.name} (ID: ${result.insertId})`);
}

console.log("\n🖼️  Criando renders de teste...");

// Buscar userId do owner
const [users] = await connection.execute("SELECT id FROM users LIMIT 1");
const userId = users[0].id;

// Criar renders com diferentes status e datas
const renders = [
  // Sala de Estar - 3 versões
  {
    compartmentId: compartmentIds[0],
    version: 1,
    name: "Vista Geral Sala",
    description: "Primeira versão - conceito inicial",
    status: "pending",
    isFavorite: 0,
    daysAgo: 45,
  },
  {
    compartmentId: compartmentIds[0],
    version: 2,
    name: "Vista Geral Sala",
    description: "Segunda versão - ajustes de iluminação",
    status: "approved_dc",
    isFavorite: 0,
    daysAgo: 30,
  },
  {
    compartmentId: compartmentIds[0],
    version: 3,
    name: "Vista Geral Sala",
    description: "Versão final aprovada pelo cliente",
    status: "approved_client",
    isFavorite: 1,
    daysAgo: 15,
  },
  
  // Cozinha - 2 versões
  {
    compartmentId: compartmentIds[1],
    version: 1,
    name: "Cozinha Perspectiva 1",
    description: "Vista da bancada",
    status: "approved_dc",
    isFavorite: 1,
    daysAgo: 20,
  },
  {
    compartmentId: compartmentIds[1],
    version: 2,
    name: "Cozinha Perspectiva 2",
    description: "Vista da ilha central",
    status: "pending",
    isFavorite: 0,
    daysAgo: 5,
  },
  
  // Suite Principal - 2 versões
  {
    compartmentId: compartmentIds[2],
    version: 1,
    name: "Suite - Vista Cama",
    description: "Render noturno",
    status: "approved_client",
    isFavorite: 1,
    daysAgo: 25,
  },
  {
    compartmentId: compartmentIds[2],
    version: 2,
    name: "Suite - Vista Closet",
    description: "Detalhe do closet",
    status: "pending",
    isFavorite: 0,
    daysAgo: 10,
  },
  
  // Casa de Banho - 1 versão
  {
    compartmentId: compartmentIds[3],
    version: 1,
    name: "WC Social",
    description: "Vista geral",
    status: "approved_dc",
    isFavorite: 0,
    daysAgo: 60,
  },
  
  // Varanda - 2 versões
  {
    compartmentId: compartmentIds[4],
    version: 1,
    name: "Varanda - Vista Dia",
    description: "Luz natural",
    status: "pending",
    isFavorite: 0,
    daysAgo: 3,
  },
  {
    compartmentId: compartmentIds[4],
    version: 2,
    name: "Varanda - Vista Noite",
    description: "Iluminação artificial",
    status: "approved_client",
    isFavorite: 1,
    daysAgo: 2,
  },
];

let renderCount = 0;
for (const render of renders) {
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - render.daysAgo);
  
  // URL de placeholder para imagens
  const imageUrl = `https://placehold.co/1920x1080/EEEAE5/5F5C59?text=${encodeURIComponent(render.name)}`;
  
  await connection.execute(
    `INSERT INTO archvizRenders 
     (compartmentId, constructionId, version, name, description, fileUrl, fileKey, 
      mimeType, fileSize, isFavorite, status, uploadedById, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      render.compartmentId,
      constructionId,
      render.version,
      render.name,
      render.description,
      imageUrl,
      `archviz/${constructionId}/${render.compartmentId}/v${render.version}.jpg`,
      "image/jpeg",
      1024000,
      render.isFavorite,
      render.status,
      userId,
      createdAt,
      createdAt,
    ]
  );
  renderCount++;
  console.log(`  ✓ ${render.name} v${render.version} - ${render.status}`);
}

console.log(`\n✅ Dados ArchViz criados com sucesso!`);
console.log(`   • ${compartments.length} compartimentos`);
console.log(`   • ${renderCount} renders`);
console.log(`   • ${renders.filter(r => r.status === "pending").length} pendentes`);
console.log(`   • ${renders.filter(r => r.status === "approved_dc").length} aprovadas DC`);
console.log(`   • ${renders.filter(r => r.status === "approved_client").length} aprovadas cliente`);
console.log(`   • ${renders.filter(r => r.isFavorite).length} favoritos`);

await connection.end();
