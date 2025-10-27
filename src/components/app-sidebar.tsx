"use client";

import * as React from "react"
import { useEffect, useState, useMemo } from "react";
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
//import { hasPermission, WorkOSRole } from '@/lib/permissions';

// These are placeholders to allow the component to function in a single-file environment.
type WorkOSRole = string;
const hasPermission = (userRole: WorkOSRole, permission: string): boolean => { return true; };

interface Props {
  userRole: WorkOSRole;
  // ... other props
}

interface CompanyInfo {
  companyName: string;
  adminName: string;
  totalUsers: number;
}

interface MenuItem {
  title: string;
  url?: string;
  permission: string;
  items?: MenuItem[];
}

// Permission mapping for each menu item
const ITEM_PERMISSIONS = {
  "Home": 'home' as const,
  "CemTem ChatBot": 'cemtemChat' as const,
  "Custom Report Generator": 'customReportGenerator' as const,

  "Business Dashboard": 'dashboard' as const,
  "Actionables": 'actionables' as const,
  "Team Overview": 'teamOverview' as const,
  "Users": 'users' as const,
  "Assign Tasks": 'assignTasks' as const,
  "Dealer Management": 'dealerManagement' as const,

  "Reports": 'reports' as const,
  "Salesman Attendance": 'salesmanAttendance' as const,
  "Salesman Leaves": 'salesmanLeaves' as const,
  "Salesman Geotracking": 'salesmanGeotracking' as const,
  "Daily Visit Reports": 'dailyVisitReports' as const,
  "Technical Visit Reports": 'technicalVisitReports' as const,
  "Competition Reports": 'competitionReports' as const,
  "Sales Order Reports": 'salesAndCollectionReports' as const,
  "Permanent Journey Plan": 'permanentJourneyPlan' as const,
  "Scores And Ratings": 'scoresAndRatings' as const,

  "Account": 'account' as const,
  "Raise A Querry": 'raiseAQuery' as const,
  "Logout": 'logout' as const,
};

// Define menu items with the new nested structure
const menuItems: MenuItem[] = [
  {
    title: "Home",
    url: "/home",
    permission: ITEM_PERMISSIONS["Home"],
    items: [
      {
        title: "CemTem ChatBot",
        url: "/home/cemtemChat",
        permission: ITEM_PERMISSIONS["CemTem ChatBot"]
      },
      {
        title: "Custom Report Generator",
        url: "/home/customReportGenerator",
        permission: ITEM_PERMISSIONS["Custom Report Generator"]
      },
    ],
  },
  {
    title: "Business Dashboard",
    url: "/dashboard",
    permission: ITEM_PERMISSIONS["Business Dashboard"],
    items: [
      {
        title: "Team Overview",
        url: "/dashboard/teamOverview",
        permission: ITEM_PERMISSIONS["Team Overview"]
      },
      {
        title: "Users",
        url: "/dashboard/users",
        permission: ITEM_PERMISSIONS["Users"]
      },
      {
        title: "Assign Tasks",
        url: "/dashboard/assignTasks",
        permission: ITEM_PERMISSIONS["Assign Tasks"]
      },
      {
        title: "Dealer Management",
        url: "/dashboard/dealerManagement",
        permission: ITEM_PERMISSIONS["Dealer Management"]
      },
      {
        title: "Permanent Journey Plan",
        url: "/dashboard/permanentJourneyPlan",
        permission: ITEM_PERMISSIONS["Permanent Journey Plan"]
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        permission: ITEM_PERMISSIONS["Reports"]
      },
      {
        title: "Salesman Leaves",
        url: "/dashboard/slmLeaves",
        permission: ITEM_PERMISSIONS["Salesman Leaves"]
      },
      {
        title: "Salesman Attendance",
        url: "/dashboard/slmAttendance",
        permission: ITEM_PERMISSIONS["Salesman Attendance"]
      },
      {
        title: "Salesman Geotracking",
        url: "/dashboard/slmGeotracking",
        permission: ITEM_PERMISSIONS["Salesman Geotracking"]
      },
      {
        title: "Scores & Ratings",
        url: "/dashboard/scoresAndRatings",
        permission: ITEM_PERMISSIONS["Scores And Ratings"]
      },
    ],
  },
  {
    title: "Account",
    url: "/account",
    permission: ITEM_PERMISSIONS["Account"],
    items: [
      // {
      //   title: "Raise A Querry",
      //   url: "/account/query",
      //   permission: ITEM_PERMISSIONS["Raise A Querry"]
      // },
      {
        title: "Logout",
        url: "/account/logout",
        permission: ITEM_PERMISSIONS["Logout"]
      },
    ],
  },
]

