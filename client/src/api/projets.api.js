import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const projetsAPI = {
  getAll: (params) => api.get(`/projets${buildParams(params)}`),
  getById: (id) => api.get(`/projets/${id}`),
  create: (data) => api.post('/projets', data),
  update: (id, data) => api.put(`/projets/${id}`, data),
  delete: (id) => api.delete(`/projets/${id}`),
  assignMember: (id, employeId) => api.post(`/projets/${id}/members`, { employeId }),
  removeMember: (id, employeId) => api.delete(`/projets/${id}/members`, { employeId }),
};
