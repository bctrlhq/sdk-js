// Builds one source into ES modules (dist) and CommonJS (dist/cjs), each with its declarations.
import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json'], { stdio: 'inherit' });
execFileSync(process.execPath, [tsc, '-p', 'tsconfig.cjs.json'], { stdio: 'inherit' });
// The package is "type": "module"; this marks the CommonJS tree for Node and TypeScript.
writeFileSync('dist/cjs/package.json', '{ "type": "commonjs" }\n');
