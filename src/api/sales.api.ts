import apiClient from './axios.config';
import type {
  SalesOrder,
  SalesOrderFormData,
  SalesOrderListParams,
  SalesOrderListResponse,
  SalesOrderHistory,
  ItemPriceResponse,
  ApproveOrderResponse,
  RejectOrderRequest,
  RejectOrderResponse,
  CustomerType,
  PendingSalesOrdersResponse,
  AvailableSchemesResponse,
  FrequentSalesItemsResponse,
} from '../types/sales.types';

const SALES_ORDER_BASE = '/api/sales/orders';

export const salesOrderApi = {
  /**
   * Get list of sales orders with optional filters
   */
  getOrders: async (params?: SalesOrderListParams): Promise<SalesOrderListResponse> => {
    const response = await apiClient.get(SALES_ORDER_BASE + '/', { params });
    return response.data;
  },

  /**
   * Get sales order status count
   */
  getStatusCount: async (): Promise<{ [key: string]: number }> => {
    const response = await apiClient.get(`${SALES_ORDER_BASE}/status-count/`);
    return response.data;
  },

  /**
   * Get single sales order by ID
   */
  getOrder: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.get(`${SALES_ORDER_BASE}/${id}/`);
    return response.data;
  },

  /**
   * Alias for getOrder (for compatibility)
   */
  getById: async (id: string): Promise<SalesOrder> => {
    return salesOrderApi.getOrder(id);
  },

  /**
   * Create new sales order
   */
  createOrder: async (data: SalesOrderFormData): Promise<SalesOrder> => {
    const formData = new FormData();
    
    // Append simple fields
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      
      if (key === 'items') {
        // Handle items array specially
        return;
      }
      
      if (key === 'attachment' && value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    // Append items as JSON
    if (data.items && data.items.length > 0) {
      formData.append('items', JSON.stringify(data.items));
    }
    
    const response = await apiClient.post(SALES_ORDER_BASE + '/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update existing sales order
   */
  updateOrder: async (id: string, data: Partial<SalesOrderFormData>): Promise<SalesOrder> => {
    const formData = new FormData();
    
    // Append simple fields
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      
      if (key === 'items') {
        return;
      }
      
      if (key === 'attachment' && value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    // Append items as JSON
    if (data.items && data.items.length > 0) {
      formData.append('items', JSON.stringify(data.items));
    }
    
    const response = await apiClient.put(`${SALES_ORDER_BASE}/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Alias for createOrder (for compatibility)
   */
  create: async (formData: FormData): Promise<SalesOrder> => {
    const response = await apiClient.post(SALES_ORDER_BASE + '/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Alias for updateOrder (for compatibility)
   */
  update: async (id: string, formData: FormData): Promise<SalesOrder> => {
    const response = await apiClient.put(`${SALES_ORDER_BASE}/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete sales order (only PENDING or REJECTED)
   */
  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`${SALES_ORDER_BASE}/${id}/`);
  },

  /**
   * Approve a sales order
   */
  approveOrder: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.post(`${SALES_ORDER_BASE}/${id}/approve/`);
    return response.data;
  },

  /**
   * Reject a sales order
   */
  rejectOrder: async (id: string, data: RejectOrderRequest): Promise<SalesOrder> => {
    const response = await apiClient.post(`${SALES_ORDER_BASE}/${id}/reject/`, data);
    return response.data;
  },

  /**
   * Start processing a sales order
   */
  processOrder: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.post(`${SALES_ORDER_BASE}/${id}/process/`);
    return response.data;
  },

  /**
   * Mark sales order as invoiced
   */
  invoiceOrder: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.post(`${SALES_ORDER_BASE}/${id}/invoice/`);
    return response.data;
  },

  /**
   * Mark sales order as delivered
   */
  deliverOrder: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.post(`${SALES_ORDER_BASE}/${id}/deliver/`);
    return response.data;
  },

  /**
   * Get sales order history
   */
  getOrderHistory: async (orderId: string): Promise<SalesOrderHistory[]> => {
    const response = await apiClient.get(`${SALES_ORDER_BASE}/${orderId}/history/`);
    return response.data.results || response.data;
  },

  /**
   * Get item price using cascade logic
   */
  getItemPrice: async (
    itemId: string,
    customerId: string,
    customerType: CustomerType
  ): Promise<ItemPriceResponse> => {
    const response = await apiClient.get('/api/sales/item-price/', {
      params: {
        item_id: itemId,
        customer_id: customerId,
        customer_type: customerType,
      },
    });
    return response.data;
  },

  /**
   * Generate next sales order document number
   */
  generateDocumentNumber: async (
    companyId?: string | number
  ): Promise<{ order_number: string; financial_year: string }> => {
    const response = await apiClient.get(`${SALES_ORDER_BASE}/generate-document-number/`, {
      params: companyId ? { company: companyId } : undefined,
    });
    return response.data;
  },

  /**
   * Get customer pending sales orders (uninvoiced) with credit summary
   */
  getPendingOrders: async (
    customerType: CustomerType,
    customerId: string
  ): Promise<PendingSalesOrdersResponse> => {
    const response = await apiClient.get(`${SALES_ORDER_BASE}/pending-orders/`, {
      params: {
        customer_type: customerType,
        customer_id: customerId,
      },
    });
    return response.data;
  },

  /**
   * Get top frequent items ordered by customer in the recent period.
   */
  getFrequentItems: async (
    customerType: CustomerType,
    customerId: string,
    months = 12,
    limit = 10,
    companyId?: string
  ): Promise<FrequentSalesItemsResponse> => {
    const response = await apiClient.get(`${SALES_ORDER_BASE}/frequent-items/`, {
      params: {
        customer_type: customerType,
        customer_id: customerId,
        months,
        limit,
        company_id: companyId,
      },
    });
    return response.data;
  },

  /**
   * Get applicable schemes for a saved sales order with preview benefits
   */
  getAvailableSchemes: async (orderId: string): Promise<AvailableSchemesResponse> => {
    const response = await apiClient.get(`${SALES_ORDER_BASE}/${orderId}/available-schemes/`);
    return response.data;
  },

  /**
   * Get applicable schemes for an unsaved order (payload-based) with previews
   */
  getApplicableSchemes: async (payload: {
    customer_type: string;
    customer_id: string;
    company_id?: string;
    location_id?: string | null;
    order_date?: string;
    items: Array<{
      item_id: string;
      category_id?: string | null;
      quantity: number;
      unit?: string;
      item_amount?: number;
    }>;
  }): Promise<AvailableSchemesResponse> => {
    const response = await apiClient.post(`${SALES_ORDER_BASE}/get-applicable-schemes/`, payload);
    return response.data;
  },

  /**
   * Get weekly customer count for sales orders
   */
  getWeeklyCustomerCount: async (customerType: CustomerType): Promise<any> => {
    const response = await apiClient.get(`${SALES_ORDER_BASE}/weekly-customer-count/`, {
      params: { customer_type: customerType },
    });
    return response.data;
  },

  /**
   * Apply selected schemes to an existing order
   */
  applySchemes: async (orderId: string, schemeIds: string[]): Promise<any> => {
    const response = await apiClient.post(`${SALES_ORDER_BASE}/${orderId}/apply-schemes/`, {
      scheme_ids: schemeIds,
      auto_recalculate: true,
    });
    return response.data;
  },
};
