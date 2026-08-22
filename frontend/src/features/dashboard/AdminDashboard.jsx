import { useEffect, useState } from 'react';
import { employeesApi } from '../../api/employeesApi.js';
import { timeoffApi } from '../../api/timeoffApi.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Button } from '../../components/common/Button.jsx';
import { QuickAccessCard } from './QuickAccessCard.jsx';

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
    </div>
  );
}

export function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  function reload() {
    employeesApi.list({}).then(setEmployees).catch(() => {});
    timeoffApi.companyRequests({ status: 'pending' }).then(setPendingRequests).catch(() => {});
  }

  useEffect(reload, []);

  async function handleDecision(id, status) {
    setBusyId(id);
    try {
      await timeoffApi.decide(id, { status });
      reload();
    } finally {
      setBusyId(null);
    }
  }

  const presentToday = employees.filter((e) => e.status === 'present').length;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-text">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Employees" value={employees.length} />
        <StatCard label="Present Today" value={presentToday} />
        <StatCard label="Pending Leave Requests" value={pendingRequests.length} />
      </div>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
        <QuickAccessCard to="/employees" icon="👥" label="Employees" />
        <QuickAccessCard to="/attendance" icon="🗓️" label="Attendance" />
        <QuickAccessCard to="/timeoff" icon="✈️" label="Time Off" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-text">Needs Your Approval</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-text-muted">Nothing pending.</p>
        ) : (
          <ul className="space-y-3">
            {pendingRequests.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar size="sm" firstName={r.employee?.firstName} lastName={r.employee?.lastName} avatarUrl={r.employee?.avatarUrl} />
                  <span className="text-sm text-text">
                    {r.employee?.firstName} {r.employee?.lastName} · {r.leaveType} ({r.days}d)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button className="h-8 px-2 text-xs" disabled={busyId === r.id} onClick={() => handleDecision(r.id, 'approved')}>
                    Approve
                  </Button>
                  <Button variant="ghost" className="h-8 px-2 text-xs" disabled={busyId === r.id} onClick={() => handleDecision(r.id, 'rejected')}>
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
