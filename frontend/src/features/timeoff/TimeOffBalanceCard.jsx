export function TimeOffBalanceCard({ balance }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-medium text-text">{balance.name}</p>
      <p className="mt-1 text-2xl font-semibold text-text">
        {balance.remainingDays}
        <span className="text-sm font-normal text-text-muted"> / {balance.allocatedDays} days</span>
      </p>
      {balance.name === 'Unpaid Leave' && (
        <p className="mt-1 text-xs text-text-muted">No cap — unpaid</p>
      )}
    </div>
  );
}
