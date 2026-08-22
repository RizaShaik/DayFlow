/**
 * Login ID format (see wireframe spec): OI + first 2 letters of first name +
 * first 2 letters of last name + 4-digit join year + 4-digit serial.
 * Example: OIJODO20220001. Serial increments per (name-prefix, year) pair.
 */
function namePart(name) {
  return name.trim().slice(0, 2).toUpperCase().padEnd(2, 'X');
}

export function buildLoginIdPrefix(firstName, lastName, joinYear) {
  return `OI${namePart(firstName)}${namePart(lastName)}${joinYear}`;
}

export async function generateLoginId(client, { firstName, lastName, joinYear }) {
  const prefix = buildLoginIdPrefix(firstName, lastName, joinYear);
  const { rows } = await client.query(
    `SELECT login_id FROM users WHERE login_id LIKE $1 ORDER BY login_id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSerial = 1;
  if (rows.length > 0) {
    const lastSerial = Number(rows[0].login_id.slice(-4));
    nextSerial = lastSerial + 1;
  }

  return `${prefix}${String(nextSerial).padStart(4, '0')}`;
}
