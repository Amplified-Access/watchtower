import z from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { locales } from "@/i18n/locales";
import { autocompletePlaces, getPlaceDetails } from "@/lib/google/places";

// Google location search for the report form (lib/google/places.ts). Public,
// like the form; the inputs are bounded so the endpoint can't be used to send
// Google arbitrary requests on Watchtower's key.
const sessionToken = z.string().uuid();

export const placesRouter = router({
  // Suggestions for what the reporter has typed. Fails soft: a Google error
  // shows as "no location found" rather than breaking the form.
  autocomplete: publicProcedure
    .input(
      z.object({
        input: z.string().trim().min(3).max(200),
        sessionToken,
        languageCode: z.enum(locales).optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await autocompletePlaces(input);
      } catch (error) {
        console.error("Place autocomplete failed:", error);
        return [];
      }
    }),

  // The picked place's coordinates, address and country.
  details: publicProcedure
    .input(z.object({ placeId: z.string().min(1).max(300), sessionToken }))
    .query(async ({ input }) => {
      try {
        const place = await getPlaceDetails(input);
        if (!place) throw new TRPCError({ code: "NOT_FOUND", message: "Place not found" });
        return place;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Place details failed:", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Could not load the place" });
      }
    }),
});
