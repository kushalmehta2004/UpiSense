/**
 * API client for UpiSense backend
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('upisense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('upisense_token');
      localStorage.removeItem('upisense_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  signup: (phone, name) => api.post('/auth/signup', { phone, name }),
  verify: (phone, otp) => api.post('/auth/verify', { phone, otp }),
  profile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify-token'),
};

export const transactions = {
  list: (params) => api.get('/api/transactions', { params }),
  summary: (params) => api.get('/api/transactions/summary', { params }),
  dailyTrend: (params) => api.get('/api/transactions/daily-trend', { params }),
};

export const categories = {
  list: () => api.get('/api/categories'),
};

export const groups = {
  list: () => api.get('/api/groups'),
  get: (id) => api.get(`/api/groups/${id}`),
  summary: () => api.get('/api/groups/summary'),
};

export const budgets = {
  list: () => api.get('/api/budgets'),
};

export const family = {
  summary: () => api.get('/api/family/summary'),
};

export const report = {
  get: (params) => api.get('/api/report', { params }),
};

export default api;
