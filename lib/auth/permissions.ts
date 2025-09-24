import { User } from '@/app/contexts/AuthContext';

/**
 * Centralized permission system for role-based access control
 * 
 * Role hierarchy:
 * - dev: Full system access (super admin) - can manage everything
 * - admin: Limited admin access - can only activate AI
 * - user: Standard user permissions
 */

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'dev';
  full_name?: string;
}

export interface PermissionContext {
  user?: User | null;
  profile?: UserProfile | null;
}

/**
 * Check if user has dev role (super admin)
 */
export function isDevAdmin(context: PermissionContext): boolean {
  return context.profile?.role === 'dev';
}

/**
 * Check if user has regular admin role  
 */
export function isRegularAdmin(context: PermissionContext): boolean {
  return context.profile?.role === 'admin';
}


/**
 * Check if user has any admin-level access (dev or admin)
 */
export function isAnyAdmin(context: PermissionContext): boolean {
  return isDevAdmin(context) || isRegularAdmin(context);
}

/**
 * Check if user can activate AI (admin or dev)
 */
export function canActivateAI(context: PermissionContext): boolean {
  return isDevAdmin(context) || isRegularAdmin(context);
}

/**
 * Check if user can manage system settings, challenges, etc (dev only)
 */
export function canManageSystem(context: PermissionContext): boolean {
  return isDevAdmin(context);
}

/**
 * Check if user can manage challenges (dev only)
 */
export function canManageChallenges(context: PermissionContext): boolean {
  return isDevAdmin(context);
}

/**
 * Check if user can view admin panels and data (dev only)
 */
export function canViewAdminData(context: PermissionContext): boolean {
  return isDevAdmin(context);
}

/**
 * Check if user can access GraphQL admin endpoint (dev only)
 */
export function canAccessGraphQL(context: PermissionContext): boolean {
  return isDevAdmin(context);
}

/**
 * Check if user can manage rate limiting (dev only)
 */
export function canManageRateLimit(context: PermissionContext): boolean {
  return isDevAdmin(context);
}

/**
 * Check if user can view all user projects (dev only)
 */
export function canViewAllProjects(context: PermissionContext): boolean {
  return isDevAdmin(context);
}

/**
 * Check if user can reset challenge cutoff dates (dev only)
 */
export function canResetChallenges(context: PermissionContext): boolean {
  return isDevAdmin(context);
}

/**
 * Get user's role display name
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'dev':
      return '👨‍💻 Developer (Super Admin)';
    case 'admin':
      return '👨‍💼 Administrator';
    case 'user':
      return '🎯 CTF Participant';
    default:
      return '🎯 CTF Participant';
  }
}

/**
 * Create permission context from user and profile data
 */
export function createPermissionContext(user?: User | null, profile?: UserProfile | null): PermissionContext {
  return { user, profile };
}

/**
 * Get all permissions for a user (useful for debugging)
 */
export function getUserPermissions(context: PermissionContext) {
  return {
    role: context.profile?.role || 'user',
    isDevAdmin: isDevAdmin(context),
    isRegularAdmin: isRegularAdmin(context),
    isAnyAdmin: isAnyAdmin(context),
    canActivateAI: canActivateAI(context),
    canManageSystem: canManageSystem(context),
    canManageChallenges: canManageChallenges(context),
    canViewAdminData: canViewAdminData(context),
    canAccessGraphQL: canAccessGraphQL(context),
    canManageRateLimit: canManageRateLimit(context),
    canViewAllProjects: canViewAllProjects(context),
    canResetChallenges: canResetChallenges(context),
  };
}
