import { Suspense } from "react";
import SuperAdminIncidentDetailContent from "@/features/super-admin/components/incidents/incident-detail-content";
import Loader from "@/components/common/loader";

interface SuperAdminIncidentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const SuperAdminIncidentDetailPage = async ({
  params,
}: SuperAdminIncidentDetailPageProps) => {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <SuperAdminIncidentDetailContent incidentId={id} />
    </Suspense>
  );
};

export default SuperAdminIncidentDetailPage;
