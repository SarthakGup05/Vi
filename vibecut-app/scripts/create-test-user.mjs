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
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const adminClient = createClient(url, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUser = {
  email: 'creator.test@vibecut.ai',
  password: 'VibeCutPassword2026!',
  email_confirm: true,
  user_metadata: {
    full_name: 'VibeCut Test Creator',
    tier: 'Pro Creator',
  },
};

async function run() {
  console.log('--- 1. Creating confirmed test user via Supabase Admin API ---');
  const { data: createdData, error: createError } = await adminClient.auth.admin.createUser(testUser);

  if (createError) {
    if (createError.message.includes('already registered') || createError.message.includes('User already registered')) {
      console.log('User already exists in Supabase. Proceeding to test authentication...');
    } else {
      console.error('Error creating user with admin key:', createError.message);
      console.log('Attempting standard signUp via anon client...');
      const publicClient = createClient(url, anonKey);
      const { data: signUpData, error: signUpError } = await publicClient.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: testUser.user_metadata,
        },
      });
      if (signUpError) {
        console.error('Sign up error:', signUpError.message);
        return;
      }
      console.log('Sign up result:', signUpData.user ? 'Created (ID: ' + signUpData.user.id + ')' : 'No user');
    }
  } else {
    console.log('✅ User successfully created in Supabase! User ID:', createdData.user?.id);
  }

  console.log('\n--- 2. Testing login authentication via Public Anon Client ---');
  const publicClient = createClient(url, anonKey);
  const { data: authData, error: authError } = await publicClient.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password,
  });

  if (authError) {
    console.error('❌ Sign In Failed:', authError.message);
  } else {
    console.log('🎉 Sign In Succeeded!');
    console.log('Authenticated User ID:', authData.user.id);
    console.log('Email:', authData.user.email);
    console.log('Metadata:', JSON.stringify(authData.user.user_metadata, null, 2));
    console.log('Session Access Token:', authData.session.access_token.slice(0, 30) + '...');
  }
}

run();
