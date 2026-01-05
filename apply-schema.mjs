#!/usr/bin/env node
import { execSync } from 'child_process';

try {
  // Run drizzle-kit generate
  console.log('Generating migrations...');
  execSync('pnpm exec drizzle-kit generate', { 
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  // Run drizzle-kit migrate with yes flag
  console.log('Applying migrations...');
  execSync('pnpm exec drizzle-kit migrate', { 
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  console.log('✅ Schema updated successfully!');
} catch (error) {
  console.error('❌ Error applying schema:', error.message);
  process.exit(1);
}
