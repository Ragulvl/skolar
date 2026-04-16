// Superadmin Controller — Re-exports from sub-modules
// Import from 'controllers/superadmin/index.js' for backward compatibility

export { getPlatformStats, getPlatformActivity, getEnhancedAnalytics, getPlatformSettings, updatePlatformSettings } from './stats.js'
export { getInstitutions, createInstitution, updateInstitution, deleteInstitution, getInstitutionDetail } from './institutions.js'
export { getAllUsers, getUserById, updateUserRole, toggleUserApproval, deleteUser, getPendingUsers, bulkApproveUsers } from './users.js'
export { getAdmins, createAdmin, deleteAdmin, assignInstitution } from './admins.js'
