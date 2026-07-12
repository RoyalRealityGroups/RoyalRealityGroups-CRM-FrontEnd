import { lazy, type ComponentType } from 'react';

// Cache for lazy components
const componentCache = new Map<string, Promise<{ default: ComponentType<any> }>>();

export const preloadComponent = (importFn: () => Promise<{ default: ComponentType<any> }>, key: string) => {
  if (!componentCache.has(key)) {
    componentCache.set(key, importFn());
  }
  return componentCache.get(key);
};

// Preload on link hover
export const preloadRoute = (routePath: string) => {
  const routeMap: Record<string, () => void> = {
    '/sales/orders/create': () => import('../pages/sales/SaleOrder/SalesOrderForm'),
    '/sales/orders': () => import('../pages/sales/SaleOrder/SalesOrderList'),
    '/sales/invoice/create': () => import('../pages/sales/Invoice/InvoiceForm'),
    '/sales/invoice': () => import('../pages/sales/Invoice/InvoiceList'),
    '/masters/items': () => import('../pages/masters/Item/ItemList'),
    '/masters/items/add': () => import('../pages/masters/Item/ItemForm'),
    '/masters/projects': () => import('../pages/masters/Project/ProjectList'),
    '/masters/projects/view/:id': () => import('../pages/masters/Project/ProjectView'),
    '/masters/projects/add': () => import('../pages/masters/Project/ProjectForm'),
    '/masters/projects/:id/edit': () => import('../pages/masters/Project/ProjectForm'),
    // Add more routes as needed
  };

  const loader = routeMap[routePath];
  if (loader) {
    loader();
  }
};
