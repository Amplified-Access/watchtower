import { Suspense } from "react";
import IncidentDetailContent from "@/features/admin/components/incidents/incident-detail-content";
import Loader from "@/components/common/loader";

interface IncidentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const IncidentDetailPage = async ({ params }: IncidentDetailPageProps) => {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <IncidentDetailContent incidentId={id} />
    </Suspense>
  );
};

export default IncidentDetailPage;
