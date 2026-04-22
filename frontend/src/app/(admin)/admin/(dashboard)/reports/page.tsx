import { Metadata } from "next";
import { Suspense } from "react";
import ReportsContent from "@/features/admin/components/reports/reports-content";
import Loader from "@/components/common/loader";

export const metadata: Metadata = {
  title: "Reports | Watchtower Admin",
  description: "Manage your organization's reports",
};

const page = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
};

export default page;
