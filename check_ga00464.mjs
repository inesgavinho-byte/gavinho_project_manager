import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔍 Verificando projeto GA00464...\n');

const [projects] = await connection.execute(
  `SELECT id, name, clientName, location, status, progress FROM projects WHERE name LIKE '%GA00464%' OR name LIKE '%Apartment IG%'`
);

if (projects.length > 0) {
  console.log('✅ Projeto encontrado:');
  projects.forEach(p => {
    console.log(`   ID: ${p.id}`);
    console.log(`   Nome: ${p.name}`);
    console.log(`   Cliente: ${p.clientName}`);
    console.log(`   Localização: ${p.location}`);
    console.log(`   Status: ${p.status}`);
    console.log(`   Progresso: ${p.progress}%\n`);
  });
} else {
  console.log('❌ Projeto GA00464 não encontrado no banco de dados.');
}

await connection.end();
