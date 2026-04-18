"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RiProfileFill } from "react-icons/ri";
import { BiSolidMessageSquare } from "react-icons/bi";
import { TiWarning } from "react-icons/ti";
import { SiFormspree } from "react-icons/si";
import { MdSpaceDashboard } from "react-icons/md";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IoDocumentText } from "react-icons/io5";

export function NavMain() {
  const pathname = usePathname();
  return (
    <SidebarMenu>
      {[
        {
          icon: <MdSpaceDashboard />,
          label: "Home",
          href: "/watcher",
        },
        {
          icon: <IoDocumentText />,
          label: "Reports",
          href: "/watcher/reports",
          // badge: 10,
        },
        {
          icon: <TiWarning />,
          label: "Incidents",
          href: "/watcher/incidents",
          // badge: 10,
        },
        // {
        //   icon: <SiFormspree />,
        //   label: "Forms",
        //   href: "/watcher/forms",
        //   // badge: 10,
        // },
        // {
        //   icon: <BiSolidMessageSquare />,
        //   label: "Inbox",
        //   href: "/watcher/inbox",
        //   badge: 10,
        // },
        // {
        //   icon: <RiProfileFill />,
        //   label: "Profile",
        //   href: "/watcher/profile",
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
