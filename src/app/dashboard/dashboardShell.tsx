// src/app/dashboard/DashboardShell.tsx
'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { WorkOSRole } from '@/lib/permissions';

interface Company {
  id: number;
  companyName: string;
  adminUserId: string;
}

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  company: Company;
}

interface Props {
  user: User;
  company: Company;
  children: React.ReactNode;
  workosRole?: string;
  permissions?: string[];
}

export default function DashboardShell({ 
  //user, 
  //company, 
  children, 
  workosRole,
  //permissions 
}: Props) {
  return (
    <SidebarProvider
      // style={
      //   {
      //     "--sidebar-width": "calc(var(--spacing) * 72)",
      //     "--header-height": "calc(var(--spacing) * 12)",
      //   } as React.CSSProperties
      // }
    >
      <AppSidebar 
        userRole={workosRole as WorkOSRole}
        variant="inset" 
      />
      <SidebarInset className="pl-4 pt-4 md:pl-6 md:pt-6">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-2 @container/main">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}