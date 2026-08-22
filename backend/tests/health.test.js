import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';

test('GET /api/v1/health returns ok status', async () => {
  const app = createApp();
  const server = http.createServer(app).listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/api/v1/health`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'ok');
  } finally {
    server.close();
  }
});
