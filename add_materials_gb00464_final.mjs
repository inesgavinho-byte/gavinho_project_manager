import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('📦 Registando requisição de materiais na obra GB00464...\n');

// 1. Buscar obra GB00464
const [constructions] = await connection.execute(
  `SELECT id FROM constructions WHERE code = 'GB00464' AND deletedAt IS NULL LIMIT 1`
);

if (constructions.length === 0) {
  console.log('❌ Obra GB00464 não encontrada.');
  await connection.end();
  process.exit(1);
}

const constructionId = constructions[0].id;
console.log(`✅ Obra GB00464 encontrada (ID: ${constructionId})\n`);

// 2. Buscar userId
const [projects] = await connection.execute(
  `SELECT createdById FROM projects WHERE name LIKE '%GA00464%' LIMIT 1`
);
const userId = projects[0].createdById;

// 3. Registar requisição de materiais
console.log('📦 Registando requisição de materiais (Nº 1/26 - 07/01/2026)...\n');

const materials = [
  { name: 'Baguetes de alumínio perfurado para cantos', quantity: 28, unit: 'un', reason: 'Para remotes do lado int. das paredes junto às portas, caixa em cima BBQ' },
  { name: 'Perfil montante para pladur 48mm', quantity: 5, unit: 'un', reason: '' },
  { name: 'Perfil raia de 48mm', quantity: 2, unit: 'un', reason: '' },
  { name: 'Perfil de tecto 47mm', quantity: 2, unit: 'un', reason: '' },
  { name: 'Cantoneira de pladur', quantity: 1, unit: 'un', reason: '' },
  { name: 'Cx parafusos preto para pladur 25mm, 1000un/cx', quantity: 1, unit: 'cx', reason: '' },
  { name: 'Latas de espuma expansiva', quantity: 3, unit: 'un', reason: '' },
  { name: 'Massa barramento 2H para gesso cartonado', quantity: 1, unit: 'saco', reason: '' },
  { name: 'Massa de estuque de 24H', quantity: 2, unit: 'sacos', reason: 'Edgar diz que pode vir da obra do Restelo onde sobrou 8 sacos' },
  { name: 'Massa Maxfino, da Yesdebro', quantity: 2, unit: 'sacos', reason: '' },
  { name: 'Massa Gesso Projecção Aligeirado, Rubo 25Kg', quantity: 2, unit: 'sacos', reason: '' },
  { name: 'Placas de gesso cartonado hidrófugo', quantity: 5, unit: 'un', reason: 'Para parede I5 Master Suite, rematar envolvente da Lareira no lado da Cozinha' },
  { name: 'Rolos largos de fita crepe de pintor', quantity: 12, unit: 'un', reason: '' },
  { name: 'Resina de primário para superfícies pintadas (tipo tinta)', quantity: 1, unit: 'lata 4Lt', reason: 'Para barrar tecto pintado da varanda, antes do barramento final, ver marca com Edgar' },
  { name: 'Cimento cola H40 Flex', quantity: 15, unit: 'sacos', reason: '' }
];

let insertedCount = 0;
for (const material of materials) {
  await connection.execute(
    `INSERT INTO siteMaterialRequests (constructionId, requestedBy, materialName, quantity, unit, status, urgency, reason, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [constructionId, userId, material.name, material.quantity, material.unit, 'pending', 'medium', material.reason]
  );
  insertedCount++;
  console.log(`   ✓ ${insertedCount}. ${material.name} (${material.quantity} ${material.unit})`);
}

console.log(`\n✅ ${insertedCount} materiais registados com sucesso!\n`);

// 4. Registar ferramenta
console.log('🔧 Registando ferramenta...');
await connection.execute(
  `INSERT INTO siteMaterialRequests (constructionId, requestedBy, materialName, quantity, unit, status, urgency, reason, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
  [
    constructionId,
    userId,
    'Kit brocas cranianas para pladur/madeira/metal, diâmetros diversos',
    1,
    'conjunto',
    'pending',
    'medium',
    '74mm para focos no duche, outras para focos pequenos, necessária de futuro. Ref: Leroy Merlin - Brocas cranianas Dexter'
  ]
);
console.log('   ✓ Kit brocas cranianas (1 conjunto)\n');

console.log('✅ Requisição de materiais Nº 1/26 registada com sucesso!');
console.log(`📊 Total: 15 materiais + 1 ferramenta = 16 itens\n`);

await connection.end();
