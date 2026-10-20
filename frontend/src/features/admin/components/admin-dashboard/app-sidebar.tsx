"use client";

import { BsIncognito } from "react-icons/bs";
import { FaExternalLinkSquareAlt } from "react-icons/fa";
import { IoDocumentText } from "react-icons/io5";
import { MdCategory, MdSpaceDashboard } from "react-icons/md";
import { TiWarning } from "react-icons/ti";

import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-sidebar";

const items: DashboardNavItem[] = [
  { title: "Home", url: "/admin", icon: <MdSpaceDashboard />, exact: true },
  { title: "Watchers", url: "/admin/watchers", icon: <BsIncognito /> },
  { title: "Reports", url: "/admin/reports", icon: <IoDocumentText /> },
  {
    title: "Incident Types",
    url: "/admin/incident-types",
    icon: <MdCategory />,
  },
  { title: "Incidents", url: "/admin/incidents", icon: <TiWarning /> },
  {
    title: "Reporting Link",
    url: "/admin/reporting-link",
    icon: <FaExternalLinkSquareAlt />,
  },
];

export function AppSidebar() {
  return <DashboardSidebar items={items} />;
}
