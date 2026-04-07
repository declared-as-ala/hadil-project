import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const congesAPI = {
  getAll: (params) => api.get(`/conges${buildParams(params)}`),
  getById: (id) => api.get(`/conges/${id}`),
  create: (data) => api.post('/conges', data),
  update: (id, data) => api.put(`/conges/${id}`, data),
  delete: (id) => api.delete(`/conges/${id}`),
  prolonger: (id, joursSupplementaires) =>
    api.post(`/conges/${id}/prolonger`, { joursSupplementaires }),
};
