import apiClient from '../config';

export interface Payment {
  id: string;
  schoolId: string;
  studentId: string;
  parentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  gateway: 'stripe' | 'paypal' | 'razorpay';
  transactionId?: string;
  invoiceId: string;
  dueDate: string;
  paidAt?: string;
}

export interface CreatePaymentData {
  schoolId: string;
  studentId: string;
  parentId: string;
  amount: number;
  currency?: string;
  invoiceId: string;
  dueDate: string;
  gateway: Payment['gateway'];
}

export const paymentService = {
  async createPayment(data: CreatePaymentData): Promise<Payment> {
    const response = await apiClient.post('/payments', data);
    return response.data.data;
  },

  async processPayment(paymentId: string): Promise<Payment> {
    const response = await apiClient.post(`/payments/${paymentId}/process`);
    return response.data.data;
  },

  async getPayments(params?: {
    parentId?: string;
    studentId?: string;
  }): Promise<Payment[]> {
    const response = await apiClient.get('/payments', { params });
    return response.data.data;
  },
};
