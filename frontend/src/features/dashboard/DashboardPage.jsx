import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button.jsx';
import { ThemeToggle } from '../../components/layout/ThemeToggle.jsx';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Temporary authenticated landing page. Replaced by the real navigation
 * shell + employee directory in Phase 3.
 */
export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/signin', { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface-alt text-text p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Welcome, {user?.employee?.firstName || user?.loginId}
          </h1>
          <ThemeToggle />
        </div>
        <div className="rounded-lg border border-border bg-surface p-6 text-sm space-y-1">
          <p>
            <span className="text-text-muted">Login ID:</span> {user?.loginId}
          </p>
          <p>
            <span className="text-text-muted">Email:</span> {user?.email}
          </p>
          <p>
            <span className="text-text-muted">Role:</span> {user?.role}
          </p>
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="self-start">
          Log Out
        </Button>
      </div>
    </div>
  );
}
