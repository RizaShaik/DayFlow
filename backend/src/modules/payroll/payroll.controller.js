import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as payrollService from './payroll.service.js';

export const configureSalary = asyncHandler(async (req, res) => {
  const salaryInfo = await payrollService.configureSalary(req.user, req.params.employeeId, req.body);
  sendSuccess(res, 200, { salaryInfo });
});
