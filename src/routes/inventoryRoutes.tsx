import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';

const InventoryHub = lazy(() => import('../pages/inventory/InventoryHub'));
const PlotList = lazy(() => import('../pages/inventory/PlotList'));
const PlotForm = lazy(() => import('../pages/inventory/PlotForm'));
const FlatList = lazy(() => import('../pages/inventory/FlatList'));
const FlatForm = lazy(() => import('../pages/inventory/FlatForm'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const inventoryRoutes = (
  <>
    <Route path="inventory" element={withSuspense(InventoryHub)} />
    <Route path="inventory/plots" element={withSuspense(PlotList)} />
    <Route path="inventory/plots/add" element={withSuspense(PlotForm)} />
    <Route path="inventory/plots/edit/:id" element={withSuspense(PlotForm)} />
    <Route path="inventory/plots/view/:id" element={withSuspense(PlotForm)} />
    <Route path="inventory/flats" element={withSuspense(FlatList)} />
    <Route path="inventory/flats/add" element={withSuspense(FlatForm)} />
    <Route path="inventory/flats/edit/:id" element={withSuspense(FlatForm)} />
    <Route path="inventory/flats/view/:id" element={withSuspense(FlatForm)} />
  </>
);