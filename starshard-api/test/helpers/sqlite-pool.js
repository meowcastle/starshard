// sqlite-pool.js, a mysql2/promise look-alike over node:sqlite, for the route tests only.
//
// Why: the night shift's VM has no Docker and no mysqld, and the API's routes had never been
// exercised against any database at all (SHIP-AUDIT-26OCT.md §1: "no API integration suite").
// This shim speaks just enough of mysql2's promise API for server.js and lib/manzil-lobby.js
// (pool.execute, pool.getConnection -> execute/beginTransaction/commit/rollback/release) and
// rewrites the handful of MySQL-only constructs the server uses into SQLite:
//   NOW()                                  -> CURRENT_TIMESTAMP (UTC in both engines)
//   INSERT ... ON DUPLICATE KEY UPDATE x = VALUES(x) -> ON CONFLICT DO UPDATE SET x = excluded.x
//   INSERT ... ON DUPLICATE KEY UPDATE id = id       -> ON CONFLICT DO NOTHING
//   INSERT IGNORE INTO                     -> INSERT OR IGNORE INTO
//   Date parameters                        -> 'YYYY-MM-DD HH:MM:SS' UTC strings
//   ER_DUP_ENTRY                           <- SQLITE_CONSTRAINT_UNIQUE, sqlMessage names the column
// schema.sql is translated by the same file (AUTO_INCREMENT, ENGINE=, UNSIGNED, UNIQUE KEY,
// INDEX, ON UPDATE CURRENT_TIMESTAMP). Foreign keys with ON DELETE CASCADE are enforced
// (PRAGMA foreign_keys = ON), so cascade-on-delete is really tested, not assumed.
//
// It is NOT MySQL. Anything that passes here still wants one run against the real thing before
// a schema change ships; what it proves is the handlers' logic, status codes, transactions and
// cascades. Inject it with helpers/boot.js, which puts it in require.cache under mysql2/promise
// before server.js is loaded.
'use strict';

const { DatabaseSync } = require('node:sqlite');

function translateSchema(sql) {
  return sql
    .replace(/^\s*--.*$/gm, '')
    .replace(/\)\s*ENGINE=InnoDB[^;]*;/g, ');')
    .replace(/INT AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/\bTINYINT\(1\)/g, 'INTEGER')
    .replace(/\b(TINYINT|SMALLINT|INT)\s+UNSIGNED\b/g, 'INTEGER')
    .replace(/\bDECIMAL\(\d+,\s*\d+\)/g, 'REAL')
    .replace(/\bLONGTEXT\b/g, 'TEXT')
    .replace(/ ON UPDATE CURRENT_TIMESTAMP/g, '')
    .replace(/,\s*INDEX\s+\w+\s*\([^)]*\)/g, '')
    .replace(/UNIQUE KEY\s+\w+\s*\(/g, 'UNIQUE (')
    .replace(/\bVARCHAR\(\d+\)/g, 'TEXT')
    .replace(/\bCHAR\(\d+\)/g, 'TEXT');
}

function translateQuery(sql) {
  let q = sql.replace(/\bNOW\(\)/g, 'CURRENT_TIMESTAMP');
  q = q.replace(/^(\s*)INSERT IGNORE INTO\b/i, '$1INSERT OR IGNORE INTO'); // the lobby's block list (MZ6)
  const dup = q.match(/\s+ON DUPLICATE KEY UPDATE\s+([\s\S]+)$/i);
  if (dup) {
    const body = dup[1].trim();
    if (/^(\w+)\s*=\s*\1$/.test(body)) {
      q = q.slice(0, dup.index) + ' ON CONFLICT DO NOTHING';
    } else {
      const sets = body.split(',').map(s => s.trim()).map(s => s.replace(/VALUES\((\w+)\)/gi, 'excluded.$1'));
      q = q.slice(0, dup.index) + ' ON CONFLICT DO UPDATE SET ' + sets.join(', ');
    }
  }
  return q;
}

function bindValue(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}

function mysqlError(e, sql) {
  if (e && /UNIQUE constraint failed/.test(e.message)) {
    const err = new Error(e.message);
    err.code = 'ER_DUP_ENTRY';
    err.errno = 1062;
    err.sqlMessage = `Duplicate entry for key '${e.message.replace(/^.*failed:\s*/, '')}'`;
    err.sql = sql;
    return err;
  }
  return e;
}

function createPool(opts = {}) {
  const db = new DatabaseSync(opts.filename || ':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  if (opts.schemaSql) db.exec(translateSchema(opts.schemaSql));

  function execute(sql, params = []) {
    const q = translateQuery(sql);
    try {
      const stmt = db.prepare(q);
      const args = params.map(bindValue);
      if (/^\s*select\b/i.test(q)) {
        return Promise.resolve([stmt.all(...args), []]);
      }
      const r = stmt.run(...args);
      return Promise.resolve([{ insertId: Number(r.lastInsertRowid), affectedRows: Number(r.changes) }, undefined]);
    } catch (e) {
      return Promise.reject(mysqlError(e, q));
    }
  }

  function connection() {
    return {
      execute,
      query: execute,
      beginTransaction: () => { db.exec('BEGIN'); return Promise.resolve(); },
      commit: () => { db.exec('COMMIT'); return Promise.resolve(); },
      rollback: () => { try { db.exec('ROLLBACK'); } catch (e) { /* no open transaction */ } return Promise.resolve(); },
      release: () => {},
    };
  }

  return {
    execute,
    query: execute,
    getConnection: () => Promise.resolve(connection()),
    end: () => { db.close(); return Promise.resolve(); },
    _db: db,
    _translateSchema: translateSchema,
    _translateQuery: translateQuery,
  };
}

module.exports = { createPool, translateSchema, translateQuery };
