import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { SignInPage } from '../features/auth/SignInPage.jsx';
import { SignUpPage } from '../features/auth/SignUpPage.jsx';
import { VerifyEmailPage } from '../features/auth/VerifyEmailPage.jsx';
import { ChangePasswordPage } from '../features/auth/ChangePasswordPage.jsx';
import { EmployeeListPage } from '../features/employees/EmployeeListPage.jsx';
import { EmployeeProfilePage } from '../features/employees/EmployeeProfilePage.jsx';
import { AttendanceComingSoonPage } from '../features/attendance/AttendanceComingSoonPage.jsx';
import { TimeOffComingSoonPage } from '../features/timeoff/TimeOffComingSoonPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employees/:id" element={<EmployeeProfilePage />} />
          <Route path="/attendance" element={<AttendanceComingSoonPage />} />
          <Route path="/timeoff" element={<TimeOffComingSoonPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
