import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { uploadAvatar } from '../../middleware/upload.js';
import * as controller from './employees.controller.js';
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from './employees.validation.js';

export const employeesRouter = Router();

employeesRouter.get('/', authenticate, validate(listEmployeesQuerySchema, 'query'), controller.list);
employeesRouter.post('/', authenticate, validate(createEmployeeSchema), controller.create);

employeesRouter.get(
  '/:id',
  authenticate,
  validate(employeeIdParamsSchema, 'params'),
  controller.getById
);
employeesRouter.patch(
  '/:id',
  authenticate,
  validate(employeeIdParamsSchema, 'params'),
  validate(updateEmployeeSchema),
  controller.update
);
employeesRouter.post(
  '/:id/avatar',
  authenticate,
  validate(employeeIdParamsSchema, 'params'),
  uploadAvatar.single('avatar'),
  controller.uploadAvatar
);
