let accessToken = null;
let onAuthFailure = () => {};

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

/** Called by AuthProvider so the axios interceptor can report hard auth failures. */
export function setAuthFailureHandler(handler) {
  onAuthFailure = handler;
}

export function reportAuthFailure() {
  onAuthFailure();
}
