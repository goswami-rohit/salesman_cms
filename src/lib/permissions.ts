// src/lib/permissions.ts
export type WorkOSRole = 'admin' | 'manager' | 'staff';

export interface DashboardPermissions {
  // Home section
  home: boolean;
  cemtemChat: boolean;
  downloadReports: boolean;
  
  // Business Dashboard section
  dashboard: boolean;
  users: boolean;
  salesmanAttendance: boolean;
  salesmanLeaves: boolean;
  salesmanGeotracking: boolean;
  dailyVisitReports: boolean;
  permanentJourneyPlan: boolean;
  clientReports: boolean;
  dealerReports: boolean;
  technicalVisitReports: boolean;
  competitionReports: boolean;
  
  // Account section
  account: boolean;
  settings: boolean;
  raiseAQuery: boolean;
}

export const WORKOS_ROLE_PERMISSIONS: Record<WorkOSRole, DashboardPermissions> = {
  admin: {
    // Home - full access
    home: true,
    cemtemChat: true,
    downloadReports: true,
    
    // Business Dashboard - full access
    dashboard: true,
    users: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: true,
    
    // Account - full access
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  manager: {
    // Home - full access
    home: true,
    cemtemChat: true,
    downloadReports: true,
    
    // Business Dashboard - all except users
    dashboard: true,
    users: false,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: true,
    
    // Account - full access
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  staff: {
    // Home - no download reports
    home: true,
    cemtemChat: true,
    downloadReports: false,
    
    // Business Dashboard - limited access
    dashboard: true,
    users: false,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: false,  // No access
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: false,  // No access
    
    // Account - full access
    account: true,
    settings: true,
    raiseAQuery: true,
  },
};

export function hasPermission(role: WorkOSRole, feature: keyof DashboardPermissions): boolean {
  return WORKOS_ROLE_PERMISSIONS[role]?.[feature] || false;
}

export function getUserPermissions(role: WorkOSRole): DashboardPermissions {
  return WORKOS_ROLE_PERMISSIONS[role] || WORKOS_ROLE_PERMISSIONS.staff;
}