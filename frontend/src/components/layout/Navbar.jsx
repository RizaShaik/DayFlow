import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar.jsx';
import { Logo } from '../common/Logo.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { CheckInOutWidget } from '../../features/attendance/CheckInOutWidget.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl.js';

const navLinkClass = ({ isActive }) =>
  `flex h-16 items-center border-b-2 text-sm font-medium transition-colors ${
    isActive
      ? 'border-primary text-primary'
      : 'border-transparent text-text-muted hover:text-text'
  }`;

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate('/signin', { replace: true });
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2">
            <Logo height={26} />
            {user?.company?.logoUrl && (
              <img
                src={resolveAssetUrl(user.company.logoUrl)}
                alt={`${user.company.name} logo`}
                className="h-7 w-7 rounded-full border border-border object-cover"
              />
            )}
          </NavLink>
          <nav className="flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/employees" className={navLinkClass}>
              Employees
            </NavLink>
            <NavLink to="/attendance" className={navLinkClass}>
              Attendance
            </NavLink>
            <NavLink to="/timeoff" className={navLinkClass}>
              Time Off
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <CheckInOutWidget />
          <ThemeToggle />
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Avatar
                size="sm"
                firstName={user?.employee?.firstName}
                lastName={user?.employee?.lastName}
                avatarUrl={user?.employee?.avatarUrl}
              />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-border bg-surface py-1 shadow-md">
                  <NavLink
                    to={`/employees/${user?.employee?.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-text hover:bg-surface-alt"
                  >
                    My Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-surface-alt"
                  >
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
