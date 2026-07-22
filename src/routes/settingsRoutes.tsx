import { Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { PageLoader } from '../components/common/PageLoader';
import { isSuperuser } from '../utils/permissions';

const SettingsHub = lazy(() => import('../pages/SettingsHub'));
const GroupList = lazy(() => import('../pages/settings/GroupList'));
const GroupForm = lazy(() => import('../pages/settings/GroupForm'));
const UserList = lazy(() => import('../pages/settings/UserList'));
const UserForm = lazy(() => import('../pages/settings/UserForm'));
const UserView = lazy(() => import('../pages/settings/UserView'));
const GeneralSettings = lazy(() => import('../pages/settings/GeneralSettings'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Allows superusers and users with USER_PERMISSION screen access
const SettingsGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  if (isSuperuser(user)) return <>{children}</>;
  // Allow if user has any user management permission
  const hasUserPerm = user?.permissions?.some((p: string) =>
    p.includes('user') || p.includes('Users')
  );
  if (!hasUserPerm) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Users-specific routes: superuser OR has user management permissions
const UserManagementGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  if (isSuperuser(user)) return <>{children}</>;
  const hasUserPerm = user?.permissions?.some((p: string) =>
    p.includes('user') || p.includes('Users')
  );
  if (!hasUserPerm) return <Navigate to="/settings" replace />;
  return <>{children}</>;
};

// Superuser-only guard (Groups, General Settings)
const SuperuserGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  if (!user?.is_superuser) return <Navigate to="/settings" replace />;
  return <>{children}</>;
};

export const settingsRoutes = (
  <>
    <Route path="settings" element={<SettingsGuard>{withSuspense(SettingsHub)}</SettingsGuard>} />
    <Route path="settings/groups" element={<SuperuserGuard>{withSuspense(GroupList)}</SuperuserGuard>} />
    <Route path="settings/groups/:id" element={<SuperuserGuard>{withSuspense(GroupForm)}</SuperuserGuard>} />
    <Route path="settings/users" element={<UserManagementGuard>{withSuspense(UserList)}</UserManagementGuard>} />
    <Route path="settings/users/view/:id" element={<UserManagementGuard>{withSuspense(UserView)}</UserManagementGuard>} />
    <Route path="settings/users/:id" element={<UserManagementGuard>{withSuspense(UserForm)}</UserManagementGuard>} />
    <Route path="settings/general-settings" element={<SuperuserGuard>{withSuspense(GeneralSettings)}</SuperuserGuard>} />
    <Route path="profile" element={withSuspense(UserView)} />
    <Route path="profile/edit" element={withSuspense(UserForm)} />
  </>
);
