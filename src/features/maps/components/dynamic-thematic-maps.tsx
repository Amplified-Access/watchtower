"use client";

import { trpc } from "@/_trpc/client";
import Container from "@/components/common/container";
import HeadingFour from "@/components/common/heading-four";
import HeadingTwo from "@/components/common/heading-two";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MiniatureMapThumbnail from "./miniature-map-thumbnail";

// Helper function to generate URL-friendly slug from incident type name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_]/g, "") // Keep underscores, spaces, and hyphens temporarily
    .replace(/[\s_]+/g, "-") // Replace spaces AND underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
};

const DynamicThematicMaps = () => {
  const {
    data: incidentTypesData,
    isLoading,
    error,
  } = trpc.anonymousReports.getActiveIncidentTypesForMaps.useQuery();

  if (isLoading) {
    return (
      <section className="pt-16 pb-12 md:py-20">
        <Container size="xs">
          <HeadingTwo className="mb-8 md:pb-12">Thematic maps</HeadingTwo>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8 mb-10">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="relative">
                <Skeleton className="aspect-12/9 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4 mt-4" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (error || !incidentTypesData?.success) {
    return (
      <section className="pt-16 pb-12 md:py-20">
        <Container size="xs">
          <HeadingTwo className="mb-8 md:pb-12">Thematic maps</HeadingTwo>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Unable to load incident types. Please try again later.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  const incidentTypes = incidentTypesData.data || [];

  return (
    <section className="pt-16 pb-12 md:py-20">
      <Container size="xs">
        <HeadingTwo className="mb-8 md:pb-12">Thematic maps</HeadingTwo>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8 mb-10">
          {incidentTypes.map((incidentType, index) => {
            const slug = generateSlug(incidentType.name);

            return (
              <div key={incidentType.id} className="relative">
                <Link
                  href={`/maps/${slug}`}
                  className="group active:cursor-grabbing transition-transform duration-200"
                >
                  <div className="relative rounded-lg overflow-hidden group">
                    <MiniatureMapThumbnail
                      incidentTypeName={incidentType.name}
                      incidentTypeColor={incidentType.color}
                      className="aspect-12/9 w-full rounded-lg border  scale-150 group-hover:scale-[160%] transition-all duration-300 ease-in-out"
                    />
                    {/* Hover overlay */}
                    <div className="absolute opacity-0 group-hover:opacity-100 h-full w-full top-0 border place-items-center bg-black/32 text-white flex items-center justify-center gap-1 transition-all ease-in-out duration-300">
                      <p className="border rounded-full flex bg-white/20 px-2 items-center gap-1">
                        <span>Go to map</span> <ArrowRight size={16} />
                      </p>
                    </div>
                  </div>
                  <HeadingFour className="mt-4 font-medium transition-colors duration-200">
                    {incidentType.name
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (char) => char.toUpperCase())}
                  </HeadingFour>
                </Link>
              </div>
            );
          })}
        </div>

        {incidentTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No incident types are currently available for mapping.
            </p>
          </div>
        )}
      </Container>
    </section>
  );
};

export default DynamicThematicMaps;
