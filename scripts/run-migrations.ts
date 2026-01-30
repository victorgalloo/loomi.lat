/**
 * Script to run Supabase migrations via REST API
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/run-migrations.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use the Supabase SQL API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: text };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function runMigrationStatements(filename: string, sql: string): Promise<void> {
  console.log(`\nRunning migration: ${filename}`);
  console.log('-'.repeat(50));

  // Split SQL by semicolons but handle functions with $$ delimiters
  const statements: string[] = [];
  let current = '';
  let inFunction = false;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('--')) continue;

    current += line + '\n';

    // Track function blocks
    if (trimmed.includes('$$')) {
      inFunction = !inFunction;
    }

    // End of statement
    if (trimmed.endsWith(';') && !inFunction) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') {
        statements.push(stmt);
      }
      current = '';
    }
  }

  // Add any remaining statement
  if (current.trim()) {
    statements.push(current.trim());
  }

  console.log(`Found ${statements.length} statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);

    const result = await executeSql(stmt);

    if (result.success) {
      console.log('✅');
    } else if (result.error?.includes('already exists') || result.error?.includes('does not exist')) {
      console.log('⚠️ (already exists/not found - OK)');
    } else {
      console.log('❌');
      console.log(`    Error: ${result.error?.substring(0, 200)}`);
    }
  }
}

async function main() {
  console.log('\n===========================================');
  console.log('   SUPABASE MIGRATIONS');
  console.log('===========================================');
  console.log(`Project: ${projectRef}`);

  // First, let's check if we need to create the exec_sql function
  console.log('\nChecking database connection...');

  // Test connection by querying a table
  const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=count&limit=1`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!testResponse.ok) {
    console.log('❌ Could not connect to database');
    console.log('\nPlease run the following SQL in Supabase Dashboard SQL Editor:');
    console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql');
    console.log('\n--- COPY FROM HERE ---\n');

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f.startsWith('20260129'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`-- ${file}`);
      console.log(sql);
      console.log('\n');
    }

    console.log('--- END COPY ---\n');
    return;
  }

  console.log('✅ Connected to database');

  // Print SQL for manual execution in Supabase Dashboard
  console.log('\n📋 Run the following SQL in Supabase Dashboard SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql\n`);

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && f.startsWith('20260129'))
    .sort();

  console.log('--- COPY SQL FROM HERE ---\n');

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`-- Migration: ${file}`);
    console.log(sql);
  }

  console.log('\n--- END SQL ---');

  console.log('\n===========================================\n');
}

main().catch(console.error);
