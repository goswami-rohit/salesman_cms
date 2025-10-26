// src/lib/permissions.ts
export type WorkOSRole =
  | 'president'
  | 'senior-general-manager'
  | 'general-manager'
  | 'regional-sales-manager'
  | 'area-sales-manager'
  | 'senior-manager'
  | 'manager'
  | 'assistant-manager'
  | 'senior-executive'
  | 'executive'
  | 'junior-executive';

export interface DashboardPermissions {
  // Home section
  home: boolean;
  cemtemChat: boolean;
  customReportGenerator: boolean;

  // Business Dashboard section
  dashboard: boolean;
  teamOverview: boolean;
  users: boolean;
  assignTasks: boolean;
  dealerManagement: boolean;
  salesmanAttendance: boolean;
  salesmanLeaves: boolean;
  salesmanGeotracking: boolean;
  dailyVisitReports: boolean;
  permanentJourneyPlan: boolean;
  technicalVisitReports: boolean;
  competitionReports: boolean;
  dealerDevelopmentAndMappingReports: boolean;
  scoresAndRatings: boolean;

  // Account section
  account: boolean;
  raiseAQuery: boolean;
}

export const WORKOS_ROLE_PERMISSIONS: Record<WorkOSRole, DashboardPermissions> = {
  // Executive Roles
  president: {
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    dealerManagement: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },
  'senior-general-manager': {
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    dealerManagement: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },
  'general-manager': {
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    dealerManagement: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },

  // Managerial Roles
  'regional-sales-manager': {
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    dealerManagement: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },
  'area-sales-manager': {
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: true,
    users: false,
    assignTasks: true,
    dealerManagement: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },
  'senior-manager': {     //Default role assigned when company is created(has all permissions)
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    dealerManagement: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },
  manager: {
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    dealerManagement: true, 
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },
  'assistant-manager': {
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    dealerManagement: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },

  // Executive Staff Roles
  'senior-executive': {
    home: true,
    cemtemChat: true,
    customReportGenerator: true,
    dashboard: true,
    teamOverview: false,
    users: false,
    assignTasks: false,
    dealerManagement: true,
    salesmanAttendance: true,
    salesmanLeaves: false,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: false,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    raiseAQuery: true,
  },
  executive: {
    home: true,
    cemtemChat: true,
    customReportGenerator: false,
    dashboard: true,
    teamOverview: false,
    users: false,
    assignTasks: false,
    dealerManagement: true,
    salesmanAttendance: false,
    salesmanLeaves: false,
    salesmanGeotracking: false,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    technicalVisitReports: true,
    competitionReports: false,
    dealerDevelopmentAndMappingReports: false,
    scoresAndRatings: false,
    account: true,
    raiseAQuery: true,
  },
  'junior-executive': {
    home: true,
    cemtemChat: true,
    customReportGenerator: false,
    dashboard: true,
    teamOverview: false,
    users: false,
    assignTasks: false,
    dealerManagement: true,
    salesmanAttendance: false,
    salesmanLeaves: false,
    salesmanGeotracking: false,
    dailyVisitReports: false,
    permanentJourneyPlan: false,
    technicalVisitReports: false,
    competitionReports: false,
    dealerDevelopmentAndMappingReports: false,
    scoresAndRatings: false,
    account: true,
    raiseAQuery: true,
  },
};

export function hasPermission(role: WorkOSRole, feature: keyof DashboardPermissions): boolean {
  return WORKOS_ROLE_PERMISSIONS[role]?.[feature] || false;
}

export function getUserPermissions(role: WorkOSRole): DashboardPermissions {
  return WORKOS_ROLE_PERMISSIONS[role] || WORKOS_ROLE_PERMISSIONS['junior-executive'];
}
