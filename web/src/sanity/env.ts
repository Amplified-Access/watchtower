// The Sanity project the site reads and the embedded Studio (/studio) edits.
// NEXT_PUBLIC_ so Next inlines them into the Studio's browser bundle; the
// Sanity CLI (sanity.cli.ts) reads the same variables. A project ID is not a
// secret: the dataset is public and editing requires a Sanity login.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
