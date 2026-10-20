import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        process.env[match[1]] = process.env[match[1]] || val;
      }
    }
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mlpybvvcgeftnpextwwm.supabase.co';
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

async function testEndpoints() {
  console.log('Testing SQL / DB endpoints on Supabase...');

  // 1. Test /pg endpoint
  try {
    const res = await fetch(`${url}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('/pg/query status:', res.status, await res.text());
  } catch (e) {
    console.log('/pg/query error:', e.message);
  }

  // 2. Test /rest/v1/
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`,
      }
    });
    console.log('/rest/v1/ status:', res.status, (await res.text()).slice(0, 200));
  } catch (e) {
    console.log('/rest/v1/ error:', e.message);
  }
}

testEndpoints();
