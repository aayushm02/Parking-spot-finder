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

export const adminService = {
  // Dashboard
  getDashboard: async () => {
    const response = await axios.get(`${API_URL}/admin/dashboard`);
    return response.data;
  },

  // User Management
  getAllUsers: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/users`, { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await axios.get(`${API_URL}/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await axios.put(`${API_URL}/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await axios.delete(`${API_URL}/admin/users/${id}`);
    return response.data;
  },

  banUser: async (id, banData) => {
    const response = await axios.post(`${API_URL}/admin/users/${id}/ban`, banData);
    return response.data;
  },

  unbanUser: async (id) => {
    const response = await axios.post(`${API_URL}/admin/users/${id}/unban`);
    return response.data;
  },

  // Parking Spot Management
  getAllSpots: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/spots`, { params });
    return response.data;
  },

  getSpotById: async (id) => {
    const response = await axios.get(`${API_URL}/admin/spots/${id}`);
    return response.data;
  },

  updateSpot: async (id, spotData) => {
    const response = await axios.put(`${API_URL}/admin/spots/${id}`, spotData);
    return response.data;
  },

  deleteSpot: async (id) => {
    const response = await axios.delete(`${API_URL}/admin/spots/${id}`);
    return response.data;
  },

  approveSpot: async (id) => {
    const response = await axios.post(`${API_URL}/admin/spots/${id}/approve`);
    return response.data;
  },

  rejectSpot: async (id, rejectionData) => {
    const response = await axios.post(`${API_URL}/admin/spots/${id}/reject`, rejectionData);
    return response.data;
  },

  // Booking Management
  getAllBookings: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/bookings`, { params });
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await axios.get(`${API_URL}/admin/bookings/${id}`);
    return response.data;
  },

  updateBookingStatus: async (id, statusData) => {
    const response = await axios.put(`${API_URL}/admin/bookings/${id}/status`, statusData);
    return response.data;
  },

  // Payment Management
  getAllPayments: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/payments`, { params });
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await axios.get(`${API_URL}/admin/payments/${id}`);
    return response.data;
  },

  processRefund: async (id, refundData) => {
    const response = await axios.post(`${API_URL}/admin/payments/${id}/refund`, refundData);
    return response.data;
  },

  // System Settings
  getSettings: async () => {
    const response = await axios.get(`${API_URL}/admin/settings`);
    return response.data;
  },

  updateSettings: async (settingsData) => {
    const response = await axios.put(`${API_URL}/admin/settings`, settingsData);
    return response.data;
  },

  // Reports
  getSpotReports: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/reports/spots`, { params });
    return response.data;
  },

  getUserReports: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/reports/users`, { params });
    return response.data;
  },

  resolveReport: async (id, resolutionData) => {
    const response = await axios.post(`${API_URL}/admin/reports/${id}/resolve`, resolutionData);
    return response.data;
  },

  // System Logs
  getSystemLogs: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/logs/system`, { params });
    return response.data;
  },

  getErrorLogs: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/logs/errors`, { params });
    return response.data;
  }
};
