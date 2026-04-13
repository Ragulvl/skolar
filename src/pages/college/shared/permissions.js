/**
 * Role permission flags for college L1+L2 roles.
 * Used across all shared college-admin pages to show/hide action buttons.
 */
export function getPermissions(role) {
  const L1_L2 = ['chairman', 'vice_chairman', 'principal', 'vice_principal']
  return {
    canViewAll: L1_L2.includes(role),
    canManageDepts: role === 'chairman' || role === 'vice_chairman',
    canAssignDean: role === 'chairman',
    canApproveUsers: L1_L2.includes(role),
    canAssignHOD: role === 'chairman' || role === 'principal',
    canManageSubjects: L1_L2.includes(role),
    canAssignTeachers: L1_L2.includes(role),
    // Phase 4: fine-grained action flags
    canViewAnalytics: L1_L2.includes(role),
    canManageStaff: role === 'chairman' || role === 'principal',
    canManageInstitution: role === 'chairman',
    isChairman: role === 'chairman',
    isPrincipal: role === 'principal',
    isVP: role === 'vice_principal',
    isVC: role === 'vice_chairman',
  }
}

export const ROLE_LABELS = {
  chairman: 'Chairman',
  vice_chairman: 'Vice Chairman',
  principal: 'Principal',
  vice_principal: 'Vice Principal',
}
