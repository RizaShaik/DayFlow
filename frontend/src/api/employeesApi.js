import { apiClient } from './client.js';

export const employeesApi = {
  list: (params, options) =>
    apiClient.get('/employees', { params, ...options }).then((r) => r.data.data.employees),
  getById: (id) => apiClient.get(`/employees/${id}`).then((r) => r.data.data.employee),
  create: (payload) => apiClient.post('/employees', payload).then((r) => r.data.data),
  update: (id, payload) =>
    apiClient.patch(`/employees/${id}`, payload).then((r) => r.data.data.employee),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient
      .post(`/employees/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },
};
