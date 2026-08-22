const STATUS = {
  present: { icon: '🟢', label: 'Present' },
  leave: { icon: '✈️', label: 'On Leave' },
  absent: { icon: '🟡', label: 'Absent' },
  half_day: { icon: '🟠', label: 'Half Day' },
};

export function StatusDot({ status, className = '' }) {
  const info = STATUS[status] || STATUS.absent;
  return (
    <span title={info.label} aria-label={info.label} className={`text-sm leading-none ${className}`}>
      {info.icon}
    </span>
  );
}
