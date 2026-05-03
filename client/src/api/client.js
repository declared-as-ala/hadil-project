import { API_BASE_URL } from '../utils/constants';

/**
 * Generic API client that handles auth headers, JSON parsing, and error extraction.
 */
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async request(method, path, body) {
    const options = {
      method,
      headers: this.getHeaders(),
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const url = `${this.baseURL}${path}`;
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'An unexpected error occurred',
        errors: data.errors || null,
      };
    }

    return data;
  }

  get(path) {
    return this.request('GET', path);
  }

  post(path, body) {
    return this.request('POST', path, body);
  }

  put(path, body) {
    return this.request('PUT', path, body);
  }

  delete(path) {
    return this.request('DELETE', path);
  }

  patch(path, body) {
    return this.request('PATCH', path, body);
  }
}

export default new ApiClient();
