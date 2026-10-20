"use client";

import { IoDocumentText } from "react-icons/io5";
import { MdSpaceDashboard } from "react-icons/md";
import { TiWarning } from "react-icons/ti";

import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-sidebar";

const items: DashboardNavItem[] = [
  { title: "Home", url: "/watcher", icon: <MdSpaceDashboard />, exact: true },
  { title: "Reports", url: "/watcher/reports", icon: <IoDocumentText /> },
  { title: "Incidents", url: "/watcher/incidents", icon: <TiWarning /> },
];

export function AppSidebar() {
  return <DashboardSidebar items={items} />;
}
