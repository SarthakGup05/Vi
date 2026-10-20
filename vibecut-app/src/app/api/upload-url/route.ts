import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl, isAwsConfigured } from "@/lib/aws";

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType } = await req.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    // Check if AWS credentials are set
    if (!isAwsConfigured()) {
      return NextResponse.json(
        {
          error: "AWS credentials not configured. Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local",
          isMock: true,
        },
        { status: 200 } // Graceful fallback for local development without credentials
      );
    }

    const { uploadUrl, fileKey, bucket } = await getPresignedUploadUrl(
      fileName,
      contentType
    );

    return NextResponse.json({
      uploadUrl,
      fileKey,
      bucket,
    });
  } catch (error: any) {
    console.error("Error generating presigned upload URL:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
