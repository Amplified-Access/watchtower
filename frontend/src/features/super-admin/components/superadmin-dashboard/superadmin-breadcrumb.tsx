"use client";

import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-shell";
import { superAdminNav } from "./nav";

export function SuperAdminBreadcrumb() {
  return <DashboardBreadcrumb root="Super Admin" items={superAdminNav} />;
}
