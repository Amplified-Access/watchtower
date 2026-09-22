import { router } from "../trpc";
import { adminRouter } from "./admin";
import { coreRouter } from "./core";
import { datasetsRouter } from "./datasets";
import { insightsRouter } from "./insights";
import { mapRouter } from "./map";
import { organizationsRouter } from "./organizations";
import { reportsRouter } from "./reports";
import { superAdminRouter } from "./super-admin";

export const appRouter = router({
  ...coreRouter._def.record,
  ...reportsRouter._def.record,
  ...insightsRouter._def.record,
  ...organizationsRouter._def.record,
  ...adminRouter._def.record,
  ...superAdminRouter._def.record,
  ...datasetsRouter._def.record,
  map: mapRouter,
});

export type AppRouter = typeof appRouter;
