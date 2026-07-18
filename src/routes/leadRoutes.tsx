import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const LeadHub = lazy(() => import('../pages/lead/LeadHub'));
const LeadList = lazy(() => import('../pages/lead/LeadList'));
const LeadForm = lazy(() => import('../pages/lead/LeadForm'));
const CrossLeadCheck = lazy(() => import('../pages/lead/CrossLeadCheck'));
const FollowUps = lazy(() => import('../pages/lead/FollowUps'));
const SiteVisits = lazy(() => import('../pages/lead/SiteVisits'));
const Bookings = lazy(() => import('../pages/lead/Bookings'));
const DocumentVault = lazy(() => import('../pages/documents/DocumentVault'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const leadRoutes = (
  <>
    <Route path="lead" element={withSuspense(LeadHub)} />
    <Route path="lead/list" element={withSuspense(LeadList)} />
    <Route path="lead/add" element={withSuspense(LeadForm)} />
    <Route path="lead/edit/:id" element={withSuspense(LeadForm)} />
    <Route path="lead/view/:id" element={withSuspense(LeadForm)} />
    <Route path="lead/cross-check" element={withSuspense(CrossLeadCheck)} />
    <Route path="lead/follow-ups" element={withSuspense(FollowUps)} />
    <Route path="lead/site-visits" element={withSuspense(SiteVisits)} />
    <Route path="bookings" element={withSuspense(Bookings)} />
    <Route path="documents" element={withSuspense(DocumentVault)} />
  </>
);
