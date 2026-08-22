import { apiClient } from './client.js';

export const departmentsApi = {
  list: () => apiClient.get('/departments').then((r) => r.data.data.departments),
};
