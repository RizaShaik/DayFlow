import { pool } from '../../config/database.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { listDepartments } from './departments.repository.js';

export const list = asyncHandler(async (req, res) => {
  const departments = await listDepartments(pool, req.user.companyId);
  sendSuccess(res, 200, { departments });
});
