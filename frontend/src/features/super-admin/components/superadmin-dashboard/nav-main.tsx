"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { BsIncognito } from "react-icons/bs";
import { IoIosDocument } from "react-icons/io";
import { RiBuilding2Fill } from "react-icons/ri";
import { BiSolidMessageSquare } from "react-icons/bi";
import { TiWarning } from "react-icons/ti";
import { SiFormspree } from "react-icons/si";
import { MdAdminPanelSettings, MdSpaceDashboard } from "react-icons/md";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IoDocumentText } from "react-icons/io5";
import { HiDatabase } from "react-icons/hi";
import { BsRobot } from "react-icons/bs";
import { MdCategory } from "react-icons/md";

export function NavMain() {
  const pathname = usePathname();
  return (
    <SidebarMenu>
      {[
        {
          icon: <MdSpaceDashboard />,
          label: "Home",
          href: "/superadmin",
        },
        {
          icon: <IoIosDocument />,
          label: "Applications",
          href: "/superadmin/applications",
          // badge: 10,
        },
        {
          icon: <RiBuilding2Fill />,
          label: "Organizations",
          href: "/superadmin/organizations",
          // badge: 10,
        },
        {
          icon: <MdAdminPanelSettings />,
          label: "Admins",
          href: "/superadmin/admins",
          // badge: 10,
        },
        {
          icon: <BsIncognito />,
          label: "Watchers",
          href: "/superadmin/watchers",
          // badge: 10,
        },
        {
          icon: <IoDocumentText />,
          label: "Reports",
          href: "/superadmin/reports",
          // badge: 10,
        },
        {
          icon: <TiWarning />,
          label: "Incidents",
          href: "/superadmin/incidents",
          // badge: 10,
        },
        {
          icon: <MdCategory />,
          label: "Incident Types",
          href: "/superadmin/incident-types",
          // badge: 10,
        },
        // {
        //   icon: <SiFormspree />,
        //   label: "Forms",
        //   href: "/superadmin/forms",
        //   // badge: 10,
        // },
        {
          icon: <HiDatabase />,
          label: "Datasets",
          href: "/superadmin/datasets",
          // badge: 10,
        },
        // {
        //   icon: <BiSolidMessageSquare />,
        //   label: "Inbox",
        //   href: "/superadmin/inbox",
        //   badge: 10,
        // },
      ].map(({ icon, label, href }) => (
        <SidebarMenuItem key={label}>
          <SidebarMenuButton
            size={"lg"}
            asChild
            isActive={href == pathname}
            className=""
          >
            <Link href={href} className="text-dark">
              {icon}
              <span>{label}</span>
              {/* {badge && <span className="badge">{badge}</span>} */}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
