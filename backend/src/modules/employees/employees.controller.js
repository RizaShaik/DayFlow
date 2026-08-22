import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as employeesService from './employees.service.js';

export const list = asyncHandler(async (req, res) => {
  const employees = await employeesService.list(req.user.companyId, req.query);
  sendSuccess(res, 200, { employees });
});

export const getById = asyncHandler(async (req, res) => {
  const employee = await employeesService.getDetail(req.params.id, req.user);
  sendSuccess(res, 200, { employee });
});

export const create = asyncHandler(async (req, res) => {
  const result = await employeesService.createEmployee(req.user, req.body);
  sendSuccess(res, 201, result);
});

export const update = asyncHandler(async (req, res) => {
  const employee = await employeesService.updateEmployee(req.params.id, req.user, req.body);
  sendSuccess(res, 200, { employee });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const result = await employeesService.uploadAvatar(req.params.id, req.user, avatarUrl);
  sendSuccess(res, 200, result);
});
