import { useAuth } from '../../hooks/useAuth.js';
import { MyTimeOffView } from './MyTimeOffView.jsx';
import { CompanyTimeOffView } from './CompanyTimeOffView.jsx';

export function TimeOffPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr';
  return isPrivileged ? <CompanyTimeOffView /> : <MyTimeOffView />;
}
