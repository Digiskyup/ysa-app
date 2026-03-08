import { Payment, PaymentStatus, PaymentMode, ApiResponse } from '../types';
import apiClient from './api/client';

/**
 * Payment Service
 */
export const PaymentService = {
  /**
   * Get payments list
   */
  async getPayments(params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    status?: PaymentStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Payment[]; total: number }> {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/payments', { params });
    return {
      data: response.data.data || [],
      total: response.data.meta?.total || 0,
    };
  },

  /**
   * Create new payment (staff only)
   */
  async createPayment(data: {
    studentId: string;
    amount: number;
    paymentDate: string;
    paymentMode: PaymentMode;
    notes?: string;
  }): Promise<Payment> {
    const response = await apiClient.post<ApiResponse<Payment>>('/payments', data);
    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to create payment');
    }
    return response.data.data;
  },

  /**
   * Approve/Reject payment (super-admin only)
   */
  async approvePayment(
    id: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<Payment> {
    // If approved=true, call approval endpoint. If false, rejection logic?
    // Postman: PUT /v1/payments/:id/approval { "approved": true }
    // If rejected, maybe sending approved=false? and reason.
    const response = await apiClient.put<ApiResponse<Payment>>(`/payments/${id}/approval`, { approved, rejectionReason });
    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to process payment approval');
    }
    return response.data.data;
  },

  /**
   * Download payment receipt (returns URI)
   */
  async downloadReceipt(paymentId: string): Promise<string> {
    // Check if we can get the receipt URL directly
    // Ideally, getPayment(id) returns { receiptUrl: ... }
    const response = await apiClient.get<ApiResponse<Payment>>(`/payments/${paymentId}`);
    if (response.data.data?.receiptUrl) {
      return response.data.data.receiptUrl;
    }
    // Fallback: If no URL, return empty or throw? 
    // The previous mock returned a file URI. 
    // We'll return a placeholder or empty string if not found.
    return '';
  },

  /**
   * Send payment reminders (bulk)
   */
  async sendReminders(paymentIds: string[]): Promise<void> {
    await apiClient.post('/payments/reminders', { paymentIds });
  },
};

export default PaymentService;
