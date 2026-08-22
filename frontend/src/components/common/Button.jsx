export function Button({ variant = 'primary', className = '', disabled, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    // Light mode: white text on navy passes AAA (~12:1). Dark mode swaps to
    // dark text on the lighter accent blue — white text there only hits
    // ~2.8:1 and fails WCAG AA, so it can't just follow the theme's --color-primary blindly.
    primary: 'bg-primary text-white dark:text-surface hover:bg-primary-hover',
    ghost: 'border border-border text-text hover:bg-surface-alt',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
