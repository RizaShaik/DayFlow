import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';

async function withServer(fn) {
  const app = createApp();
  const server = http.createServer(app).listen(0);
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}/api/v1`);
  } finally {
    server.close();
  }
}

/** Captures console output (logger.info -> console.info) during fn(). */
async function captureLogs(fn) {
  const originalLog = console.log;
  const originalInfo = console.info;
  const lines = [];
  const capture = (...args) => lines.push(args.join(' '));
  console.log = capture;
  console.info = capture;
  try {
    const result = await fn();
    return { result, lines };
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
  }
}

function extractVerificationToken(lines) {
  const line = lines.find((l) => l.includes('/verify-email/'));
  const match = /verify-email\/([a-f0-9]{64})/.exec(line || '');
  if (!match) throw new Error('verification token not found in logs');
  return match[1];
}

function uniqueEmail() {
  return `user${Date.now()}${Math.floor(Math.random() * 1e6)}@test.dayflow`;
}

test('rejects signup with a weak password', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Test Co',
        name: 'Weak Pass',
        email: uniqueEmail(),
        password: 'weak',
      }),
    });
    assert.equal(res.status, 400);
  });
});

test('rejects signin with unknown identifier', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'nobody@nowhere.test', password: 'whatever123' }),
    });
    assert.equal(res.status, 401);
  });
});

test('rejects protected routes without a token', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/me`);
    assert.equal(res.status, 401);
  });
});

test('full auth lifecycle: signup -> verify -> signin -> refresh -> change-password -> logout', async () => {
  await withServer(async (base) => {
    const email = uniqueEmail();
    const password = 'Sup3r$ecretPass';

    const { result: signupResult, lines } = await captureLogs(async () => {
      const res = await fetch(`${base}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: 'Lifecycle Co', name: 'Lin Cycle', email, password }),
      });
      return { status: res.status, body: await res.json() };
    });
    assert.equal(signupResult.status, 201);
    assert.match(signupResult.body.data.loginId, /^OILICY\d{8}$/);
    const verificationToken = extractVerificationToken(lines);

    // Duplicate signup must be rejected.
    const dup = await fetch(`${base}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: 'Lifecycle Co', name: 'Lin Cycle', email, password }),
    });
    assert.equal(dup.status, 409);

    // Can't sign in before verifying.
    const preVerifySignin = await fetch(`${base}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password }),
    });
    assert.equal(preVerifySignin.status, 403);

    // Verify email -> issues access token + refresh cookie.
    const verifyRes = await fetch(`${base}/auth/verify-email/${verificationToken}`);
    assert.equal(verifyRes.status, 200);
    const verifyBody = await verifyRes.json();
    assert.ok(verifyBody.data.accessToken);
    const refreshCookie = verifyRes.headers.get('set-cookie');
    assert.match(refreshCookie, /dayflow_refresh_token=/);
    const cookieHeader = refreshCookie.split(';')[0];

    // Wrong password rejected.
    const wrongPassword = await fetch(`${base}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password: 'WrongPass$1' }),
    });
    assert.equal(wrongPassword.status, 401);

    // Correct signin, by login_id this time.
    const signinRes = await fetch(`${base}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: signupResult.body.data.loginId, password }),
    });
    assert.equal(signinRes.status, 200);
    const { data: signinData } = await signinRes.json();
    const accessToken = signinData.accessToken;

    // /me reflects the authenticated user.
    const meRes = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meBody = await meRes.json();
    assert.equal(meBody.data.user.email, email);

    // Refresh rotates the token and returns a new access token.
    const refreshRes = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    assert.equal(refreshRes.status, 200);
    const refreshBody = await refreshRes.json();
    assert.ok(refreshBody.data.accessToken);
    const rotatedCookie = refreshRes.headers.get('set-cookie').split(';')[0];

    // Change password, then confirm old password no longer works.
    const changeRes = await fetch(`${base}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ currentPassword: password, newPassword: 'BrandNew$99' }),
    });
    assert.equal(changeRes.status, 200);

    const oldPasswordSignin = await fetch(`${base}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password }),
    });
    assert.equal(oldPasswordSignin.status, 401);

    // Logout revokes the refresh token.
    const logoutRes = await fetch(`${base}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: rotatedCookie },
    });
    assert.equal(logoutRes.status, 200);

    const refreshAfterLogout = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: rotatedCookie },
    });
    assert.equal(refreshAfterLogout.status, 401);
  });
});
