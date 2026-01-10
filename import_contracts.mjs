#!/usr/bin/env node
/**
 * Script para importar contratos extraídos para a database
 */
import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { projects } from './drizzle/schema.js';
import { sql, like } from 'drizzle-orm';

// Ler dados extraídos
const contractsData = JSON.parse(
  readFileSync('./contracts_extracted.json', 'utf-8')
);

// Mapear status dos contratos para status de projetos
const statusMap = {
  'signed': 'in_progress',      // Assinado → Em progresso
  'in_progress': 'in_progress', // Em progresso → Em progresso
  'draft': 'planning'           // Rascunho → Planeamento
};

// Conectar à database
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🔌 Conectado à database');
console.log(`📦 A importar ${contractsData.length} contratos...\n`);

let imported = 0;
let skipped = 0;

for (const contract of contractsData) {
  try {
    // Verificar se já existe projeto com este código
    const existing = await db.select().from(projects).where(
      like(projects.name, `${contract.code}%`)
    ).limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  ${contract.code} já existe, a saltar...`);
      skipped++;
      continue;
    }

    // Inserir projeto
    await db.insert(projects).values({
      name: `${contract.code} - ${contract.name}`,
      description: `Projeto ${contract.type}`,
      status: statusMap[contract.status] || 'planning',
      priority: 'medium',
      clientName: contract.client,
      location: contract.location,
      createdById: 1, // Owner
      progress: contract.status === 'signed' ? 25 : 0,
    });

    console.log(`✅ ${contract.code} - ${contract.name}`);
    imported++;
  } catch (error) {
    console.error(`❌ Erro ao importar ${contract.code}:`, error.message);
  }
}

await connection.end();

console.log(`\n✨ Importação concluída!`);
console.log(`   Importados: ${imported}`);
console.log(`   Saltados: ${skipped}`);
console.log(`   Total: ${contractsData.length}`);
