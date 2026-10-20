// Brings a dataset up to date with the seed without touching anything an
// editor has written. Run by scripts/sanity-setup.sh as
// `sanity exec sanity/seed/sync.ts --with-user-token`:
//
// - Seed documents the dataset doesn't have are written to MISSING_FILE, for
//   the setup script to `sanity datasets import` (which uploads their images).
// - Documents it has get only the top-level fields they lack (a field added to
//   the seed since, like the privacy policy's page header), on the published
//   version and on an open draft. Fields that exist are never changed, and
//   fields holding images are left to the Studio.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCliClient } from "sanity/cli";

const SEED_DIR = join(process.cwd(), "sanity/seed");
const MISSING_FILE = join(SEED_DIR, ".missing.ndjson");

type Doc = { _id: string; _type: string; [field: string]: unknown };

const main = async () => {
  const client = getCliClient({ apiVersion: "2025-10-15" });
  const seed: Doc[] = readFileSync(join(SEED_DIR, "seed.ndjson"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const ids = seed.flatMap((doc) => [doc._id, `drafts.${doc._id}`]);
  const existing: Doc[] = await client.fetch("*[_id in $ids]", { ids }, { perspective: "raw" });
  const byId = new Map(existing.map((doc) => [doc._id, doc]));

  const missing = seed.filter((doc) => !byId.has(doc._id) && !byId.has(`drafts.${doc._id}`));
  writeFileSync(MISSING_FILE, missing.map((doc) => JSON.stringify(doc)).join("\n") + (missing.length ? "\n" : ""));
  console.log(
    missing.length
      ? `  ${missing.length} seed document(s) to import: ${missing.map((doc) => doc._id).join(", ")}`
      : "  Every seed document is already in the dataset",
  );

  const transaction = client.transaction();
  let patched = 0;
  for (const doc of seed) {
    for (const id of [doc._id, `drafts.${doc._id}`]) {
      const current = byId.get(id);
      if (!current) continue;
      const fields = Object.fromEntries(
        Object.entries(doc).filter(
          ([name, value]) =>
            !name.startsWith("_") && !(name in current) && !JSON.stringify(value).includes("_sanityAsset"),
        ),
      );
      if (Object.keys(fields).length === 0) continue;
      transaction.patch(id, (patch) => patch.setIfMissing(fields));
      console.log(`  ${id}: adding ${Object.keys(fields).join(", ")}`);
      patched++;
    }
  }
  if (patched) await transaction.commit();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
