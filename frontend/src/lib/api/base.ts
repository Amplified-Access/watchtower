// The Go API's base URL. Kept apart from client.ts so browser code can use
// it without pulling in the server-side cookie handling.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
