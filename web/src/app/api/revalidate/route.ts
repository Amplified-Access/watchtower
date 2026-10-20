import { revalidateTag } from "next/cache";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { SANITY_CACHE_TAG } from "@/lib/sanity/live";

// Called by a Sanity webhook whenever content is published. Sanity Live
// (lib/sanity/live.ts) already refreshes pages while someone has one open;
// this covers publishes nobody is watching, so the next visitor gets the new
// content instead of a copy up to a minute old. Every Sanity fetch carries
// the one `sanity` tag: content is small and publishing is rare, so dropping
// all of it is simpler than tracking which pages a document feeds.
// Setup: docs/CMS.md ("Publishing straight away").
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ message: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? "";
  if (!(await isValidSignature(body, signature, secret))) {
    return Response.json({ message: "Invalid signature" }, { status: 401 });
  }

  revalidateTag(SANITY_CACHE_TAG);
  return Response.json({ revalidated: true });
}
