import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { Button } from '../../components/common/Button.jsx';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function CheckInOutWidget() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceApi.todayStatus().then(setStatus).catch(() => {});
  }, []);

  async function handleCheckIn() {
    setBusy(true);
    setError('');
    try {
      setStatus(await attendanceApi.checkIn());
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not check in.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckOut() {
    setBusy(true);
    setError('');
    try {
      setStatus(await attendanceApi.checkOut());
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not check out.');
    } finally {
      setBusy(false);
    }
  }

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {error && <span className="text-xs text-danger">{error}</span>}
      {!status.checkIn && (
        <Button onClick={handleCheckIn} disabled={busy} className="h-9 px-3 text-xs">
          Check In →
        </Button>
      )}
      {status.checkIn && !status.checkOut && (
        <>
          <span className="hidden text-text-muted sm:inline">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-success align-middle" />
            Since {formatTime(status.checkIn)}
          </span>
          <Button
            variant="ghost"
            onClick={handleCheckOut}
            disabled={busy}
            className="h-9 px-3 text-xs"
          >
            Check Out →
          </Button>
        </>
      )}
      {status.checkIn && status.checkOut && (
        <span className="hidden text-text-muted sm:inline">
          Checked out at {formatTime(status.checkOut)}
        </span>
      )}
    </div>
  );
}
