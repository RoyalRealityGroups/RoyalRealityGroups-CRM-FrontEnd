import { Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const BookingList = lazy(() => import('../pages/booking/BookingList'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const bookingRoutes = (
  <>
    <Route path="booking" element={<Navigate to="/booking/list" replace />} />
    <Route path="booking/list" element={withSuspense(BookingList)} />
  </>
);
