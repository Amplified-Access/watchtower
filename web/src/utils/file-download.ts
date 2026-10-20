import { API_BASE } from "@/lib/api/base";

/**
 * URL that downloads a stored file from the Go backend, saved as filename
 * when given.
 */
export function fileDownloadUrl(fileKey: string, filename?: string): string {
  const params = new URLSearchParams({ fileKey });
  if (filename) params.set("filename", filename);
  return `${API_BASE}/files/download?${params}`;
}

/**
 * Downloads a report PDF, named after its title.
 */
export function downloadReport(fileKey: string, title: string) {
  window.open(fileDownloadUrl(fileKey, `${title}.pdf`), "_blank");
}

/**
 * Downloads any stored file.
 */
export function downloadFileFromR2(fileKey: string, filename: string) {
  window.open(fileDownloadUrl(fileKey, filename), "_blank");
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
