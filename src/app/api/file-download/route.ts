import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_S3_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY ?? "",
  },
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileKey = searchParams.get("fileKey");
    const filename = searchParams.get("filename");

    if (!fileKey) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Get file from Cloudflare R2
    const getObjectCommand = new GetObjectCommand({
      Bucket: "amplified-access-bucket",
      Key: fileKey,
    });

    const response = await r2.send(getObjectCommand);

    if (!response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Convert the stream to a buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToByteArray();
    const buffer = Buffer.from(await reader);

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.ContentType || "application/octet-stream"
    );
    headers.set("Content-Length", buffer.length.toString());

    // Set filename for download
    if (filename) {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      headers.set("Content-Disposition", `attachment; filename="${fileKey}"`);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
