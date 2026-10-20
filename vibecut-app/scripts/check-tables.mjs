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

async function checkTables() {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': secretKey,
      'Authorization': `Bearer ${secretKey}`,
    }
  });
  const data = await res.json();
  console.log('Definitions/Tables in public schema:', Object.keys(data.definitions || {}));
}

checkTables();
