import { API_BASE_URL } from '../utils/constants';
import api from './client';

const buildParams = (params) => {
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
};

const authHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const cvAiAPI = {
  uploadCv: async (file) => {
    const formData = new FormData();
    formData.append('cvFile', file);

    const response = await fetch(`${API_BASE_URL}/hr/cv-ai/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw { status: response.status, message: data.message || 'Upload failed' };
    return data;
  },
  analyze: (id, payload) => api.post(`/hr/cv-ai/analyze/${id}`, payload),
  chat: (id, question) => api.post(`/hr/cv-ai/chat/${id}`, { question }),
  getAll: (params = {}) => api.get(`/hr/cv-ai${buildParams(params)}`),
  getById: (id) => api.get(`/hr/cv-ai/${id}`),
  delete: (id) => api.delete(`/hr/cv-ai/${id}`),
  clearChat: (id) => api.delete(`/hr/cv-ai/${id}/chat`),
  updatePipeline: (id, payload) => api.patch(`/hr/cv-ai/${id}/pipeline`, payload),
  exportPdfUrl: (id) => `${API_BASE_URL}/hr/cv-ai/${id}/export-pdf`,
};
