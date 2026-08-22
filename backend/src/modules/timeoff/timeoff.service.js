import { pool } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { todayLocalDate } from '../../utils/dateUtils.js';
import { emitToCompany } from '../../sockets/index.js';
import * as repo from './timeoff.repository.js';

async function requireEmployeeId(userId) {
  const employeeId = await repo.getEmployeeIdForUser(pool, userId);
  if (!employeeId) throw ApiError.notFound('No employee record found for this account');
  return employeeId;
}

function daysBetweenInclusive(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.round(ms / 86_400_000) + 1;
}

function toRequestRecord(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    leaveType: row.leave_type_name,
    startDate: row.start_date,
    endDate: row.end_date,
    days: Number(row.days),
    remarks: row.remarks,
    attachmentUrl: row.attachment_url,
    status: row.status,
    reviewComment: row.review_comment,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    employee: row.first_name
      ? { firstName: row.first_name, lastName: row.last_name, avatarUrl: row.avatar_url }
      : undefined,
  };
}

export async function listMyBalances(requester) {
  const employeeId = await requireEmployeeId(requester.sub);
  const year = new Date().getFullYear();
  const types = await repo.listLeaveTypes(pool, requester.companyId);

  const results = [];
  for (const t of types) {
    let balance = await repo.getBalance(pool, employeeId, t.id, year);
    if (!balance) {
      balance = await repo.createBalance(pool, employeeId, t.id, year, t.default_allocation_days);
    }
    results.push({
      leaveTypeId: t.id,
      name: t.name,
      requiresAttachment: t.requires_attachment,
      allocatedDays: Number(balance.allocated_days),
      usedDays: Number(balance.used_days),
      remainingDays: Number(balance.allocated_days) - Number(balance.used_days),
    });
  }
  return results;
}

export async function applyForLeave(requester, payload, attachmentUrl) {
  const employeeId = await requireEmployeeId(requester.sub);
  const leaveType = await repo.getLeaveType(pool, payload.leaveTypeId, requester.companyId);
  if (!leaveType) throw ApiError.badRequest('Invalid leave type');

  if (payload.endDate < payload.startDate) {
    throw ApiError.badRequest('End date must be on or after the start date');
  }
  if (leaveType.requires_attachment && !attachmentUrl) {
    throw ApiError.badRequest(`${leaveType.name} requires an attachment (e.g. a certificate)`);
  }

  const days = daysBetweenInclusive(payload.startDate, payload.endDate);
  const year = Number(payload.startDate.slice(0, 4));

  // Unpaid Leave has no allocation to check against — it's unlimited by
  // definition (default_allocation_days is 0, so a balance check here would
  // always reject it).
  if (leaveType.name !== 'Unpaid Leave') {
    let balance = await repo.getBalance(pool, employeeId, leaveType.id, year);
    if (!balance) {
      balance = await repo.createBalance(pool, employeeId, leaveType.id, year, leaveType.default_allocation_days);
    }
    const remaining = Number(balance.allocated_days) - Number(balance.used_days);
    if (days > remaining) {
      throw ApiError.badRequest(
        `Insufficient balance: only ${remaining} day(s) remaining for ${leaveType.name}`
      );
    }
  }

  const row = await repo.insertLeaveRequest(pool, {
    employeeId,
    leaveTypeId: leaveType.id,
    startDate: payload.startDate,
    endDate: payload.endDate,
    days,
    remarks: payload.remarks,
    attachmentUrl,
  });
  return toRequestRecord({ ...row, leave_type_name: leaveType.name });
}

export async function getMyRequests(requester) {
  const employeeId = await requireEmployeeId(requester.sub);
  const rows = await repo.listRequestsForEmployee(pool, employeeId);
  return rows.map(toRequestRecord);
}

export async function getCompanyRequests(requester, { status } = {}) {
  if (requester.role !== 'admin' && requester.role !== 'hr') {
    throw ApiError.forbidden('Only admins or HR can view all leave requests');
  }
  const rows = await repo.listRequestsForCompany(pool, requester.companyId, status);
  return rows.map(toRequestRecord);
}

export async function decideRequest(requester, requestId, decision) {
  if (requester.role !== 'admin' && requester.role !== 'hr') {
    throw ApiError.forbidden('Only admins or HR can approve or reject leave requests');
  }

  const existing = await repo.getRequestById(pool, requestId);
  if (!existing || existing.company_id !== requester.companyId) {
    throw ApiError.notFound('Leave request not found');
  }
  if (existing.status !== 'pending') {
    throw ApiError.conflict('This request has already been decided');
  }

  const row = await repo.decideRequest(pool, requestId, {
    status: decision.status,
    reviewedBy: requester.sub,
    reviewComment: decision.reviewComment,
  });

  if (decision.status === 'approved') {
    const year = Number(existing.start_date.slice(0, 4));
    if (existing.leave_type_name !== 'Unpaid Leave') {
      await repo.incrementUsedDays(pool, existing.employee_id, existing.leave_type_id, year, Number(existing.days));
    }
    await repo.markAttendanceLeave(pool, existing.employee_id, existing.start_date, existing.end_date);

    const today = todayLocalDate();
    if (today >= existing.start_date && today <= existing.end_date) {
      emitToCompany(requester.companyId, 'attendance:update', {
        employeeId: existing.employee_id,
        status: 'leave',
      });
    }
  }

  return toRequestRecord({ ...row, leave_type_name: existing.leave_type_name });
}
