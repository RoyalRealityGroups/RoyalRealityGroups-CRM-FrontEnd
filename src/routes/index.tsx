import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { PageLoader } from '../components/common/PageLoader';
import { ROUTES } from '../utils/constants';
import { publicRoutes } from './publicRoutes';
import { leadRoutes } from './leadRoutes';
import { settingsRoutes } from './settingsRoutes';
import { receiptsRoutes, receiptsPrintRoutes } from './receiptsRoutes';
import { siteVisitRoutes } from './siteVisitRoutes';
import { inventoryRoutes } from './inventoryRoutes';
import { bookingRoutes } from './bookingRoutes';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import SmartRedirect from '../components/auth/SmartRedirect';
import { Layout } from '../components/layout';
import { setNavigateRef } from '../api/axios.config';

const Dashboard = lazy(() => import('../pages/dashboard/DashboardPage'));
const TodaysInsights = lazy(() => import('../pages/dashboard/TodaysInsights'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Project is a top-level domain in this CRM, not a master
const ProjectList = lazy(() => import('../pages/masters/Project/ProjectList'));
const ProjectView = lazy(() => import('../pages/masters/Project/ProjectView'));
const ProjectForm = lazy(() => import('../pages/masters/Project/ProjectForm'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

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
      <Route index element={<SmartRedirect />} />
      <Route
        path={ROUTES.DASHBOARD.substring(1)}
        element={
          <ProtectedRoute permission="view_dashboard">
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/insights"
        element={
          <ProtectedRoute permission="view_dashboard">
            <Suspense fallback={<PageLoader />}>
              <TodaysInsights />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="projects/list" element={withSuspense(ProjectList)} />
      <Route path="projects/view/:id" element={withSuspense(ProjectView)} />
      <Route path="projects/add" element={withSuspense(ProjectForm)} />
      <Route path="projects/edit/:id" element={withSuspense(ProjectForm)} />
      {leadRoutes}
      {settingsRoutes}
      {receiptsRoutes}
      {siteVisitRoutes}
      {inventoryRoutes}
      {bookingRoutes}
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
