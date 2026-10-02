import { buildLlmsTxt } from "@/lib/seo/llms";
import { getLlmsInput } from "@/lib/seo/page";

// /llms.txt: the curated index of the site for AI assistants (lib/seo/llms.ts).
// Rebuilt from Sanity at most once an hour.
export const revalidate = 3600;

export async function GET() {
  return new Response(buildLlmsTxt(await getLlmsInput()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
