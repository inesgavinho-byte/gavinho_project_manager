#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

try {
  console.log('🔄 Reading DATABASE_URL...');
  const envFile = readFileSync('.env', 'utf-8');
  const dbUrl = envFile.match(/DATABASE_URL="(.+)"/)?.[1];
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL not found in .env');
  }

  console.log('📊 Generating migration SQL...');
  execSync('pnpm exec drizzle-kit generate', { 
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  console.log('✅ Migration generated!');
  console.log('');
  console.log('⚠️  To apply the migration to the database, run:');
  console.log('   pnpm exec drizzle-kit push');
  console.log('');
  console.log('Or manually apply the SQL files in drizzle/migrations/');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
