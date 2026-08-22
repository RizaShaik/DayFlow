import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

/**
 * Demo dataset so the UI has real, non-hardcoded data to render while we
 * build Phases 2+. Safe to re-run: wipes and re-inserts (dev-only script).
 */
async function seed() {
  await withTransaction(async (client) => {
    await client.query(`
      TRUNCATE TABLE
        leave_requests, leave_balances, leave_types,
        salary_components, salary_structures, bank_details,
        attendance, employees, departments, users, companies
      RESTART IDENTITY CASCADE;
    `);

    const { rows: [company] } = await client.query(
      `INSERT INTO companies (name) VALUES ($1) RETURNING id`,
      ['Odoo India']
    );

    const { rows: [engDept] } = await client.query(
      `INSERT INTO departments (company_id, name) VALUES ($1, $2) RETURNING id`,
      [company.id, 'Engineering']
    );
    await client.query(
      `INSERT INTO departments (company_id, name) VALUES ($1, $2)`,
      [company.id, 'Human Resources']
    );

    const leaveTypeDefs = [
      { name: 'Paid Time Off', requiresAttachment: false, allocation: 24 },
      { name: 'Sick Leave', requiresAttachment: true, allocation: 7 },
      { name: 'Unpaid Leave', requiresAttachment: false, allocation: 0 },
    ];
    const leaveTypes = {};
    for (const def of leaveTypeDefs) {
      const { rows: [lt] } = await client.query(
        `INSERT INTO leave_types (company_id, name, requires_attachment, default_allocation_days)
         VALUES ($1, $2, $3, $4) RETURNING id, name`,
        [company.id, def.name, def.requiresAttachment, def.allocation]
      );
      leaveTypes[lt.name] = { id: lt.id, allocation: def.allocation };
    }

    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const { rows: [adminUser] } = await client.query(
      `INSERT INTO users (company_id, login_id, email, password_hash, role, must_change_password, email_verified)
       VALUES ($1, $2, $3, $4, 'admin', false, true) RETURNING id`,
      [company.id, 'OIADUS20260001', 'admin@dayflow.local', adminPasswordHash]
    );
    const { rows: [adminEmployee] } = await client.query(
      `INSERT INTO employees (user_id, company_id, employee_code, first_name, last_name,
                               job_position, work_location, date_of_joining)
       VALUES ($1, $2, 'EMP0001', 'Admin', 'User', 'HR Manager', 'Bengaluru', '2020-01-01')
       RETURNING id`,
      [adminUser.id, company.id]
    );

    const employeeTempPasswordHash = await bcrypt.hash('Welcome@123', 10);
    const { rows: [empUser] } = await client.query(
      `INSERT INTO users (company_id, login_id, email, password_hash, role, must_change_password, email_verified)
       VALUES ($1, $2, $3, $4, 'employee', true, true) RETURNING id`,
      [company.id, 'OIJODO20260001', 'john.doe@dayflow.local', employeeTempPasswordHash]
    );
    const { rows: [johnDoe] } = await client.query(
      `INSERT INTO employees (user_id, company_id, employee_code, first_name, last_name,
                               phone, department_id, manager_id, job_position, work_location,
                               date_of_joining, about, skills, date_of_birth, gender,
                               marital_status, nationality, personal_email, residing_address)
       VALUES ($1, $2, 'EMP0002', 'John', 'Doe', '+91-9876543210', $3, $4, 'Software Engineer',
               'Bengaluru', '2026-01-15', 'Full-stack engineer who enjoys clean architecture.',
               ARRAY['JavaScript', 'PostgreSQL', 'React'], '1996-05-20', 'male', 'single',
               'Indian', 'john.personal@example.com', '221B Baker Street, Bengaluru')
       RETURNING id`,
      [empUser.id, company.id, engDept.id, adminEmployee.id]
    );

    await client.query(
      `INSERT INTO bank_details (employee_id, account_number, bank_name, ifsc_code, uan_no, pan_no)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [johnDoe.id, '1234567890123', 'HDFC Bank', 'HDFC0001234', 'UAN10023456789', 'ABCDE1234F']
    );

    const monthlyWage = 50000;
    const basic = monthlyWage * 0.5;
    const hra = basic * 0.5;
    const standardAllowance = basic * 0.166667;
    const performanceBonus = basic * 0.0833;
    const lta = basic * 0.08333;
    const pfEmployee = basic * 0.12;
    const pfEmployer = basic * 0.12;
    const professionalTax = 200;
    const fixedAllowance =
      monthlyWage - (basic + hra + standardAllowance + performanceBonus + lta);

    await client.query(
      `INSERT INTO salary_structures (employee_id, monthly_wage, working_days_per_week, break_time_hours)
       VALUES ($1, $2, 5, 1)`,
      [johnDoe.id, monthlyWage]
    );

    const components = [
      ['basic', 'percentage', 50, basic],
      ['hra', 'percentage', 50, hra],
      ['standard_allowance', 'percentage', 16.6667, standardAllowance],
      ['performance_bonus', 'percentage', 8.33, performanceBonus],
      ['lta', 'percentage', 8.333, lta],
      ['fixed_allowance', 'fixed', fixedAllowance, fixedAllowance],
      ['pf_employee', 'percentage', 12, pfEmployee],
      ['pf_employer', 'percentage', 12, pfEmployer],
      ['professional_tax', 'fixed', professionalTax, professionalTax],
    ];
    for (const [componentType, computationType, value, amount] of components) {
      await client.query(
        `INSERT INTO salary_components (employee_id, component_type, computation_type, value, computed_amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [johnDoe.id, componentType, computationType, value, amount.toFixed(2)]
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const checkIn = `${today}T09:00:00Z`;
    const checkOut = `${today}T18:00:00Z`;
    for (const employeeId of [adminEmployee.id, johnDoe.id]) {
      await client.query(
        `INSERT INTO attendance (employee_id, work_date, check_in, check_out, status)
         VALUES ($1, $2, $3, $4, 'present')`,
        [employeeId, today, checkIn, checkOut]
      );
    }

    for (const [name, { id: leaveTypeId, allocation }] of Object.entries(leaveTypes)) {
      await client.query(
        `INSERT INTO leave_balances (employee_id, leave_type_id, year, allocated_days, used_days)
         VALUES ($1, $2, $3, $4, 0)`,
        [johnDoe.id, leaveTypeId, new Date().getFullYear(), allocation]
      );
      void name;
    }

    await client.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days, remarks, status)
       VALUES ($1, $2, $3, $3, 1, 'Personal errand', 'pending')`,
      [johnDoe.id, leaveTypes['Paid Time Off'].id, '2026-09-01']
    );

    logger.info('Seed complete.');
    logger.info('  Admin login:    OIADUS20260001 / Admin@123');
    logger.info('  Employee login: OIJODO20260001 / Welcome@123 (must change password on first login)');
  });

  await pool.end();
}

seed().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
