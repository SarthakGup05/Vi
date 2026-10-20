import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getS3Client() {
  const region = process.env.AWS_REGION?.trim() || "ap-south-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";

  return new S3Client({
    region,
    credentials: accessKeyId && secretAccessKey ? {
      accessKeyId,
      secretAccessKey,
    } : undefined,
    // Prevents AWS SDK v3 from adding automatic checksum query parameters
    // that cause browser S3 presigned PUT uploads to fail with checksum mismatch / CORS errors.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function isAwsConfigured(): boolean {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  return Boolean(accessKeyId && secretAccessKey && !accessKeyId.includes("your_"));
}

/**
 * Generate a pre-signed URL for direct browser-to-S3 video upload.
 * This completely bypasses the 4.5MB Next.js / Vercel body size limit.
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string, expiresInSeconds = 900) {
  const s3 = getS3Client();
  const bucketName = process.env.AWS_S3_BUCKET_NAME?.trim() || "vibecut-storage-2026";
  const fileKey = `raw-uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
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
  const s3 = getS3Client();
  const bucketName = process.env.AWS_S3_BUCKET_NAME?.trim() || "vibecut-storage-2026";
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
