import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const demandesAPI = {
  getAll: (params) => api.get(`/demandes${buildParams(params)}`),
  consulter: (params) => api.get(`/demandes/consult${buildParams(params)}`),
  getById: (id) => api.get(`/demandes/${id}`),
  create: (data) => api.post('/demandes', data),
  update: (id, data) => api.put(`/demandes/${id}`, data),
  delete: (id) => api.delete(`/demandes/${id}`),
};
