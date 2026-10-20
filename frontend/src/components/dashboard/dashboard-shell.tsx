"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  findActiveNavItem,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import UserButton from "@/features/auth/components/user-button";

interface DashboardShellProps {
  sidebar: ReactNode;
  // What the header shows beside the sidebar toggle: usually a
  // <DashboardTitle>, or a breadcrumb that loads data (the admin's
  // organisation name).
  title: ReactNode;
  // From the sidebar_state cookie, read by the (server) layout, so a
  // collapsed sidebar stays collapsed on reload without a flash.
  defaultOpen?: boolean;
  children: ReactNode;
}

// The layout shared by the admin, watcher and super admin dashboards, after
// the Gigz app: a grey frame holding a transparent sidebar (DashboardSidebar)
// and, from md up, the content as a white card with rounded corners, inset
// from the edges, with no border or shadow. On phones the content is
// full-bleed white and the sidebar opens as a sheet.
//
// The card is a viewport, as in Blaze: the shell is locked to the screen
// height (h-svh, overflow-hidden), so the card always ends 8px above the
// bottom edge with its rounded corners in view, and the page scrolls inside
// it, under the header, clipped by the card's corners. Without this the card
// grew with the page and its bottom ran off the screen.
export function DashboardShell({
  sidebar,
  title,
  defaultOpen = true,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="h-svh overflow-hidden has-data-[variant=inset]:bg-background"
    >
      {sidebar}
      {/* Collapsed, the inset variant adds an 8px left margin that widens the
          grey strip past the icon rail, pushing the icons off-centre; drop it
          so the strip is exactly the rail. */}
      <SidebarInset className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-card md:peer-data-[variant=inset]:rounded-2xl md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            {title}
          </div>
          <UserButton />
        </header>
        {/* The scroll area. Pages that fill the card (a map, a table with
            its own scroll) can still use flex-1/min-h-0, since its height
            is now bounded. It is also the size container --dashboard-scale
            measures. */}
        <div className="@container flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Scaled to the card's width (--dashboard-scale), so the content
              uses the room the sidebar gives up when it collapses. Pages'
              <Container>s drop the public site's max width and its 64px
              viewport-based padding, which inside the card only left empty
              bands at the sides. */}
          <div className="flex min-h-0 flex-1 flex-col [zoom:var(--dashboard-scale)] **:data-[slot=container]:max-w-none **:data-[slot=container]:px-4 md:**:data-[slot=container]:px-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// "Super Admin › Organizations": the dashboard, then the section we're in,
// named from the same nav items the sidebar shows. The root links back to
// the dashboard's home; a page with no nav item shows the root alone.
export function DashboardBreadcrumb({
  root,
  items,
}: {
  root: string;
  items: DashboardNavItem[];
}) {
  const pathname = usePathname();
  const current = findActiveNavItem(pathname, items);
  const home = items.find((item) => item.exact) ?? items[0];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {current ? (
            <BreadcrumbLink asChild>
              <Link href={home.url}>{root}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{root}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {current && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">
                {current.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function DashboardTitle({ children }: { children: ReactNode }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="line-clamp-1">{children}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
