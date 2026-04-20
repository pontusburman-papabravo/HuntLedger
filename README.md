# HuntLedger — källkods-arkiv

Här hamnar **endast källkod** (inga `node_modules`, inga byggartefakter) som zip.

## Skapa arkivet

Från repots rot:

```bash
node exportera/_stage_src_zip.mjs
```

Om det totala arkivet blir större än 20 MB per del skapas ett **delat** Info-ZIP-arkiv:

- `HuntLedger-src.zip`
- `HuntLedger-src.z01`, `HuntLedger-src.z02`, … (vid behov)

## Packa upp

Lägg **alla** delar i samma mapp och kör:

```bash
unzip HuntLedger-src.zip
```

`unzip` läser automatiskt `.z01`, `.z02`, osv.

## Vad som ingår / utelämnas

**Med:** `apps/`, `packages/`, `scripts/`, `docs/` (markdown m.m.), rot-`package.json`, `package-lock.json`, konfigfiler.

**Utan:** `node_modules/`, `dist/`, `build/`, `tools/`, `.git`, PDF-filer, `.env`, `*.tsbuildinfo`, stora dokument under `docs/` som `document_pdf.pdf`, samt hela `exportera/` (för att undvika att paketera andra export-zips).

Efter uppackning: kör `npm install` i projektroten.
