import { useState } from 'react';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { Button } from '../../../components/common/Button.jsx';
import { SalaryConfigModal } from '../SalaryConfigModal.jsx';

const COMPONENT_LABELS = {
  basic: 'Basic Salary',
  hra: 'House Rent Allowance',
  standard_allowance: 'Standard Allowance',
  performance_bonus: 'Performance Bonus',
  lta: 'Leave Travel Allowance',
  fixed_allowance: 'Fixed Allowance',
  pf_employee: 'Provident Fund (Employee)',
  pf_employer: 'Provident Fund (Employer)',
  professional_tax: 'Professional Tax',
};

export function SalaryInfoTab({ employeeId, salaryInfo, isPrivileged, onConfigured }) {
  const [showModal, setShowModal] = useState(false);

  if (!salaryInfo) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">No salary structure configured yet.</p>
        {isPrivileged && <Button onClick={() => setShowModal(true)}>Configure Salary</Button>}
        {showModal && (
          <SalaryConfigModal
            employeeId={employeeId}
            currentSalaryInfo={null}
            onClose={() => setShowModal(false)}
            onSaved={(info) => {
              setShowModal(false);
              onConfigured(info);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-text-muted">Month Wage</p>
            <p className="text-sm text-text">{formatCurrency(salaryInfo.monthlyWage)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Working Days / Week</p>
            <p className="text-sm text-text">{salaryInfo.workingDaysPerWeek}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Break Time</p>
            <p className="text-sm text-text">{salaryInfo.breakTimeHours} hrs</p>
          </div>
        </div>
        {isPrivileged && (
          <Button variant="ghost" onClick={() => setShowModal(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-alt text-text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Component</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {salaryInfo.components.map((c) => (
              <tr key={c.type} className="border-t border-border">
                <td className="px-3 py-2 text-text">{COMPONENT_LABELS[c.type] || c.type}</td>
                <td className="px-3 py-2 text-text-muted">
                  {c.computationType === 'percentage' ? `${Number(c.value).toFixed(2)}%` : '—'}
                </td>
                <td className="px-3 py-2 text-text">{formatCurrency(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SalaryConfigModal
          employeeId={employeeId}
          currentSalaryInfo={salaryInfo}
          onClose={() => setShowModal(false)}
          onSaved={(info) => {
            setShowModal(false);
            onConfigured(info);
          }}
        />
      )}
    </div>
  );
}
