import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './departments.controller.js';

export const departmentsRouter = Router();

departmentsRouter.get('/', authenticate, controller.list);

// TODO (Phase 4): POST /, PATCH /:id — admin-only department management.
