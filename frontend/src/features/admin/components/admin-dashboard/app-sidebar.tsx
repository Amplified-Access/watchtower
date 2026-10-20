"use client";

import { BsIncognito } from "react-icons/bs";
import { IoDocumentText } from "react-icons/io5";
import { MdCategory, MdMap, MdSpaceDashboard } from "react-icons/md";
import { TiWarning } from "react-icons/ti";

import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-sidebar";

const items: DashboardNavItem[] = [
  { title: "Home", url: "/admin", icon: <MdSpaceDashboard />, exact: true },
  { title: "Deployments", url: "/admin/deployments", icon: <MdMap /> },
  { title: "Watchers", url: "/admin/watchers", icon: <BsIncognito /> },
  { title: "Reports", url: "/admin/reports", icon: <IoDocumentText /> },
  {
    title: "Incident Types",
    url: "/admin/incident-types",
    icon: <MdCategory />,
  },
  { title: "Incidents", url: "/admin/incidents", icon: <TiWarning /> },
];

export function AppSidebar() {
  return <DashboardSidebar items={items} />;
}
