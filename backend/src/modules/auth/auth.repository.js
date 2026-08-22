export async function findUserByIdentifier(client, identifier) {
  const { rows } = await client.query(
    `SELECT * FROM users WHERE email = $1 OR login_id = $2 LIMIT 1`,
    [identifier.toLowerCase(), identifier.toUpperCase()]
  );
  return rows[0] || null;
}

export async function findUserById(client, id) {
  const { rows } = await client.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function findUserByVerificationToken(client, tokenHash) {
  const { rows } = await client.query(
    `SELECT * FROM users
     WHERE email_verification_token = $1
       AND email_verification_expires_at > now()`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function getEmployeeByUserId(client, userId) {
  const { rows } = await client.query(
    `SELECT e.*, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function insertCompany(client, name) {
  const { rows } = await client.query(
    `INSERT INTO companies (name) VALUES ($1) RETURNING *`,
    [name]
  );
  return rows[0];
}

export async function insertDefaultLeaveTypes(client, companyId) {
  const defaults = [
    { name: 'Paid Time Off', requiresAttachment: false, allocation: 24 },
    { name: 'Sick Leave', requiresAttachment: true, allocation: 7 },
    { name: 'Unpaid Leave', requiresAttachment: false, allocation: 0 },
  ];
  for (const d of defaults) {
    await client.query(
      `INSERT INTO leave_types (company_id, name, requires_attachment, default_allocation_days)
       VALUES ($1, $2, $3, $4)`,
      [companyId, d.name, d.requiresAttachment, d.allocation]
    );
  }
}

export async function insertUser(client, user) {
  const { rows } = await client.query(
    `INSERT INTO users (
       company_id, login_id, email, password_hash, role,
       must_change_password, email_verified,
       email_verification_token, email_verification_expires_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      user.companyId,
      user.loginId,
      user.email,
      user.passwordHash,
      user.role,
      user.mustChangePassword,
      user.emailVerified,
      user.emailVerificationToken || null,
      user.emailVerificationExpiresAt || null,
    ]
  );
  return rows[0];
}

export async function insertEmployee(client, employee) {
  const { rows } = await client.query(
    `INSERT INTO employees (user_id, company_id, employee_code, first_name, last_name, job_position, date_of_joining)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      employee.userId,
      employee.companyId,
      employee.employeeCode,
      employee.firstName,
      employee.lastName,
      employee.jobPosition,
      employee.dateOfJoining,
    ]
  );
  return rows[0];
}

export async function markEmailVerified(client, userId) {
  await client.query(
    `UPDATE users
     SET email_verified = true, email_verification_token = NULL, email_verification_expires_at = NULL
     WHERE id = $1`,
    [userId]
  );
}

export async function updatePasswordHash(client, userId, passwordHash) {
  await client.query(
    `UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2`,
    [passwordHash, userId]
  );
}

export async function insertRefreshToken(client, { userId, tokenHash, expiresAt }) {
  await client.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function findActiveRefreshToken(client, tokenHash) {
  const { rows } = await client.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function revokeRefreshToken(client, tokenHash) {
  await client.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`,
    [tokenHash]
  );
}
