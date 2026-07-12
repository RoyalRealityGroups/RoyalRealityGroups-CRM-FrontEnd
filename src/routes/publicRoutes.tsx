import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ROUTES } from '../utils/constants';
import Login from '../components/auth/Login';
import ForgotPassword from '../components/auth/ForgotPassword';
import { PageLoader } from '../components/common/PageLoader';

const Unauthorized = lazy(() => import('../pages/Unauthorized'));

export const publicRoutes = (
  <>
    <Route path={ROUTES.LOGIN} element={<Login />} />
    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
    <Route path="/unauthorized" element={
      <Suspense fallback={<PageLoader />}>
        <Unauthorized />
      </Suspense>
    } />
  </>
);
