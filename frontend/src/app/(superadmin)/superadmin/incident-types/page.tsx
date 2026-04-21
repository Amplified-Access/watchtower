import { Metadata } from "next";
import IncidentTypesContent from "@/features/admin/components/incident-types/incident-types-content";

export const metadata: Metadata = {
  title: "Incident Types - Super Admin Dashboard",
  description: "Manage incident types for the entire platform",
};

export default function SuperAdminIncidentTypesPage() {
  return <IncidentTypesContent />;
}
