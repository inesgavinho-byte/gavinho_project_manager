import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

try {
  // Buscar projeto MYRIAD
  const [project] = await connection.execute(
    `SELECT * FROM projects WHERE projectCode LIKE '%469%' OR projectCode LIKE '%MYRIAD%' OR name LIKE '%MYRIAD%' LIMIT 1`
  );
  
  if (project && project.length > 0) {
    console.log('📊 Projeto MYRIAD encontrado:');
    console.log(`   ID: ${project[0].id}`);
    console.log(`   Código: ${project[0].projectCode}`);
    console.log(`   Nome: ${project[0].name}`);
    console.log(`   Cliente: ${project[0].clientName}`);
    console.log(`   Status: ${project[0].status}`);
    console.log(`   Progresso: ${project[0].progress}%`);
    
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
    
    // Buscar obras associadas
    const [constructions] = await connection.execute(
      `SELECT * FROM constructions WHERE projectId = ?`,
      [project[0].id]
    );
    
    console.log(`\n🏗️ Obras associadas: ${constructions.length}`);
    if (constructions.length > 0) {
      constructions.forEach((constr, idx) => {
        console.log(`   ${idx + 1}. ${constr.constructionCode} - ${constr.name}`);
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
