import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasWorkspaceRole } from './access-control.js';
import { FixedWindowRateLimiter } from './rate-limit.js';
import {
  createOpaqueToken,
  hashPassword,
  hashToken,
  isTrustedBrowserOrigin,
  loginSchema,
  readSessionCookie,
  registerSchema,
  sessionCookieOptions,
  verifyPassword,
} from './security.js';

test('password hashes are salted and only verify the matching password', async () => {
  const firstHash = await hashPassword('A secure test password 123');
  const secondHash = await hashPassword('A secure test password 123');

  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyPassword('A secure test password 123', firstHash), true);
  assert.equal(await verifyPassword('incorrect password', firstHash), false);
  assert.equal(await verifyPassword('password', 'invalid-hash'), false);
});

test('opaque session and reset tokens are random and stored as one-way hashes', () => {
  const token = createOpaqueToken();
  assert.match(token, /^[A-Za-z0-9_-]{40,128}$/u);
  assert.notEqual(token, hashToken(token));
  assert.equal(hashToken(token), hashToken(token));
});

test('registration validates required fields and canonicalizes email', () => {
  const result = registerSchema.safeParse({
    name: '  Ada Lovelace  ',
    email: ' ADA@EXAMPLE.COM ',
    password: 'A long secure password',
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, 'Ada Lovelace');
    assert.equal(result.data.email, 'ada@example.com');
  }
  assert.equal(
    registerSchema.safeParse({ name: 'Ada', email: 'ada@example.com', password: 'short' }).success,
    false,
  );
});

test('login never accepts frontend role fields as validated credentials', () => {
  const result = loginSchema.safeParse({
    email: 'member@example.com',
    password: 'correct horse battery staple',
    role: 'OWNER',
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal('role' in result.data, false);
});

test('workspace role policy grants only explicitly allowed database roles', () => {
  assert.equal(hasWorkspaceRole('OWNER', ['OWNER', 'ADMIN']), true);
  assert.equal(hasWorkspaceRole('ADMIN', ['OWNER', 'ADMIN']), true);
  assert.equal(hasWorkspaceRole('MEMBER', ['OWNER', 'ADMIN']), false);
  assert.equal(hasWorkspaceRole(undefined, ['OWNER', 'ADMIN']), false);
});

test('session cookie is httpOnly, same-site, and secure in production', () => {
  const originalEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const options = sessionCookieOptions(60_000);
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.path, '/');
    assert.equal(options.maxAge, 60_000);
  } finally {
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  }
});

test('cookie parsing rejects malformed opaque tokens', () => {
  const token = createOpaqueToken();
  assert.equal(readSessionCookie(`other=x; taskflow_session=${token}`), token);
  assert.equal(readSessionCookie('taskflow_session=too-short'), undefined);
  assert.equal(
    readSessionCookie(`taskflow_session=${token}; taskflow_session=${token}`),
    undefined,
  );
  assert.equal(readSessionCookie(undefined), undefined);
});

test('browser mutation origins must match the configured web origin', () => {
  const originalOrigin = process.env.WEB_ORIGIN;
  process.env.WEB_ORIGIN = 'https://app.example.test';
  try {
    assert.equal(isTrustedBrowserOrigin('https://app.example.test'), true);
    assert.equal(isTrustedBrowserOrigin('https://evil.example.test'), false);
    assert.equal(isTrustedBrowserOrigin(undefined), false);
  } finally {
    if (originalOrigin === undefined) delete process.env.WEB_ORIGIN;
    else process.env.WEB_ORIGIN = originalOrigin;
  }
});

test('rate limiter blocks attempts until the fixed window expires', () => {
  const limiter = new FixedWindowRateLimiter(2, 10_000);
  assert.equal(limiter.consume('login:127.0.0.1', 1_000).allowed, true);
  assert.equal(limiter.consume('login:127.0.0.1', 2_000).allowed, true);
  assert.deepEqual(limiter.consume('login:127.0.0.1', 3_000), {
    allowed: false,
    retryAfterSeconds: 8,
  });
  assert.equal(limiter.consume('login:127.0.0.1', 11_001).allowed, true);
});
