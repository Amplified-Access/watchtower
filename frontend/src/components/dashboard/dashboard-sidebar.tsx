"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface DashboardNavItem {
  title: string;
  url: string;
  icon: ReactNode;
  // Match the URL exactly rather than as a prefix. Needed for a dashboard's
  // home ("/admin"), which every other page's URL starts with.
  exact?: boolean;
}

function isActive(pathname: string | null, { url, exact }: DashboardNavItem) {
  if (!pathname) return false;
  return pathname === url || (!exact && pathname.startsWith(`${url}/`));
}

// The nav item for the page we're on (or a page under it), if it has one.
export function findActiveNavItem(
  pathname: string | null,
  items: DashboardNavItem[]
) {
  return items.find((item) => isActive(pathname, item));
}

// The sidebar shared by the admin, watcher and super admin dashboards. It
// sits on DashboardShell's grey frame (the panel is transparent) and
// collapses to an icon rail (collapsible="icon"), where each item shows its
// name in a tooltip and the logo shrinks to the mark.
export function DashboardSidebar({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="[&_[data-slot=sidebar-inner]]:bg-transparent"
    >
      {/* On phones the sidebar is a sheet, outside the frame, so it carries
          the frame's grey itself; otherwise the white active chip would sit
          on near-white. */}
      <div className="flex min-h-0 flex-1 flex-col bg-background md:bg-transparent">
        <SidebarHeader className="py-3">
          {/* Collapsed, only the mark shows, centred over the icon column
              (px-1.5 puts the 20px mark's centre at 32px, like the icons'). */}
          <Link
            href="/"
            aria-label="Watchtower"
            className="flex h-6 items-center px-2 group-data-[collapsible=icon]:px-1.5"
          >
            <Image
              src="/brand/logo-black.svg"
              alt=""
              width={219}
              height={37}
              className="h-6 w-auto group-data-[collapsible=icon]:hidden"
            />
            <Image
              src="/brand/icon-black.svg"
              alt=""
              width={40}
              height={37}
              className="hidden size-5 group-data-[collapsible=icon]:block"
            />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              {/* Spaced so a hovered row's chip doesn't run into the
                  selected one's; a little more for the icon squares. */}
              <SidebarMenu className="gap-1 group-data-[collapsible=icon]:gap-2">
                {items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    {/* On the grey frame the default accent is invisible, so
                        the active section is a white chip. */}
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item)}
                      tooltip={item.title}
                      className="hover:bg-card/60 data-[active=true]:bg-card data-[active=true]:text-foreground"
                    >
                      <Link href={item.url}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
