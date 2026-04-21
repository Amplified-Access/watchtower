/**
 * Utility function to handle file downloads from Cloudflare R2
 */
export function downloadReport(fileKey: string, title: string) {
  // Create download URL with proper filename
  const downloadUrl = `/api/file-download?fileKey=${encodeURIComponent(
    fileKey
  )}&filename=${encodeURIComponent(title)}.pdf`;

  // Open in new tab to trigger download
  window.open(downloadUrl, "_blank");
}

/**
 * Generic utility function to download any file from Cloudflare R2
 */
export function downloadFileFromR2(fileKey: string, filename: string) {
  // Create download URL with proper filename
  const downloadUrl = `/api/file-download?fileKey=${encodeURIComponent(
    fileKey
  )}&filename=${encodeURIComponent(filename)}`;

  // Open in new tab to trigger download
  window.open(downloadUrl, "_blank");
}

/**
 * Utility function to get a direct public URL for a file in Cloudflare R2
 * This can be used for preview purposes if the bucket is configured for public access
 */
export function getFilePreviewUrl(fileKey: string): string {
  return `/api/file-download?fileKey=${encodeURIComponent(fileKey)}`;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  return `${size} ${sizes[i]}`;
}

/**
 * Validate if a file is a PDF
 */
export function isPDF(filename: string): boolean {
  return filename.toLowerCase().endsWith(".pdf");
}
