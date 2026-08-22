import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query('SELECT name FROM schema_migrations ORDER BY id');
  return new Set(rows.map((r) => r.name));
}

function getMigrationFiles() {
  return fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

async function run() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const files = getMigrationFiles();
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      logger.info('No pending migrations.');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      logger.info(`Applying migration: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration failed: ${file}\n${err.message}`);
      }
    }

    logger.info(`Applied ${pending.length} migration(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
