import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "ap-south-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const bucketName = process.env.AWS_S3_BUCKET_NAME || "vibecut-uploads";

export const s3Client = new S3Client({
  region,
  credentials: accessKeyId && secretAccessKey ? {
    accessKeyId,
    secretAccessKey,
  } : undefined,
});

/**
 * Generate a pre-signed URL for direct browser-to-S3 video upload.
 * This completely bypasses the 4.5MB Next.js / Vercel body size limit.
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string, expiresInSeconds = 900) {
  const fileKey = `raw-uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  return {
    uploadUrl,
    fileKey,
    bucket: bucketName,
  };
}

/**
 * Generate a pre-signed GET URL to stream or download private video assets.
 */
export async function getPresignedDownloadUrl(fileKey: string, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
