import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const input = resolve(root, 'src');
const output = resolve(root, 'dist');
const sha = process.env.GITHUB_SHA || process.env.SITE_COMMIT_SHA || 'local-development';
if (!/^(?:[0-9a-f]{40}|local-development)$/.test(sha)) {
  throw new Error('SITE_COMMIT_SHA must be a 40-character lowercase Git SHA');
}
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
