import { z } from 'zod';

export const listEmployeesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  departmentId: z.string().uuid().optional(),
});

export const employeeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().toLowerCase(),
  role: z.enum(['employee', 'hr']),
  phone: z.string().trim().max(30).optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  jobPosition: z.string().trim().max(120).optional(),
  workLocation: z.string().trim().max(120).optional(),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
});

// Fields any employee may change on their own profile.
const selfEditableFields = {
  phone: z.string().trim().max(30).optional(),
  residingAddress: z.string().trim().max(300).optional(),
};

// Additional fields only an admin/hr editor may change (on anyone's profile).
const adminOnlyFields = {
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  jobPosition: z.string().trim().max(120).optional(),
  workLocation: z.string().trim().max(120).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  maritalStatus: z.enum(['single', 'married', 'other']).optional(),
  nationality: z.string().trim().max(60).optional(),
  personalEmail: z.string().trim().email().optional(),
  accountNumber: z.string().trim().max(40).optional(),
  bankName: z.string().trim().max(120).optional(),
  ifscCode: z.string().trim().max(20).optional(),
  uanNo: z.string().trim().max(30).optional(),
  panNo: z.string().trim().max(20).optional(),
};

// Fields anyone with access (self or admin/hr) may change — About/Skills are
// part of the open Resume tab, not gated like private info.
const sharedFields = {
  about: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  certifications: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
};

export const updateEmployeeSchema = z
  .object({ ...selfEditableFields, ...adminOnlyFields, ...sharedFields })
  .strict();

export const selfUpdateAllowedKeys = new Set([
  ...Object.keys(selfEditableFields),
  ...Object.keys(sharedFields),
]);
