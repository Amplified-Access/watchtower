import { Suspense } from "react";
import ThematicMap from "@/features/maps/components/thematic-map";
import Loader from "@/components/common/loader";
import { notFound } from "next/navigation";
import { incidentsApi } from "@/lib/api/incidents";

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

const DynamicMapPage = async ({ params }: DynamicMapPageProps) => {
  const { slug } = await params;

  const types = await incidentsApi.getAllTypes(true);
  const incidentType = types.find((t) => generateSlug(t.name) === slug);

  if (!incidentType) {
    notFound();
  }

  const label = toSentenceCase(incidentType.name);

  return (
    <section>
      <Suspense
        fallback={
          <div className="w-full h-screen grid place-items-center">
            <Loader className="text-dark" size="24" />
          </div>
        }
      >
        <ThematicMap
          theme={incidentType.name}
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
    const types = await incidentsApi.getAllTypes(true);
    return types.map((t) => ({ slug: generateSlug(t.name) }));
  } catch {
    return [];
  }
}
