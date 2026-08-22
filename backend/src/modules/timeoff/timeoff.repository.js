export async function getEmployeeIdForUser(client, userId) {
  const { rows } = await client.query(`SELECT id FROM employees WHERE user_id = $1`, [userId]);
  return rows[0]?.id || null;
}

export async function listLeaveTypes(client, companyId) {
  const { rows } = await client.query(
    `SELECT id, name, requires_attachment, default_allocation_days
     FROM leave_types WHERE company_id = $1 ORDER BY name`,
    [companyId]
  );
  return rows;
}

export async function getLeaveType(client, leaveTypeId, companyId) {
  const { rows } = await client.query(
    `SELECT * FROM leave_types WHERE id = $1 AND company_id = $2`,
    [leaveTypeId, companyId]
  );
  return rows[0] || null;
}

export async function getBalance(client, employeeId, leaveTypeId, year) {
  const { rows } = await client.query(
    `SELECT * FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
    [employeeId, leaveTypeId, year]
  );
  return rows[0] || null;
}

export async function createBalance(client, employeeId, leaveTypeId, year, allocatedDays) {
  const { rows } = await client.query(
    `INSERT INTO leave_balances (employee_id, leave_type_id, year, allocated_days, used_days)
     VALUES ($1, $2, $3, $4, 0)
     ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING
     RETURNING *`,
    [employeeId, leaveTypeId, year, allocatedDays]
  );
  if (rows[0]) return rows[0];
  return getBalance(client, employeeId, leaveTypeId, year);
}

export async function listBalancesForEmployee(client, employeeId, year) {
  const { rows } = await client.query(
    `SELECT lt.id AS leave_type_id, lt.name, lb.allocated_days, lb.used_days
     FROM leave_types lt
     LEFT JOIN leave_balances lb
       ON lb.leave_type_id = lt.id AND lb.employee_id = $1 AND lb.year = $2
     WHERE lt.company_id = (SELECT company_id FROM employees WHERE id = $1)
     ORDER BY lt.name`,
    [employeeId, year]
  );
  return rows;
}

export async function incrementUsedDays(client, employeeId, leaveTypeId, year, days) {
  await client.query(
    `UPDATE leave_balances SET used_days = used_days + $4
     WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
    [employeeId, leaveTypeId, year, days]
  );
}

export async function insertLeaveRequest(client, req) {
  const { rows } = await client.query(
    `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days, remarks, attachment_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [req.employeeId, req.leaveTypeId, req.startDate, req.endDate, req.days, req.remarks || null, req.attachmentUrl || null]
  );
  return rows[0];
}

export async function listRequestsForEmployee(client, employeeId) {
  const { rows } = await client.query(
    `SELECT lr.*, lt.name AS leave_type_name
     FROM leave_requests lr
     JOIN leave_types lt ON lt.id = lr.leave_type_id
     WHERE lr.employee_id = $1
     ORDER BY lr.created_at DESC`,
    [employeeId]
  );
  return rows;
}

export async function listRequestsForCompany(client, companyId, status) {
  const params = [companyId];
  let statusClause = '';
  if (status) {
    params.push(status);
    statusClause = `AND lr.status = $${params.length}`;
  }
  const { rows } = await client.query(
    `SELECT lr.*, lt.name AS leave_type_name, e.first_name, e.last_name, e.avatar_url
     FROM leave_requests lr
     JOIN leave_types lt ON lt.id = lr.leave_type_id
     JOIN employees e ON e.id = lr.employee_id
     WHERE e.company_id = $1 ${statusClause}
     ORDER BY lr.created_at DESC`,
    params
  );
  return rows;
}

export async function getRequestById(client, requestId) {
  const { rows } = await client.query(
    `SELECT lr.*, lt.name AS leave_type_name, e.company_id
     FROM leave_requests lr
     JOIN leave_types lt ON lt.id = lr.leave_type_id
     JOIN employees e ON e.id = lr.employee_id
     WHERE lr.id = $1`,
    [requestId]
  );
  return rows[0] || null;
}

export async function decideRequest(client, requestId, { status, reviewedBy, reviewComment }) {
  const { rows } = await client.query(
    `UPDATE leave_requests
     SET status = $2, reviewed_by = $3, review_comment = $4, reviewed_at = now()
     WHERE id = $1
     RETURNING *`,
    [requestId, status, reviewedBy, reviewComment || null]
  );
  return rows[0];
}

export async function markAttendanceLeave(client, employeeId, startDate, endDate) {
  await client.query(
    `INSERT INTO attendance (employee_id, work_date, status)
     SELECT $1, d::date, 'leave'
     FROM generate_series($2::date, $3::date, interval '1 day') AS d
     ON CONFLICT (employee_id, work_date)
     DO UPDATE SET status = 'leave' WHERE attendance.check_in IS NULL`,
    [employeeId, startDate, endDate]
  );
}
