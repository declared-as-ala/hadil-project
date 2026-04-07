import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const heuresSupAPI = {
  getAll: (params) => api.get(`/heures-supplementaires${buildParams(params)}`),
  getById: (id) => api.get(`/heures-supplementaires/${id}`),
  create: (data) => api.post('/heures-supplementaires', data),
  update: (id, data) => api.put(`/heures-supplementaires/${id}`, data),
  delete: (id) => api.delete(`/heures-supplementaires/${id}`),
};
