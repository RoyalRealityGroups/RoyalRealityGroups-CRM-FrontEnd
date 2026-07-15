import { Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const LeadList = lazy(() => import('../pages/lead/LeadList'));
const LeadForm = lazy(() => import('../pages/lead/LeadForm'));
const FollowUps = lazy(() => import('../pages/lead/FollowUps'));
const FollowUpView = lazy(() => import('../pages/lead/FollowUpView'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const leadRoutes = (
  <>
    <Route path="lead" element={<Navigate to="/lead/list" replace />} />
    <Route path="lead/list" element={withSuspense(LeadList)} />
    <Route path="lead/add" element={withSuspense(LeadForm)} />
    <Route path="lead/edit/:id" element={withSuspense(LeadForm)} />
    <Route path="lead/view/:id" element={withSuspense(LeadForm)} />
    <Route path="lead/follow-ups" element={withSuspense(FollowUps)} />
    <Route path="lead/follow-ups/view/:id" element={withSuspense(FollowUpView)} />
  </>
);
