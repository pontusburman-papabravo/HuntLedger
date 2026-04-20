# GITHub (`@huntledger/github`)

Integrationsskikt för **GitHub** och **Polsis-liknande** hosting där plattformen importerar repot, bygger och kör tjänsten på sina servrar utan manuell infrastruktur.

> **OBS:** Offentlig dokumentation för produkten “Polsis” har inte kunnat verifieras här. Filer i `polsis/` är ett **kontraktsförslag** som du mappar mot Polsis import, deploy hooks eller API när leverantören anger format. **CI** (lint, typecheck, build + valfri Polsis-notifiering) ligger i `.github/workflows/ci.yml`.

## Innehåll

| Sökväg | Syfte |
|--------|--------|
| `src/` | TypeScript: Polsis-manifest (Zod), GitHub `X-Hub-Signature-256`-verifiering |
| `polsis/huntledger.deployment.yaml` | Maskinläsbar deployment-beskrivning (v1) |
| `.github/workflows/ci.yml` (rot) | Aktiv CI: PR/push, Polsis-hook efter lyckad build på `main`/`master` |
| `docker/Dockerfile.web` | Bygger Vite-frontenden och servar med nginx på port **8080** |
| `docker/nginx-default.conf` | SPA fallback + enkel `/health` |

API-containern använder befintlig `apps/api/Dockerfile` (port **8080**).

## Importera till Polsis (konceptuellt)

1. Koppla ditt **GitHub-repository** i Polsis (eller ladda upp motsvarande källkodspaket).
2. Ange **rot** som monorepots rot (där `package.json` med workspaces ligger).
3. Låt plattformen läsa **`GITHub/polsis/huntledger.deployment.yaml`** eller motsvarande fält manuellt:
   - **API:** Dockerfile `apps/api/Dockerfile`, hälsa `GET /health`.
   - **Web:** Dockerfile `GITHub/docker/Dockerfile.web`.
4. Sätt miljövariabler (minimalt):
   - API: `PORT=8080`, `HOST=0.0.0.0`, `CORS_ORIGIN` (webbens publika URL).
   - Web: bygg med rätt `VITE_API_BASE_URL` om Polsis bygger med args; annars konfigurera enligt plattformens sätt att injicera Vite-variabler.

## Bygga webb-imagen lokalt

Från monorepots rot:

```bash
docker build -f GITHub/docker/Dockerfile.web -t huntledger-web:local .
```

## Använda paketet från kod

```ts
import {
  HUNTLEDGER_POLSIS_SPEC,
  verifyGithubWebhookSignature,
} from '@huntledger/github';

// Exempel: verifiera GitHub webhook i en framtida deploy-mottagare
const ok = verifyGithubWebhookSignature(rawBody, req.headers['x-hub-signature-256'], process.env.GITHUB_WEBHOOK_SECRET!);
```

## GitHub Actions

Workflow: **`.github/workflows/ci.yml`** — kör `lint`, `typecheck` och `build` på varje PR och push. Efter en grön build på **`main`** eller **`master`** skickas (om secret finns) en POST till `POLSIS_DEPLOY_URL` med JSON `{ repository, sha, ref }`. Lägg till secrets `POLSIS_DEPLOY_URL` och vid behov `POLSIS_DEPLOY_TOKEN` i GitHub-repot.

## Version

Manifestformat: `apiVersion: huntledger.dev/polsishosting/v1` — höj versionen om du ändrar strukturen i YAML eller Zod-schemat.
