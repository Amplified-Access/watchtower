import { cache } from "react";
import { deploymentsApi, type Deployment } from "@/lib/api/deployments";

// A live or closed deployment by its slug, read on the server for its public
// pages, or null (unknown, a draft, or Go unreachable). Cached per request,
// so a page's metadata and body share one fetch.
export const getPublicDeployment = cache(async (slug: string): Promise<Deployment | null> => {
  const res = await deploymentsApi.getPublic(slug).catch(() => null);
  return res?.success && res.data ? res.data : null;
});
