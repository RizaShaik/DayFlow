import { apiClient } from './client.js';

export const attendanceApi = {
  checkIn: () => apiClient.post('/attendance/check-in').then((r) => r.data.data),
  checkOut: () => apiClient.post('/attendance/check-out').then((r) => r.data.data),
  todayStatus: () => apiClient.get('/attendance/today-status').then((r) => r.data.data),
  me: (params) => apiClient.get('/attendance/me', { params }).then((r) => r.data.data),
  company: (params) => apiClient.get('/attendance', { params }).then((r) => r.data.data),
};
