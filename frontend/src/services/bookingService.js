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

export const bookingService = {
  // Check availability
  checkAvailability: async (data) => {
    const response = await axios.get(`${API_URL}/bookings/availability`, {
      params: data
    });
    return response.data;
  },

  // Create new booking
  createBooking: async (bookingData) => {
    const response = await axios.post(`${API_URL}/bookings`, bookingData);
    return response.data;
  },

  // Get user's bookings
  getUserBookings: async (params = {}) => {
    const response = await axios.get(`${API_URL}/bookings`, { params });
    return response.data;
  },

  // Get owner's bookings
  getOwnerBookings: async (params = {}) => {
    const response = await axios.get(`${API_URL}/bookings/owner`, { params });
    return response.data;
  },

  // Get booking by ID
  getBookingById: async (id) => {
    const response = await axios.get(`${API_URL}/bookings/${id}`);
    return response.data;
  },

  // Update booking
  updateBooking: async (id, updateData) => {
    const response = await axios.put(`${API_URL}/bookings/${id}`, updateData);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (id, reason = '') => {
    const response = await axios.delete(`${API_URL}/bookings/${id}`, {
      data: { reason }
    });
    return response.data;
  },

  // Check in to booking
  checkIn: async (id) => {
    const response = await axios.post(`${API_URL}/bookings/${id}/check-in`);
    return response.data;
  },

  // Check out from booking
  checkOut: async (id) => {
    const response = await axios.post(`${API_URL}/bookings/${id}/check-out`);
    return response.data;
  },

  // Extend booking
  extendBooking: async (id, additionalHours) => {
    const response = await axios.post(`${API_URL}/bookings/${id}/extend`, {
      additionalHours
    });
    return response.data;
  },

  // Rate booking
  rateBooking: async (id, rating, comment = '') => {
    const response = await axios.post(`${API_URL}/bookings/${id}/rating`, {
      rating,
      comment
    });
    return response.data;
  },

  // Get spot bookings (for spot owners)
  getSpotBookings: async (spotId, params = {}) => {
    const response = await axios.get(`${API_URL}/bookings/spot/${spotId}`, { params });
    return response.data;
  },

  // Update booking status (for spot owners/admins)
  updateBookingStatus: async (id, status, reason = '') => {
    const response = await axios.put(`${API_URL}/bookings/${id}/status`, {
      status,
      reason
    });
    return response.data;
  }
};
