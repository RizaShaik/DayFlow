export async function getRecordForDate(client, employeeId, workDate) {
  const { rows } = await client.query(
    `SELECT * FROM attendance WHERE employee_id = $1 AND work_date = $2`,
    [employeeId, workDate]
  );
  return rows[0] || null;
}

export async function checkIn(client, employeeId, workDate) {
  // A row can already exist for today with no check_in yet — e.g. an
  // approved leave request marks today's status='leave' ahead of time.
  // Checking in should override that (they did come in after all), not
  // collide with the UNIQUE(employee_id, work_date) constraint.
  const { rows } = await client.query(
    `INSERT INTO attendance (employee_id, work_date, check_in, status)
     VALUES ($1, $2, now(), 'present')
     ON CONFLICT (employee_id, work_date)
     DO UPDATE SET check_in = now(), status = 'present'
     RETURNING *`,
    [employeeId, workDate]
  );
  return rows[0];
}

export async function checkOut(client, employeeId, workDate) {
  const { rows } = await client.query(
    `UPDATE attendance SET check_out = now()
     WHERE employee_id = $1 AND work_date = $2
     RETURNING *`,
    [employeeId, workDate]
  );
  return rows[0];
}

export async function listForEmployeeRange(client, employeeId, startDate, endDate) {
  const { rows } = await client.query(
    `SELECT * FROM attendance
     WHERE employee_id = $1 AND work_date BETWEEN $2 AND $3
     ORDER BY work_date`,
    [employeeId, startDate, endDate]
  );
  return rows;
}

export async function listForCompanyDate(client, companyId, workDate) {
  const { rows } = await client.query(
    `SELECT e.id AS employee_id, e.first_name, e.last_name, e.avatar_url, e.employee_code,
            a.check_in, a.check_out, a.status
     FROM employees e
     LEFT JOIN attendance a ON a.employee_id = e.id AND a.work_date = $2
     WHERE e.company_id = $1
     ORDER BY e.first_name, e.last_name`,
    [companyId, workDate]
  );
  return rows;
}

export async function getEmployeeIdForUser(client, userId) {
  const { rows } = await client.query(`SELECT id FROM employees WHERE user_id = $1`, [userId]);
  return rows[0]?.id || null;
}
