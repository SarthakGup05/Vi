import { S3Client, HeadBucketCommand, PutObjectCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
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

async function testS3() {
  console.log(`--- Testing AWS S3 connection for bucket: ${bucket} in region: ${region} ---`);

  // 1. Head Bucket Check
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log('✅ Bucket exists and is accessible!');
  } catch (err) {
    console.error('❌ HeadBucket error:', err.message);
    return;
  }

  // 2. CORS check
  try {
    const cors = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
    console.log('✅ CORS configuration found on bucket:');
    console.log(JSON.stringify(cors.CORSRules, null, 2));
  } catch (err) {
    console.log('⚠️ CORS check notice:', err.message);
  }

  // 3. Presigned PUT URL test
  try {
    const testKey = `test-handshake-${Date.now()}.txt`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      ContentType: 'text/plain',
    });
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    console.log('✅ Presigned PUT URL generated successfully!');
    console.log('Presigned URL sample:', presignedUrl.slice(0, 80) + '...');

    // 4. Test uploading via the presigned URL
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: 'VibeCut AI S3 handshake verified!',
    });

    if (uploadRes.ok) {
      console.log('🎉 Direct upload via Presigned URL succeeded! (HTTP', uploadRes.status, ')');
    } else {
      console.error('❌ Presigned URL upload failed:', uploadRes.status, await uploadRes.text());
    }
  } catch (err) {
    console.error('❌ Presigned upload error:', err.message);
  }
}

testS3();
