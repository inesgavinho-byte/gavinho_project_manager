import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [columns] = await connection.execute(`DESCRIBE constructions`);
console.log('Colunas da tabela constructions:\n');
columns.forEach(col => {
  console.log(`  ${col.Field} (${col.Type})`);
});

await connection.end();
