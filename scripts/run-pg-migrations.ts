/**
 * Script to run Supabase migrations via direct PostgreSQL connection
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

// Load .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// Construct the connection string
// Supabase PostgreSQL connection: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
const DATABASE_URL = `postgresql://postgres.${projectRef}:${SUPABASE_SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

async function runMigrations() {
  console.log('\n===========================================');
  console.log('   RUNNING SUPABASE MIGRATIONS');
  console.log('===========================================');
  console.log(`Project: ${projectRef}\n`);

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f.startsWith('20260129'))
      .sort();

    console.log(`Found ${files.length} migrations to run:\n`);

    for (const file of files) {
      console.log(`Running: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      try {
        await client.query(sql);
        console.log(`  ✅ Success\n`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️ Already exists (OK)\n`);
        } else {
          console.log(`  ❌ Error: ${error.message}\n`);
        }
      }
    }

    console.log('===========================================');
    console.log('   MIGRATIONS COMPLETED');
    console.log('===========================================\n');

  } catch (error) {
    console.error('Database connection error:', error);

    // Fallback: print SQL for manual execution
    console.log('\n📋 Could not connect. Run this SQL manually in Supabase Dashboard:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql\n`);

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f.startsWith('20260129'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`-- ${file}`);
      console.log(sql);
    }
  } finally {
    await client.end();
  }
}

runMigrations().catch(console.error);
