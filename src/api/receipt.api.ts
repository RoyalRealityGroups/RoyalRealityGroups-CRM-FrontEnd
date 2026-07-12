import api from './axios.config';
import type {
  Receipt,
  PendingInvoice,
  CustomerLedgerListResponse,
  CustomerLedgerSummary,
} from '../types/receipt.types';

interface GetAllParams {
  page?: number;
  page_size?: number;
  search?: string;
  payment_mode?: string;
}

interface CustomerLedgerParams {
  page?: number;
  page_size?: number;
  customer_type?: string;
  customer_id?: string;
  posting_date_from?: string;
  posting_date_to?: string;
  document_type?: string;
  entry_status?: string;
}

export const receiptApi = {
  getAll: async (params?: GetAllParams) => {
    const response = await api.get('/api/receipts/', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/receipts/${id}/`);
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await api.post('/api/receipts/create/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, data: FormData) => {
    const response = await api.put(`/api/receipts/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/receipts/${id}/`);
    return response.data;
  },

  getPendingInvoices: async (customerType: string, customerId: string): Promise<PendingInvoice[]> => {
    const response = await api.get('/api/receipts/pending-invoices/', {
      params: { customer_type: customerType, customer_id: customerId },
    });
    return response.data;
  },

  generateReceiptNumber: async (locationId: string) => {
    const response = await api.get('/api/receipts/generate-number/', {
      params: { location: locationId },
    });
    return response.data;
  },

  getCustomerCreditBalance: async (customerType: string, customerId: string, receiptDate?: string, receiptId?: string) => {
    const response = await api.get('/api/receipts/customer-credit-balance/', {
      params: { 
        customer_type: customerType, 
        customer_id: customerId,
        receipt_date: receiptDate,
        receipt_id: receiptId
      },
    });
    return response.data;
  },

  getCustomerLedger: async (params?: CustomerLedgerParams): Promise<CustomerLedgerListResponse> => {
    const response = await api.get('/api/receipts/customer-ledger/', { params });
    return response.data;
  },

  getCustomerLedgerSummary: async (
    customerType: string,
    customerId: string,
    postingDateFrom?: string,
    postingDateTo?: string,
  ): Promise<CustomerLedgerSummary> => {
    const response = await api.get('/api/receipts/customer-ledger-summary/', {
      params: {
        customer_type: customerType,
        customer_id: customerId,
        posting_date_from: postingDateFrom,
        posting_date_to: postingDateTo,
      },
    });
    return response.data;
  },
};
