import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceApi } from '../../api/attendanceApi.js';
import { timeoffApi } from '../../api/timeoffApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { QuickAccessCard } from './QuickAccessCard.jsx';

const STATUS_STYLES = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
};

export function EmployeeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [todayStatus, setTodayStatus] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    attendanceApi.todayStatus().then(setTodayStatus).catch(() => {});
    timeoffApi.myRequests().then((r) => setRecentRequests(r.slice(0, 3))).catch(() => {});
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/signin', { replace: true });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-text">
        Welcome back, {user?.employee?.firstName}
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickAccessCard to={`/employees/${user?.employee?.id}`} icon="👤" label="My Profile" />
        <QuickAccessCard to="/attendance" icon="🗓️" label="Attendance" />
        <QuickAccessCard to="/timeoff" icon="✈️" label="Leave Requests" />
        <QuickAccessCard onClick={handleSignOut} icon="🚪" label="Logout" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">Today</h2>
          {todayStatus ? (
            <div className="text-sm text-text-muted">
              <p>
                Status: <span className="font-medium capitalize text-text">{todayStatus.status.replace('_', ' ')}</span>
              </p>
              {todayStatus.checkIn && (
                <p className="mt-1">
                  Checked in at {new Date(todayStatus.checkIn).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Loading…</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">Recent Activity</h2>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-text-muted">No recent time off requests.</p>
          ) : (
            <ul className="space-y-2">
              {recentRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">
                    {r.leaveType} · {r.startDate}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
