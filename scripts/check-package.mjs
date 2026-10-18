// Checks the package as npm will publish it: types resolve under every Node resolution mode (attw), the manifest is
// valid (publint), and a consumer can both require() and import() each entry point.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const run = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' });
const directory = mkdtempSync(path.join(tmpdir(), 'bctrl-sdk-package-'));
try {
  execFileSync('npm', ['pack', '--pack-destination', directory], { stdio: ['ignore', 'ignore', 'inherit'] });
  const tarball = path.join(directory, readdirSync(directory).find((name) => name.endsWith('.tgz')));
  execFileSync('pnpm', ['exec', 'attw', tarball, '--profile', 'node16'], { stdio: 'inherit' });
  execFileSync('pnpm', ['exec', 'publint', '--strict', tarball], { stdio: 'inherit' });

  const consumer = path.join(directory, 'consumer');
  execFileSync('npm', ['install', '--prefix', consumer, '--no-audit', '--no-fund', '--ignore-scripts', tarball], { stdio: 'ignore' });
  writeFileSync(path.join(consumer, 'require.cjs'), `const sdk = require('@bctrl/sdk');
const node = require('@bctrl/sdk/node');
if (typeof sdk.Bctrl !== 'function' || typeof node.createCodeToolFromFile !== 'function') process.exit(1);
`);
  writeFileSync(path.join(consumer, 'import.mjs'), `const sdk = await import('@bctrl/sdk');
const node = await import('@bctrl/sdk/node');
if (typeof sdk.Bctrl !== 'function' || typeof node.createCodeToolFromFile !== 'function') process.exit(1);
`);
  run(['require.cjs'], consumer);
  run(['import.mjs'], consumer);
  console.log('Package check passed: attw, publint, require() and import().');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
