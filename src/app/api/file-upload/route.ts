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

  const bytes = await uploadedFile.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileExtension = uploadedFile.name.split(".").pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;

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
