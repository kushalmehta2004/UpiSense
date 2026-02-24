/**
 * API client for UpiSense backend
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'upisense_token';
const USER_KEY = 'upisense_user';

/** Get token from localStorage (remember me) or sessionStorage (session only). */
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/** Clear auth from both storages (e.g. on logout or 401). */
export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuthStorage();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  signup: (phone, name) => api.post('/auth/signup', { phone, name }),
  verify: (phone, otp, name, rememberMe) => api.post('/auth/verify', { phone, otp, name, rememberMe }),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify-token'),
  deleteAccount: () => api.delete('/auth/account'),
};

export const transactions = {
  list: (params) => api.get('/api/transactions', { params }),
  update: (id, data) => api.patch(`/api/transactions/${id}`, data),
  delete: (id) => api.delete(`/api/transactions/${id}`),
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
  create: (name) => api.post('/api/groups', { name }),
  update: (id, name) => api.patch(`/api/groups/${id}`, { name }),
  delete: (id) => api.delete(`/api/groups/${id}`),
  addMember: (groupId, phone) => api.post(`/api/groups/${groupId}/members`, { phone }),
  removeMember: (groupId, memberId) => api.delete(`/api/groups/${groupId}/members/${memberId}`),
};

export const debts = {
  owedToMe: () => api.get('/api/debts/owed-to-me'),
  iOwe: () => api.get('/api/debts/i-owe'),
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
