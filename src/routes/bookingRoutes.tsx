import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const Bookings = lazy(() => import('../pages/lead/Bookings'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const bookingRoutes = (
  <>
    <Route path="booking" element={withSuspense(Bookings)} />
  </>
);
