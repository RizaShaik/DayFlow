import { useState } from 'react';

export function TextField({ label, id, error, className = '', type, ...inputProps }) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          className={`w-full rounded-md border border-border bg-surface px-3 py-2 text-text
                     placeholder:text-text-muted focus:border-primary focus:outline-none
                     focus:ring-1 focus:ring-primary ${isPassword ? 'pr-10' : ''}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text"
          >
            {revealed ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
