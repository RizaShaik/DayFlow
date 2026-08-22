import { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal.jsx';
import { TextField } from '../../components/common/TextField.jsx';
import { Select } from '../../components/common/Select.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { employeesApi } from '../../api/employeesApi.js';
import { departmentsApi } from '../../api/departmentsApi.js';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'employee',
  departmentId: '',
  managerId: '',
  jobPosition: '',
  workLocation: '',
  phone: '',
  dateOfJoining: new Date().toISOString().slice(0, 10),
};

export function EmployeeCreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => {});
    employeesApi.list({}).then(setEmployees).catch(() => {});
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        departmentId: form.departmentId || undefined,
        managerId: form.managerId || undefined,
        phone: form.phone || undefined,
        jobPosition: form.jobPosition || undefined,
        workLocation: form.workLocation || undefined,
      };
      const created = await employeesApi.create(payload);
      setResult(created);
      onCreated?.();
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

  if (result) {
    return (
      <Modal title="Employee added" onClose={onClose}>
        <Alert variant="success">
          {form.firstName} {form.lastName} has been added with Login ID{' '}
          <strong>{result.loginId}</strong>.
        </Alert>
        {result.tempPassword ? (
          <div className="mt-4 rounded-md border border-warning/30 bg-warning/10 p-4 text-sm">
            <p className="text-text">
              SMTP isn&rsquo;t configured, so this wasn&rsquo;t emailed — share it with them
              directly:
            </p>
            <p className="mt-2 font-mono text-base font-semibold text-text">
              {result.tempPassword}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              They&rsquo;ll be asked to set a new password on first login. This won&rsquo;t be
              shown again.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            Their temporary password was emailed to them.
          </p>
        )}
        <Button className="mt-4" onClick={onClose}>
          Done
        </Button>
      </Modal>
    );
  }

  return (
    <Modal title="New Employee" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <div className="grid grid-cols-2 gap-4">
          <TextField id="firstName" label="First Name" value={form.firstName} onChange={update('firstName')} required />
          <TextField id="lastName" label="Last Name" value={form.lastName} onChange={update('lastName')} required />
        </div>
        <TextField id="email" label="Email" type="email" value={form.email} onChange={update('email')} required />
        <div className="grid grid-cols-2 gap-4">
          <Select id="role" label="Role" value={form.role} onChange={update('role')}>
            <option value="employee">Employee</option>
            <option value="hr">HR Officer</option>
          </Select>
          <TextField id="dateOfJoining" label="Date of Joining" type="date" value={form.dateOfJoining} onChange={update('dateOfJoining')} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select id="departmentId" label="Department" value={form.departmentId} onChange={update('departmentId')}>
            <option value="">—</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Select id="managerId" label="Manager" value={form.managerId} onChange={update('managerId')}>
            <option value="">—</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField id="jobPosition" label="Job Position" value={form.jobPosition} onChange={update('jobPosition')} />
          <TextField id="workLocation" label="Location" value={form.workLocation} onChange={update('workLocation')} />
        </div>
        <TextField id="phone" label="Mobile" value={form.phone} onChange={update('phone')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
