export type ProofOfDeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';

export interface ProofOfDeliveryFile {
  id?: string;
  file: string;
  file_type?: 'SIGNATURE' | 'PHOTO' | 'DOC';
  file_url?: string;
  original_filename?: string;
  description?: string;
  created_on?: string;
}

export interface ProofOfDelivery {
  id?: string;
  code?: string;
  pod_number?: string;
  invoice: string;
  invoice_number?: string;
  invoice_date?: string;
  sales_order: string;
  order_number?: string;
  order_date?: string;
  dispatch_item?: string | null;
  dispatch_number?: string | null;
  status: ProofOfDeliveryStatus;
  pod_date?: string;
  delivered_date?: string;
  receiver_name?: string;
  receiver_phone?: string;
  delivered_by?: string;
  remarks?: string;
  customer_name?: string;
  customer_type?: string;
  customer_id?: string;
  billing_address?: string;
  shipping_address?: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_gst?: string;
  company_logo?: string;
  files?: ProofOfDeliveryFile[];
  authorized_status?: 1 | 2 | 3;
  authorized_level?: number;
  pending_approver_names?: string;
}
