import { ThemeToggle } from '../layout/ThemeToggle.jsx';
import { Logo } from './Logo.jsx';

export function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <Logo height={34} className="mb-6" />
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
