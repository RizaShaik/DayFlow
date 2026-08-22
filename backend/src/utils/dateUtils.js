/** 'YYYY-MM-DD' in the server's local timezone (not UTC — avoids the same
 * off-by-one-day trap as the pg DATE type parser fix in config/database.js). */
export function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
