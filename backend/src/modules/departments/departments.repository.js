export async function listDepartments(client, companyId) {
  const { rows } = await client.query(
    `SELECT id, name FROM departments WHERE company_id = $1 ORDER BY name`,
    [companyId]
  );
  return rows;
}