export function AppSidebar({ userRole }: Props) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const apiURI = `/api/company`;

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiURI);
        const data = await response.json();
        setCompanyInfo(data);
      } catch (error) {
        console.error("Failed to fetch company info", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  // Recursive function to filter menu items based on user permissions
  const filterMenuItems = (items: any[], role: WorkOSRole): any[] => {
    return items.reduce((acc, item) => {
      if ('url' in item) {
        if (hasPermission(role, item.permission)) {
          acc.push(item);
        }
      } else if ('items' in item) {
        const filteredSubItems = filterMenuItems(item.items, role);
        if (filteredSubItems.length > 0) {
          acc.push({ ...item, items: filteredSubItems });
        }
      }
      return acc;
    }, [] as any[]);
  };

  const accessibleMenuItems = useMemo(() => {
    return filterMenuItems(menuItems, userRole);
  }, [userRole]);


  return (
    <Sidebar className="hidden md:flex w-64 shrink-0 border-r">
      {/* <SidebarRail className="md:hidden" /> */}

      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center space-x-2">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div>
              <div className="text-sm font-bold">{companyInfo?.companyName}</div>
              <div className="text-xs text-gray-500">{companyInfo?.adminName}</div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarGroup>
          <SidebarMenu>
            {accessibleMenuItems.map((item: MenuItem) => {
              if (item.items) {
                return (
                  <SidebarMenuItem key={item.title}>
                    {item.url ? (
                      <SidebarMenuButton asChild>
                        <a href={item.url} className="py-4 my-2.5">
                          {item.title}
                        </a>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton>{item.title}</SidebarMenuButton>
                    )}
                    <SidebarMenuSub>
                      {item.items.map((subItem: MenuItem) => {
                        if (subItem.items) {
                          // Nested group (Reports / Actionables)
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              {subItem.url ? (
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url} className="py-5 my-2">
                                    {subItem.title}
                                  </a>
                                </SidebarMenuSubButton>
                              ) : (
                                <SidebarMenuSubButton>{subItem.title}</SidebarMenuSubButton>
                              )}
                              <SidebarMenuSub>
                                {subItem.items.map((subSubItem: MenuItem) => (
                                  <SidebarMenuSubItem key={subSubItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <a href={subSubItem.url} className="py-6.5 my-2">
                                        {subSubItem.title}
                                      </a>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </SidebarMenuSubItem>
                          );
                        } else {
                          // Direct sub-item link
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              {subItem.title === "Logout" ? (
                                <form action="/account/logout" method="post" className="w-full">
                                  <SidebarMenuSubButton asChild>
                                    <button
                                      type="submit"
                                      className="w-full h-full justify-start items-center px-4 py-3 my-1 rounded-md bg-red-600/65 text-white"
                                    >
                                      {subItem.title}
                                    </button>
                                  </SidebarMenuSubButton>
                                </form>
                              ) : (
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url} className="py-4 my-1">
                                    {subItem.title}
                                  </a>
                                </SidebarMenuSubButton>
                              )}
                            </SidebarMenuSubItem>
                          );
                        }
                      })}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                );
              } else {
                // Top-level without children (e.g., standalone link)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="py-3 my-1">
                        {item.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
