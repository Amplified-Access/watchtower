import { Suspense } from "react";
import SuperAdminFormDetailContent from "@/features/super-admin/components/forms/form-detail-content";
import Loader from "@/components/common/loader";

interface SuperAdminFormDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const SuperAdminFormDetailPage = async ({
  params,
}: SuperAdminFormDetailPageProps) => {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <SuperAdminFormDetailContent formId={id} />
    </Suspense>
  );
};

export default SuperAdminFormDetailPage;
