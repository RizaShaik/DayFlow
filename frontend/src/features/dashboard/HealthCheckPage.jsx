import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';
import { ThemeToggle } from '../../components/layout/ThemeToggle.jsx';

/**
 * Temporary Phase 0 landing page: proves the frontend can reach the backend
 * and that the theme system works. Replaced by real routing in Phase 2/3.
 */
export function HealthCheckPage() {
  const [status, setStatus] = useState('checking...');
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get('/health')
      .then((res) => setStatus(JSON.stringify(res.data.data)))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-surface-alt text-text flex flex-col items-center justify-center gap-6 p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-2xl font-semibold">Dayflow — scaffold check</h1>
      <div className="rounded-lg border border-border bg-surface px-6 py-4 text-sm">
        <p className="text-text-muted">Backend health response:</p>
        {error ? (
          <p className="text-danger">Error: {error} (start the backend, see README)</p>
        ) : (
          <p className="font-mono">{status}</p>
        )}
      </div>
    </div>
  );
}
