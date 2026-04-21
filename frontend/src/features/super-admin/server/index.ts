"use server";

import { PutObjectAclCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_S3_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY ?? "",
  },
});

export const UploadFileToCloudFlare = async (file: File | null) => {
  console.log("Received file: ", file);
};
