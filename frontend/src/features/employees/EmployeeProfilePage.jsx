import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { employeesApi } from '../../api/employeesApi.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ProfileTab } from './tabs/ProfileTab.jsx';
import { ResumeTab } from './tabs/ResumeTab.jsx';
import { PrivateInfoTab } from './tabs/PrivateInfoTab.jsx';
import { BankDetailsTab } from './tabs/BankDetailsTab.jsx';
import { SalaryInfoTab } from './tabs/SalaryInfoTab.jsx';
import { EmployeeEditModal } from './EmployeeEditModal.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export function EmployeeProfilePage() {
  const { id } = useParams();
  const { user, refreshMe } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showEditModal, setShowEditModal] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setEmployee(null);
    setError('');
    setActiveTab('profile');
    employeesApi
      .getById(id)
      .then(setEmployee)
      .catch(() => setError('Could not load this employee.'));
  }, [id]);

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-danger">{error}</p>
        <Link to="/employees" className="text-sm text-primary hover:underline">
          Back to Employees
        </Link>
      </div>
    );
  }

  if (!employee) {
    return <p className="text-sm text-text-muted">Loading…</p>;
  }

  const isPrivilegedViewer = user?.role === 'admin' || user?.role === 'hr';
  const canEdit = employee.isSelf || isPrivilegedViewer;

  // privateInfo/bankDetails/salaryInfo are gated together server-side (self
  // or admin/hr); privateInfo's presence is the access signal. bankDetails
  // or salaryInfo can still individually be null for an authorized viewer
  // if that employee simply has no bank/salary record yet — their tabs
  // handle that as an empty state, not as "no access".
  const canViewSensitive = employee.privateInfo !== null;
  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'resume', label: 'Resume' },
    canViewSensitive && { key: 'private', label: 'Private Info' },
    canViewSensitive && { key: 'bank', label: 'Bank Details' },
    canViewSensitive && { key: 'salary', label: 'Salary Info' },
  ].filter(Boolean);

  async function handleAvatarSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const { avatarUrl } = await employeesApi.uploadAvatar(employee.id, file);
      setEmployee((prev) => ({ ...prev, avatarUrl }));
      if (employee.isSelf) await refreshMe();
    } catch (err) {
      setAvatarError(err.response?.data?.error?.message || 'Could not upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/employees" className="text-sm text-primary hover:underline">
        ← Back to Employees
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              size="lg"
              firstName={employee.firstName}
              lastName={employee.lastName}
              avatarUrl={employee.avatarUrl}
            />
            {canEdit && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change photo"
                title="Change photo"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center
                           rounded-full border border-border bg-surface text-xs shadow-sm
                           hover:bg-surface-alt disabled:opacity-60"
              >
                📷
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelected}
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text">
              {employee.firstName} {employee.lastName}
              {employee.isSelf && (
                <span className="ml-2 text-xs font-normal text-text-muted">(You)</span>
              )}
            </h1>
            <p className="text-sm text-text-muted">{employee.jobPosition || '—'}</p>
            {avatarError && <p className="mt-1 text-xs text-danger">{avatarError}</p>}
          </div>
        </div>
        {canEdit && (
          <Button variant="ghost" onClick={() => setShowEditModal(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        {activeTab === 'profile' && <ProfileTab employee={employee} />}
        {activeTab === 'resume' && <ResumeTab employee={employee} />}
        {activeTab === 'private' && employee.privateInfo && (
          <PrivateInfoTab privateInfo={employee.privateInfo} employeeCode={employee.employeeCode} />
        )}
        {activeTab === 'bank' && <BankDetailsTab bankDetails={employee.bankDetails} />}
        {activeTab === 'salary' && (
          <SalaryInfoTab
            employeeId={employee.id}
            salaryInfo={employee.salaryInfo}
            isPrivileged={isPrivilegedViewer}
            onConfigured={(salaryInfo) => setEmployee((prev) => ({ ...prev, salaryInfo }))}
          />
        )}
      </div>

      {showEditModal && (
        <EmployeeEditModal
          employee={employee}
          isPrivileged={isPrivilegedViewer}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setEmployee(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
