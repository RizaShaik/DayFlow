import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateLoginId } from '../../utils/idGenerator.js';
import { generateTempPassword } from '../../utils/passwordGenerator.js';
import { sendMail } from '../../utils/mailer.js';
import * as repo from './employees.repository.js';
import { selfUpdateAllowedKeys } from './employees.validation.js';

const BCRYPT_ROUNDS = 10;
const BANK_FIELD_KEYS = ['accountNumber', 'bankName', 'ifscCode', 'uanNo', 'panNo'];

function toCard(row) {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    jobPosition: row.job_position,
    departmentName: row.department_name,
    status: row.status,
  };
}

export async function list(companyId, filters) {
  const rows = await repo.listEmployees(pool, companyId, filters);
  return rows.map(toCard);
}

/**
 * Profile/Resume are visible to any coworker in the company (open directory).
 * Private Info, Bank Details, and Salary Info are financial/personal data —
 * gated to the employee themselves or an admin/hr viewer, even though the
 * wireframe only explicitly calls out Salary Info. Enforced here (not just
 * hidden client-side) so it's a real access boundary.
 */
export async function getDetail(employeeId, requester) {
  const row = await repo.getEmployeeDetail(pool, employeeId, requester.companyId);
  if (!row) throw ApiError.notFound('Employee not found');

  const isSelf = row.user_id === requester.sub;
  const isPrivileged = requester.role === 'admin' || requester.role === 'hr';
  const canViewSensitive = isSelf || isPrivileged;

  const detail = {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    jobPosition: row.job_position,
    workLocation: row.work_location,
    dateOfJoining: row.date_of_joining,
    email: row.email,
    loginId: row.login_id,
    role: row.role,
    department: row.department_id_full
      ? { id: row.department_id_full, name: row.department_name }
      : null,
    manager: row.manager_id_full
      ? { id: row.manager_id_full, firstName: row.manager_first_name, lastName: row.manager_last_name }
      : null,
    about: row.about,
    skills: row.skills,
    certifications: row.certifications,
    isSelf,
    privateInfo: null,
    bankDetails: null,
    salaryInfo: null,
  };

  if (canViewSensitive) {
    detail.privateInfo = {
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      maritalStatus: row.marital_status,
      nationality: row.nationality,
      personalEmail: row.personal_email,
      residingAddress: row.residing_address,
    };

    const bank = await repo.getBankDetails(pool, employeeId);
    detail.bankDetails = bank
      ? {
          accountNumber: bank.account_number,
          bankName: bank.bank_name,
          ifscCode: bank.ifsc_code,
          uanNo: bank.uan_no,
          panNo: bank.pan_no,
        }
      : null;

    const salary = await repo.getSalaryInfo(pool, employeeId);
    detail.salaryInfo = salary
      ? {
          monthlyWage: salary.structure.monthly_wage,
          workingDaysPerWeek: salary.structure.working_days_per_week,
          breakTimeHours: salary.structure.break_time_hours,
          components: salary.components.map((c) => ({
            type: c.component_type,
            computationType: c.computation_type,
            value: c.value,
            amount: c.computed_amount,
          })),
        }
      : null;
  }

  return detail;
}

function isPrivilegedRole(role) {
  return role === 'admin' || role === 'hr';
}

/**
 * Admin/HR create an employee: login ID and a temp password are generated
 * server-side (never chosen by the creator), the account is pre-verified
 * (an admin vouching for the address is enough — no email round-trip like
 * self-signup requires), and the temp password is emailed (or dev-logged).
 */
export async function createEmployee(requester, payload) {
  if (!isPrivilegedRole(requester.role)) {
    throw ApiError.forbidden('Only admins or HR can add employees');
  }

  return withTransaction(async (client) => {
    const existingUser = await repo.findUserByEmailGlobal(client, payload.email);
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const dateOfJoining = payload.dateOfJoining || new Date().toISOString().slice(0, 10);
    const joinYear = Number(dateOfJoining.slice(0, 4));
    const loginId = await generateLoginId(client, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      joinYear,
    });

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const user = await repo.insertUserForEmployee(client, {
      companyId: requester.companyId,
      loginId,
      email: payload.email,
      passwordHash,
      role: payload.role,
    });

    const employeeCode = await repo.nextEmployeeCode(client, requester.companyId);
    const employee = await repo.insertEmployeeRecord(client, {
      userId: user.id,
      companyId: requester.companyId,
      employeeCode,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      departmentId: payload.departmentId,
      managerId: payload.managerId,
      jobPosition: payload.jobPosition,
      workLocation: payload.workLocation,
      dateOfJoining,
    });

    await sendMail({
      to: payload.email,
      subject: 'Your Dayflow account is ready',
      text: `Welcome to Dayflow!\n\nYour Login ID: ${loginId}\nTemporary password: ${tempPassword}\n\nYou'll be asked to set a new password the first time you sign in.`,
    });

    return { id: employee.id, employeeCode: employee.employee_code, loginId };
  });
}

/**
 * Self editors are restricted to selfUpdateAllowedKeys (phone/address/
 * about/skills/certifications) — anything else in the payload is rejected
 * outright rather than silently dropped, so a confused/malicious request
 * gets a clear 403 instead of a partially-applied edit.
 */
export async function updateEmployee(employeeId, requester, payload) {
  const row = await repo.getEmployeeDetail(pool, employeeId, requester.companyId);
  if (!row) throw ApiError.notFound('Employee not found');

  const isSelf = row.user_id === requester.sub;
  const isPrivileged = isPrivilegedRole(requester.role);
  if (!isSelf && !isPrivileged) {
    throw ApiError.forbidden('You can only edit your own profile');
  }

  if (!isPrivileged) {
    const disallowed = Object.keys(payload).filter((key) => !selfUpdateAllowedKeys.has(key));
    if (disallowed.length > 0) {
      throw ApiError.forbidden(`You cannot edit: ${disallowed.join(', ')}`);
    }
  }

  const employeeFields = {};
  const bankFields = {};
  for (const [key, value] of Object.entries(payload)) {
    if (BANK_FIELD_KEYS.includes(key)) {
      bankFields[key] = value;
    } else {
      employeeFields[key] = value;
    }
  }

  await withTransaction(async (client) => {
    if (Object.keys(employeeFields).length > 0) {
      await repo.updateEmployeeFields(client, employeeId, employeeFields);
    }
    if (Object.keys(bankFields).length > 0) {
      await repo.upsertBankDetails(client, employeeId, bankFields);
    }
  });

  return getDetail(employeeId, requester);
}

export async function uploadAvatar(employeeId, requester, avatarUrl) {
  const row = await repo.getEmployeeDetail(pool, employeeId, requester.companyId);
  if (!row) throw ApiError.notFound('Employee not found');

  const isSelf = row.user_id === requester.sub;
  const isPrivileged = isPrivilegedRole(requester.role);
  if (!isSelf && !isPrivileged) {
    throw ApiError.forbidden('You can only change your own avatar');
  }

  await repo.updateAvatarUrl(pool, employeeId, avatarUrl);
  return { avatarUrl };
}
