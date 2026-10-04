import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { app } from '../app.js';

test('authentication routes validate input and protect profile/workspace data', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    const profileResponse = await fetch(`${baseUrl}/auth/me`);
    assert.equal(profileResponse.status, 401);

    const workspaceResponse = await fetch(`${baseUrl}/workspaces/not-owned`);
    assert.equal(workspaceResponse.status, 401);

    const invalidRegistration = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
        'content-type': 'application/json',
      },
      body: '{}',
    });
    assert.equal(invalidRegistration.status, 400);

    const crossOriginLogout = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { origin: 'https://attacker.invalid', 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(crossOriginLogout.status, 403);
  } finally {
    server.close();
    await once(server, 'close');
  }
});
