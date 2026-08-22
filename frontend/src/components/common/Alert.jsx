const styles = {
  error: 'bg-danger/10 text-danger border-danger/30',
  success: 'bg-success/10 text-success border-success/30',
};

export function Alert({ variant = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${styles[variant]}`} role="alert">
      {children}
    </div>
  );
}
