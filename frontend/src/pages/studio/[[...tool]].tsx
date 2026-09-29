import Head from "next/head";
import dynamic from "next/dynamic";
import { projectId } from "@/sanity/env";

// The Sanity Studio, where editors manage case studies and legal pages; see
// docs/CMS.md. A Pages Router route on purpose, the only one in the app:
// Sanity v6 uses React 19.2's `Activity`, which the React build Next 15
// bundles for the App Router doesn't export yet, while the Pages Router runs
// the installed `react` (19.2). It also keeps the site's layout and global CSS
// away from the Studio. Once the site is on Next 16, this can move to app/.
//
// The Studio only runs in the browser, and it is large: loading it here keeps
// it out of the server render and out of every other page's bundle. Editors
// sign in with their Sanity account, so the page itself needs no auth.
const Studio = dynamic(() => import("@/sanity/studio"), { ssr: false });

const StudioPage = () => (
  <>
    <Head>
      <title>Content Studio | WatchTower</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    </Head>
    {projectId ? (
      <Studio />
    ) : (
      <main style={{ maxWidth: 560, margin: "96px auto", padding: "0 24px", fontFamily: "system-ui, sans-serif" }}>
        <h1>The content studio isn&apos;t set up</h1>
        <p>
          Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and <code>NEXT_PUBLIC_SANITY_DATASET</code> (run{" "}
          <code>pnpm sanity:setup</code> in <code>frontend/</code>), then restart the server.
        </p>
      </main>
    )}
  </>
);

export default StudioPage;
