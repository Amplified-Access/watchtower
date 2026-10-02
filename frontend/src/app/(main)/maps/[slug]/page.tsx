import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import ThematicMap from "@/features/maps/components/thematic-map";
import Loader from "@/components/common/loader";
import { JsonLd } from "@/components/common/json-ld";
import { notFound } from "next/navigation";
import { incidentsApi } from "@/lib/api/incidents";
import { codePageJsonLd, codePageMetadata, getCodePageSeo } from "@/lib/seo/page";

const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim();

interface DynamicMapPageProps {
  params: Promise<{ slug: string }>;
}

const toSentenceCase = (name: string) => {
  const s = name.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const findIncidentType = async (slug: string) => {
  const { data: types } = await incidentsApi.getAllTypes(true);
  return (types ?? []).find((t) => generateSlug(t.name) === slug);
};

// The search text is "Thematic maps" in the Studio's "Search and sharing",
// with {type} replaced by the incident type.
export async function generateMetadata({ params }: DynamicMapPageProps): Promise<Metadata> {
  const { slug } = await params;
  const incidentType = await findIncidentType(slug);
  if (!incidentType) return {};
  return codePageMetadata("thematicMap", `/maps/${slug}`, {
    values: { type: toSentenceCase(incidentType.name) },
  });
}

const DynamicMapPage = async ({ params }: DynamicMapPageProps) => {
  const { slug } = await params;

  const incidentType = await findIncidentType(slug);

  if (!incidentType) {
    notFound();
  }

  const label = toSentenceCase(incidentType.name);
  const maps = await getCodePageSeo("maps", await getLocale());
  const jsonLd = await codePageJsonLd("thematicMap", `/maps/${slug}`, {
    values: { type: label },
    parents: [{ name: maps.title, path: "/maps" }],
  });

  return (
    <section>
      <JsonLd data={jsonLd} />
      <Suspense
        fallback={
          <div className="w-full h-screen grid place-items-center">
            <Loader className="text-dark" size="24" />
          </div>
        }
      >
        <ThematicMap
          theme={incidentType.name}
          color={incidentType.color}
          title={`${label} map`}
          description={
            incidentType.description ||
            `Mapping incidents related to ${label.toLowerCase()}`
          }
        />
      </Suspense>
    </section>
  );
};

export default DynamicMapPage;

export async function generateStaticParams() {
  try {
    const { data: types } = await incidentsApi.getAllTypes(true);
    return (types ?? []).map((t) => ({ slug: generateSlug(t.name) }));
  } catch {
    return [];
  }
}
