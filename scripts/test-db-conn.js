import pkg from 'pg';
const { Client } = pkg;

(async () => {
  const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];
  if (!DATABASE_URL) {
    console.error('ERROR: No DATABASE_URL provided. Pass it via env or as the first arg.');
    process.exit(1);
  }

  console.log('Testing DB connection to:', DATABASE_URL.substring(0, 80) + '...');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      // For testing only: allow self-signed certs. In production prefer proper cert validation.
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    const res = await client.query('SELECT version();');
    console.log('Connected. Postgres version:', res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection error:');
    console.error(err);
    try { await client.end(); } catch(e){}
    process.exit(2);
  }
})();
