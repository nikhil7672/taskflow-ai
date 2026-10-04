import { Router, type RequestHandler } from 'express';
import { prisma } from '@taskflow/database';
import { isEmailDeliveryConfigured, sendPasswordResetEmail } from './email.js';
import { requireAuth, requireTrustedOrigin, type AuthLocals } from './middleware.js';
import { rateLimit } from './rate-limit.js';
import {
  clearSessionCookieOptions,
  createOpaqueToken,
  hashPassword,
  hashToken,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  profileUpdateSchema,
  readSessionCookie,
  registerSchema,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  verifyPassword,
} from './security.js';

const SHORT_SESSION_MS = 12 * 60 * 60 * 1000;
const LONG_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_MS = 30 * 60 * 1000;
const authRouter = Router();

const registerLimit = rateLimit({ scope: 'register', limit: 5, windowMs: 15 * 60 * 1000 });
const loginLimit = rateLimit({ scope: 'login', limit: 10, windowMs: 15 * 60 * 1000 });
const resetLimit = rateLimit({ scope: 'password-reset', limit: 4, windowMs: 60 * 60 * 1000 });

const safeUser = (user: {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  imageUrl: user.imageUrl,
});

const validationError = (response: Parameters<RequestHandler>[1], message = 'Invalid request') =>
  response.status(400).json({ error: { code: 'INVALID_REQUEST', message } });

authRouter.post('/register', registerLimit, requireTrustedOrigin, async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, 'Enter a name, valid email, and password of at least 12 characters');
    return;
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  const sessionToken = createOpaqueToken();
  const sessionExpiry = new Date(Date.now() + LONG_SESSION_MS);

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, imageUrl: true },
      });
      const workspace = await transaction.workspace.create({
        data: {
          name: `${name.split(/\s+/u)[0]}'s workspace`.slice(0, 120),
          slug: `workspace-${createdUser.id}`,
          createdById: createdUser.id,
        },
      });
      await transaction.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: createdUser.id, role: 'OWNER' },
      });
      await transaction.session.create({
        data: {
          userId: createdUser.id,
          tokenHash: hashToken(sessionToken),
          expiresAt: sessionExpiry,
        },
      });
      return createdUser;
    });

    response.cookie(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions(LONG_SESSION_MS));
    response.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      response.status(409).json({
        error: {
          code: 'ACCOUNT_UNAVAILABLE',
          message: 'Unable to create an account with those details',
        },
      });
      return;
    }
    throw error;
  }
});

authRouter.post('/login', loginLimit, requireTrustedOrigin, async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, 'Enter a valid email and password');
    return;
  }

  const { email, password, rememberMe } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, imageUrl: true, passwordHash: true },
  });
  const passwordMatches = user?.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : (await hashPassword(password), false);

  if (!user || !user.passwordHash || !passwordMatches) {
    response
      .status(401)
      .json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    return;
  }

  const sessionToken = createOpaqueToken();
  const maxAge = rememberMe ? LONG_SESSION_MS : SHORT_SESSION_MS;
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(sessionToken),
      expiresAt: new Date(Date.now() + maxAge),
    },
  });
  response.cookie(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions(maxAge));
  response.status(200).json({ user: safeUser(user) });
});

authRouter.post('/logout', requireTrustedOrigin, async (request, response) => {
  const token = readSessionCookie(request.headers.cookie);
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  response.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
  response.status(204).end();
});

authRouter.get('/me', requireAuth, async (_request, response) => {
  const auth = (response.locals as AuthLocals).auth;
  if (!auth) return;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      createdAt: true,
      memberships: {
        select: {
          role: true,
          workspace: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });
  if (!user) {
    response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } });
    return;
  }
  response.status(200).json({ user });
});

authRouter.patch('/me', requireAuth, requireTrustedOrigin, async (request, response) => {
  const parsed = profileUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, 'Enter a valid name');
    return;
  }
  const auth = (response.locals as AuthLocals).auth;
  if (!auth) return;
  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { name: parsed.data.name },
    select: { id: true, name: true, email: true, imageUrl: true },
  });
  response.status(200).json({ user });
});

authRouter.get('/sessions', requireAuth, async (_request, response) => {
  const auth = (response.locals as AuthLocals).auth;
  if (!auth) return;
  const sessions = await prisma.session.findMany({
    where: { userId: auth.userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, expiresAt: true },
  });
  response.status(200).json({
    sessions: sessions.map((session) => ({ ...session, current: session.id === auth.sessionId })),
  });
});

authRouter.delete(
  '/sessions/:sessionId',
  requireAuth,
  requireTrustedOrigin,
  async (request, response) => {
    const auth = (response.locals as AuthLocals).auth;
    if (!auth) return;
    const sessionId = request.params.sessionId;
    if (typeof sessionId !== 'string') {
      response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }
    const result = await prisma.session.deleteMany({
      where: { id: sessionId, userId: auth.userId },
    });
    if (result.count === 0) {
      response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }
    if (sessionId === auth.sessionId) {
      response.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
    }
    response.status(204).end();
  },
);

authRouter.post(
  '/password-reset/request',
  resetLimit,
  requireTrustedOrigin,
  async (request, response) => {
    const parsed = passwordResetRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      validationError(response, 'Enter a valid email address');
      return;
    }

    const acceptedMessage = {
      message: 'If an account matches that email, password reset instructions will be sent.',
    };
    if (!isEmailDeliveryConfigured()) {
      response.status(202).json(acceptedMessage);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (user?.passwordHash) {
      const token = createOpaqueToken();
      const expiresAt = new Date(Date.now() + RESET_TOKEN_MS);
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          OR: [{ expiresAt: { lte: new Date() } }, { usedAt: { not: null } }],
        },
      });
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
      });
      try {
        await sendPasswordResetEmail(user.email, token);
      } catch {
        await prisma.passwordResetToken.deleteMany({ where: { tokenHash: hashToken(token) } });
        console.error('Password reset email delivery failed');
      }
    }
    response.status(202).json(acceptedMessage);
  },
);

authRouter.post(
  '/password-reset/confirm',
  resetLimit,
  requireTrustedOrigin,
  async (request, response) => {
    const parsed = passwordResetConfirmSchema.safeParse(request.body);
    if (!parsed.success) {
      validationError(response, 'Use a valid reset link and a password of at least 12 characters');
      return;
    }

    const tokenHash = hashToken(parsed.data.token);
    const now = new Date();
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true, usedAt: true },
    });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
      response.status(400).json({
        error: { code: 'INVALID_RESET_TOKEN', message: 'Reset link is invalid or expired' },
      });
      return;
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw new InvalidResetTokenError();
      await transaction.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
      await transaction.session.deleteMany({ where: { userId: resetToken.userId } });
    });
    response.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
    response.status(204).end();
  },
);

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export class InvalidResetTokenError extends Error {
  constructor() {
    super('Reset token is invalid or expired');
  }
}

export { authRouter };
