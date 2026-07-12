import { Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PageLoader } from '../components/common/PageLoader';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Eager load frequently used components
import MastersHub from '../pages/MastersHub';
import ItemList from '../pages/masters/Item/ItemList';
import ItemForm from '../pages/masters/Item/ItemForm';

// Lazy load less frequently used components
const CountryList = lazy(() => import('../pages/masters/Country/CountryList'));
const StateList = lazy(() => import('../pages/masters/State/StateList'));
const DistrictList = lazy(() => import('../pages/masters/District/DistrictList'));
const MandalList = lazy(() => import('../pages/masters/Mandal/MandalList'));
const CityList = lazy(() => import('../pages/masters/City/CityList'));
const AreaList = lazy(() => import('../pages/masters/Area/AreaList'));
const RouteList = lazy(() => import('../pages/masters/Route/RouteList'));
const RouteForm = lazy(() => import('../pages/masters/Route/RouteForm'));
const CompanyList = lazy(() => import('../pages/masters/Company/CompanyList'));
const LocationList = lazy(() => import('../pages/masters/Location/LocationList'));
const LocationForm = lazy(() => import('../pages/masters/Location/LocationForm'));
const SuperstockistList = lazy(() => import('../pages/masters/SuperStockist/SuperstockistList'));
const SuperstockistForm = lazy(() => import('../pages/masters/SuperStockist/SuperstockistForm'));
const DistributorList = lazy(() => import('../pages/masters/Distributor/DistributorList'));
const DistributorForm = lazy(() => import('../pages/masters/Distributor/DistributorForm'));
const RetailerList = lazy(() => import('../pages/masters/Retailer/RetailerList'));
const RetailerForm = lazy(() => import('../pages/masters/Retailer/RetailerForm'));
const WarehouseList = lazy(() => import('../pages/masters/Warehouse/WarehouseList'));
const UOMList = lazy(() => import('../pages/masters/Uom/UOMList'));
const CategoryList = lazy(() => import('../pages/masters/Category/CategoryList'));
const BrandList = lazy(() => import('../pages/masters/Brand/BrandList'));
const TaxList = lazy(() => import('../pages/masters/Tax/TaxList'));
const ItemTaxCompositionList = lazy(() => import('../pages/masters/Item/ItemTaxCompositionList'));
const OutletTypeList = lazy(() => import('../pages/masters/OutletType/OutletTypeList'));
const AgentList = lazy(() => import('../pages/masters/Agent/AgentList'));
const ItemSettings = lazy(() => import('../pages/masters/Item/ItemSettings'));
const ItemView = lazy(() => import('../pages/masters/Item/ItemView'));
const ProjectList = lazy(() => import('../pages/masters/Project/ProjectList'));
const ProjectView = lazy(() => import('../pages/masters/Project/ProjectView'));
const ProjectForm = lazy(() => import('../pages/masters/Project/ProjectForm'));

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const mastersRoutes = (
  <>
    <Route path="masters" element={<MastersHub />} />
    <Route path="masters/country" element={withSuspense(CountryList)} />
    <Route path="masters/state" element={withSuspense(StateList)} />
    <Route path="masters/district" element={withSuspense(DistrictList)} />
    <Route path="masters/mandal" element={withSuspense(MandalList)} />
    <Route path="masters/city" element={withSuspense(CityList)} />
    <Route path="masters/area" element={withSuspense(AreaList)} />
    <Route path="masters/route" element={withSuspense(RouteList)} />
    <Route path="masters/route/add" element={withSuspense(RouteForm)} />
    <Route path="masters/route/edit/:id" element={withSuspense(RouteForm)} />
    <Route path="masters/company" element={withSuspense(CompanyList)} />
    <Route path="masters/location" element={withSuspense(LocationList)} />
    <Route path="masters/location/add" element={withSuspense(LocationForm)} />
    <Route path="masters/location/edit/:id" element={withSuspense(LocationForm)} />
    <Route path="masters/superstockist" element={withSuspense(SuperstockistList)} />
    <Route path="masters/superstockist/add" element={withSuspense(SuperstockistForm)} />
    <Route path="masters/superstockist/edit/:id" element={withSuspense(SuperstockistForm)} />
    <Route path="masters/distributor" element={withSuspense(DistributorList)} />
    <Route path="masters/distributor/add" element={withSuspense(DistributorForm)} />
    <Route path="masters/distributor/edit/:id" element={withSuspense(DistributorForm)} />
    <Route path="masters/retailer" element={withSuspense(RetailerList)} />
    <Route path="masters/retailer/add" element={withSuspense(RetailerForm)} />
    <Route path="masters/retailer/edit/:id" element={withSuspense(RetailerForm)} />
    <Route path="masters/warehouses" element={withSuspense(WarehouseList)} />
    <Route path="masters/uom" element={withSuspense(UOMList)} />
    <Route path="masters/categories" element={withSuspense(CategoryList)} />
    <Route path="masters/brands" element={withSuspense(BrandList)} />
    <Route path="masters/tax" element={withSuspense(TaxList)} />
    <Route path="masters/item-tax-composition" element={withSuspense(ItemTaxCompositionList)} />
    <Route path="masters/outlet-types" element={withSuspense(OutletTypeList)} />
    <Route path="masters/agents" element={withSuspense(AgentList)} />
    <Route path="masters/items" element={<ItemList />} />
    <Route path="masters/items/add" element={<ItemForm />} />
    <Route path="masters/items/edit/:id" element={<ItemForm />} />
    <Route path="masters/items/view/:id" element={withSuspense(ItemView)} />
    <Route path="masters/settings/item-settings" element={withSuspense(ItemSettings)} />

    <Route path="masters/projects" element={withSuspense(ProjectList)} />
    <Route path="masters/projects/view/:id" element={withSuspense(ProjectView)} />
    <Route path="masters/projects/add" element={withSuspense(ProjectForm)} />
    <Route path="masters/projects/:id/edit" element={withSuspense(ProjectForm)} />
  </>
);
