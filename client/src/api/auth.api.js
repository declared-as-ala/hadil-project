import api from './client';

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (data) => api.post('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
};
