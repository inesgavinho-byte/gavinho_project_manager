import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

try {
  // Buscar projeto MYRIAD
  const [project] = await connection.execute(
    `SELECT * FROM projects WHERE code LIKE '%469%' OR code LIKE '%MYRIAD%' OR name LIKE '%MYRIAD%' LIMIT 1`
  );
  
  if (project[0]) {
    console.log('📊 Projeto MYRIAD encontrado:');
    console.log(JSON.stringify(project[0], null, 2));
    
    // Buscar documentos associados
    const [docs] = await connection.execute(
      `SELECT * FROM projectDocuments WHERE projectId = ?`,
      [project[0].id]
    );
    
    console.log(`\n📄 Documentos existentes: ${docs.length}`);
    if (docs.length > 0) {
      docs.forEach((doc, idx) => {
        console.log(`   ${idx + 1}. ${doc.title} (${doc.type})`);
      });
    }
  } else {
    console.log('❌ Projeto MYRIAD não encontrado');
  }
} catch (error) {
  console.error('Erro:', error.message);
} finally {
  await connection.end();
}
