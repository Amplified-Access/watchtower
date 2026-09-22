import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_S3_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY ?? "",
  },
});

// Anonymous reporters upload evidence here, so this route stays public. Until
// uploads move behind the Go backend's rate limiter, cap the size and refuse
// types a browser would execute if the file were ever served inline.
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set([
  "html", "htm", "xhtml", "svg", "js", "mjs", "cjs", "exe", "bat", "cmd", "sh", "msi", "php",
]);

export const POST = async (req: NextRequest) => {
  const formdata = await req.formData();
  const file = formdata.get("file");

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json(
      { success: false, error: "No valid file found in the request." },
      { status: 400 }
    );
  }

  const uploadedFile = file as File;

  if (uploadedFile.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { success: false, error: "File is too large (50 MB max)." },
      { status: 413 }
    );
  }
  const extension = uploadedFile.name.split(".").pop()?.toLowerCase() ?? "";
  if (!extension || BLOCKED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { success: false, error: "This file type isn't allowed." },
      { status: 415 }
    );
  }

  const bytes = await uploadedFile.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniqueFileName = `${uuidv4()}.${extension}`;

  const putObjectCommand = new PutObjectCommand({
    Bucket: "amplified-access-bucket",
    Key: uniqueFileName,
    Body: buffer,
  });

  try {
    const response = await r2.send(putObjectCommand);
    console.log(response);

    return NextResponse.json(
      { success: true, fileKey: uniqueFileName },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
};
