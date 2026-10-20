import { Metadata } from "next";
import DeploymentsContent from "@/features/admin/components/deployments/deployments-content";

export const metadata: Metadata = {
  title: "Deployments - Admin Dashboard",
  description: "Your organization's deployments",
};

export default function DeploymentsPage() {
  return <DeploymentsContent />;
}
