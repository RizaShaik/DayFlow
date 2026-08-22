const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_DOT_CLASS = {
  approved: 'bg-success text-white',
  pending: 'bg-warning text-white',
  rejected: 'bg-danger text-white',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

/** One month of a year-calendar, with individual days colored by that
 * day's leave status (if the employee has a request covering it). */
export function MonthMiniCalendar({ year, month, dayStatus, todayStr, onDayClick }) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="mb-2 text-xs font-semibold text-text">{MONTH_NAMES[month - 1]}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px]">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-text-muted">{w}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />;
          const dateStr = `${year}-${pad(month)}-${pad(day)}`;
          const status = dayStatus.get(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick?.(dateStr)}
              title={status ? `${dateStr}: ${status}` : dateStr}
              className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full hover:ring-1
                          hover:ring-primary ${
                status
                  ? STATUS_DOT_CLASS[status]
                  : isToday
                    ? 'border border-primary text-text'
                    : 'text-text-muted'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
