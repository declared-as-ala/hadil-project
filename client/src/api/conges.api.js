import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const congesAPI = {
  /** Admin/RH: get all requests with optional filters */
  getAll: (params) => api.get(`/conges${buildParams(params)}`),

  /** Employee: get only their own requests */
  getMy: () => api.get('/conges/my'),

  /** Admin/RH: get stats */
  getStats: () => api.get('/conges/stats'),

  /** Admin/RH: get single request */
  getById: (id) => api.get(`/conges/${id}`),

  /** Employee: submit their own leave request */
  create: (data) => api.post('/conges', data),

  /** Employee: update their own leave request */
  updateMy: (id, data) => api.put(`/conges/my/${id}`, data),

  /** Admin/RH: create for a specific employee */
  createAdmin: (data) => api.post('/conges/admin', data),

  /** Admin/RH: approve or reject */
  updateStatus: (id, status) => api.patch(`/conges/${id}/status`, { status }),

  /** Admin/RH: full update */
  update: (id, data) => api.put(`/conges/${id}`, data),

  /** Admin only: delete */
  delete: (id) => api.delete(`/conges/${id}`),

  /** Admin/RH: extend leave */
  prolonger: (id, joursSupplementaires) =>
    api.post(`/conges/${id}/prolonger`, { joursSupplementaires }),
};
