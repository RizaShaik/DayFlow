import { pool } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

// TODO (Phase 1+): seed a demo company, admin user, departments, and a
// handful of employees so the UI has real data to render during development.

async function seed() {
  logger.info('Seed script not yet implemented.');
  await pool.end();
}

seed().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
