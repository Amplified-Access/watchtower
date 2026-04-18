// This is the CORRECT helper for the r2.dev URL
const CLOUDFLARE_R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;

export function getR2PublicUrl(fileKey: string): string {
  if (!CLOUDFLARE_R2_PUBLIC_URL) {
    // Handle the case where the variable is missing
    return "";
  }
  return `${CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`;
}
