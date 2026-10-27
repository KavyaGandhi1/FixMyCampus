import axios from 'axios';

let apiBaseUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api').trim();
if (apiBaseUrl.endsWith('/') && apiBaseUrl.length > 1) {
  apiBaseUrl = apiBaseUrl.slice(0, -1);
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fmc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired token if 401 is received on authenticated routes
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('fmc_token');
        localStorage.removeItem('fmc_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
