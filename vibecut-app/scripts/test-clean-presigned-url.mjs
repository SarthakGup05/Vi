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
  // Disable automatic request checksum calculation for presigned URLs
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

async function testCleanUrl() {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: 'test.mp4',
    ContentType: 'video/mp4',
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 900 });
  console.log('Clean Presigned URL:');
  console.log(url);
  console.log('\nHas x-amz-checksum-crc32?', url.includes('checksum'));
}

testCleanUrl();
