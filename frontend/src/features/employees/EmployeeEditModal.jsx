import { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal.jsx';
import { TextField } from '../../components/common/TextField.jsx';
import { Textarea } from '../../components/common/Textarea.jsx';
import { Select } from '../../components/common/Select.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { employeesApi } from '../../api/employeesApi.js';
import { departmentsApi } from '../../api/departmentsApi.js';

function toCsv(arr) {
  return (arr || []).join(', ');
}

function fromCsv(value) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function EmployeeEditModal({ employee, isPrivileged, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    phone: employee.phone || '',
    jobPosition: employee.jobPosition || '',
    workLocation: employee.workLocation || '',
    departmentId: employee.department?.id || '',
    managerId: employee.manager?.id || '',
    dateOfJoining: employee.dateOfJoining || '',
    about: employee.about || '',
    skills: toCsv(employee.skills),
    certifications: toCsv(employee.certifications),
    residingAddress: employee.privateInfo?.residingAddress || '',
    dateOfBirth: employee.privateInfo?.dateOfBirth || '',
    gender: employee.privateInfo?.gender || '',
    maritalStatus: employee.privateInfo?.maritalStatus || '',
    nationality: employee.privateInfo?.nationality || '',
    personalEmail: employee.privateInfo?.personalEmail || '',
    accountNumber: employee.bankDetails?.accountNumber || '',
    bankName: employee.bankDetails?.bankName || '',
    ifscCode: employee.bankDetails?.ifscCode || '',
    uanNo: employee.bankDetails?.uanNo || '',
    panNo: employee.bankDetails?.panNo || '',
  });
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isPrivileged) return;
    departmentsApi.list().then(setDepartments).catch(() => {});
    employeesApi.list({}).then(setEmployees).catch(() => {});
  }, [isPrivileged]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const shared = {
        phone: form.phone || undefined,
        residingAddress: form.residingAddress || undefined,
        about: form.about || undefined,
        skills: fromCsv(form.skills),
        certifications: fromCsv(form.certifications),
      };
      const payload = isPrivileged
        ? {
            ...shared,
            firstName: form.firstName || undefined,
            lastName: form.lastName || undefined,
            jobPosition: form.jobPosition || undefined,
            workLocation: form.workLocation || undefined,
            departmentId: form.departmentId || undefined,
            managerId: form.managerId || undefined,
            dateOfJoining: form.dateOfJoining || undefined,
            dateOfBirth: form.dateOfBirth || undefined,
            gender: form.gender || undefined,
            maritalStatus: form.maritalStatus || undefined,
            nationality: form.nationality || undefined,
            personalEmail: form.personalEmail || undefined,
            accountNumber: form.accountNumber || undefined,
            bankName: form.bankName || undefined,
            ifscCode: form.ifscCode || undefined,
            uanNo: form.uanNo || undefined,
            panNo: form.panNo || undefined,
          }
        : shared;

      const updated = await employeesApi.update(employee.id, payload);
      onSaved(updated);
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
    <Modal title="Edit Employee" onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
        <Alert>{error}</Alert>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <TextField id="firstName" label="First Name" value={form.firstName} onChange={update('firstName')} disabled={!isPrivileged} />
            <TextField id="lastName" label="Last Name" value={form.lastName} onChange={update('lastName')} disabled={!isPrivileged} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField id="phone" label="Mobile" value={form.phone} onChange={update('phone')} />
            <TextField id="jobPosition" label="Job Position" value={form.jobPosition} onChange={update('jobPosition')} disabled={!isPrivileged} />
          </div>
          {isPrivileged && (
            <div className="grid grid-cols-2 gap-4">
              <Select id="departmentId" label="Department" value={form.departmentId} onChange={update('departmentId')}>
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
              <Select id="managerId" label="Manager" value={form.managerId} onChange={update('managerId')}>
                <option value="">—</option>
                {employees.filter((e) => e.id !== employee.id).map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </Select>
            </div>
          )}
          {isPrivileged && (
            <div className="grid grid-cols-2 gap-4">
              <TextField id="workLocation" label="Location" value={form.workLocation} onChange={update('workLocation')} />
              <TextField id="dateOfJoining" label="Date of Joining" type="date" value={form.dateOfJoining} onChange={update('dateOfJoining')} />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Resume</h3>
          <Textarea id="about" label="About" value={form.about} onChange={update('about')} />
          <TextField id="skills" label="Skills (comma-separated)" value={form.skills} onChange={update('skills')} />
          <TextField id="certifications" label="Certifications (comma-separated)" value={form.certifications} onChange={update('certifications')} />
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Private Info</h3>
          <TextField id="residingAddress" label="Residing Address" value={form.residingAddress} onChange={update('residingAddress')} />
          {isPrivileged && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <TextField id="dateOfBirth" label="Date of Birth" type="date" value={form.dateOfBirth} onChange={update('dateOfBirth')} />
                <TextField id="personalEmail" label="Personal Email" type="email" value={form.personalEmail} onChange={update('personalEmail')} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select id="gender" label="Gender" value={form.gender} onChange={update('gender')}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
                <Select id="maritalStatus" label="Marital Status" value={form.maritalStatus} onChange={update('maritalStatus')}>
                  <option value="">—</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="other">Other</option>
                </Select>
                <TextField id="nationality" label="Nationality" value={form.nationality} onChange={update('nationality')} />
              </div>
            </>
          )}
        </section>

        {isPrivileged && (
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Bank Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <TextField id="accountNumber" label="Account Number" value={form.accountNumber} onChange={update('accountNumber')} />
              <TextField id="bankName" label="Bank Name" value={form.bankName} onChange={update('bankName')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <TextField id="ifscCode" label="IFSC Code" value={form.ifscCode} onChange={update('ifscCode')} />
              <TextField id="uanNo" label="UAN No" value={form.uanNo} onChange={update('uanNo')} />
              <TextField id="panNo" label="PAN No" value={form.panNo} onChange={update('panNo')} />
            </div>
          </section>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}
