import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const absencesAPI = {
  getAll: (params) => api.get(`/absences${buildParams(params)}`),
  getById: (id) => api.get(`/absences/${id}`),
  create: (data) => api.post('/absences', data),
  update: (id, data) => api.put(`/absences/${id}`, data),
  delete: (id) => api.delete(`/absences/${id}`),
};
