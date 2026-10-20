import { Suspense } from "react";
import IncidentsContent from "@/features/admin/components/incidents/incidents-content";
import Loader from "@/components/common/loader";

const IncidentsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <IncidentsContent />
    </Suspense>
  );
};

export default IncidentsPage;
