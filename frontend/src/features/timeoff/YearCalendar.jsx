import { useMemo, useState } from 'react';
import { MonthMiniCalendar } from './MonthMiniCalendar.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';

const STATUS_BADGE_CLASS = {
  approved: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  rejected: 'bg-danger/10 text-danger',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function eachDate(start, end) {
  const dates = [];
  const cur = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cur <= last) {
    dates.push(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const LEGEND = [
  { status: 'approved', label: 'Approved', className: 'bg-success' },
  { status: 'pending', label: 'To Approve', className: 'bg-warning' },
  { status: 'rejected', label: 'Refused', className: 'bg-danger' },
];

export function YearCalendar({ requests }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const dayInfo = useMemo(() => {
    const map = new Map();
    for (const r of requests) {
      for (const date of eachDate(r.startDate, r.endDate)) {
        const existing = map.get(date);
        if (!existing) {
          map.set(date, { status: r.status, requests: [r] });
        } else {
          existing.requests.push(r);
          // approved/pending take priority over a stray rejected overlap
          if (r.status !== 'rejected') existing.status = r.status;
        }
      }
    }
    return map;
  }, [requests]);

  const dayStatus = useMemo(() => {
    const map = new Map();
    for (const [date, info] of dayInfo) map.set(date, info.status);
    return map;
  }, [dayInfo]);

  const selectedRequests = selectedDate ? dayInfo.get(selectedDate)?.requests || [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => setYear((y) => y - 1)}>←</Button>
          <span className="text-sm font-medium text-text">{year}</span>
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => setYear((y) => y + 1)}>→</Button>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          {LEGEND.map((l) => (
            <span key={l.status} className="flex items-center gap-1">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${l.className}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
          <MonthMiniCalendar
            key={month}
            year={year}
            month={month}
            dayStatus={dayStatus}
            todayStr={todayStr}
            onDayClick={setSelectedDate}
          />
        ))}
      </div>

      {selectedDate && (
        <Modal title={selectedDate} onClose={() => setSelectedDate(null)} maxWidth="max-w-md">
          {selectedRequests.length === 0 ? (
            <p className="text-sm text-text-muted">No leave requests on this day.</p>
          ) : (
            <ul className="space-y-3">
              {selectedRequests.map((r) => (
                <li key={r.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text">{r.leaveType}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE_CLASS[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-text-muted">
                    {r.startDate} to {r.endDate} &middot; {r.days} day{r.days === 1 ? '' : 's'}
                  </p>
                  {r.remarks && <p className="mt-1 text-text">{r.remarks}</p>}
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
