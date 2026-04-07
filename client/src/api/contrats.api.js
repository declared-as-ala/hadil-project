import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const contratsAPI = {
  getAll: (params) => api.get(`/contrats${buildParams(params)}`),
  getById: (id) => api.get(`/contrats/${id}`),
  create: (data) => api.post('/contrats', data),
  update: (id, data) => api.put(`/contrats/${id}`, data),
  delete: (id) => api.delete(`/contrats/${id}`),
  renouveler: (id, notes) => api.post(`/contrats/${id}/renouveler`, { notes }),
};
