import { formatCurrency } from '../../../utils/formatCurrency.js';

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

export function SalaryInfoTab({ salaryInfo }) {
  if (!salaryInfo) {
    return <p className="text-sm text-text-muted">No salary structure configured yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
    </div>
  );
}
