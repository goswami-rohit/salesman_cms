"use client";

import * as React from "react"
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { hasPermission, WorkOSRole } from '@/lib/permissions';

interface Props {
  userRole: WorkOSRole;
  // ... other props
}

interface CompanyInfo {
  companyName: string;
  adminName: string;
  totalUsers: number;
}

// Permission mapping for each menu item
const ITEM_PERMISSIONS = {
  // Home items
  "Home": 'home' as const,
  "CemTem Chat": 'cemtemChat' as const,
  "Download Reports": 'downloadReports' as const,

  // Dashboard items
  "Business Dashboard": 'dashboard' as const,
  "Team Overview": 'teamOverview' as const,
  "Users": 'users' as const,
  "Assign Tasks": 'assignTasks' as const,
  "Add Dealers|Sub-Dealers": 'addDealers' as const,
  "Salesman Attendance": 'salesmanAttendance' as const,
  "Salesman Leaves": 'salesmanLeaves' as const,
  "Salesman Geotracking": 'salesmanGeotracking' as const,
  "Daily Visit Reports": 'dailyVisitReports' as const,
  "Permanent Journey Plan": 'permanentJourneyPlan' as const,
  "Client Reports": 'clientReports' as const,
  "Dealer Reports": 'dealerReports' as const,
  "Technical Visit Reports": 'technicalVisitReports' as const,
  "Competition Reports": 'competitionReports' as const,
  "Sales And Competition Reports": 'salesAndCollectionReports' as const,
  "Dealer Development And Mapping Reports": 'dealerDevelopmentAndMappingReports' as const,
  "Scores And Ratings": 'scoresAndRatings' as const,

  // Account items
  "Account": 'account' as const,
  "Settings": 'settings' as const,
  "Raise A Querry": 'raiseAQuery' as const,
  "Logout": null, // Everyone can logout
};

const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      items: [
        // {
        //   title: "CemTem Chat",
        //   url: "/home/cemtemChat",
        //   isActive: false,
        // },
        {
          title: "Download Reports",
          url: "/home/downloadReport",
        },
      ],
    },
    {
      title: "Business Dashboard",
      url: "/dashboard",
      items: [
        {
          title: "Team Overview",
          url: "/dashboard/teamOverview",
        },
        {
          title: "Users",
          url: "/dashboard/users",
          isActive: false,
        },
        {
          title: "Assign Tasks",
          url: "/dashboard/assignTasks",
        },
        {
          title: "Add Dealers|Sub-Dealers",
          url: "/dashboard/addDealers",
        },
        {
          title: "Salesman Attendance",
          url: "/dashboard/slmAttendance",
        },
        {
          title: "Salesman Leaves",
          url: "/dashboard/slmLeaves",
        },
        {
          title: "Salesman Geotracking",
          url: "/dashboard/slmGeotracking",
        },
        {
          title: "Daily Visit Reports",
          url: "/dashboard/dailyVisitReports",
        },
        {
          title: "Permanent Journey Plan",
          url: "/dashboard/permanentJourneyPlan",
        },
        {
          title: "Client Reports",
          url: "/dashboard/clientReports",
        },
        {
          title: "Dealer Reports",
          url: "/dashboard/dealerReports",
        },
        {
          title: "Technical Visit Reports",
          url: "/dashboard/technicalVisitReports",
        },
        {
          title: "Competition Reports",
          url: "/dashboard/competitionReports",
        },
        {
          title: "Sales And Competition Reports",
          url: "/dashboard/salesAndCollectionReports",
        },
        {
          title: "Dealer Development And Mapping Reports",
          url: "/dashboard/dealerDevelopmentAndMappingReports",
        },
        {
          title: "Scores And Ratings",
          url: "/dashboard/scoresAndRatings",
        },
      ],
    },
    {
      title: "Account",
      url: "/account",
      items: [
        // {
        //   title: "Settings",
        //   url: "/account/settings",
        // },
        {
          title: "Raise A Querry",
          url: "/account/query",
        },
        {
          title: "Logout",
          url: "/account/logout",
        },
      ],
    },
  ],
}

export function AppSidebar({ userRole, ...props }: Props & React.ComponentProps<typeof Sidebar>) {

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed] = useState(false);
  // Fetch company information
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company');
        if (response.ok) {
          const data = await response.json();
          setCompanyInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch company info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyInfo();
  }, []);

  // Function to check if user has permission for an item
  const hasItemPermission = (itemTitle: string): boolean => {
    const permission = ITEM_PERMISSIONS[itemTitle as keyof typeof ITEM_PERMISSIONS];

    // If no permission is needed (like Logout), allow access
    if (permission === null) return true;

    // If permission is defined, check it
    if (permission) {
      return hasPermission(userRole, permission);
    }

    // Default to false if permission not found
    return false;
  };

  // Function to check if a section should be shown (has at least one visible item)
  const shouldShowSection = (section: typeof data.navMain[0]): boolean => {
    return section.items?.some(item => hasItemPermission(item.title)) || false;
  };

   return (
    // Apply `is-collapsed` class conditionally to the Sidebar component
    <Sidebar {...props} className={isCollapsed ? 'is-collapsed' : ''}>
      <SidebarHeader>
        {/* Sidebar rendering--commented out for now */}
        {/* {!isCollapsed && ( */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">
                    {loading ? 'Loading...' : companyInfo?.companyName || 'My Company'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {companyInfo && `${companyInfo.totalUsers} users`}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* )} */}

        {/* Collapse Toggle - move to the right using flexbox and ml-auto */}
        {/* <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className={`p-1 text-muted-foreground hover:text-foreground ${!isCollapsed ? 'ml-auto' : 'w-full' // Add ml-auto when expanded, full width when collapsed
              }`}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button> */}
      </SidebarHeader>

      {/* Sidebar rendering--commented out for now */}
      {/* {!isCollapsed && ( */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => {
              // Only show sections that have at least one visible item
              if (!shouldShowSection(item)) {
                return null;
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="font-medium">
                      {item.title}
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        // Check if user has permission for this specific item
                        if (!hasItemPermission(subItem.title)) {
                          return null;
                        }

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                              {/* Conditional rendering for Logout */}
                              {subItem.title === "Logout" ? (
                                // IMPORTANT CHANGE: Use a form for the Logout button
                                <form action="/account/logout" method="post" className="w-full">
                                  <button type="submit"
                                    className="hidden sm:flex bg-red-600/65 text-white w-full h-full justify-start items-center px-4 py-2 rounded-md">
                                    {subItem.title}
                                  </button>
                                </form>
                              ) : (
                                // For all other menu items, use a standard <a> tag
                                <a href={subItem.url} className="py-4.5 my-0.5">
                                  {subItem.title}</a>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {/* )} */}
      <SidebarRail />
    </Sidebar>
  )
}