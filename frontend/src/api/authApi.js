import { apiClient } from './client.js';

export const authApi = {
  signup: (payload) => apiClient.post('/auth/signup', payload).then((r) => r.data.data),
  verifyEmail: (token) =>
    apiClient.get(`/auth/verify-email/${token}`).then((r) => r.data.data),
  signin: (payload) => apiClient.post('/auth/signin', payload).then((r) => r.data.data),
  refresh: () => apiClient.post('/auth/refresh').then((r) => r.data.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data.data),
  changePassword: (payload) =>
    apiClient.post('/auth/change-password', payload).then((r) => r.data.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data.data),
};
