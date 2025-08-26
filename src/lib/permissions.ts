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
  downloadReports: boolean;

  // Business Dashboard section
  dashboard: boolean;
  teamOverview: boolean;
  users: boolean;
  assignTasks: boolean;
  addDealers: boolean;
  salesmanAttendance: boolean;
  salesmanLeaves: boolean;
  salesmanGeotracking: boolean;
  dailyVisitReports: boolean;
  permanentJourneyPlan: boolean;
  clientReports: boolean;
  dealerReports: boolean;
  technicalVisitReports: boolean;
  competitionReports: boolean;
  salesAndCollectionReports: boolean;
  dealerDevelopmentAndMappingReports: boolean;
  scoresAndRatings: boolean;

  // Account section
  account: boolean;
  settings: boolean;
  raiseAQuery: boolean;
}

export const WORKOS_ROLE_PERMISSIONS: Record<WorkOSRole, DashboardPermissions> = {
  // Executive Roles
  president: {
    home: true,
    cemtemChat: true,
    downloadReports: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    addDealers: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: true,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  'senior-general-manager': {
    home: true,
    cemtemChat: true,
    downloadReports: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    addDealers: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: true,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  'general-manager': {
    home: true,
    cemtemChat: true,
    downloadReports: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    addDealers: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: true,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },

  // Managerial Roles
  'regional-sales-manager': {
    home: true,
    cemtemChat: true,
    downloadReports: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    addDealers: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: false, // Not a sales-focused role
    competitionReports: true,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  'area-sales-manager': {
    home: true,
    cemtemChat: true,
    downloadReports: true,
    dashboard: true,
    teamOverview: true,
    users: false,
    assignTasks: true,
    addDealers: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: false,
    competitionReports: true,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  'senior-manager': {     //Default role assigned when company is created(has all permissions)
    home: true,
    cemtemChat: true,
    downloadReports: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    addDealers: false,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: true,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  manager: {
    home: true,
    cemtemChat: true,
    downloadReports: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    addDealers: false, // Managers can't add dealers directly
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: true,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  'assistant-manager': {
    home: true,
    cemtemChat: true,
    downloadReports: true,
    dashboard: true,
    teamOverview: true,
    users: true,
    assignTasks: true,
    addDealers: false,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: true,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },

  // Executive Staff Roles
  'senior-executive': {
    home: true,
    cemtemChat: true,
    downloadReports: false,
    dashboard: true,
    teamOverview: true,
    users: false,
    assignTasks: false,
    addDealers: true,
    salesmanAttendance: true,
    salesmanLeaves: true,
    salesmanGeotracking: true,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: true,
    dealerReports: true,
    technicalVisitReports: true,
    competitionReports: false,
    salesAndCollectionReports: true,
    dealerDevelopmentAndMappingReports: true,
    scoresAndRatings: true,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  executive: {
    home: true,
    cemtemChat: true,
    downloadReports: false,
    dashboard: true,
    teamOverview: false,
    users: false,
    assignTasks: false,
    addDealers: true,
    salesmanAttendance: false,
    salesmanLeaves: false,
    salesmanGeotracking: false,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: false,
    dealerReports: false,
    technicalVisitReports: true,
    competitionReports: false,
    salesAndCollectionReports: false,
    dealerDevelopmentAndMappingReports: false,
    scoresAndRatings: false,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
  'junior-executive': {
    home: true,
    cemtemChat: true,
    downloadReports: false,
    dashboard: true,
    teamOverview: false,
    users: false,
    assignTasks: false,
    addDealers: true,
    salesmanAttendance: false,
    salesmanLeaves: false,
    salesmanGeotracking: false,
    dailyVisitReports: true,
    permanentJourneyPlan: true,
    clientReports: false,
    dealerReports: false,
    technicalVisitReports: true,
    competitionReports: false,
    salesAndCollectionReports: false,
    dealerDevelopmentAndMappingReports: false,
    scoresAndRatings: false,
    account: true,
    settings: true,
    raiseAQuery: true,
  },
};

export function hasPermission(role: WorkOSRole, feature: keyof DashboardPermissions): boolean {
  return WORKOS_ROLE_PERMISSIONS[role]?.[feature] || false;
}

export function getUserPermissions(role: WorkOSRole): DashboardPermissions {
  return WORKOS_ROLE_PERMISSIONS[role] || WORKOS_ROLE_PERMISSIONS['junior-executive'];
}
