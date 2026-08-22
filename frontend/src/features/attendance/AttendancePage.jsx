import { useAuth } from '../../hooks/useAuth.js';
import { MyAttendanceView } from './MyAttendanceView.jsx';
import { CompanyAttendanceView } from './CompanyAttendanceView.jsx';

export function AttendancePage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr';
  return isPrivileged ? <CompanyAttendanceView /> : <MyAttendanceView />;
}
