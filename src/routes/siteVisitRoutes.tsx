import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const SiteVisits = lazy(() => import('../pages/sitevisit/SiteVisits'));
const SiteVisitForm = lazy(() => import('../pages/sitevisit/SiteVisitForm'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const siteVisitRoutes = (
  <>
    <Route path="sitevisit" element={withSuspense(SiteVisits)} />
    <Route path="sitevisit/add" element={withSuspense(SiteVisitForm)} />
    <Route path="sitevisit/edit/:id" element={withSuspense(SiteVisitForm)} />
    <Route path="sitevisit/view/:id" element={withSuspense(SiteVisitForm)} />
  </>
);