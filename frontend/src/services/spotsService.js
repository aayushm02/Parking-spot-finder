import api from './authService';

export const spotsService = {
  // Get all spots
  getAllSpots: async (params = {}) => {
    const response = await api.get('/spots', { params });
    return response.data;
  },

  // Search spots
  searchSpots: async (params = {}) => {
    const response = await api.get('/spots/search', { params });
    return response.data;
  },

  // Get nearby spots
  getNearbySpots: async (params = {}) => {
    const response = await api.get('/spots/nearby', { params });
    return response.data;
  },

  // Get spot by ID
  getSpotById: async (id) => {
    const response = await api.get(`/spots/${id}`);
    return response.data;
  },

  // Create spot
  createSpot: async (spotData) => {
    const response = await api.post('/spots', spotData);
    return response.data;
  },

  // Update spot
  updateSpot: async (id, spotData) => {
    const response = await api.put(`/spots/${id}`, spotData);
    return response.data;
  },

  // Delete spot
  deleteSpot: async (id) => {
    const response = await api.delete(`/spots/${id}`);
    return response.data;
  },

  // Get my spots
  getMySpots: async (params = {}) => {
    const response = await api.get('/spots/owner/my-spots', { params });
    return response.data;
  },

  // Get user's spots (alternative method name)
  getUserSpots: async (params = {}) => {
    const response = await api.get('/spots/owner/my-spots', { params });
    return response.data;
  },

  // Update availability
  updateAvailability: async (id, availabilityData) => {
    const response = await api.put(`/spots/${id}/availability`, availabilityData);
    return response.data;
  },

  // Add rating
  addRating: async (id, rating, comment) => {
    const response = await api.post(`/spots/${id}/rating`, { rating, comment });
    return response.data;
  },

  // Add to favorites
  addToFavorites: async (id) => {
    const response = await api.post(`/spots/${id}/favorite`);
    return response.data;
  },

  // Remove from favorites
  removeFromFavorites: async (id) => {
    const response = await api.delete(`/spots/${id}/favorite`);
    return response.data;
  },

  // Get favorites
  getFavorites: async () => {
    const response = await api.get('/spots/user/favorites');
    return response.data;
  },

  // Get favorite spots (alternative method name)
  getFavoriteSpots: async (params = {}) => {
    const response = await api.get('/spots/user/favorites', { params });
    return response.data;
  },

  // Report spot
  reportSpot: async (id, reason, description) => {
    const response = await api.post(`/spots/${id}/report`, { reason, description });
    return response.data;
  },

  // Get popular spots
  getPopularSpots: async (params = {}) => {
    const response = await api.get('/spots/popular', { params });
    return response.data;
  },

  // Toggle spot availability
  toggleAvailability: async (id) => {
    const response = await api.patch(`/spots/${id}/availability`);
    return response.data;
  },

  // Upload spot images
  uploadImages: async (id, images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.post(`/spots/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get spot reviews
  getSpotReviews: async (id, params = {}) => {
    const response = await api.get(`/spots/${id}/reviews`, { params });
    return response.data;
  },

  // Add review to spot
  addReview: async (id, reviewData) => {
    const response = await api.post(`/spots/${id}/reviews`, reviewData);
    return response.data;
  },

  // Get spot analytics (for spot owners)
  getSpotAnalytics: async (id, params = {}) => {
    const response = await api.get(`/spots/${id}/analytics`, { params });
    return response.data;
  },

  // Get spot availability for specific dates
  getSpotAvailability: async (id, startDate, endDate) => {
    const response = await api.get(`/spots/${id}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Toggle spot status
  toggleSpotStatus: async (id, isActive) => {
    const response = await api.put(`/spots/${id}/status`, { isActive });
    return response.data;
  },

  // Get owner analytics
  getOwnerAnalytics: async () => {
    const response = await api.get('/spots/owner/analytics');
    return response.data;
  },

  // Update spot availability
  updateSpotAvailability: async (id, availability) => {
    const response = await api.put(`/spots/${id}/availability`, { availability });
    return response.data;
  },
};
