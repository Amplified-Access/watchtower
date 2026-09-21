"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MiniatureMapThumbnail from "./miniature-map-thumbnail";
import BrowserFrame from "./maps-landing/browser-frame";
import { generateIncidentTypeSlug } from "@/features/maps";

const toSentenceCase = (name: string) => {
  const s = name.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const cellClassName =
  "border-b border-border px-6 py-10 md:px-10 md:py-12 md:odd:border-r";

// Blue card with a browser window holding the live thumbnail map, cropped at
// the right and bottom edges like the design mockup.
const MapMockup = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mt-8 aspect-6/5 w-full overflow-hidden rounded-2xl bg-linear-to-b from-primary via-primary/50 to-white ring-1 ring-border md:aspect-5/4">
    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-[radial-gradient(var(--primary)_1.5px,transparent_1.5px)] bg-size-[10px_10px] opacity-40 mask-[linear-gradient(to_right,black,transparent)]" />
    <BrowserFrame
      className="absolute top-[12%] -right-6 bottom-0 left-[10%] flex flex-col transition-transform duration-300 group-hover:-translate-y-1"
      contentClassName="min-h-0 flex-1 rounded-tl-xl p-3 pr-0 pb-0 md:p-4 md:pr-0 md:pb-0"
    >
      {/* The content box is padded, so the thumbnail sits inside its corner
          radius and shows a square corner of its own unless it is clipped too.
          The radius lives here rather than on the thumbnail's wrapper because
          that wrapper is zoomed, which would scale the radius out of step with
          the frame around it. */}
      <div className="h-full overflow-hidden rounded-tl-lg">{children}</div>
    </BrowserFrame>
  </div>
);

const DynamicThematicMaps = () => {
  const t = useTranslations("MapsPage");
  const {
    data: incidentTypesData,
    isLoading,
    error,
  } = trpc.anonymousReports.getActiveIncidentTypesForMaps.useQuery();

  const incidentTypes = incidentTypesData?.data ?? [];
  const failed = !isLoading && (error || !incidentTypesData?.success);

  return (
    <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
        <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
        <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
      </div>
      <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
        <div className="border-b border-border px-6 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl font-title text-3xl font-semibold text-dark md:text-4xl">
            {t("thematicLabel")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-dark/60 leading-snug">
            {t("thematicDescription")}
          </p>
        </div>

        {isLoading && (
          <div className="grid md:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className={cellClassName}>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Skeleton className="h-12 w-3/4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-4 h-11 w-36" />
                  </div>
                </div>
                <Skeleton className="mt-8 aspect-6/5 w-full rounded-2xl md:aspect-5/4" />
              </div>
            ))}
          </div>
        )}

        {failed && (
          <p className="border-b border-border py-16 text-center text-muted-foreground">
            {t("thematicError")}
          </p>
        )}

        {!isLoading && !failed && incidentTypes.length === 0 && (
          <p className="border-b border-border py-16 text-center text-muted-foreground">
            {t("thematicEmpty")}
          </p>
        )}

        {!isLoading && !failed && incidentTypes.length > 0 && (
          <div className="grid md:grid-cols-2">
            {incidentTypes.map((incidentType) => {
              const href = `/maps/${generateIncidentTypeSlug(incidentType.name)}`;
              const label = toSentenceCase(incidentType.name);

              return (
                <div key={incidentType.id} className={cellClassName}>
                  {/* Side by side only from xl: real type names ("Public demonstrations")
                      are longer than the design's, and need the wider title column. */}
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] xl:gap-8">
                    <h3 className="min-w-0 font-title text-3xl font-semibold leading-[1.05] text-dark hyphens-auto">
                      {label}
                    </h3>
                    <div>
                      {incidentType.description && (
                        <p className="line-clamp-4 text-dark/60 leading-snug">
                          {incidentType.description}
                        </p>
                      )}
                      <Link
                        href={href}
                        className={cn(
                          buttonVariants({ variant: "default", size: "lg" }),
                          "mt-6 font-title font-medium",
                        )}
                      >
                        {t("exploreMap")}
                        <ChevronRight />
                      </Link>
                    </div>
                  </div>

                  <Link
                    href={href}
                    aria-label={`${t("exploreMap")}: ${label}`}
                    className="group block"
                  >
                    <MapMockup>
                      {/* Cancels the section's zoom so Mapbox renders at true
                          pixels instead of an upscaled, blurry canvas. */}
                      <div className="h-full [zoom:calc(1/var(--viewport-scale))]">
                        <MiniatureMapThumbnail
                          incidentTypeName={incidentType.name}
                          // Some colors come back from the API with stray whitespace/CRLF.
                          incidentTypeColor={incidentType.color?.trim() || undefined}
                          mapStyle="mapbox://styles/mapbox/outdoors-v12"
                          className="relative h-full w-full"
                        />
                      </div>
                    </MapMockup>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default DynamicThematicMaps;
