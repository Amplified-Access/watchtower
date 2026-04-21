import { Metadata } from "next";
import { Suspense } from "react";
import SuperAdminReportsContent from "@/features/super-admin/components/reports/super-admin-reports-content";
import Loader from "@/components/common/loader";

export const metadata: Metadata = {
  title: "Reports | Watchtower Superadmin",
  description: "Manage reports across all organizations",
};

export default async function SuperAdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="32" />
        </div>
      }
    >
      <SuperAdminReportsContent />
    </Suspense>
  );
}
