export function TextField({ label, id, error, className = '', ...inputProps }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text
                   placeholder:text-text-muted focus:border-primary focus:outline-none
                   focus:ring-1 focus:ring-primary"
        {...inputProps}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
