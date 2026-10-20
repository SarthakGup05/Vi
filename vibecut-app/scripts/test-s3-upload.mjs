import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import https from 'https';
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

async function uploadDirectViaSDK() {
  const testKey = `sdk-test-${Date.now()}.txt`;
  console.log('Testing direct PutObjectCommand via AWS SDK...');
  try {
    const res = await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: 'VibeCut AI S3 SDK PutObject verified!',
      ContentType: 'text/plain'
    }));
    console.log('🎉 S3 SDK PutObject succeeded! ETag:', res.ETag);
  } catch (err) {
    console.error('SDK PutObject error:', err);
  }
}

async function uploadViaHttps() {
  const testKey = `presigned-test-${Date.now()}.txt`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: testKey,
    ContentType: 'text/plain',
  });
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const urlObj = new URL(presignedUrl);

  const req = https.request({
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'PUT',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength('Test presigned upload payload'),
    }
  }, (res) => {
    console.log(`🎉 Presigned PUT response: HTTP ${res.statusCode} ${res.statusMessage}`);
  });

  req.on('error', (e) => {
    console.error('HTTPS request error:', e.message);
  });

  req.write('Test presigned upload payload');
  req.end();
}

async function main() {
  await uploadDirectViaSDK();
  await uploadViaHttps();
}

main();
