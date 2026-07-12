import type { User } from '../types/auth.types';

// Check if user has specific permission
export const hasPermission = (user: User | null, permission: string): boolean => {
  // console.log('Checking permission:', { user, permission });
  if (!user) return false;
  
  // Superuser has all permissions
  if (user.is_superuser) return true;
  
  // Check in user permissions - handle both formats:
  // 1. "add_salesorder" (short format)
  // 2. "Sales.add_salesorder" (full format with app label)
  return user.permissions?.some(p => {
    // Direct match
    if (p === permission) return true;
    // Match without app label (e.g., "Sales.add_salesorder" matches "add_salesorder")
    if (p.includes('.') && p.split('.')[1] === permission) return true;
    // Match with app label (e.g., "add_salesorder" matches "Sales.add_salesorder")
    if (permission.includes('.') && p === permission.split('.')[1]) return true;
    return false;
  }) || false;
};

// Check if user has any of the given permissions
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  // Superuser has all permissions
  if (user.is_superuser) return true;
  
  // Check if user has at least one of the permissions
  return permissions.some(permission => user.permissions?.includes(permission));
};

// Check if user has all of the given permissions
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  // Superuser has all permissions
  if (user.is_superuser) return true;
  
  // Check if user has all permissions
  return permissions.every(permission => user.permissions?.includes(permission));
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
