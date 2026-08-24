import { Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { PageLoader } from '../components/common/PageLoader';
import { usePermissions } from '../contexts/PermissionContext';

const SettingsHub         = lazy(() => import('../pages/SettingsHub'));
const UserList            = lazy(() => import('../pages/settings/UserList'));
const UserForm            = lazy(() => import('../pages/settings/UserForm'));
const UserView            = lazy(() => import('../pages/settings/UserView'));
const GeneralSettings     = lazy(() => import('../pages/settings/GeneralSettings'));
const NotificationSettings = lazy(() => import('../pages/settings/NotificationSettings'));
const AlertTriggerList    = lazy(() => import('../pages/settings/AlertTriggerList'));
const AlertTriggerForm    = lazy(() => import('../pages/settings/AlertTriggerForm'));
const TemplateList        = lazy(() => import('../pages/settings/TemplateList'));

const withSuspense = (C: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}><C /></Suspense>
);

/** Superuser OR user with can_view on USER_PERMISSION screen */
const SettingsGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { canView } = usePermissions();
  if (user?.is_superuser || canView('USER_PERMISSION')) return <>{children}</>;
  return <Navigate to="/dashboard" replace />;
};

/** Same as SettingsGuard but redirects to /settings instead of /dashboard */
const UserManagementGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { canView } = usePermissions();
  if (user?.is_superuser || canView('USER_PERMISSION')) return <>{children}</>;
  return <Navigate to="/settings" replace />;
};

/** Superuser only */
const SuperuserGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  if (!user?.is_superuser) return <Navigate to="/settings" replace />;
  return <>{children}</>;
};

export const settingsRoutes = (
  <>
    <Route path="settings" element={<SettingsGuard>{withSuspense(SettingsHub)}</SettingsGuard>} />

    {/* User management */}
    <Route path="settings/users"          element={<UserManagementGuard>{withSuspense(UserList)}</UserManagementGuard>} />
    <Route path="settings/users/view/:id" element={<UserManagementGuard>{withSuspense(UserView)}</UserManagementGuard>} />
    <Route path="settings/users/:id"      element={<UserManagementGuard>{withSuspense(UserForm)}</UserManagementGuard>} />

    {/* Superuser-only */}
    <Route path="settings/general-settings"    element={<SuperuserGuard>{withSuspense(GeneralSettings)}</SuperuserGuard>} />
    <Route path="settings/notifications"       element={<SuperuserGuard>{withSuspense(NotificationSettings)}</SuperuserGuard>} />
    <Route path="settings/alert-triggers"      element={<SuperuserGuard>{withSuspense(AlertTriggerList)}</SuperuserGuard>} />
    <Route path="settings/alert-triggers/create" element={<SuperuserGuard>{withSuspense(AlertTriggerForm)}</SuperuserGuard>} />
    <Route path="settings/alert-triggers/:id"  element={<SuperuserGuard>{withSuspense(AlertTriggerForm)}</SuperuserGuard>} />
    <Route path="settings/templates"           element={<SuperuserGuard>{withSuspense(TemplateList)}</SuperuserGuard>} />

    {/* Profile — every authenticated user */}
    <Route path="profile"      element={withSuspense(UserView)} />
    <Route path="profile/edit" element={withSuspense(UserForm)} />
  </>
);
