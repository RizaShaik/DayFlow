export function Select({ label, id, error, className = '', children, ...selectProps }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-text">
        {label}
      </label>
      <select
        id={id}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        {...selectProps}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
