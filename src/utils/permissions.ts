import type { User } from '../types/auth.types';

// Screen permission object type (from new system)
interface ScreenPermission {
  screen_code: string;
  screen_name?: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

// Check if user has specific permission
// Supports both old format ("Sales.add_salesorder") and new screen-based format ("LEAD")
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  // Superuser has all permissions
  if (user.is_superuser) return true;
  
  // Check screen_permissions (new system) - array of objects
  if (user.screen_permissions && Array.isArray(user.screen_permissions)) {
    const screenPerm = user.screen_permissions.find(
      (p: ScreenPermission) => p.screen_code === permission
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
  
  // Superuser has all permissions
  if (user.is_superuser) return true;
  
  // Check if user has at least one of the permissions
  return permissions.some(permission => hasPermission(user, permission));
};

// Check if user has all of the given permissions
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  // Superuser has all permissions
  if (user.is_superuser) return true;
  
  // Check if user has all permissions
  return permissions.every(permission => hasPermission(user, permission));
};

// Check if user is in specific group
export const isInGroup = (user: User | null, groupName: string): boolean => {
  if (!user) return false;
  
  // Superuser bypasses group checks
  if (user.is_superuser) return true;
  
  // Check if user is in group
  return user.groups?.some(group => group.name === groupName) || false;
};

// Check if user is superuser
export const isSuperuser = (user: User | null): boolean => {
  return user?.is_superuser || false;
};
