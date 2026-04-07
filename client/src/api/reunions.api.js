import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const reunionsAPI = {
  getAll: (params) => api.get(`/reunions${buildParams(params)}`),
  getById: (id) => api.get(`/reunions/${id}`),
  create: (data) => api.post('/reunions', data),
  update: (id, data) => api.put(`/reunions/${id}`, data),
  delete: (id) => api.delete(`/reunions/${id}`),
  assignToProject: (id, projetId) => api.put(`/reunions/${id}/assign-project`, { projetId }),
};
