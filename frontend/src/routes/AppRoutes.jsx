import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';
import { SignInPage } from '../features/auth/SignInPage.jsx';
import { SignUpPage } from '../features/auth/SignUpPage.jsx';
import { VerifyEmailPage } from '../features/auth/VerifyEmailPage.jsx';
import { ChangePasswordPage } from '../features/auth/ChangePasswordPage.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
