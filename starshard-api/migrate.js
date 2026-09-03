// Migration runner. Deliberately tiny and deliberately manual.
//
//   node migrate.js migrations/2026-09-02-email-verification.sql
//
// tools/deploy.sh does NOT call this and should not: migrations touch production
// data, so they stay a step someone runs on purpose after reading the file. This
// exists so that running one does not mean pasting credentials into a shell —
// it reuses server.js's own dotenv + mysql2 config, so the .env on the box stays
// the only place they live.
//
// Statements are split on semicolons at end of line, which is enough for the SQL
// this project writes (plain DDL, no stored procedures, no semicolons inside
// string literals). If that ever stops being true, this needs a real parser, not
// a cleverer regex — check before assuming it still holds.
//
// Already-applied migrations are reported and skipped, not failed: ALTER TABLE has
// no IF NOT EXISTS for columns in MySQL 8, so re-running one is the normal way to
// find out whether it landed. Anything else throws and stops the run.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const IDEMPOTENT = new Set(['ER_DUP_FIELDNAME', 'ER_TABLE_EXISTS_ERROR', 'ER_DUP_KEYNAME']);

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node migrate.js <path/to/migration.sql>');
    process.exit(2);
  }
  const sql = fs.readFileSync(path.resolve(file), 'utf8');
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean);

  const conn = await mysql.createConnection(
    process.env.DB_HOST
      ? {
          host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
          user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
          multipleStatements: false,
        }
      : {
          socketPath: process.env.DB_SOCKET,
          user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
          multipleStatements: false,
        }
  );

  console.log(`${path.basename(file)}: ${statements.length} statement(s)`);
  let applied = 0, skipped = 0;
  for (const [i, stmt] of statements.entries()) {
    const label = stmt.split('\n')[0].slice(0, 72);
    try {
      await conn.query(stmt);
      applied++;
      console.log(`  [${i + 1}] applied   ${label}`);
    } catch (e) {
      if (IDEMPOTENT.has(e.code)) {
        skipped++;
        console.log(`  [${i + 1}] already   ${label}  (${e.code})`);
      } else {
        console.error(`  [${i + 1}] FAILED    ${label}`);
        console.error(`      ${e.code || ''} ${e.message}`);
        await conn.end();
        process.exit(1);
      }
    }
  }
  console.log(`done: ${applied} applied, ${skipped} already in place`);
  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
