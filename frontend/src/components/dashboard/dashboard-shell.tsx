"use client";

import type { ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
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
export function DashboardShell({
  sidebar,
  title,
  defaultOpen = true,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="has-data-[variant=inset]:bg-background"
    >
      {sidebar}
      {/* Collapsed, the inset variant adds an 8px left margin that widens the
          grey strip past the icon rail, pushing the icons off-centre; drop it
          so the strip is exactly the rail. */}
      <SidebarInset className="flex min-w-0 flex-col bg-card md:peer-data-[variant=inset]:rounded-2xl md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            {title}
          </div>
          <UserButton />
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
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
