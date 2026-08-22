export async function getEmployeeCompanyId(client, employeeId) {
  const { rows } = await client.query(`SELECT company_id FROM employees WHERE id = $1`, [
    employeeId,
  ]);
  return rows[0]?.company_id || null;
}

export async function upsertSalaryStructure(client, employeeId, structure) {
  const { rows } = await client.query(
    `INSERT INTO salary_structures (employee_id, monthly_wage, working_days_per_week, break_time_hours)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (employee_id) DO UPDATE
       SET monthly_wage = $2, working_days_per_week = $3, break_time_hours = $4, updated_at = now()
     RETURNING *`,
    [employeeId, structure.monthlyWage, structure.workingDaysPerWeek, structure.breakTimeHours]
  );
  return rows[0];
}

export async function replaceSalaryComponents(client, employeeId, components) {
  await client.query(`DELETE FROM salary_components WHERE employee_id = $1`, [employeeId]);
  for (const c of components) {
    await client.query(
      `INSERT INTO salary_components (employee_id, component_type, computation_type, value, computed_amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [employeeId, c.type, c.computationType, c.value, c.amount]
    );
  }
}
