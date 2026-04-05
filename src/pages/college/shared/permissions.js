/**
 * Role permission flags for college L1+L2 roles.
 * Used across all shared college-admin pages to show/hide action buttons.
 */
export function getPermissions(role) {
  const L1_L2 = ['chairman', 'vice_chairman', 'principal', 'vice_principal']
  return {
    canViewAll: L1_L2.includes(role),
    canManageDepts: role === 'chairman',
    canAssignDean: role === 'chairman',
    canApproveUsers: L1_L2.includes(role),
    canAssignHOD: L1_L2.includes(role),
    canManageSubjects: L1_L2.includes(role),
    canAssignTeachers: L1_L2.includes(role),
  }
}

export const ROLE_LABELS = {
  chairman: 'Chairman',
  vice_chairman: 'Vice Chairman',
  principal: 'Principal',
  vice_principal: 'Vice Principal',
}
