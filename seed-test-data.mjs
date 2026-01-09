import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  console.log('🌱 Seeding database with test data...');

  // Seed projects with financial data
  const projectIds = [];
  for (let i = 1; i <= 20; i++) {
    const budget = 50000 + Math.random() * 200000;
    const actualCost = budget * (0.5 + Math.random() * 0.7); // 50-120% of budget
    
    const result = await db.insert(schema.projects).values({
      name: `Projeto Teste ${i}`,
      description: `Projeto de teste para validação do dashboard financeiro`,
      status: ['planning', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
      priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
      budget: budget.toFixed(2),
      actualCost: actualCost.toFixed(2),
      clientName: `Cliente ${i}`,
      createdById: 1,
    });
    projectIds.push(result[0].insertId);
  }

  console.log(`✓ Created ${projectIds.length} test projects`);

  // Seed task assignments
  for (let i = 0; i < 50; i++) {
    await db.insert(schema.taskAssignments).values({
      projectId: projectIds[Math.floor(Math.random() * projectIds.length)],
      userId: 1,
      title: `Tarefa de Teste ${i + 1}`,
      description: `Descrição da tarefa ${i + 1}`,
      status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      estimatedHours: (5 + Math.random() * 35).toFixed(2),
      actualHours: (Math.random() * 40).toFixed(2),
    });
  }

  console.log('✓ Created 50 test task assignments');

  // Seed time tracking entries
  for (let i = 0; i < 100; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days
    
    await db.insert(schema.timeTracking).values({
      userId: 1,
      projectId: projectIds[Math.floor(Math.random() * projectIds.length)],
      description: `Trabalho realizado em ${date.toISOString().split('T')[0]}`,
      hours: (1 + Math.random() * 8).toFixed(2),
      date: date.toISOString().split('T')[0],
    });
  }

  console.log('✓ Created 100 time tracking entries');

  // Seed user availability
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i); // Next 30 days
    
    await db.insert(schema.userAvailability).values({
      userId: 1,
      date: date.toISOString().split('T')[0],
      status: ['available', 'busy', 'off'][Math.floor(Math.random() * 3)],
      notes: i % 5 === 0 ? `Nota para ${date.toISOString().split('T')[0]}` : null,
    });
  }

  console.log('✓ Created 30 availability entries');

  await connection.end();
  console.log('🎉 Database seeding completed!');
}

seed().catch(console.error);
