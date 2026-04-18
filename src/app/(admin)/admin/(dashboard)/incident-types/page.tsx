import { Metadata } from "next";
import IncidentTypesContent from "@/features/admin/components/incident-types/incident-types-content";

export const metadata: Metadata = {
  title: "Incident Types - Admin Dashboard",
  description: "Manage incident types for your organization's reporting system",
};

export default function IncidentTypesPage() {
  return <IncidentTypesContent />;
}
