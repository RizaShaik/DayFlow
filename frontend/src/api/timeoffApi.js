import { apiClient } from './client.js';

export const timeoffApi = {
  balances: () => apiClient.get('/timeoff/balances').then((r) => r.data.data.balances),
  myRequests: () => apiClient.get('/timeoff/requests/me').then((r) => r.data.data.requests),
  companyRequests: (params) =>
    apiClient.get('/timeoff/requests', { params }).then((r) => r.data.data.requests),
  createRequest: (formData) =>
    apiClient
      .post('/timeoff/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data.request),
  decide: (id, payload) =>
    apiClient.patch(`/timeoff/requests/${id}/decision`, payload).then((r) => r.data.data.request),
};
