import { buildLlmsFull } from "@/lib/seo/llms";
import { getLlmsInput } from "@/lib/seo/page";

// /llms-full.txt: the full text of the site's content pages for AI assistants
// (lib/seo/llms.ts). Rebuilt from Sanity at most once an hour.
export const revalidate = 3600;

export async function GET() {
  return new Response(buildLlmsFull(await getLlmsInput()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
