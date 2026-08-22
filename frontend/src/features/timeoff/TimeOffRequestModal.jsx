import { useMemo, useState } from 'react';
import { Modal } from '../../components/common/Modal.jsx';
import { Select } from '../../components/common/Select.jsx';
import { Textarea } from '../../components/common/Textarea.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { timeoffApi } from '../../api/timeoffApi.js';
import { useAuth } from '../../hooks/useAuth.js';

function daysBetweenInclusive(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 86_400_000) + 1;
}

export function TimeOffRequestModal({ balances, onClose, onCreated }) {
  const { user } = useAuth();
  const [leaveTypeId, setLeaveTypeId] = useState(balances[0]?.leaveTypeId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedType = balances.find((b) => b.leaveTypeId === leaveTypeId);
  const allocationDays = useMemo(() => daysBetweenInclusive(startDate, endDate), [startDate, endDate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (selectedType?.requiresAttachment && !attachment) {
      setError(`${selectedType.name} requires an attachment (e.g. a certificate).`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('leaveTypeId', leaveTypeId);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      if (remarks) formData.append('remarks', remarks);
      if (attachment) formData.append('attachment', attachment);

      await timeoffApi.createRequest(formData);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Time off Type Request" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>

        <div className="grid grid-cols-[140px_1fr] items-center gap-y-3 text-sm">
          <span className="text-text-muted">Employee</span>
          <span className="text-text">
            {user?.employee?.firstName} {user?.employee?.lastName}
          </span>

          <label htmlFor="leaveType" className="text-text-muted">Time off Type</label>
          <Select
            id="leaveType"
            label=""
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            className="[&>label]:hidden"
          >
            {balances.map((b) => (
              <option key={b.leaveTypeId} value={b.leaveTypeId}>
                {b.name} ({b.remainingDays} days available)
              </option>
            ))}
          </Select>

          <span className="text-text-muted">Validity Period</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text
                         focus:border-primary focus:outline-none"
            />
            <span className="text-text-muted">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text
                         focus:border-primary focus:outline-none"
            />
          </div>

          <span className="text-text-muted">Allocation</span>
          <span className="text-text">
            {allocationDays !== null ? allocationDays.toFixed(2) : '—'} Days
          </span>
        </div>

        <Textarea id="remarks" label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />

        <div>
          <label htmlFor="attachment" className="mb-1 block text-sm font-medium text-text">
            Attachment{' '}
            <span className="text-text-muted">
              {selectedType?.requiresAttachment
                ? '(required — sick leave certificate)'
                : '(optional, for sick leave certificate)'}
            </span>
          </label>
          <input
            id="attachment"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="w-full text-sm text-text"
          />
          {attachment && (
            <p className="mt-1 text-xs text-text-muted">Selected: {attachment.name}</p>
          )}
        </div>

        <div className="flex justify-start gap-3 pt-2">
          <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Discard</Button>
        </div>
      </form>
    </Modal>
  );
}
