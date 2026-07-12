import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const ReceiptList = lazy(() => import('../pages/receipts/ReceiptList'));
const ReceiptForm = lazy(() => import('../pages/receipts/ReceiptForm'));
const ReceiptView = lazy(() => import('../pages/receipts/ReceiptView'));
const ReceiptPrint = lazy(() => import('../pages/receipts/ReceiptPrint'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const receiptsRoutes = (
  <>
    <Route path="receipts" element={withSuspense(ReceiptList)} />
    <Route path="receipts/create" element={
      <ProtectedRoute permission="add_receipt">
        {withSuspense(ReceiptForm)}
      </ProtectedRoute>
    } />
    <Route path="receipts/edit/:id" element={
      <ProtectedRoute permission="change_receipt">
        {withSuspense(ReceiptForm)}
      </ProtectedRoute>
    } />
    <Route path="receipts/:id/view" element={
      <ProtectedRoute permission="view_receipt">
        {withSuspense(ReceiptView)}
      </ProtectedRoute>
    } />
  </>
);

// Standalone print route (outside layout)
export const receiptsPrintRoutes = (
  <Route path="/receipts/:id/print" element={
    <ProtectedRoute permission="view_receipt">
      {withSuspense(ReceiptPrint)}
    </ProtectedRoute>
  } />
);
