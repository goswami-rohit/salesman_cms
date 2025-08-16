// src/lib/roleHierarchy.ts

// Define the authoritative order of roles, from highest to lowest.
// This single source of truth will be used for both UI filtering and backend validation.
export const ROLE_HIERARCHY = [
  'president',
  'senior-general-manager',
  'general-manager',
  'regional-sales-manager',
  'area-sales-manager',
  'senior-manager',
  'manager',
  'assistant-manager',
  'senior-executive',
  'executive',
  'junior-executive',
];

/**
 * Returns a list of roles that the current user is permitted to see/assign.
 * These are all roles lower in the hierarchy than the user's own role.
 *
 * @param currentUserRole The role of the currently logged-in user.
 * @returns An array of role strings that are visible to the current user.
 */
export function getVisibleRoles(currentUserRole: string): string[] {
  const userRoleIndex = ROLE_HIERARCHY.indexOf(currentUserRole);
  if (userRoleIndex === -1) {
    // Return an empty array if the user's role is not in the hierarchy
    return [];
  }
  // Return all roles from the next one in the hierarchy onwards
  return ROLE_HIERARCHY.slice(userRoleIndex + 1);
}

/**
 * Checks if a target role is a valid, lower-level role for a given current user's role.
 * This function is crucial for server-side validation.
 *
 * @param currentUserRole The role of the user making the change.
 * @param targetRole The role being assigned.
 * @returns boolean
 */
export function canAssignRole(currentUserRole: string, targetRole: string): boolean {
  const currentUserIndex = ROLE_HIERARCHY.indexOf(currentUserRole);
  const targetRoleIndex = ROLE_HIERARCHY.indexOf(targetRole);

  // A role can only be assigned if it exists and is a lower index (higher position)
  // than the target role.
  return currentUserIndex !== -1 && targetRoleIndex !== -1 && currentUserIndex < targetRoleIndex;
}

