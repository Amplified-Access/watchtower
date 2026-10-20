import { IoIosDocument } from "react-icons/io";
import {
  MdAdminPanelSettings,
  MdCategory,
  MdMap,
  MdSpaceDashboard,
} from "react-icons/md";
import { RiBuilding2Fill } from "react-icons/ri";

import type { DashboardNavItem } from "@/components/dashboard/dashboard-sidebar";

// The super admin dashboard's sections: the sidebar's links and the
// breadcrumb's page names.
export const superAdminNav: DashboardNavItem[] = [
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
  { title: "Deployments", url: "/superadmin/deployments", icon: <MdMap /> },
  {
    title: "Admins",
    url: "/superadmin/admins",
    icon: <MdAdminPanelSettings />,
  },
  {
    title: "Incident Types",
    url: "/superadmin/incident-types",
    icon: <MdCategory />,
  },
];
