import { resolveAssetUrl } from '../../utils/resolveAssetUrl.js';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
};

function initials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export function Avatar({ firstName, lastName, avatarUrl, size = 'md', className = '' }) {
  const sizeClasses = SIZES[size] || SIZES.md;

  if (avatarUrl) {
    return (
      <img
        src={resolveAssetUrl(avatarUrl)}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClasses} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} ${className} flex items-center justify-center rounded-full
                  bg-primary/15 font-semibold text-primary`}
    >
      {initials(firstName, lastName)}
    </div>
  );
}
