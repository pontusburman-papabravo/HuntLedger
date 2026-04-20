import { z } from 'zod';

/**
 * Declarative deployment contract for platforms that import a repo and
 * provision build/run (e.g. Polsis-style automated hosting). Version this
 * schema when the file format changes.
 */
export const polsisDeploymentSpecSchema = z.object({
  apiVersion: z.literal('huntledger.dev/polsishosting/v1'),
  kind: z.literal('BusinessDeployment'),
  metadata: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }),
  spec: z.object({
    runtime: z.object({
      node: z.string().min(1),
    }),
    services: z.array(
      z.object({
        id: z.string().min(1),
        type: z.enum(['node', 'static']),
        dockerfile: z.string().min(1),
        port: z.number().int().positive(),
        healthPath: z.string().optional(),
        env: z.array(z.string()).default([]),
      })
    ),
  }),
});

export type PolsisDeploymentSpec = z.infer<typeof polsisDeploymentSpecSchema>;

/** Default HuntLedger layout inside this monorepo (paths relative to repo root). */
export const HUNTLEDGER_POLSIS_SPEC: PolsisDeploymentSpec = {
  apiVersion: 'huntledger.dev/polsishosting/v1',
  kind: 'BusinessDeployment',
  metadata: {
    name: 'huntledger',
    description: 'HuntLedger — web UI + Fastify API',
  },
  spec: {
    runtime: { node: '>=20.10' },
    services: [
      {
        id: 'api',
        type: 'node',
        dockerfile: 'apps/api/Dockerfile',
        port: 8080,
        healthPath: '/health',
        env: ['PORT', 'HOST', 'CORS_ORIGIN', 'NODE_ENV'],
      },
      {
        id: 'web',
        type: 'static',
        dockerfile: 'GITHub/docker/Dockerfile.web',
        port: 8080,
        env: ['VITE_API_BASE_URL'],
      },
    ],
  },
};

export function parsePolsisDeploymentSpec(input: unknown): PolsisDeploymentSpec {
  return polsisDeploymentSpecSchema.parse(input);
}
