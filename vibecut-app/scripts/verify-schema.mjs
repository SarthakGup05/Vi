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

async function checkSchema() {
  console.log('Inspecting public schema tables on Supabase: ' + url);
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`,
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch OpenAPI schema:', res.status, await res.text());
      return;
    }

    const data = await res.json();
    const tables = Object.keys(data.definitions || {});
    console.log(`\nFound ${tables.length} tables in public schema:`);
    tables.forEach(t => console.log(`  ✓ ${t}`));

    const expected = ['guest_sessions', 'users', 'day_passes', 'projects', 'transcripts', 'edl_revisions', 'render_jobs'];
    const missing = expected.filter(t => !tables.includes(t));

    if (missing.length === 0) {
      console.log('\n🎉 ALL 7 TABLES ARE DEPLOYED & ACTIVE IN SUPABASE!');
    } else {
      console.log(`\n⏳ Awaiting migration for: ${missing.join(', ')}`);
    }
  } catch (err) {
    console.error('Check failed:', err.message);
  }
}

checkSchema();
