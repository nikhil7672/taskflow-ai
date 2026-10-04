import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const endpoint = (handler: RequestHandler): RequestHandler => handler;

export const apiErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) return next(error);
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request' } });
    return;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    if (error.code === 'P2002') {
      response.status(409).json({
        error: { code: 'CONFLICT', message: 'A record with these values already exists' },
      });
      return;
    }
    if (error.code === 'P2025') {
      response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
      return;
    }
  }
  if (typeof error === 'object' && error !== null && 'status' in error && error.status === 400) {
    response.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request' } });
    return;
  }
  console.error('Unhandled request error', error);
  response
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
};

export function parsePage(query: Record<string, unknown>) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw new HttpError(400, 'INVALID_PAGINATION', 'Use page >= 1 and pageSize between 1 and 100');
  }
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } };
}

export function omitUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;
}
