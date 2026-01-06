import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import crypto from 'crypto';
// Usar crypto nativo do Node.js

// Gerar password aleatória segura
function generateSecurePassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Garantir pelo menos 1 de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Preencher o resto
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Extrair nome do email
function extractNameFromEmail(email) {
  const localPart = email.split('@')[0];
  const parts = localPart.split('.');
  
  if (parts.length >= 2) {
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return `${firstName} ${lastName}`;
  }
  
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

async function registerTeamUsers() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });
  
  const teamEmails = [
    'armando.felix@gavinhogroup.com',
    'maria.gavinho@gavinhogroup.com',
    'rute.santos@by-gavinho.com',
    'leonor.traguil@by-gavinho.com',
    'joao.umbelino@by-gavinho.com',
    'caroline.roda@by-gavinho.com',
    'luciana.ortega@by-gavinho.com'
  ];
  
  const credentials = [];
  
  console.log('🔐 A gerar passwords e registar utilizadores...\n');
  
  for (const email of teamEmails) {
    const password = generateSecurePassword(12);
    // Hash usando PBKDF2 (método seguro nativo do Node.js)
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex') + ':' + salt;
    const name = extractNameFromEmail(email);
    const openId = `gavinho_${crypto.randomBytes(8).toString('hex')}`;
    
    try {
      await db.insert(schema.user).values({
        openId,
        name,
        email,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      credentials.push({
        name,
        email,
        password,
        status: '✅ Registado'
      });
      
      console.log(`✅ ${name} (${email})`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        credentials.push({
          name,
          email,
          password: 'N/A',
          status: '⚠️  Já existe'
        });
        console.log(`⚠️  ${name} (${email}) - Já existe no sistema`);
      } else {
        credentials.push({
          name,
          email,
          password: 'N/A',
          status: `❌ Erro: ${error.message}`
        });
        console.log(`❌ ${name} (${email}) - Erro: ${error.message}`);
      }
    }
  }
  
  await connection.end();
  
  console.log('\n📋 Lista de Credenciais:\n');
  console.log('═'.repeat(80));
  credentials.forEach(cred => {
    console.log(`Nome: ${cred.name}`);
    console.log(`Email: ${cred.email}`);
    console.log(`Password: ${cred.password}`);
    console.log(`Status: ${cred.status}`);
    console.log('─'.repeat(80));
  });
  
  // Salvar em arquivo JSON
  const fs = await import('fs/promises');
  await fs.writeFile(
    '/home/ubuntu/team_credentials.json',
    JSON.stringify(credentials, null, 2)
  );
  
  console.log('\n✅ Credenciais salvas em: /home/ubuntu/team_credentials.json');
  
  return credentials;
}

registerTeamUsers().catch(console.error);
