// Data Migration Import Script
// Imports CSV data from old tax software into D1 database

import fs from 'fs';
import { parse } from 'csv-parse/sync';

const CSV_DIR = './migration-data/csv';

// Parse CSV file
function parseCSV(filename) {
  const filePath = `${CSV_DIR}/${filename}`;
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filename} not found, skipping...`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

// Import clients
async function importClients(db) {
  console.log('\n📋 Importing clients...');
  const clients = parseCSV('clients.csv');
  
  let imported = 0;
  for (const client of clients) {
    try {
      await db.prepare(
        `INSERT INTO clients (name, email, phone, ssn, address, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        client.name,
        client.email || null,
        client.phone || null,
        client.ssn || null,
        client.address || null
      ).run();
      
      imported++;
      console.log(`  ✓ ${client.name}`);
    } catch (err) {
      console.log(`  ✗ ${client.name}: ${err.message}`);
    }
  }
  
  console.log(`✅ Imported ${imported}/${clients.length} clients`);
  return imported;
}

// Import staff/users
async function importStaff(db) {
  console.log('\n👥 Importing staff...');
  const staff = parseCSV('staff.csv');
  
  let imported = 0;
  for (const user of staff) {
    try {
      // Generate temp password (user must reset)
      const tempPassword = await hashPassword('TempPassword123!');
      
      await db.prepare(
        `INSERT INTO staff (name, email, role, password_hash, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).bind(
        user.name,
        user.email,
        user.role || 'staff',
        tempPassword
      ).run();
      
      imported++;
      console.log(`  ✓ ${user.name} (${user.role})`);
    } catch (err) {
      console.log(`  ✗ ${user.name}: ${err.message}`);
    }
  }
  
  console.log(`✅ Imported ${imported}/${staff.length} staff`);
  return imported;
}

// Import returns
async function importReturns(db) {
  console.log('\n📄 Importing returns...');
  const returns = parseCSV('returns.csv');
  
  let imported = 0;
  for (const ret of returns) {
    try {
      // Find client_id by name
      const client = await db.prepare(
        'SELECT id FROM clients WHERE name = ?'
      ).bind(ret.client_name).first();
      
      if (!client) {
        console.log(`  ✗ ${ret.client_name}: Client not found`);
        continue;
      }
      
      await db.prepare(
        `INSERT INTO returns (client_id, tax_year, return_type, status, date_filed, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        client.id,
        ret.tax_year,
        ret.return_type || '1040',
        ret.status || 'pending',
        ret.date_filed || null
      ).run();
      
      imported++;
      console.log(`  ✓ ${ret.client_name} - ${ret.tax_year} ${ret.return_type}`);
    } catch (err) {
      console.log(`  ✗ ${ret.client_name}: ${err.message}`);
    }
  }
  
  console.log(`✅ Imported ${imported}/${returns.length} returns`);
  return imported;
}

// Import fees/payments
async function importFees(db) {
  console.log('\n💰 Importing fees...');
  const fees = parseCSV('fees.csv');
  
  let imported = 0;
  for (const fee of fees) {
    try {
      // Find client_id by name
      const client = await db.prepare(
        'SELECT id FROM clients WHERE name = ?'
      ).bind(fee.client_name).first();
      
      if (!client) {
        console.log(`  ✗ ${fee.client_name}: Client not found`);
        continue;
      }
      
      await db.prepare(
        `INSERT INTO fees (client_id, service, amount, status, payment_date, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        client.id,
        fee.service || 'Tax Preparation',
        fee.amount,
        fee.paid === 'yes' ? 'paid' : 'pending',
        fee.date || null
      ).run();
      
      imported++;
      console.log(`  ✓ ${fee.client_name}: $${fee.amount}`);
    } catch (err) {
      console.log(`  ✗ ${fee.client_name}: ${err.message}`);
    }
  }
  
  console.log(`✅ Imported ${imported}/${fees.length} fees`);
  return imported;
}

// Helper: Hash password (bcrypt)
async function hashPassword(password) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

// Main migration function
async function runMigration() {
  console.log('🚀 Ross Tax Prep - Data Migration Tool\n');
  console.log('═══════════════════════════════════════\n');
  
  // Check if CSV directory exists
  if (!fs.existsSync(CSV_DIR)) {
    console.log(`❌ Error: ${CSV_DIR} directory not found`);
    console.log('Please create the directory and add CSV files:');
    console.log('  - clients.csv');
    console.log('  - staff.csv');
    console.log('  - returns.csv');
    console.log('  - fees.csv');
    return;
  }
  
  // Note: This script needs to be run with wrangler for D1 access
  console.log('⚠️  This script requires D1 database access.');
  console.log('Run with: npx wrangler d1 execute ross-tax-prep-db --local --file=migration-data/import.sql\n');
  
  // Generate SQL file instead
  console.log('📝 Generating SQL import file...\n');
  generateSQL();
}

// Generate SQL import file from CSVs
function generateSQL() {
  let sql = '-- Ross Tax Prep Data Migration\n';
  sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
  
  sql += 'BEGIN TRANSACTION;\n\n';
  
  // Import clients
  const clients = parseCSV('clients.csv');
  if (clients.length > 0) {
    sql += '-- Import Clients\n';
    for (const client of clients) {
      const name = client.name.replace(/'/g, "''");
      const email = client.email ? `'${client.email.replace(/'/g, "''")}'` : 'NULL';
      const phone = client.phone ? `'${client.phone}'` : 'NULL';
      const ssn = client.ssn ? `'${client.ssn}'` : 'NULL';
      const address = client.address ? `'${client.address.replace(/'/g, "''")}'` : 'NULL';
      
      sql += `INSERT INTO clients (name, email, phone, ssn, address, created_at) VALUES ('${name}', ${email}, ${phone}, ${ssn}, ${address}, datetime('now'));\n`;
    }
    sql += '\n';
  }
  
  // Import staff
  const staff = parseCSV('staff.csv');
  if (staff.length > 0) {
    sql += '-- Import Staff (Password: TempPassword123! - must be reset)\n';
    for (const user of staff) {
      const name = user.name.replace(/'/g, "''");
      const email = user.email.replace(/'/g, "''");
      const role = user.role || 'staff';
      
      sql += `INSERT INTO staff (name, email, role, password_hash, created_at) VALUES ('${name}', '${email}', '${role}', 'TEMP_HASH', datetime('now'));\n`;
    }
    sql += '\n';
  }
  
  sql += 'COMMIT;\n';
  
  // Write SQL file
  fs.writeFileSync('./migration-data/import.sql', sql);
  console.log('✅ Generated: migration-data/import.sql\n');
  console.log('To import, run:');
  console.log('  npx wrangler d1 execute ross-tax-prep-db --file=migration-data/import.sql\n');
}

// Run migration
runMigration().catch(console.error);
