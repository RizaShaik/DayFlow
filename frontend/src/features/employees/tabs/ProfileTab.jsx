function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-text">{value || '—'}</p>
    </div>
  );
}

export function ProfileTab({ employee }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Login ID" value={employee.loginId} />
      <Field label="Email" value={employee.email} />
      <Field label="Mobile" value={employee.phone} />
      <Field label="Department" value={employee.department?.name} />
      <Field
        label="Manager"
        value={
          employee.manager
            ? `${employee.manager.firstName} ${employee.manager.lastName}`
            : null
        }
      />
      <Field label="Job Position" value={employee.jobPosition} />
      <Field label="Location" value={employee.workLocation} />
      <Field label="Date of Joining" value={employee.dateOfJoining} />
    </div>
  );
}
