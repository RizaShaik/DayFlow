import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { employeesApi } from '../../api/employeesApi.js';
import { Avatar } from '../../components/common/Avatar.jsx';
import { ProfileTab } from './tabs/ProfileTab.jsx';
import { ResumeTab } from './tabs/ResumeTab.jsx';
import { PrivateInfoTab } from './tabs/PrivateInfoTab.jsx';
import { BankDetailsTab } from './tabs/BankDetailsTab.jsx';
import { SalaryInfoTab } from './tabs/SalaryInfoTab.jsx';

export function EmployeeProfilePage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

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

  return (
    <div className="space-y-6">
      <Link to="/employees" className="text-sm text-primary hover:underline">
        ← Back to Employees
      </Link>

      <div className="flex items-center gap-4">
        <Avatar
          size="lg"
          firstName={employee.firstName}
          lastName={employee.lastName}
          avatarUrl={employee.avatarUrl}
        />
        <div>
          <h1 className="text-xl font-semibold text-text">
            {employee.firstName} {employee.lastName}
            {employee.isSelf && (
              <span className="ml-2 text-xs font-normal text-text-muted">(You)</span>
            )}
          </h1>
          <p className="text-sm text-text-muted">{employee.jobPosition || '—'}</p>
        </div>
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
        {activeTab === 'salary' && <SalaryInfoTab salaryInfo={employee.salaryInfo} />}
      </div>
    </div>
  );
}
