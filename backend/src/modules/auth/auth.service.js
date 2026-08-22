import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateLoginId } from '../../utils/idGenerator.js';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/tokens.js';
import { sendMail } from '../../utils/mailer.js';
import * as repo from './auth.repository.js';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  return { firstName, lastName };
}

function toPublicUser(user, employee) {
  return {
    id: user.id,
    loginId: user.login_id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.must_change_password,
    emailVerified: user.email_verified,
    employee: employee
      ? {
          id: employee.id,
          firstName: employee.first_name,
          lastName: employee.last_name,
          employeeCode: employee.employee_code,
          jobPosition: employee.job_position,
          avatarUrl: employee.avatar_url,
          departmentName: employee.department_name || null,
        }
      : null,
  };
}

async function issueSession(client, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const tokenHash = hashOpaqueToken(refreshToken);
  await repo.insertRefreshToken(client, {
    userId: user.id,
    tokenHash,
    expiresAt: refreshExpiryDate(),
  });
  return { accessToken, refreshToken };
}

export async function signup({ companyName, name, email, password }) {
  return withTransaction(async (client) => {
    const existing = await repo.findUserByIdentifier(client, email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const company = await repo.insertCompany(client, companyName);
    await repo.insertDefaultLeaveTypes(client, company.id);

    const { firstName, lastName } = splitName(name);
    const joinYear = new Date().getFullYear();
    const loginId = await generateLoginId(client, { firstName, lastName, joinYear });
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { raw: verificationToken, hash: verificationTokenHash } = generateOpaqueToken();

    const user = await repo.insertUser(client, {
      companyId: company.id,
      loginId,
      email,
      passwordHash,
      role: 'admin',
      mustChangePassword: false,
      emailVerified: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    await repo.insertEmployee(client, {
      userId: user.id,
      companyId: company.id,
      employeeCode: 'EMP0001',
      firstName,
      lastName,
      jobPosition: 'Administrator',
      dateOfJoining: new Date().toISOString().slice(0, 10),
    });

    const verifyUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    await sendMail({
      to: email,
      subject: 'Verify your Dayflow account',
      text: `Welcome to Dayflow! Verify your email: ${verifyUrl}\n\nYour login ID is ${loginId} — keep it, you'll use it to sign in.`,
    });

    return { loginId };
  });
}

export async function verifyEmail(rawToken) {
  const client = await pool.connect();
  try {
    const tokenHash = hashOpaqueToken(rawToken);
    const user = await repo.findUserByVerificationToken(client, tokenHash);
    if (!user) {
      throw ApiError.badRequest('Verification link is invalid or has expired');
    }

    await repo.markEmailVerified(client, user.id);
    const employee = await repo.getEmployeeByUserId(client, user.id);
    const session = await issueSession(client, user);

    return { ...session, user: toPublicUser({ ...user, email_verified: true }, employee) };
  } finally {
    client.release();
  }
}

export async function signin({ identifier, password }) {
  const client = await pool.connect();
  try {
    const user = await repo.findUserByIdentifier(client, identifier);
    if (!user) {
      throw ApiError.unauthorized('Invalid login ID/email or password');
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      throw ApiError.unauthorized('Invalid login ID/email or password');
    }

    if (!user.email_verified) {
      throw ApiError.forbidden('Please verify your email before signing in');
    }

    const employee = await repo.getEmployeeByUserId(client, user.id);
    const session = await issueSession(client, user);

    return { ...session, user: toPublicUser(user, employee) };
  } finally {
    client.release();
  }
}

export async function refresh(rawRefreshToken) {
  if (!rawRefreshToken) throw ApiError.unauthorized('Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const client = await pool.connect();
  try {
    const tokenHash = hashOpaqueToken(rawRefreshToken);
    const stored = await repo.findActiveRefreshToken(client, tokenHash);
    if (!stored) {
      throw ApiError.unauthorized('Refresh token has been revoked or expired');
    }

    const user = await repo.findUserById(client, payload.sub);
    if (!user) throw ApiError.unauthorized('Account no longer exists');

    await repo.revokeRefreshToken(client, tokenHash);
    const session = await issueSession(client, user);
    return session;
  } finally {
    client.release();
  }
}

export async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = hashOpaqueToken(rawRefreshToken);
  await repo.revokeRefreshToken(pool, tokenHash);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const client = await pool.connect();
  try {
    const user = await repo.findUserById(client, userId);
    if (!user) throw ApiError.notFound('User not found');

    const passwordOk = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordOk) throw ApiError.badRequest('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await repo.updatePasswordHash(client, userId, newHash);
  } finally {
    client.release();
  }
}

export async function getCurrentUser(userId) {
  const client = await pool.connect();
  try {
    const user = await repo.findUserById(client, userId);
    if (!user) throw ApiError.notFound('User not found');
    const employee = await repo.getEmployeeByUserId(client, user.id);
    return toPublicUser(user, employee);
  } finally {
    client.release();
  }
}
