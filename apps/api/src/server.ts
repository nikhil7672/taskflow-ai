import { app } from './app.js';

const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? 'localhost';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set in production');
  if (
    !process.env.EMAIL_DELIVERY_URL ||
    !process.env.EMAIL_DELIVERY_TOKEN ||
    !process.env.EMAIL_FROM
  ) {
    throw new Error('Password-reset email delivery must be configured in production');
  }
  if (new URL(process.env.EMAIL_DELIVERY_URL).protocol !== 'https:') {
    throw new Error('EMAIL_DELIVERY_URL must use HTTPS in production');
  }
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('API_PORT must be an integer between 1 and 65535');
}

app.listen(port, host, () => {
  console.info(`TaskFlow API listening at http://${host}:${port}`);
});
