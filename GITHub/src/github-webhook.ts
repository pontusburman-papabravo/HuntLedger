import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify GitHub `X-Hub-Signature-256` (HMAC SHA-256 hex).
 * Use the raw request body (bytes or UTF-8 string) exactly as received.
 */
export function verifyGithubWebhookSignature(
  rawBody: Buffer | string,
  signature256Header: string | undefined,
  secret: string
): boolean {
  if (!signature256Header || !secret) return false;
  const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  const digest = createHmac('sha256', secret).update(body).digest('hex');
  const expected = `sha256=${digest}`;
  const received = signature256Header.trim();
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}
