import fullLogo from '../../assets/dayflow-logo.png';
import mark from '../../assets/dayflow-mark.png';

/**
 * Dayflow logo. `variant="full"` is the icon+wordmark lockup (navbar, auth
 * screens); `variant="mark"` is the icon alone (compact/square contexts).
 */
export function Logo({ variant = 'full', height = 28, className = '' }) {
  const src = variant === 'mark' ? mark : fullLogo;
  return <img src={src} alt="Dayflow" style={{ height }} className={`w-auto ${className}`} />;
}
