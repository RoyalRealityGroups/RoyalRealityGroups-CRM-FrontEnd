import apiClient from './axios.config';
import type { Invoice, DispatchPlanForInvoice, SalesOrderForInvoice, PendingInvoicesResponse } from '../types/invoice.types';

export const invoiceApi = {
  // Invoices
  getAll: (params?: any) => 
    apiClient.get('/api/invoice/invoices/', { params }).then(res => res.data),
  
  getById: (id: string) => 
    apiClient.get(`/api/invoice/invoices/${id}/`).then(res => res.data),
  
  update: (id: string, data: Partial<Invoice>) => 
    apiClient.patch(`/api/invoice/invoices/${id}/`, data).then(res => res.data),
  
  delete: (id: string) => 
    apiClient.delete(`/api/invoice/invoices/${id}/`).then(res => res.data),
  
  cancel: (id: string) => 
    apiClient.post(`/api/invoice/invoices/${id}/cancel/`).then(res => res.data),
  
  // Generate Invoices
  generateFromDispatch: (data: { dispatch_plan: string; location: string; invoice_date: string; invoice_number: string; remarks?: string }) => 
    apiClient.post('/api/invoice/invoices/generate-from-dispatch/', data).then(res => res.data),
  
  generateFromOrder: (data: { sales_order: string; location: string; invoice_date: string; invoice_number: string; remarks?: string }) => 
    apiClient.post('/api/invoice/invoices/generate-from-order/', data).then(res => res.data),
  
  // Available Sources
  getAvailableDispatches: (params?: any) => 
    apiClient.get('/api/invoice/invoices/available-dispatches/', { params }).then(res => res.data),
  
  getAvailableOrders: (params?: any) => 
    apiClient.get('/api/invoice/invoices/available-orders/', { params }).then(res => res.data),
  
  getAvailableCustomers: (params?: any) => 
    apiClient.get('/api/invoice/invoices/available-customers/', { params }).then(res => res.data),
  
  // Status Count
  getStatusCount: async (): Promise<{ [key: string]: number }> => {
    const response = await apiClient.get('/api/invoice/invoices/status-count/');
    return response.data;
  },
  
  // Utilities
  generateInvoiceNumber: (locationId: string) => 
    apiClient.get('/api/invoice/invoices/generate-number/', { params: { location: locationId } }).then(res => res.data),
  
  // Pending Invoices for Customer
  getPendingInvoices: (customerType: string, customerId: string): Promise<PendingInvoicesResponse> => 
    apiClient.get('/api/invoice/invoices/pending-invoices/', { 
      params: { customer_type: customerType, customer_id: customerId } 
    }).then(res => res.data),
};
