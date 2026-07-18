import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { PageLoader } from '../components/common/PageLoader';
import { ROUTES } from '../utils/constants';
import { publicRoutes } from './publicRoutes';
import { mastersRoutes } from './mastersRoutes';
import { leadRoutes } from './leadRoutes';
import { settingsRoutes } from './settingsRoutes';
import { receiptsRoutes, receiptsPrintRoutes } from './receiptsRoutes';
import { reportsRoutes } from './reportsRoutes';
import { siteVisitRoutes } from './siteVisitRoutes';
import { inventoryRoutes } from './inventoryRoutes';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Layout } from '../components/layout';
import { setNavigateRef } from '../api/axios.config';

const Dashboard = lazy(() => import('../pages/dashboard/DashboardPage'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Wires React Router's navigate into the axios interceptor so auth failures
// redirect using SPA navigation instead of a full page reload.
const NavigateInjector = () => {
  const navigate = useNavigate();
  useEffect(() => { setNavigateRef(navigate); }, [navigate]);
  return null;
};

export const AppRoutes = () => (
  <>
    <NavigateInjector />
    <Routes>
    {/* Public Routes */}
    {publicRoutes}

    {/* Standalone Print Routes (no app chrome) */}
    {receiptsPrintRoutes}

    {/* Protected Routes with Layout */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route
        path={ROUTES.DASHBOARD.substring(1)}
        element={
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        }
      />
      {mastersRoutes}
      {leadRoutes}
      {settingsRoutes}
      {receiptsRoutes}
      {reportsRoutes}
      {siteVisitRoutes}
      {inventoryRoutes}
    </Route>

    {/* 404 Route */}
    <Route
      path="*"
      element={
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      }
    />
  </Routes>
  </>
);
