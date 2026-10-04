export function isEmailDeliveryConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_DELIVERY_URL && process.env.EMAIL_DELIVERY_TOKEN && process.env.EMAIL_FROM,
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const endpoint = process.env.EMAIL_DELIVERY_URL;
  const deliveryToken = process.env.EMAIL_DELIVERY_TOKEN;
  const from = process.env.EMAIL_FROM;
  if (!endpoint || !deliveryToken || !from) throw new Error('Email delivery is not configured');
  const deliveryUrl = new URL(endpoint);
  if (process.env.NODE_ENV === 'production' && deliveryUrl.protocol !== 'https:') {
    throw new Error('Production email delivery must use HTTPS');
  }

  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  const resetUrl = new URL('/reset-password', webOrigin);
  resetUrl.searchParams.set('token', token);

  const response = await fetch(deliveryUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${deliveryToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Reset your TaskFlow AI password',
      text: `Use this one-time link to reset your password: ${resetUrl.toString()}`,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error('Email delivery request failed');
}
