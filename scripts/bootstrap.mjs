#!/usr/bin/env node
// Bootstrap script: downloads and extracts npm into tools/npm so we can run
// `npm install` without a system-installed npm.
//
// Usage: node scripts/bootstrap.mjs
//
// After bootstrap, npm is available at:
//   tools/npm/package/bin/npm-cli.js
// Run it via:
//   node tools/npm/package/bin/npm-cli.js <args>

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { request } from 'node:https';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const NPM_DIR = join(ROOT, 'tools/npm');
const TGZ = join(NPM_DIR, 'npm.tgz');
const PKG = join(NPM_DIR, 'package');

function get(url) {
  return new Promise((resolveP, reject) => {
    const req = request(url, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        resolveP(get(res.headers.location));
      } else if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      } else {
        resolveP(res);
      }
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchJson(url) {
  const res = await get(url);
  let data = '';
  for await (const chunk of res) data += chunk;
  return JSON.parse(data);
}

async function download(url, dest) {
  const res = await get(url);
  await pipeline(res, createWriteStream(dest));
}

function run(cmd, args, opts = {}) {
  return new Promise((resolveP, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('exit', (code) => (code === 0 ? resolveP() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))));
  });
}

async function main() {
  mkdirSync(NPM_DIR, { recursive: true });

  if (existsSync(join(PKG, 'bin/npm-cli.js'))) {
    console.log('npm already bootstrapped at', PKG);
    return;
  }

  console.log('Looking up latest npm version...');
  const meta = await fetchJson('https://registry.npmjs.org/npm/latest');
  console.log('npm version:', meta.version);

  console.log('Downloading', meta.dist.tarball);
  await download(meta.dist.tarball, TGZ);

  console.log('Extracting...');
  await run('tar', ['xzf', TGZ, '-C', NPM_DIR]);

  if (!existsSync(join(PKG, 'bin/npm-cli.js'))) {
    throw new Error('Extraction did not produce package/bin/npm-cli.js');
  }
  console.log('npm bootstrapped successfully at', PKG);
  console.log('Use:  node tools/npm/package/bin/npm-cli.js <command>');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
