import { Link } from 'react-router-dom';

export function QuickAccessCard({ to, onClick, icon, label }) {
  const className =
    'flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface p-6 text-center shadow-sm transition-shadow hover:shadow-md';

  const content = (
    <>
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-text">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
