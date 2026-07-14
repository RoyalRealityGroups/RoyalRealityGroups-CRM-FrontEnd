import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
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

export const settingsRoutes = (
  <>
    <Route path="settings" element={withSuspense(SettingsHub)} />
    <Route path="settings/groups" element={withSuspense(GroupList)} />
    <Route path="settings/groups/:id" element={withSuspense(GroupForm)} />
    <Route path="settings/users" element={withSuspense(UserList)} />
    <Route path="settings/users/view/:id" element={withSuspense(UserView)} />
    <Route path="settings/users/:id" element={withSuspense(UserForm)} />
    <Route path="settings/general-settings" element={withSuspense(GeneralSettings)} />
  </>
);
