const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
const path = require('path');
const fs = require('fs');

async function main() {
  const dataDir = path.join(__dirname, '..', 'data', 'pg_live');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new PGlite(dataDir);
  await db.waitReady;

  const port = parseInt(process.env.PGPORT || '5432', 10);
  const server = new PGLiteSocketServer({
    db,
    port,
    maxConnections: 100,
  });

  await server.start();
  console.log(`> PostgreSQL server active on port ${port}`);

  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start PostgreSQL server:', err);
  process.exit(1);
});
