/**
 * HuntLedger API — Fastify server entry point.
 *
 * F1: this server runs but the web app does NOT call it. It exists so that
 * F2 becomes an adapter swap on the frontend instead of a rewrite.
 *
 * F2+: backed by Postgres + Firebase Auth middleware.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes/index.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

async function main() {
  // Only enable the pino-pretty transport when it can actually be required —
  // otherwise prod images that don't ship dev deps would crash on boot.
  let prettyTransport: { target: string; options: Record<string, unknown> } | undefined;
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createRequire } = await import('node:module');
      const req = createRequire(import.meta.url);
      req.resolve('pino-pretty');
      prettyTransport = { target: 'pino-pretty', options: { colorize: true } };
    } catch {
      prettyTransport = undefined;
    }
  }

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport: prettyTransport,
    },
  });

  await app.register(cors, { origin: CORS_ORIGIN, credentials: true });
  await registerRoutes(app);

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`HuntLedger API listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
