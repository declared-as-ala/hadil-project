import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const documentsAdminAPI = {
  // Employee: get own requests
  getMesDemandes: () => api.get('/documents-admin/mes-demandes'),

  // Admin / RH: get all with optional filters
  getAll: (params) => api.get(`/documents-admin${buildParams(params)}`),

  // Employee: create a new request
  create: (data) => api.post('/documents-admin', data),

  // Admin / RH: update status + comment
  updateStatut: (id, data) => api.put(`/documents-admin/${id}/statut`, data),

  // Admin / RH: delete any request
  delete: (id) => api.delete(`/documents-admin/${id}`),

  // Employee: delete own request (only if en_attente)
  deleteMaDemande: (id) => api.delete(`/documents-admin/mes-demandes/${id}`),
};
