import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './attendance.controller.js';
import { companyAttendanceQuerySchema, myAttendanceQuerySchema } from './attendance.validation.js';

export const attendanceRouter = Router();

attendanceRouter.post('/check-in', authenticate, controller.checkIn);
attendanceRouter.post('/check-out', authenticate, controller.checkOut);
attendanceRouter.get('/today-status', authenticate, controller.todayStatus);
attendanceRouter.get(
  '/me',
  authenticate,
  validate(myAttendanceQuerySchema, 'query'),
  controller.myAttendance
);
attendanceRouter.get(
  '/',
  authenticate,
  authorize('admin', 'hr'),
  validate(companyAttendanceQuerySchema, 'query'),
  controller.companyAttendance
);
