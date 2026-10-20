import { Metadata } from "next";
import { Suspense } from "react";
import PageLoader from "@/components/common/page-loader";
import SuperAdminDeploymentsContent from "@/features/super-admin/components/deployments/deployments-content";

export const metadata: Metadata = {
  title: "Deployments - Super Admin Dashboard",
  description: "Every organization's deployments",
};

export default function SuperAdminDeploymentsPage() {
  // The content reads the organization filter from the URL
  // (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense fallback={<PageLoader />}>
      <SuperAdminDeploymentsContent />
    </Suspense>
  );
}
