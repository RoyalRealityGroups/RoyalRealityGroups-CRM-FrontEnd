import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const SettingsHub = lazy(() => import('../pages/SettingsHub'));
const ChannelConfiguration = lazy(() => import('../pages/settings/ChannelConfiguration'));
const GroupList = lazy(() => import('../pages/settings/GroupList'));
const GroupForm = lazy(() => import('../pages/settings/GroupForm'));
const UserList = lazy(() => import('../pages/settings/UserList'));
const UserForm = lazy(() => import('../pages/settings/UserForm'));
const UserView = lazy(() => import('../pages/settings/UserView'));
const AuthorizationDefinitionList = lazy(() => import('../pages/settings/AuthorizationDefinitionList'));
const AuthorizationDefinitionForm = lazy(() => import('../pages/settings/AuthorizationDefinitionForm'));
const AuthorizationDefinitionView = lazy(() => import('../pages/settings/AuthorizationDefinitionView'));
const GeneralSettings = lazy(() => import('../pages/settings/GeneralSettings'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const settingsRoutes = (
  <>
    <Route path="settings" element={withSuspense(SettingsHub)} />
    <Route path="settings/channel-configuration" element={withSuspense(ChannelConfiguration)} />
    <Route path="settings/groups" element={withSuspense(GroupList)} />
    <Route path="settings/groups/:id" element={withSuspense(GroupForm)} />
    <Route path="settings/users" element={withSuspense(UserList)} />
    <Route path="settings/users/view/:id" element={withSuspense(UserView)} />
    <Route path="settings/users/:id" element={withSuspense(UserForm)} />
    <Route path="settings/authorizations" element={withSuspense(AuthorizationDefinitionList)} />
    <Route path="settings/authorization-definitions" element={withSuspense(AuthorizationDefinitionList)} />
    <Route path="settings/authorization-definitions/:id/view" element={withSuspense(AuthorizationDefinitionView)} />
    <Route path="settings/authorization-definitions/:id" element={withSuspense(AuthorizationDefinitionForm)} />
    <Route path="settings/general-settings" element={withSuspense(GeneralSettings)} />
  </>
);
