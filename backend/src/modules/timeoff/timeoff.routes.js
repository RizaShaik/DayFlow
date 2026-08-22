import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { uploadAttachment } from '../../middleware/upload.js';
import * as controller from './timeoff.controller.js';
import {
  createLeaveRequestSchema,
  decideRequestSchema,
  listRequestsQuerySchema,
  requestIdParamsSchema,
} from './timeoff.validation.js';

export const timeoffRouter = Router();

timeoffRouter.get('/balances', authenticate, controller.balances);
timeoffRouter.get('/requests/me', authenticate, controller.myRequests);
timeoffRouter.get(
  '/requests',
  authenticate,
  authorize('admin', 'hr'),
  validate(listRequestsQuerySchema, 'query'),
  controller.companyRequests
);
timeoffRouter.post(
  '/requests',
  authenticate,
  uploadAttachment.single('attachment'),
  validate(createLeaveRequestSchema),
  controller.createRequest
);
timeoffRouter.patch(
  '/requests/:id/decision',
  authenticate,
  authorize('admin', 'hr'),
  validate(requestIdParamsSchema, 'params'),
  validate(decideRequestSchema),
  controller.decideRequest
);
