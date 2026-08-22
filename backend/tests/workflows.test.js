import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';

async function withServer(fn) {
  const app = createApp();
  const server = http.createServer(app).listen(0);
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}/api/v1`);
  } finally {
    server.close();
  }
}

async function captureLogs(fn) {
  const originalLog = console.log;
  const originalInfo = console.info;
  const lines = [];
  const capture = (...args) => lines.push(args.join(' '));
  console.log = capture;
  console.info = capture;
  try {
    const result = await fn();
    return { result, lines };
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
  }
}

function extractToken(lines, pattern) {
  const line = lines.find((l) => pattern.test(l));
  return pattern.exec(line || '')?.[1];
}

function uniqueEmail(label) {
  return `${label}${Date.now()}${Math.floor(Math.random() * 1e6)}@test.dayflow`;
}

// leave_balances are tracked per calendar year, and GET /timeoff/balances
// always lazily-inits/reads the *current* year's row — so test dates must
// stay within the current year (not just "any future date") for the
// before/after balance comparison to read the same row it wrote to.
function currentYearDate(month, day) {
  const year = new Date().getFullYear();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function json(res) {
  return res.json();
}

test('attendance + time off + payroll: full workflow with permission boundaries', async () => {
  await withServer(async (base) => {
    const adminEmail = uniqueEmail('admin');
    const adminPassword = 'Adm1n$ecret';

    const { result: signupBody, lines: signupLines } = await captureLogs(async () => {
      const res = await fetch(`${base}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Workflow Co',
          name: 'Wanda Admin',
          email: adminEmail,
          password: adminPassword,
        }),
      });
      return res.json();
    });
    const verificationToken = extractToken(signupLines, /verify-email\/([a-f0-9]{64})/);

    const verifyRes = await fetch(`${base}/auth/verify-email/${verificationToken}`);
    const { data: verifyData } = await json(verifyRes);
    const adminToken = verifyData.accessToken;
    const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

    // --- Admin creates an employee; capture the dev-logged temp password ---
    const empEmail = uniqueEmail('worker');
    const { result: createRes, lines: createLines } = await captureLogs(async () => {
      const res = await fetch(`${base}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(adminToken) },
        body: JSON.stringify({
          firstName: 'Wendy',
          lastName: 'Worker',
          email: empEmail,
          role: 'employee',
        }),
      });
      return { status: res.status, body: await res.json() };
    });
    assert.equal(createRes.status, 201);
    const tempPassword = extractToken(createLines, /Temporary password: (\S+)/);
    const loginId = createRes.body.data.loginId;

    const empSignin = await fetch(`${base}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: loginId, password: tempPassword }),
    });
    const { data: empSigninData } = await json(empSignin);
    const empToken = empSigninData.accessToken;
    const employeeId = empSigninData.user.employee.id;

    // --- Attendance: check-in, double check-in rejected, check-out ---
    const checkIn1 = await fetch(`${base}/attendance/check-in`, {
      method: 'POST',
      headers: authHeader(empToken),
    });
    assert.equal(checkIn1.status, 201);

    const checkIn2 = await fetch(`${base}/attendance/check-in`, {
      method: 'POST',
      headers: authHeader(empToken),
    });
    assert.equal(checkIn2.status, 409);

    const checkOut = await fetch(`${base}/attendance/check-out`, {
      method: 'POST',
      headers: authHeader(empToken),
    });
    assert.equal(checkOut.status, 200);

    // Non-privileged user can't see company-wide attendance.
    const forbiddenAttendance = await fetch(`${base}/attendance`, { headers: authHeader(empToken) });
    assert.equal(forbiddenAttendance.status, 403);

    // --- Time off: balances lazy-init, apply, over-allocation rejected ---
    const balancesRes = await fetch(`${base}/timeoff/balances`, { headers: authHeader(empToken) });
    const { data: balancesData } = await json(balancesRes);
    const paidType = balancesData.balances.find((b) => b.name === 'Paid Time Off');
    assert.equal(paidType.allocatedDays, 24);

    const overAllocation = await fetch(`${base}/timeoff/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(empToken) },
      body: JSON.stringify({
        leaveTypeId: paidType.leaveTypeId,
        startDate: currentYearDate(11, 1),
        endDate: currentYearDate(11, 30),
      }),
    });
    assert.equal(overAllocation.status, 400);

    const leaveRes = await fetch(`${base}/timeoff/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(empToken) },
      body: JSON.stringify({
        leaveTypeId: paidType.leaveTypeId,
        startDate: currentYearDate(12, 10),
        endDate: currentYearDate(12, 11),
        remarks: 'Trip',
      }),
    });
    const { data: leaveData } = await json(leaveRes);
    assert.equal(leaveData.request.days, 2);

    // Non-privileged user can't approve their own (or anyone's) request.
    const forbiddenDecision = await fetch(`${base}/timeoff/requests/${leaveData.request.id}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(empToken) },
      body: JSON.stringify({ status: 'approved' }),
    });
    assert.equal(forbiddenDecision.status, 403);

    // Admin approves -> balance deducted, attendance marked 'leave' for that date range.
    const decisionRes = await fetch(`${base}/timeoff/requests/${leaveData.request.id}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(adminToken) },
      body: JSON.stringify({ status: 'approved', reviewComment: 'Approved' }),
    });
    assert.equal(decisionRes.status, 200);

    const balancesAfterRes = await fetch(`${base}/timeoff/balances`, { headers: authHeader(empToken) });
    const { data: balancesAfter } = await json(balancesAfterRes);
    const paidAfter = balancesAfter.balances.find((b) => b.name === 'Paid Time Off');
    assert.equal(paidAfter.usedDays, 2);
    assert.equal(paidAfter.remainingDays, 22);

    // --- Payroll: configure salary, verify components foot back to wage ---
    const forbiddenPayroll = await fetch(`${base}/payroll/${employeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader(empToken) },
      body: JSON.stringify({ monthlyWage: 40000 }),
    });
    assert.equal(forbiddenPayroll.status, 403);

    const payrollRes = await fetch(`${base}/payroll/${employeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader(adminToken) },
      body: JSON.stringify({ monthlyWage: 40000, workingDaysPerWeek: 5, breakTimeHours: 1 }),
    });
    const { data: payrollData } = await json(payrollRes);
    const wageComponents = new Set([
      'basic', 'hra', 'standard_allowance', 'performance_bonus', 'lta', 'fixed_allowance',
    ]);
    const total = payrollData.salaryInfo.components
      .filter((c) => wageComponents.has(c.type))
      .reduce((sum, c) => sum + c.amount, 0);
    assert.ok(Math.abs(total - 40000) < 0.01, `components should foot back to wage, got ${total}`);
    assert.equal(payrollData.salaryInfo.components.find((c) => c.type === 'basic').amount, 20000);
  });
});
