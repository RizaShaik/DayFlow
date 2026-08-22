const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const API_ORIGIN = new URL(API_BASE_URL).origin;

/** Uploaded files (avatars, attachments) are served from the API origin at
 * a relative path like "/uploads/avatars/x.jpg" — not the frontend's own
 * dev server origin, and not under /api/v1. */
export function resolveAssetUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}
