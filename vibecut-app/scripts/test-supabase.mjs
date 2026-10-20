import { createClient } from '@supabase/supabase-js';
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
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function testConnection() {
  console.log('Testing Supabase connectivity to:', url);
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Session error:', error.message);
  } else {
    console.log('✅ Supabase connected successfully! Auth service reachable. Session:', data.session ? 'Active' : 'No active session (clean)');
  }
}

testConnection();
