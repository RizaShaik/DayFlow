import { useEffect, useState } from 'react';
import { timeoffApi } from '../../api/timeoffApi.js';
import { Button } from '../../components/common/Button.jsx';
import { TimeOffBalanceCard } from './TimeOffBalanceCard.jsx';
import { TimeOffRequestModal } from './TimeOffRequestModal.jsx';
import { YearCalendar } from './YearCalendar.jsx';

export function MyTimeOffView() {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  function reload() {
    timeoffApi.balances().then(setBalances).catch(() => setError('Could not load balances.'));
    timeoffApi.myRequests().then(setRequests).catch(() => setError('Could not load requests.'));
  }

  useEffect(reload, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Time Off</h1>
        <Button onClick={() => setShowModal(true)}>New</Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {balances.map((b) => (
          <TimeOffBalanceCard key={b.leaveTypeId} balance={b} />
        ))}
      </div>

      <YearCalendar requests={requests} />

      {showModal && (
        <TimeOffRequestModal
          balances={balances}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
