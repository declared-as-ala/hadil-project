import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const employesAPI = {
  getAll: (params) => api.get(`/employes${buildParams(params)}`),
  getById: (id) => api.get(`/employes/${id}`),
  create: (data) => api.post('/employes', data),
  update: (id, data) => api.put(`/employes/${id}`, data),
  delete: (id) => api.delete(`/employes/${id}`),
};
