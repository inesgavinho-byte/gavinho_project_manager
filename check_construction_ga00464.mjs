import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔍 Verificando obra associada ao projeto GA00464...\n');

// Buscar projeto
const [projects] = await connection.execute(
  `SELECT id, name FROM projects WHERE name LIKE '%GA00464%'`
);

if (projects.length === 0) {
  console.log('❌ Projeto GA00464 não encontrado.');
  await connection.end();
  process.exit(1);
}

const projectId = projects[0].id;
console.log(`✅ Projeto encontrado: ${projects[0].name} (ID: ${projectId})\n`);

// Buscar obra associada
const [constructions] = await connection.execute(
  `SELECT id, name, code, status FROM constructions WHERE projectId = ? AND deletedAt IS NULL`,
  [projectId]
);

if (constructions.length > 0) {
  console.log('✅ Obra encontrada:');
  constructions.forEach(c => {
    console.log(`   ID: ${c.id}`);
    console.log(`   Nome: ${c.name}`);
    console.log(`   Código: ${c.code}`);
    console.log(`   Status: ${c.status}\n`);
  });
} else {
  console.log('❌ Nenhuma obra associada ao projeto GA00464.');
  console.log('💡 Será necessário criar uma obra primeiro para registar requisições de materiais.');
}

await connection.end();
