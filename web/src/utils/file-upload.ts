import { API_BASE } from "@/lib/api/base";

/**
 * Uploads a file to the Go backend's file storage and returns its key.
 *
 * The browser sends the file straight to Go rather than through tRPC or a
 * Next route: tRPC only carries JSON, and Vercel functions reject request
 * bodies over 4.5 MB.
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/files`, {
    method: "POST",
    body: formData,
  });
  const body: { data?: { fileKey?: string }; error?: string } = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !body.data?.fileKey) {
    throw new Error(body.error ?? `File upload failed (HTTP ${response.status})`);
  }
  return body.data.fileKey;
}
