function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-text">{value || '—'}</p>
    </div>
  );
}

export function PrivateInfoTab({ privateInfo, employeeCode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Employee Code" value={employeeCode} />
      <Field label="Date of Birth" value={privateInfo.dateOfBirth} />
      <Field label="Gender" value={privateInfo.gender} />
      <Field label="Marital Status" value={privateInfo.maritalStatus} />
      <Field label="Nationality" value={privateInfo.nationality} />
      <Field label="Personal Email" value={privateInfo.personalEmail} />
      <Field label="Residing Address" value={privateInfo.residingAddress} />
    </div>
  );
}
