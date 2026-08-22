import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { uploadLogo } from '../../middleware/upload.js';
import * as controller from './auth.controller.js';
import {
  changePasswordSchema,
  signinSchema,
  signupSchema,
  verifyEmailParamsSchema,
} from './auth.validation.js';

export const authRouter = Router();

const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many attempts, please try again later' } },
});

authRouter.post(
  '/signup',
  authAttemptLimiter,
  uploadLogo.single('logo'),
  validate(signupSchema),
  controller.signup
);
authRouter.get(
  '/verify-email/:token',
  validate(verifyEmailParamsSchema, 'params'),
  controller.verifyEmail
);
authRouter.post('/signin', authAttemptLimiter, validate(signinSchema), controller.signin);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);
authRouter.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  controller.changePassword
);
authRouter.get('/me', authenticate, controller.me);
