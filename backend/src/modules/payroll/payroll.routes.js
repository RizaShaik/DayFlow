import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './payroll.controller.js';
import { configureSalarySchema, employeeIdParamsSchema } from './payroll.validation.js';

export const payrollRouter = Router();

payrollRouter.put(
  '/:employeeId',
  authenticate,
  authorize('admin', 'hr'),
  validate(employeeIdParamsSchema, 'params'),
  validate(configureSalarySchema),
  controller.configureSalary
);
