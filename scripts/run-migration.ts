/**
 * Run Supabase migration using direct PostgreSQL connection
 *
 * Usage:
 *   DATABASE_URL=postgres://... npm run migrate
 *   -- OR --
 *   DATABASE_PASSWORD=your_db_password npm run migrate
 *
 * Get the database connection string from:
 *   Supabase Dashboard → Project Settings → Database → Connection string (URI)
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PROJECT_REF = 'cgiagucxhrokmcomldsu';

async function runMigration() {
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    const password = process.env.DATABASE_PASSWORD;

    if (!password) {
      console.error('❌ DATABASE_URL or DATABASE_PASSWORD environment variable is required');
      console.log('\nTo get your database connection string:');
      console.log('1. Go to https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database');
      console.log('2. Copy the "Connection string" (URI format)');
      console.log('3. Run: DATABASE_URL="your_connection_string" npm run migrate');
      console.log('\n   -- OR --');
      console.log('\n   DATABASE_PASSWORD=your_password npm run migrate');
      process.exit(1);
    }

    // Use direct connection (not pooler) for DDL statements
    connectionString = `postgresql://postgres:${password}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
  }

  console.log('🔌 Connecting to Supabase database...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260131100000_multi_tenant.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration: 20260131100000_multi_tenant.sql');
    console.log('   Creating tables: tenants, whatsapp_accounts, agent_configs');
    console.log('   Adding tenant_id to: leads, conversations, messages');
    console.log('   Setting up RLS policies and functions...\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('tenants', 'whatsapp_accounts', 'agent_configs')
      ORDER BY table_name
    `);

    console.log('\n📋 Verified tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

  } catch (error: unknown) {
    const err = error as Error & { code?: string; detail?: string };
    console.error('❌ Migration failed:', err.message);
    if (err.code === '42P07') {
      console.log('\n⚠️  Some tables already exist. Migration may have been partially applied.');
      console.log('   Check your database to verify the current state.');
    }
    if (err.detail) {
      console.error('   Detail:', err.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
