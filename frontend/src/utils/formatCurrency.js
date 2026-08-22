const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function formatCurrency(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? formatter.format(value) : '—';
}
