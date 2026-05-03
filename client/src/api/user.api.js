import api from './client';

export const userAPI = {
  /** GET /api/users/me — returns the logged-in user's profile */
  getMe: () => api.get('/users/me'),

  /** PUT /api/users/me — update name, email, and/or password */
  updateMe: (data) => api.put('/users/me', data),
};
