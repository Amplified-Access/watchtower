import { Suspense } from "react";
import SuperAdminFormsContent from "@/features/super-admin/components/forms/superadmin-forms-content";
import Loader from "@/components/common/loader";

const SuperAdminFormsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <SuperAdminFormsContent />
    </Suspense>
  );
};

export default SuperAdminFormsPage;
