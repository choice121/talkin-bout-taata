/**
 * run-patches.js
 * Applies the Phase 4 database patches to your Supabase project.
 *
 * Setup (one-time):
 *   1. Go to your Supabase project → Settings → Database
 *   2. Copy the "Connection string" (URI format)
 *   3. In Replit → Secrets, add:  SUPABASE_DB_URL = <that connection string>
 *
 * Then run:
 *   node run-patches.js
 */

const { Client } = require('pg');
const fs         = require('fs');
const path       = require('path');

const PATCH_FILE = path.join(__dirname, 'phase4-patches.sql');
const DB_URL     = process.env.SUPABASE_DB_URL;

async function main() {
  if (!DB_URL) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  To apply patches automatically, add one secret:

  Name:  SUPABASE_DB_URL
  Value: Your Supabase database connection string
         (Supabase → Settings → Database → URI)

  Then run:  node run-patches.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Or paste the contents of phase4-patches.sql
  directly into the Supabase SQL Editor.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    process.exit(0);
  }

  if (!fs.existsSync(PATCH_FILE)) {
    console.error(`ERROR: ${PATCH_FILE} not found.`);
    process.exit(1);
  }

  const sql = fs.readFileSync(PATCH_FILE, 'utf8');

  console.log('Connecting to Supabase…');
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected.\n');

  try {
    console.log('Applying Phase 4 patches…');
    const result = await client.query(sql);
    const last   = Array.isArray(result) ? result[result.length - 1] : result;
    const msg    = last?.rows?.[0]?.result ?? 'done';
    console.log(`\n✓ ${msg}`);
  } catch (err) {
    console.error('\nPatch failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
