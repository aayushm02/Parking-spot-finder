import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Set up axios interceptors for auth
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const paymentService = {
  // Create payment intent
  createPaymentIntent: async (paymentData) => {
    const response = await axios.post(`${API_URL}/payments/create-payment-intent`, paymentData);
    return response.data;
  },

  // Process payment
  processPayment: async (paymentData) => {
    const response = await axios.post(`${API_URL}/payments/process-payment`, paymentData);
    return response.data;
  },

  // Get user payments
  getUserPayments: async (params = {}) => {
    const response = await axios.get(`${API_URL}/payments/user/payments`, { params });
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    const response = await axios.get(`${API_URL}/payments/history`, { params });
    return response.data;
  },

  // Get payment methods
  getPaymentMethods: async () => {
    const response = await axios.get(`${API_URL}/payments/methods`);
    return response.data;
  },

  // Add payment method
  addPaymentMethod: async (methodData) => {
    const response = await axios.post(`${API_URL}/payments/methods`, methodData);
    return response.data;
  },

  // Remove payment method
  removePaymentMethod: async (methodId) => {
    const response = await axios.delete(`${API_URL}/payments/methods/${methodId}`);
    return response.data;
  },

  // Download receipt
  downloadReceipt: async (paymentId) => {
    const response = await axios.get(`${API_URL}/payments/${paymentId}/receipt`, {
      responseType: 'blob'
    });
    return response;
  },

  // Get payment by booking ID
  getPaymentByBooking: async (bookingId) => {
    const response = await axios.get(`${API_URL}/payments/booking/${bookingId}`);
    return response.data;
  },

  // Get payment by ID
  getPaymentById: async (paymentId) => {
    const response = await axios.get(`${API_URL}/payments/${paymentId}`);
    return response.data;
  },

  // Request refund
  requestRefund: async (paymentId, refundData) => {
    const response = await axios.post(`${API_URL}/payments/${paymentId}/refund`, refundData);
    return response.data;
  },

  // Get refund status
  getRefundStatus: async (paymentId) => {
    const response = await axios.get(`${API_URL}/payments/${paymentId}/refund-status`);
    return response.data;
  }
};
