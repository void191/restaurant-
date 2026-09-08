const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
const path = require('path');
const fs = require('fs');

async function main() {
  const dataDir = process.env.PG_DATA_DIR || path.join(__dirname, '..', 'data', 'pg_live');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Remove stale postmaster.pid if left over from an abrupt shutdown
  const pidFile = path.join(dataDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
    } catch (e) {
      // Ignore if cannot delete
    }
  }

  const db = new PGlite(dataDir);
  await db.waitReady;

  // Verify and bootstrap schema if empty
  try {
    const res = await db.query("SELECT to_regclass('public.branches') AS tbl;");
    if (!res.rows[0] || !res.rows[0].tbl) {
      console.log('> PostgreSQL tables missing. Bootstrapping initial schema...');
      const schemaSqlPath = path.join(__dirname, '..', 'prisma', 'schema.sql');
      if (fs.existsSync(schemaSqlPath)) {
        const sql = fs.readFileSync(schemaSqlPath, 'utf8');
        await db.exec(sql);
        console.log('> PostgreSQL schema bootstrapped successfully.');
      }
    }
  } catch (schemaErr) {
    console.warn('> Warning during schema bootstrap check:', schemaErr.message);
  }

  const port = parseInt(process.env.PGPORT || '5432', 10);
  const server = new PGLiteSocketServer({
    db,
    port,
    host: '127.0.0.1',
    maxConnections: 100,
  });

  await server.start();
  console.log(`> PostgreSQL server active on port ${port}`);

  const shutdown = async () => {
    try {
      await server.stop();
      await db.close();
    } catch (e) {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start PostgreSQL server:', err);
  process.exit(1);
});

