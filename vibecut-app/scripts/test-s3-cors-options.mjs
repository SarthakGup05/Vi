import https from 'https';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
const bucket = process.env.AWS_S3_BUCKET_NAME || 'vibecut-storage-2026';

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function testOptions() {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: `test-${Date.now()}.mp4`,
    ContentType: 'video/mp4',
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  console.log('Testing browser preflight OPTIONS request to:', uploadUrl);

  const urlObj = new URL(uploadUrl);

  const req = https.request({
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'PUT',
      'Access-Control-Request-Headers': 'content-type',
    }
  }, (res) => {
    console.log(`\nOPTIONS response status: HTTP ${res.statusCode} ${res.statusMessage}`);
    console.log('Response headers:');
    console.log(res.headers);
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Response body:', body));
  });

  req.on('error', (e) => console.error('Request error:', e));
  req.end();
}

testOptions();
