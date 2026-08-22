import { pool } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { todayLocalDate } from '../../utils/dateUtils.js';
import { emitToCompany } from '../../sockets/index.js';
import * as repo from './attendance.repository.js';

// Matches the wireframe's own example (10:00–19:00 = 9h worked, 1h "extra"
// on an implied 8h standard day).
const STANDARD_WORK_HOURS = 8;

function computeWorkHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.round((ms / 3_600_000) * 100) / 100;
}

function toRecord(row, workDate) {
  const workHours = computeWorkHours(row.check_in, row.check_out);
  return {
    date: workDate,
    checkIn: row.check_in ?? null,
    checkOut: row.check_out ?? null,
    status: row.status || 'absent',
    workHours,
    extraHours:
      workHours !== null
        ? Math.max(0, Math.round((workHours - STANDARD_WORK_HOURS) * 100) / 100)
        : null,
  };
}

function lastDayOfMonth(year, month) {
  // Local-time Date(year, month, 0) lands on the last day of `month`
  // (1-indexed) — deliberately not using toISOString() anywhere here, since
  // that converts to UTC and can shift the date in timezones ahead of UTC.
  return new Date(year, month, 0).getDate();
}

async function requireEmployeeId(userId) {
  const employeeId = await repo.getEmployeeIdForUser(pool, userId);
  if (!employeeId) throw ApiError.notFound('No employee record found for this account');
  return employeeId;
}

export async function checkIn(requester) {
  const employeeId = await requireEmployeeId(requester.sub);
  const today = todayLocalDate();

  const existing = await repo.getRecordForDate(pool, employeeId, today);
  if (existing?.check_in) throw ApiError.conflict('Already checked in today');

  const row = await repo.checkIn(pool, employeeId, today);
  emitToCompany(requester.companyId, 'attendance:update', {
    employeeId,
    status: row.status,
  });
  return toRecord(row, today);
}

export async function checkOut(requester) {
  const employeeId = await requireEmployeeId(requester.sub);
  const today = todayLocalDate();

  const existing = await repo.getRecordForDate(pool, employeeId, today);
  if (!existing?.check_in) throw ApiError.badRequest('You need to check in before checking out');
  if (existing.check_out) throw ApiError.conflict('Already checked out today');

  const row = await repo.checkOut(pool, employeeId, today);
  return toRecord(row, today);
}

export async function getTodayStatus(requester) {
  const employeeId = await requireEmployeeId(requester.sub);
  const today = todayLocalDate();
  const existing = await repo.getRecordForDate(pool, employeeId, today);
  return existing ? toRecord(existing, today) : toRecord({}, today);
}

export async function getMyAttendance(requester, { year, month } = {}) {
  const employeeId = await requireEmployeeId(requester.sub);
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || now.getMonth() + 1;
  const lastDay = lastDayOfMonth(y, m);
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Don't fabricate "absent" rows for days that haven't happened yet.
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  const daysToShow = isCurrentMonth ? Math.min(lastDay, now.getDate()) : lastDay;

  const rows = await repo.listForEmployeeRange(pool, employeeId, startDate, endDate);
  const byDate = new Map(rows.map((r) => [r.work_date, r]));

  const records = [];
  for (let day = 1; day <= daysToShow; day++) {
    const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const row = byDate.get(date);
    records.push(row ? toRecord(row, date) : toRecord({}, date));
  }

  return {
    year: y,
    month: m,
    records,
    summary: {
      daysPresent: records.filter((r) => r.status === 'present').length,
      daysOnLeave: records.filter((r) => r.status === 'leave').length,
      totalWorkingDays: records.length,
    },
  };
}

export async function getCompanyAttendance(requester, { date } = {}) {
  if (requester.role !== 'admin' && requester.role !== 'hr') {
    throw ApiError.forbidden('Only admins or HR can view company-wide attendance');
  }

  const workDate = date || todayLocalDate();
  const rows = await repo.listForCompanyDate(pool, requester.companyId, workDate);

  return {
    date: workDate,
    employees: rows.map((row) => ({
      employeeId: row.employee_id,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      employeeCode: row.employee_code,
      ...toRecord(row, workDate),
    })),
  };
}
