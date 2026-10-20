import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { resolveBuildCommit } from './commit.mjs';
const root = resolve(import.meta.dirname, '..');
const input = resolve(root, 'src');
const output = resolve(root, 'dist');

// The checked-out source takes precedence over injected CI variables, which
// can be incomplete, overridden or incorrectly formatted.
let checkedOutSha=null;
try {
  checkedOutSha=execFileSync('git',['rev-parse','--verify','HEAD'],{
    cwd:root,encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']
  }).trim();
} catch {
  // Cloudflare/GitHub CI variables are accepted only when fully validated.
}
const sha=resolveBuildCommit(process.env,checkedOutSha);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(input, output, { recursive: true });
const index = resolve(output, 'index.html');
const html = await readFile(index, 'utf8');
if (!html.includes('__COMMIT_SHA__')) throw new Error('Build marker missing from index');
await writeFile(index, html.replaceAll('__COMMIT_SHA__', sha));
await writeFile(resolve(output, 'version.json'), JSON.stringify({
  site: 'thread-and-thistle-demo',
  commit: sha,
  demo: true,
  checkout_enabled: false
}, null, 2) + '\n');
console.log(`Built demo site at dist/ for ${sha.slice(0, 12)}`);
