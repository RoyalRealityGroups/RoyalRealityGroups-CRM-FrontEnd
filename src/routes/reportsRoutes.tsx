import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Lazy load report components
const ReportsHub = lazy(() => import('../pages/ReportsHub'));
const SalesOrderReportPage = lazy(() => import('../pages/sales/SalesOrderReportPage'));
const DispatchPlanningReportPage = lazy(() => import('../pages/dispatch/DispatchPlanningReportPage'));
const InvoiceReportPage = lazy(() => import('../pages/invoice/InvoiceReportPage'));
const ReceiptReportPage = lazy(() => import('../pages/receipts/ReceiptReportPage'));
const PODReportPage = lazy(() => import('../pages/delivery/PODReportPage'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const reportsRoutes = (
  <>
    <Route path="reports" element={withSuspense(ReportsHub)} />
    <Route path="reports/orders" element={
      <ProtectedRoute permission="view_salesorder">
        {withSuspense(SalesOrderReportPage)}
      </ProtectedRoute>
    } />
    <Route path="reports/planning" element={
      <ProtectedRoute permission="view_dispatchplan">
        {withSuspense(DispatchPlanningReportPage)}
      </ProtectedRoute>
    } />
    <Route path="reports/invoices" element={
      <ProtectedRoute permission="view_invoice">
        {withSuspense(InvoiceReportPage)}
      </ProtectedRoute>
    } />
    <Route path="reports/receipts" element={
      <ProtectedRoute permission="view_receipt">
        {withSuspense(ReceiptReportPage)}
        </ProtectedRoute>
    } /> 
    <Route path="reports/pod" element={
      <ProtectedRoute permission="view_proofofdelivery">
        {withSuspense(PODReportPage)}
      </ProtectedRoute>
    } />
  </>
);
