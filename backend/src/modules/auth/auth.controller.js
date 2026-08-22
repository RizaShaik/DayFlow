import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { isProduction } from '../../config/env.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE_NAME = 'dayflow_refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    // Frontend and backend deploy to separate onrender.com subdomains,
    // which browsers treat as different sites (onrender.com is on the
    // public suffix list) — cross-site cookies require SameSite=None,
    // which in turn requires Secure. Locally (http, same-site ports)
    // Lax still works and doesn't need Secure.
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

export const signup = asyncHandler(async (req, res) => {
  const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;
  const result = await authService.signup(req.body, logoUrl);
  sendSuccess(res, 201, {
    message: 'Account created. Check your email to verify and activate your account.',
    loginId: result.loginId,
    verificationUrl: result.verificationUrl,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.verifyEmail(req.params.token);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { accessToken, user });
});

export const signin = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.signin(req.body);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { accessToken, user });
});

export const refresh = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const { accessToken, refreshToken } = await authService.refresh(rawToken);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout(rawToken);
  clearRefreshCookie(res);
  sendSuccess(res, 200, { message: 'Logged out' });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.sub, req.body);
  sendSuccess(res, 200, { message: 'Password updated' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.sub);
  sendSuccess(res, 200, { user });
});
