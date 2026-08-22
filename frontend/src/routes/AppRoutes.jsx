import { Routes, Route } from 'react-router-dom';
import { HealthCheckPage } from '../features/dashboard/HealthCheckPage.jsx';

// Phase 2+: SignIn/SignUp, ProtectedRoute-wrapped dashboard, employees,
// attendance, timeoff, payroll routes replace this temporary shell.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HealthCheckPage />} />
    </Routes>
  );
}
