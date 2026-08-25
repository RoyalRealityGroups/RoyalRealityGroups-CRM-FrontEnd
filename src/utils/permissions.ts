import type { User } from '../types/auth.types';

// Screen permission object type (from new system)
interface ScreenPermission {
  screen_code?: string;
  menuitem_code?: string;
  screen_name?: string;
  menuitem_name?: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

// Check if user has admin-level access (superuser or is_admin)
export const hasAdminAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.is_superuser || user.is_admin || false;
};

// Get screen permission object for a specific screen
export const getScreenPermission = (user: User | null, screenCode: string): ScreenPermission | null => {
  if (!user) return null;
  
  // Superuser or Admin has all permissions
  if (hasAdminAccess(user)) {
    return {
      screen_code: screenCode,
      menuitem_code: screenCode,
      can_view: true,
      can_add: true,
      can_edit: true,
      can_delete: true,
      can_export: true,
    };
  }
  
  // Find screen permission - check both screen_code and menuitem_code
  if (user.screen_permissions && Array.isArray(user.screen_permissions)) {
    return user.screen_permissions.find(
      (p: ScreenPermission) => p.screen_code === screenCode || p.menuitem_code === screenCode
    ) || null;
  }
  
  return null;
};

// Check if user can view a screen
export const canViewScreen = (user: User | null, screenCode: string): boolean => {
  if (!user) return false;
  if (hasAdminAccess(user)) return true;
  const perm = getScreenPermission(user, screenCode);
  return perm?.can_view || false;
};

// Check if user can add records on a screen
export const canAddOnScreen = (user: User | null, screenCode: string): boolean => {
  if (!user) return false;
  if (hasAdminAccess(user)) return true;
  const perm = getScreenPermission(user, screenCode);
  return perm?.can_add || false;
};

// Check if user can edit records on a screen
export const canEditOnScreen = (user: User | null, screenCode: string): boolean => {
  if (!user) return false;
  if (hasAdminAccess(user)) return true;
  const perm = getScreenPermission(user, screenCode);
  return perm?.can_edit || false;
};

// Check if user can delete records on a screen
export const canDeleteOnScreen = (user: User | null, screenCode: string): boolean => {
  if (!user) return false;
  if (hasAdminAccess(user)) return true;
  const perm = getScreenPermission(user, screenCode);
  return perm?.can_delete || false;
};

// Check if user can export records on a screen
export const canExportOnScreen = (user: User | null, screenCode: string): boolean => {
  if (!user) return false;
  if (hasAdminAccess(user)) return true;
  const perm = getScreenPermission(user, screenCode);
  return perm?.can_export || false;
};

// Check if user has specific permission
// Supports both old format ("Sales.add_salesorder") and new screen-based format ("LEAD" or "DSH-001")
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  // Superuser or Admin has all permissions
  if (hasAdminAccess(user)) return true;
  
  // Check screen_permissions (new system) - array of objects
  if (user.screen_permissions && Array.isArray(user.screen_permissions)) {
    const screenPerm = user.screen_permissions.find(
      (p: ScreenPermission) => p.screen_code === permission || p.menuitem_code === permission
    );
    if (screenPerm?.can_view) return true;
  }
  
  // Check permissions (old system) - array of strings
  if (user.permissions && Array.isArray(user.permissions)) {
    const hasOldPerm = user.permissions.some((p: unknown) => {
      // Skip if not a string (could be object from new system mixed in)
      if (typeof p !== 'string') return false;
      // Direct match
      if (p === permission) return true;
      // Match without app label (e.g., "Sales.add_salesorder" matches "add_salesorder")
      if (p.includes('.') && p.split('.')[1] === permission) return true;
      // Match with app label (e.g., "add_salesorder" matches "Sales.add_salesorder")
      if (permission.includes('.') && p === permission.split('.')[1]) return true;
      return false;
    });
    if (hasOldPerm) return true;
  }
  
  return false;
};

// Check if user has any of the given permissions
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  // Superuser or Admin has all permissions
  if (hasAdminAccess(user)) return true;
  
  // Check if user has at least one of the permissions
  return permissions.some(permission => hasPermission(user, permission));
};

// Check if user has all of the given permissions
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  // Superuser or Admin has all permissions
  if (hasAdminAccess(user)) return true;
  
  // Check if user has all permissions
  return permissions.every(permission => hasPermission(user, permission));
};

// Check if user is in specific group
export const isInGroup = (user: User | null, groupName: string): boolean => {
  if (!user) return false;
  
  // Superuser or Admin bypasses group checks
  if (hasAdminAccess(user)) return true;
  
  // Check if user is in group
  return user.groups?.some(group => group.name === groupName) || false;
};

// Check if user is superuser
export const isSuperuser = (user: User | null): boolean => {
  return user?.is_superuser || false;
};

// Check if user is admin (not superuser, but has admin flag)
export const isAdmin = (user: User | null): boolean => {
  return user?.is_admin || false;
};
