import { Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { PageLoader } from '../components/common/PageLoader';

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

const SuperuserGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  if (!user?.is_superuser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const settingsRoutes = (
  <>
    <Route path="settings" element={<SuperuserGuard>{withSuspense(SettingsHub)}</SuperuserGuard>} />
    <Route path="settings/groups" element={<SuperuserGuard>{withSuspense(GroupList)}</SuperuserGuard>} />
    <Route path="settings/groups/:id" element={<SuperuserGuard>{withSuspense(GroupForm)}</SuperuserGuard>} />
    <Route path="settings/users" element={<SuperuserGuard>{withSuspense(UserList)}</SuperuserGuard>} />
    <Route path="settings/users/view/:id" element={<SuperuserGuard>{withSuspense(UserView)}</SuperuserGuard>} />
    <Route path="settings/users/:id" element={<SuperuserGuard>{withSuspense(UserForm)}</SuperuserGuard>} />
    <Route path="settings/general-settings" element={<SuperuserGuard>{withSuspense(GeneralSettings)}</SuperuserGuard>} />
  </>
);
