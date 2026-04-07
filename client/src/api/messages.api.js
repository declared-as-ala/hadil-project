import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const messagesAPI = {
  getAll: (params) => api.get(`/messages${buildParams(params)}`),
  receive: (destinataireId) => api.get(`/messages/receive/${destinataireId}`),
  getById: (id) => api.get(`/messages/${id}`),
  send: (data) => api.post('/messages', data),
  update: (id, data) => api.put(`/messages/${id}`, data),
  markAsRead: (id) => api.put(`/messages/${id}/read`, {}),
  delete: (id) => api.delete(`/messages/${id}`),
};
