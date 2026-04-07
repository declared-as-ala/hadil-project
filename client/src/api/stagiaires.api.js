import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const stagiairesAPI = {
  getAll: (params) => api.get(`/stagiaires${buildParams(params)}`),
  getById: (id) => api.get(`/stagiaires/${id}`),
  create: (data) => api.post('/stagiaires', data),
  update: (id, data) => api.put(`/stagiaires/${id}`, data),
  delete: (id) => api.delete(`/stagiaires/${id}`),
  assignEncadrant: (stagiaireId, encadrantId) =>
    api.post(`/stagiaires/${stagiaireId}/encadrant`, { encadrantId }),
  demanderAssistance: (stagiaireId, message) =>
    api.post(`/stagiaires/${stagiaireId}/assistance`, { message }),
  gererSujet: (stagiaireId, sujet) =>
    api.put(`/stagiaires/${stagiaireId}/sujet`, { sujet }),
};
