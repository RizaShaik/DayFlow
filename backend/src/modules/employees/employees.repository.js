export async function listEmployees(client, companyId, { search, departmentId } = {}) {
  const conditions = ['e.company_id = $1'];
  const params = [companyId];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    conditions.push(
      `(LOWER(e.first_name || ' ' || e.last_name) LIKE $${params.length} OR LOWER(e.employee_code) LIKE $${params.length})`
    );
  }
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`e.department_id = $${params.length}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  params.push(today);
  const todayParamIndex = params.length;

  const { rows } = await client.query(
    `SELECT e.id, e.employee_code, e.first_name, e.last_name, e.avatar_url,
            e.job_position, d.name AS department_name,
            COALESCE(a.status, 'absent') AS status
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     LEFT JOIN attendance a ON a.employee_id = e.id AND a.work_date = $${todayParamIndex}
     WHERE ${conditions.join(' AND ')}
     ORDER BY e.first_name, e.last_name`,
    params
  );
  return rows;
}

export async function getEmployeeDetail(client, employeeId, companyId) {
  const { rows } = await client.query(
    `SELECT e.*, u.email, u.login_id, u.role,
            d.id AS department_id_full, d.name AS department_name,
            m.id AS manager_id_full, m.first_name AS manager_first_name, m.last_name AS manager_last_name
     FROM employees e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN departments d ON d.id = e.department_id
     LEFT JOIN employees m ON m.id = e.manager_id
     WHERE e.id = $1 AND e.company_id = $2`,
    [employeeId, companyId]
  );
  return rows[0] || null;
}

export async function getBankDetails(client, employeeId) {
  const { rows } = await client.query(`SELECT * FROM bank_details WHERE employee_id = $1`, [
    employeeId,
  ]);
  return rows[0] || null;
}

export async function getSalaryInfo(client, employeeId) {
  const { rows: structureRows } = await client.query(
    `SELECT * FROM salary_structures WHERE employee_id = $1`,
    [employeeId]
  );
  const { rows: componentRows } = await client.query(
    `SELECT component_type, computation_type, value, computed_amount
     FROM salary_components WHERE employee_id = $1
     ORDER BY computed_amount DESC`,
    [employeeId]
  );
  if (!structureRows[0]) return null;
  return { structure: structureRows[0], components: componentRows };
}

export async function findUserByEmailGlobal(client, email) {
  const { rows } = await client.query(`SELECT id FROM users WHERE email = $1`, [
    email.toLowerCase(),
  ]);
  return rows[0] || null;
}

export async function nextEmployeeCode(client, companyId) {
  // Ordering by employee_code as text breaks once codes have different
  // digit counts ('EMP002' sorts after 'EMP0003' lexicographically) —
  // cast the numeric suffix and sort on that instead.
  const { rows } = await client.query(
    `SELECT COALESCE(MAX((regexp_match(employee_code, '(\\d+)$'))[1]::int), 0) AS max_num
     FROM employees WHERE company_id = $1`,
    [companyId]
  );
  const nextNum = rows[0].max_num + 1;
  return `EMP${String(nextNum).padStart(4, '0')}`;
}

export async function insertUserForEmployee(client, { companyId, loginId, email, passwordHash, role }) {
  const { rows } = await client.query(
    `INSERT INTO users (company_id, login_id, email, password_hash, role, must_change_password, email_verified)
     VALUES ($1, $2, $3, $4, $5, true, true)
     RETURNING id`,
    [companyId, loginId, email, passwordHash, role]
  );
  return rows[0];
}

export async function insertEmployeeRecord(client, e) {
  const { rows } = await client.query(
    `INSERT INTO employees (
       user_id, company_id, employee_code, first_name, last_name, phone,
       department_id, manager_id, job_position, work_location, date_of_joining
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, employee_code`,
    [
      e.userId,
      e.companyId,
      e.employeeCode,
      e.firstName,
      e.lastName,
      e.phone || null,
      e.departmentId || null,
      e.managerId || null,
      e.jobPosition || null,
      e.workLocation || null,
      e.dateOfJoining,
    ]
  );
  return rows[0];
}

const EMPLOYEE_COLUMN_MAP = {
  firstName: 'first_name',
  lastName: 'last_name',
  phone: 'phone',
  jobPosition: 'job_position',
  workLocation: 'work_location',
  departmentId: 'department_id',
  managerId: 'manager_id',
  dateOfJoining: 'date_of_joining',
  about: 'about',
  skills: 'skills',
  certifications: 'certifications',
  dateOfBirth: 'date_of_birth',
  gender: 'gender',
  maritalStatus: 'marital_status',
  nationality: 'nationality',
  personalEmail: 'personal_email',
  residingAddress: 'residing_address',
};

/** Only whitelisted keys are ever interpolated as column names — arbitrary
 * caller-supplied keys are silently dropped, never reach SQL. */
export async function updateEmployeeFields(client, employeeId, fields) {
  const entries = Object.entries(fields).filter(
    ([key, value]) => EMPLOYEE_COLUMN_MAP[key] && value !== undefined
  );
  if (entries.length === 0) return;

  const setClauses = entries.map(([key], i) => `${EMPLOYEE_COLUMN_MAP[key]} = $${i + 2}`);
  const values = entries.map(([, value]) => value);
  await client.query(`UPDATE employees SET ${setClauses.join(', ')} WHERE id = $1`, [
    employeeId,
    ...values,
  ]);
}

export async function updateAvatarUrl(client, employeeId, avatarUrl) {
  await client.query(`UPDATE employees SET avatar_url = $2 WHERE id = $1`, [
    employeeId,
    avatarUrl,
  ]);
}

const BANK_COLUMN_MAP = {
  accountNumber: 'account_number',
  bankName: 'bank_name',
  ifscCode: 'ifsc_code',
  uanNo: 'uan_no',
  panNo: 'pan_no',
};

export async function upsertBankDetails(client, employeeId, fields) {
  const entries = Object.entries(fields).filter(
    ([key, value]) => BANK_COLUMN_MAP[key] && value !== undefined
  );
  if (entries.length === 0) return;

  const columns = entries.map(([key]) => BANK_COLUMN_MAP[key]);
  const values = entries.map(([, value]) => value);
  const placeholders = values.map((_, i) => `$${i + 2}`);
  const updateSet = columns.map((c, i) => `${c} = $${i + 2}`).join(', ');

  await client.query(
    `INSERT INTO bank_details (employee_id, ${columns.join(', ')})
     VALUES ($1, ${placeholders.join(', ')})
     ON CONFLICT (employee_id) DO UPDATE SET ${updateSet}, updated_at = now()`,
    [employeeId, ...values]
  );
}
