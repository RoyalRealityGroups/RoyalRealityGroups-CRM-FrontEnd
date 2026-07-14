import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';
import { ROUTES } from '../utils/constants';
import { publicRoutes } from './publicRoutes';
import { mastersRoutes } from './mastersRoutes';
import { leadRoutes } from './leadRoutes';
import { settingsRoutes } from './settingsRoutes';
import { receiptsRoutes, receiptsPrintRoutes } from './receiptsRoutes';
import { reportsRoutes } from './reportsRoutes';
import { siteVisitRoutes } from './siteVisitRoutes';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Layout } from '../components/layout';

const Dashboard = lazy(() => import('../pages/dashboard/DashboardPage'));
const NotFound = lazy(() => import('../pages/NotFound'));
export const AppRoutes = () => (
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
);
