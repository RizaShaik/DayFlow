function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-text">{value || '—'}</p>
    </div>
  );
}

export function BankDetailsTab({ bankDetails }) {
  if (!bankDetails) {
    return <p className="text-sm text-text-muted">No bank details on file.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Account Number" value={bankDetails.accountNumber} />
      <Field label="Bank Name" value={bankDetails.bankName} />
      <Field label="IFSC Code" value={bankDetails.ifscCode} />
      <Field label="UAN No" value={bankDetails.uanNo} />
      <Field label="PAN No" value={bankDetails.panNo} />
    </div>
  );
}
