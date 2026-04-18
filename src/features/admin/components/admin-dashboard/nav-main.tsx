"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { BsIncognito } from "react-icons/bs";
import { IoIosDocument } from "react-icons/io";
import { RiBuilding2Fill, RiProfileFill } from "react-icons/ri";
import { BiSolidMessageSquare } from "react-icons/bi";
import { TiWarning } from "react-icons/ti";
import { SiFormspree } from "react-icons/si";
import { MdAdminPanelSettings, MdSpaceDashboard } from "react-icons/md";
import { HiUsers } from "react-icons/hi";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IoDocumentText } from "react-icons/io5";
import { FaLink } from "react-icons/fa6";
import { FaExternalLinkSquareAlt } from "react-icons/fa";
import { MdCategory } from "react-icons/md";

export function NavMain() {
  const pathname = usePathname();
  return (
    <SidebarMenu>
      {[
        {
          icon: <MdSpaceDashboard />,
          label: "Home",
          href: "/admin",
        },

        {
          icon: <BsIncognito />,
          label: "Watchers",
          href: "/admin/watchers",
          // badge: 10,
        },
        {
          icon: <IoDocumentText />,
          label: "Reports",
          href: "/admin/reports",
          // badge: 10,
        },
        {
          icon: <MdCategory />,
          label: "Incident Types",
          href: "/admin/incident-types",
          // badge: 10,
        },
        {
          icon: <TiWarning />,
          label: "Incidents",
          href: "/admin/incidents",
          // badge: 10,
        },
        // {
        //   icon: <SiFormspree />,
        //   label: "Forms",
        //   href: "/admin/forms",
        //   // badge: 10,
        // },
        {
          icon: <FaExternalLinkSquareAlt />,
          label: "Reporting Link",
          href: "/admin/reporting-link",
          badge: 10,
        },
        // {
        //   icon: <RiProfileFill />,
        //   label: "Profile",
        //   href: "/admin/profile",
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
            <Link href={href}>
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
