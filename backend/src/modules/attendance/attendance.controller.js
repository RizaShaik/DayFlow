import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as attendanceService from './attendance.service.js';

export const checkIn = asyncHandler(async (req, res) => {
  const record = await attendanceService.checkIn(req.user);
  sendSuccess(res, 201, record);
});

export const checkOut = asyncHandler(async (req, res) => {
  const record = await attendanceService.checkOut(req.user);
  sendSuccess(res, 200, record);
});

export const todayStatus = asyncHandler(async (req, res) => {
  const record = await attendanceService.getTodayStatus(req.user);
  sendSuccess(res, 200, record);
});

export const myAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyAttendance(req.user, req.query);
  sendSuccess(res, 200, result);
});

export const companyAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getCompanyAttendance(req.user, req.query);
  sendSuccess(res, 200, result);
});
