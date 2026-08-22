import { useAuth } from '../../hooks/useAuth.js';
import { EmployeeDashboard } from './EmployeeDashboard.jsx';
import { AdminDashboard } from './AdminDashboard.jsx';

export function DashboardPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr';
  return isPrivileged ? <AdminDashboard /> : <EmployeeDashboard />;
}
