/**
 * @huntledger/github (GITHub)
 *
 * Small integration surface for GitHub webhooks and Polsis-style deployment
 * manifests. Import from other packages when you add a deploy receiver:
 *
 *   import { verifyGithubWebhookSignature, HUNTLEDGER_POLSIS_SPEC } from '@huntledger/github';
 */

export {
  HUNTLEDGER_POLSIS_SPEC,
  parsePolsisDeploymentSpec,
  polsisDeploymentSpecSchema,
  type PolsisDeploymentSpec,
} from './polsis-manifest.js';

export { verifyGithubWebhookSignature } from './github-webhook.js';
