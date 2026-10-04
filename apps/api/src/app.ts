import cors from 'cors';
import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { authRouter, InvalidResetTokenError } from './auth/router.js';
import { workspaceRouter } from './workspaces/router.js';
import { projectRouter } from './projects/router.js';
import { taskRouter } from './tasks/router.js';
import { apiErrorHandler } from './core/http.js';
import { activityRouter } from './activity/router.js';

const app = express();

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use((request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'same-origin');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/v1/health', (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'taskflow-api' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/workspaces', workspaceRouter);
app.use('/api/v1', projectRouter);
app.use('/api/v1', taskRouter);
app.use('/api/v1', activityRouter);

app.use((_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof InvalidResetTokenError) {
    response.status(400).json({
      error: { code: 'INVALID_RESET_TOKEN', message: 'Reset link is invalid or expired' },
    });
    return;
  }

  next(error);
};

app.use(errorHandler);
app.use(apiErrorHandler);

export { app };
