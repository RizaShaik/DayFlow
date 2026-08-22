import { apiClient } from './client.js';

export const payrollApi = {
  configure: (employeeId, payload) =>
    apiClient.put(`/payroll/${employeeId}`, payload).then((r) => r.data.data.salaryInfo),
};
