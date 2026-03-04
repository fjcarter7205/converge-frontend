import axios from 'axios';

// API base URL - uses proxy in development, environment variable in production
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userAPI = {
  createUser: (userData) => api.post('/users', userData),
  getUser: (userId) => api.get(`/users/${userId}`),
  getUserRSVPs: (userId) => api.get(`/users/${userId}/rsvps`),
  getUserSaved: (userId) => api.get(`/users/${userId}/saved`),
};

// Event API
export const eventAPI = {
  getAllEvents: () => api.get('/events'),
  createEvent: (eventData) => api.post('/events', eventData),
  rsvpEvent: (eventId, userId) => api.post(`/events/${eventId}/rsvp`, { userId }),
  unRsvpEvent: (eventId, userId) => api.delete(`/events/${eventId}/rsvp`, { data: { userId } }),
  saveEvent: (eventId, userId) => api.post(`/events/${eventId}/save`, { userId }),
  unsaveEvent: (eventId, userId) => api.delete(`/events/${eventId}/save`, { data: { userId } }),
};

// Analytics API
export const analyticsAPI = {
  trackPageView: (userId, page, duration) => 
    api.post('/analytics/pageview', { userId, page, duration }).catch(() => {}),
  
  trackFilter: (userId, filterType, filterValue) => 
    api.post('/analytics/filter', { userId, filterType, filterValue }).catch(() => {}),
  
  trackInteraction: (userId, eventId, action, page, metadata) => 
    api.post('/analytics/interaction', { userId, eventId, action, page, metadata }).catch(() => {}),
  
  getAnalytics: () => api.get('/analytics/summary'),
};

export default api;
