import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as timeoffService from './timeoff.service.js';

export const balances = asyncHandler(async (req, res) => {
  const data = await timeoffService.listMyBalances(req.user);
  sendSuccess(res, 200, { balances: data });
});

export const myRequests = asyncHandler(async (req, res) => {
  const data = await timeoffService.getMyRequests(req.user);
  sendSuccess(res, 200, { requests: data });
});

export const companyRequests = asyncHandler(async (req, res) => {
  const data = await timeoffService.getCompanyRequests(req.user, req.query);
  sendSuccess(res, 200, { requests: data });
});

export const createRequest = asyncHandler(async (req, res) => {
  const attachmentUrl = req.file ? `/uploads/attachments/${req.file.filename}` : undefined;
  const data = await timeoffService.applyForLeave(req.user, req.body, attachmentUrl);
  sendSuccess(res, 201, { request: data });
});

export const decideRequest = asyncHandler(async (req, res) => {
  const data = await timeoffService.decideRequest(req.user, req.params.id, req.body);
  sendSuccess(res, 200, { request: data });
});
