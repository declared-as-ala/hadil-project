import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const paieAPI = {
  getAll: (params) => api.get(`/paies${buildParams(params)}`),
  getMesPaies: (params) => api.get(`/paies/mes-paies${buildParams(params)}`),
  calculer: (params) => api.get(`/paies/calculer${buildParams(params)}`),
  getDocument: (params) => api.get(`/paies/document${buildParams(params)}`),
};

export const postesAPI = {
  getAll: () => api.get('/postes'),
  getById: (id) => api.get(`/postes/${id}`),
  create: (data) => api.post('/postes', data),
  update: (id, data) => api.put(`/postes/${id}`, data),
  delete: (id) => api.delete(`/postes/${id}`),
};

export const affectationsAPI = {
  getAll: () => api.get('/affectations'),
  getById: (id) => api.get(`/affectations/${id}`),
  getActuelle: (employeId) => api.get(`/affectations/employe/${employeId}`),
  create: (data) => api.post('/affectations', data),
  update: (id, data) => api.put(`/affectations/${id}`, data),
  delete: (id) => api.delete(`/affectations/${id}`),
  // Sync postes/affectations from existing employee poste strings
  syncFromEmployes: () => api.post('/affectations/sync', {}),
};
