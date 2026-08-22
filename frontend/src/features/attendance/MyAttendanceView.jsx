import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { Button } from '../../components/common/Button.jsx';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—';
}

function dayName(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString([], { weekday: 'short' });
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-text">{value}</p>
    </div>
  );
}

export function MyAttendanceView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceApi
      .me({ year, month })
      .then(setData)
      .catch(() => setError('Could not load attendance.'));
  }, [year, month]);

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Attendance</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => shiftMonth(-1)} className="h-8 w-8 px-0">←</Button>
          <span className="text-sm font-medium text-text">{MONTH_NAMES[month - 1]} {year}</span>
          <Button variant="ghost" onClick={() => shiftMonth(1)} className="h-8 w-8 px-0">→</Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Days Present" value={data.summary.daysPresent} />
            <StatCard label="Leaves" value={data.summary.daysOnLeave} />
            <StatCard label="Total Working Days" value={data.summary.totalWorkingDays} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-alt text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Day</th>
                  <th className="px-4 py-2 font-medium">Check In</th>
                  <th className="px-4 py-2 font-medium">Check Out</th>
                  <th className="px-4 py-2 font-medium">Work Hours</th>
                  <th className="px-4 py-2 font-medium">Extra Hours</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...data.records].reverse().map((r) => (
                  <tr key={r.date} className="border-t border-border">
                    <td className="px-4 py-2 text-text">{r.date}</td>
                    <td className="px-4 py-2 text-text-muted">{dayName(r.date)}</td>
                    <td className="px-4 py-2 text-text-muted">{formatTime(r.checkIn)}</td>
                    <td className="px-4 py-2 text-text-muted">{formatTime(r.checkOut)}</td>
                    <td className="px-4 py-2 text-text-muted">{r.workHours ?? '—'}</td>
                    <td className="px-4 py-2 text-text-muted">{r.extraHours ?? '—'}</td>
                    <td className="px-4 py-2 capitalize text-text-muted">{r.status.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
