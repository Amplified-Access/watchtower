import { Metadata } from "next";
import SuperAdminIncidentTypesContent from "@/features/super-admin/components/incident-types/incident-types-content";

export const metadata: Metadata = {
  title: "Incident Types - Super Admin Dashboard",
  description: "Incident types across the platform",
};

export default function SuperAdminIncidentTypesPage() {
  return <SuperAdminIncidentTypesContent />;
}
