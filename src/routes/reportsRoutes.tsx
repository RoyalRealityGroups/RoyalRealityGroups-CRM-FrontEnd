import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const ReportsHub = lazy(() => import('../pages/reports/ReportsHub'));
const ReportView = lazy(() => import('../pages/reports/ReportView'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const reportsRoutes = (
  <>
    <Route path="reports" element={withSuspense(ReportsHub)} />
    <Route path="reports/:reportType" element={withSuspense(ReportView)} />
  </>
);
