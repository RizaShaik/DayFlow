import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { StatusDot } from '../../components/common/StatusDot.jsx';
import { Button } from '../../components/common/Button.jsx';

function formatTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—';
}

function todayLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function shiftDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CompanyAttendanceView() {
  const [date, setDate] = useState(todayLocalDate());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceApi
      .company({ date })
      .then(setData)
      .catch(() => setError('Could not load attendance.'));
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Attendance</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setDate((d) => shiftDate(d, -1))} className="h-8 w-8 px-0">←</Button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text"
          />
          <Button variant="ghost" onClick={() => setDate((d) => shiftDate(d, 1))} className="h-8 w-8 px-0">→</Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {data && (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-alt text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Check In</th>
                <th className="px-4 py-2 font-medium">Check Out</th>
                <th className="px-4 py-2 font-medium">Work Hours</th>
                <th className="px-4 py-2 font-medium">Extra Hours</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((e) => (
                <tr key={e.employeeId} className="border-t border-border">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm" firstName={e.firstName} lastName={e.lastName} avatarUrl={e.avatarUrl} />
                      <span className="text-text">{e.firstName} {e.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{formatTime(e.checkIn)}</td>
                  <td className="px-4 py-2 text-text-muted">{formatTime(e.checkOut)}</td>
                  <td className="px-4 py-2 text-text-muted">{e.workHours ?? '—'}</td>
                  <td className="px-4 py-2 text-text-muted">{e.extraHours ?? '—'}</td>
                  <td className="px-4 py-2">
                    <StatusDot status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
