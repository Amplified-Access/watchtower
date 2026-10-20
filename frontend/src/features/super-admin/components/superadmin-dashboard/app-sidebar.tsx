"use client";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { superAdminNav } from "./nav";

export function AppSidebar() {
  return <DashboardSidebar items={superAdminNav} />;
}
