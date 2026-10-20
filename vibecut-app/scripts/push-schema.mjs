import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const dbPassword = 'BS8nyOjtpdqdlpiC';
const projectRef = 'mlpybvvcgeftnpextwwm';

// Potential connection endpoints
const connectionConfigs = [
  {
    name: 'Direct Supabase Host (port 5432)',
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'Supabase Pooler ap-south-1 (port 6543)',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${projectRef}`,
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'Supabase Pooler us-east-1 (port 6543)',
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${projectRef}`,
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
];

const schemaPath = path.resolve('..', 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

async function pushSchema() {
  let connectedClient = null;

  for (const config of connectionConfigs) {
    console.log(`Attempting connection via ${config.name}...`);
    const client = new Client(config);
    try {
      await client.connect();
      console.log(`✅ Connected successfully via ${config.name}!`);
      connectedClient = client;
      break;
    } catch (err) {
      console.log(`Connection via ${config.name} failed: ${err.message}`);
    }
  }

  if (!connectedClient) {
    console.error('❌ Could not connect to database via any host.');
    process.exit(1);
  }

  try {
    console.log('\nExecuting schema.sql on remote database...');
    await connectedClient.query(sql);
    console.log('✅ schema.sql executed successfully!');

    // Query tables in public schema
    const res = await connectedClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nTables currently in public schema:');
    res.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));

    // Verify row count of users table
    const usersRes = await connectedClient.query('SELECT count(*) FROM public.users;');
    console.log(`\nUsers synchronized in public.users: ${usersRes.rows[0].count}`);

    await connectedClient.end();
    console.log('\n🎉 Database schema push complete!');
  } catch (err) {
    console.error('Error executing SQL:', err);
    await connectedClient.end();
    process.exit(1);
  }
}

pushSchema();
