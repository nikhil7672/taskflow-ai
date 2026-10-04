import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { CookieOptions } from 'express';
import { z } from 'zod';

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELISM = 1;
const PASSWORD_KEY_BYTES = 32;
const PASSWORD_SALT_BYTES = 16;

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((email) => email.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: emailSchema,
  password: z.string().min(12).max(128),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const passwordResetRequestSchema = z.object({ email: emailSchema });
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(40).max(128),
  password: z.string().min(12).max(128),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160),
});
export const workspaceUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      PASSWORD_KEY_BYTES,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELISM,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const key = await scrypt(password, salt);
  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELISM,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, cost, blockSize, parallelism, saltText, keyText, extra] = encoded.split('$');
  if (
    algorithm !== 'scrypt' ||
    cost !== String(SCRYPT_COST) ||
    blockSize !== String(SCRYPT_BLOCK_SIZE) ||
    parallelism !== String(SCRYPT_PARALLELISM) ||
    !saltText ||
    !keyText ||
    extra !== undefined
  ) {
    return false;
  }

  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(keyText, 'base64url');
  if (salt.length !== PASSWORD_SALT_BYTES || expected.length !== PASSWORD_KEY_BYTES) return false;

  const actual = await scrypt(password, salt);
  return timingSafeEqual(actual, expected);
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const SESSION_COOKIE_NAME = 'taskflow_session';

export function sessionCookieOptions(maxAge: number): CookieOptions {
  const domain = process.env.SESSION_COOKIE_DOMAIN?.trim();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

export function clearSessionCookieOptions(): CookieOptions {
  const options = sessionCookieOptions(0);
  delete options.maxAge;
  return options;
}

export function readSessionCookie(header: string | undefined): string | undefined {
  if (!header) return undefined;
  let token: string | undefined;
  for (const entry of header.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0 || entry.slice(0, separator).trim() !== SESSION_COOKIE_NAME) continue;
    if (token) return undefined;
    token = entry.slice(separator + 1).trim();
  }
  return token && /^[A-Za-z0-9_-]{40,128}$/.test(token) ? token : undefined;
}

export function isTrustedBrowserOrigin(origin: string | undefined): boolean {
  const expected = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  return origin === expected;
}
