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
  { description: 'Baguetes de alumínio perfurado para cantos', quantity: 28, unit: 'un', notes: 'Para remotes do lado int. das paredes junto às portas, caixa em cima BBQ' },
  { description: 'Perfil montante para pladur 48mm', quantity: 5, unit: 'un', notes: '' },
  { description: 'Perfil raia de 48mm', quantity: 2, unit: 'un', notes: '' },
  { description: 'Perfil de tecto 47mm', quantity: 2, unit: 'un', notes: '' },
  { description: 'Cantoneira de pladur', quantity: 1, unit: 'un', notes: '' },
  { description: 'Cx parafusos preto para pladur 25mm, 1000un/cx', quantity: 1, unit: 'cx', notes: '' },
  { description: 'Latas de espuma expansiva', quantity: 3, unit: 'un', notes: '' },
  { description: 'Massa barramento 2H para gesso cartonado', quantity: 1, unit: 'saco', notes: '' },
  { description: 'Massa de estuque de 24H', quantity: 2, unit: 'sacos', notes: 'Edgar diz que pode vir da obra do Restelo onde sobrou 8 sacos' },
  { description: 'Massa Maxfino, da Yesdebro', quantity: 2, unit: 'sacos', notes: '' },
  { description: 'Massa Gesso Projecção Aligeirado, Rubo 25Kg', quantity: 2, unit: 'sacos', notes: '' },
  { description: 'Placas de gesso cartonado hidrófugo', quantity: 5, unit: 'un', notes: 'Para parede I5 Master Suite, rematar envolvente da Lareira no lado da Cozinha' },
  { description: 'Rolos largos de fita crepe de pintor', quantity: 12, unit: 'un', notes: '' },
  { description: 'Resina de primário para superfícies pintadas (tipo tinta)', quantity: 1, unit: 'lata 4Lt', notes: 'Para barrar tecto pintado da varanda, antes do barramento final, ver marca com Edgar' },
  { description: 'Cimento cola H40 Flex', quantity: 15, unit: 'sacos', notes: '' }
];

let insertedCount = 0;
for (const material of materials) {
  await connection.execute(
    `INSERT INTO siteMaterialRequests (constructionId, requestedBy, description, quantity, unit, status, notes, requestDate, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [constructionId, userId, material.description, material.quantity, material.unit, 'pending', material.notes, '2026-01-07']
  );
  insertedCount++;
  console.log(`   ✓ ${insertedCount}. ${material.description} (${material.quantity} ${material.unit})`);
}

console.log(`\n✅ ${insertedCount} materiais registados com sucesso!\n`);

// 4. Registar ferramenta
console.log('🔧 Registando ferramenta...');
await connection.execute(
  `INSERT INTO siteMaterialRequests (constructionId, requestedBy, description, quantity, unit, status, notes, requestDate, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
  [
    constructionId,
    userId,
    'Kit brocas cranianas para pladur/madeira/metal, diâmetros diversos',
    1,
    'conjunto',
    'pending',
    '74mm para focos no duche, outras para focos pequenos, necessária de futuro. Ref: Leroy Merlin - Brocas cranianas Dexter',
    '2026-01-07'
  ]
);
console.log('   ✓ Kit brocas cranianas (1 conjunto)\n');

console.log('✅ Requisição de materiais Nº 1/26 registada com sucesso!');
console.log(`📊 Total: 15 materiais + 1 ferramenta = 16 itens\n`);

await connection.end();
