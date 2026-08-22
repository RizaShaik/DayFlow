import { useEffect, useState } from 'react';
import { timeoffApi } from '../../api/timeoffApi.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Select } from '../../components/common/Select.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl.js';

const STATUS_STYLES = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
};

function isPdfUrl(url) {
  return /\.pdf$/i.test(url || '');
}

export function CompanyTimeOffView() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [previewRequest, setPreviewRequest] = useState(null);

  function reload() {
    timeoffApi
      .companyRequests(status ? { status } : {})
      .then(setRequests)
      .catch(() => setError('Could not load requests.'));
  }

  useEffect(reload, [status]);

  async function handleDecision(id, decisionStatus) {
    setBusyId(id);
    try {
      await timeoffApi.decide(id, { status: decisionStatus });
      reload();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not update this request.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Time Off</h1>
        <Select id="statusFilter" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </Select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-alt text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Start Date</th>
              <th className="px-4 py-2 font-medium">End Date</th>
              <th className="px-4 py-2 font-medium">Time off Type</th>
              <th className="px-4 py-2 font-medium">Certificate</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" firstName={r.employee?.firstName} lastName={r.employee?.lastName} avatarUrl={r.employee?.avatarUrl} />
                    <span className="text-text">{r.employee?.firstName} {r.employee?.lastName}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-text-muted">{r.startDate}</td>
                <td className="px-4 py-2 text-text-muted">{r.endDate}</td>
                <td className="px-4 py-2 text-text-muted">{r.leaveType}</td>
                <td className="px-4 py-2">
                  {r.attachmentUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewRequest(r)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View certificate
                    </button>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        className="h-8 px-2 text-xs"
                        disabled={busyId === r.id}
                        onClick={() => handleDecision(r.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        disabled={busyId === r.id}
                        onClick={() => handleDecision(r.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {previewRequest && (
        <Modal title="Sick Leave Certificate" onClose={() => setPreviewRequest(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Avatar
                size="sm"
                firstName={previewRequest.employee?.firstName}
                lastName={previewRequest.employee?.lastName}
                avatarUrl={previewRequest.employee?.avatarUrl}
              />
              <span className="text-text">
                {previewRequest.employee?.firstName} {previewRequest.employee?.lastName}
              </span>
              <span className="text-text-muted">
                &middot; {previewRequest.startDate} to {previewRequest.endDate}
              </span>
            </div>

            {isPdfUrl(previewRequest.attachmentUrl) ? (
              <a
                href={resolveAssetUrl(previewRequest.attachmentUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Open PDF certificate in a new tab
              </a>
            ) : (
              <img
                src={resolveAssetUrl(previewRequest.attachmentUrl)}
                alt="Sick leave certificate"
                className="max-h-[60vh] w-full rounded-md border border-border object-contain"
              />
            )}

            {previewRequest.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  disabled={busyId === previewRequest.id}
                  onClick={async () => {
                    await handleDecision(previewRequest.id, 'approved');
                    setPreviewRequest(null);
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  disabled={busyId === previewRequest.id}
                  onClick={async () => {
                    await handleDecision(previewRequest.id, 'rejected');
                    setPreviewRequest(null);
                  }}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
