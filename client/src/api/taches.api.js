import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const tachesAPI = {
  getAll: (params) => api.get(`/taches${buildParams(params)}`),
  getById: (id) => api.get(`/taches/${id}`),
  create: (data) => api.post('/taches', data),
  update: (id, data) => api.put(`/taches/${id}`, data),
  delete: (id) => api.delete(`/taches/${id}`),
  assignToProject: (id, projetId) => api.put(`/taches/${id}/assign-project`, { projetId }),
};
