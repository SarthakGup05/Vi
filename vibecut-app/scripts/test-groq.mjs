import Groq from 'groq-sdk';
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

const apiKey = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey });

async function testGroq() {
  console.log('Testing Groq API connection...');
  try {
    const models = await groq.models.list();
    console.log('✅ Groq API connection successful!');
    const whisperModel = models.data.find(m => m.id.includes('whisper'));
    console.log('Whisper model available:', whisperModel ? whisperModel.id : 'whisper-large-v3');
    console.log('Total available models:', models.data.length);
  } catch (error) {
    console.error('❌ Groq API error:', error.message);
  }
}

testGroq();
