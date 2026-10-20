"use client";

import { BsIncognito } from "react-icons/bs";
import { HiDatabase } from "react-icons/hi";
import { IoIosDocument } from "react-icons/io";
import { IoDocumentText } from "react-icons/io5";
import {
  MdAdminPanelSettings,
  MdCategory,
  MdSpaceDashboard,
} from "react-icons/md";
import { RiBuilding2Fill } from "react-icons/ri";
import { TiWarning } from "react-icons/ti";

import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-sidebar";

const items: DashboardNavItem[] = [
  {
    title: "Home",
    url: "/superadmin",
    icon: <MdSpaceDashboard />,
    exact: true,
  },
  {
    title: "Applications",
    url: "/superadmin/applications",
    icon: <IoIosDocument />,
  },
  {
    title: "Organizations",
    url: "/superadmin/organizations",
    icon: <RiBuilding2Fill />,
  },
  {
    title: "Admins",
    url: "/superadmin/admins",
    icon: <MdAdminPanelSettings />,
  },
  { title: "Watchers", url: "/superadmin/watchers", icon: <BsIncognito /> },
  { title: "Reports", url: "/superadmin/reports", icon: <IoDocumentText /> },
  { title: "Incidents", url: "/superadmin/incidents", icon: <TiWarning /> },
  {
    title: "Incident Types",
    url: "/superadmin/incident-types",
    icon: <MdCategory />,
  },
  { title: "Datasets", url: "/superadmin/datasets", icon: <HiDatabase /> },
];

export function AppSidebar() {
  return <DashboardSidebar items={items} />;
}
