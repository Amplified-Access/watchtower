import { defineCliConfig } from "sanity/cli";

// For Sanity CLI commands run from frontend/ (schema validation, dataset
// import, CORS). The Studio itself is part of the site at /studio, so there
// is nothing to `sanity deploy`.
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  },
});
