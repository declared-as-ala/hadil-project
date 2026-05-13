import api from './client';

const buildParams = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
};

export const congesAPI = {
  /** Admin/RH: Utilisée par : Page congés quand connecté en tant qu'Admin/RH */
  getAll: (params) => api.get(`/conges${buildParams(params)}`),

  /** Employee Utilisée par : Page congés quand connecté en tant qu'Employé */
  getMy: () => api.get('/conges/my'),

  /** Admin/RH: Utilisée par : Dashboard congés (Admin/RH) */
  getStats: () => api.get('/conges/stats'),

  /** Admin/RH: Utilisée par : Quand on clique "View Details" sur une demande. */
  getById: (id) => api.get(`/conges/${id}`),

  /** Employee: Crée une nouvelle demande de congé. */
  create: (data) => api.post('/conges', data),

  /** Employee: Modifie mon propre congé (avant approbation).*/
  updateMy: (id, data) => api.put(`/conges/my/${id}`, data),

  /** Admin/RH:  crée un congé pour un employé. */
  createAdmin: (data) => api.post('/conges/admin', data),

  /** Admin/RH: approve or reject */
  updateStatus: (id, status) => api.patch(`/conges/${id}/status`, { status }),

  /** Admin/RH: Modification complète d'un congé par Admin/RH */
  update: (id, data) => api.put(`/conges/${id}`, data),

  /** Admin only:  Supprime complètement une demande.*/
  delete: (id) => api.delete(`/conges/${id}`),

  /** Admin/RH: Prolonge un congé existant (ajoute des jours). */
  prolonger: (id, joursSupplementaires) =>
    api.post(`/conges/${id}/prolonger`, { joursSupplementaires }),
};
