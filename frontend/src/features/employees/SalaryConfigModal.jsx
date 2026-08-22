import { useState } from 'react';
import { Modal } from '../../components/common/Modal.jsx';
import { TextField } from '../../components/common/TextField.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { payrollApi } from '../../api/payrollApi.js';

export function SalaryConfigModal({ employeeId, currentSalaryInfo, onClose, onSaved }) {
  const [monthlyWage, setMonthlyWage] = useState(currentSalaryInfo?.monthlyWage ?? '');
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(
    currentSalaryInfo?.workingDaysPerWeek ?? 5
  );
  const [breakTimeHours, setBreakTimeHours] = useState(currentSalaryInfo?.breakTimeHours ?? 1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const salaryInfo = await payrollApi.configure(employeeId, {
        monthlyWage: Number(monthlyWage),
        workingDaysPerWeek: Number(workingDaysPerWeek),
        breakTimeHours: Number(breakTimeHours),
      });
      onSaved(salaryInfo);
    } catch (err) {
      const apiError = err.response?.data?.error;
      const message =
        apiError?.details?.map((d) => d.message).join(' ') ||
        apiError?.message ||
        'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Configure Salary" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <TextField
          id="monthlyWage"
          label="Monthly Wage (₹)"
          type="number"
          min="0"
          step="0.01"
          value={monthlyWage}
          onChange={(e) => setMonthlyWage(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="workingDaysPerWeek"
            label="Working Days / Week"
            type="number"
            min="1"
            max="7"
            value={workingDaysPerWeek}
            onChange={(e) => setWorkingDaysPerWeek(e.target.value)}
          />
          <TextField
            id="breakTimeHours"
            label="Break Time (hrs)"
            type="number"
            min="0"
            max="8"
            step="0.5"
            value={breakTimeHours}
            onChange={(e) => setBreakTimeHours(e.target.value)}
          />
        </div>
        <p className="text-xs text-text-muted">
          Basic, HRA, allowances, PF, and professional tax are all recalculated automatically
          from the wage.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}
