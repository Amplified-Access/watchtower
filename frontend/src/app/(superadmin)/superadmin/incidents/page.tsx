import { Suspense } from "react";
import SuperAdminIncidentsContent from "@/features/super-admin/components/incidents/superadmin-incidents-content";
import Loader from "@/components/common/loader";

const SuperAdminIncidentsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <SuperAdminIncidentsContent />
    </Suspense>
  );
};

export default SuperAdminIncidentsPage;
