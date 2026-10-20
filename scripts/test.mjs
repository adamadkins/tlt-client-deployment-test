import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { resolveBuildCommit } from './commit.mjs';
const root = resolve(import.meta.dirname, '..', 'dist');
const get = name => readFile(resolve(root, name), 'utf8');
test('Build includes accessible HTML and local assets', async () => {
  const html = await get('index.html');
  assert.match(html, /<main id="main">/);
  assert.match(html, /aria-labelledby="collection-title"/);
  assert.match(html, /Demo only. No orders or payments/);
  assert.match(html, /checkout-disabled" disabled/);
  assert.doesNotMatch(html, /__COMMIT_SHA__/);
  assert.match(html, /rel="stylesheet" href=".\/styles.css"/);
  for (const file of ['app.js', 'styles.css', 'assets/mitten-rose.svg', 'assets/mitten-oat.svg', 'assets/mitten-pine.svg','assets/mark.svg']) await access(resolve(root, file));
});
test('Release metadata identifies the exact build source', async () => {
  const version = JSON.parse(await get('version.json'));
  assert.equal(version.site, 'thread-and-thistle-demo');
  assert.equal(version.demo, true);
  assert.equal(version.checkout_enabled, false);
  assert.match(version.commit, /^(?:[a-f0-9]{40}|local-development)$/);
  let gitHead = null;
  try {
    gitHead = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd: resolve(root, '..'), encoding:'utf8', timeout:5000,
      stdio:['ignore','pipe','ignore']
    }).trim();
  } catch { /* Fall back to fully validated CI-provided SHA. */ }
  const expected = resolveBuildCommit(process.env,gitHead);
  assert.equal(version.commit,expected);
  assert.match(await get('index.html'),new RegExp(expected));

});
test('No live checkout, credential collection, or hosted payment integrations', async () => {
  const js = await get('app.js');
  const html = await get('index.html');
  assert.doesNotMatch(js, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(html, /stripe\.com|paypal\.com|checkout\.stripe\.com|<form[^>]*action=/i);
});

test('Build commit is the checked-out Git SHA even when Cloudflare variables are malformed', () => {
  const actual='a'.repeat(40);
  const validOther='b'.repeat(40);
  assert.equal(resolveBuildCommit({
    WORKERS_CI:'1', WORKERS_CI_COMMIT_SHA:'short-sha',
    GITHUB_SHA:validOther, SITE_COMMIT_SHA:'bad-value'
  },actual),actual);
  assert.equal(resolveBuildCommit({
    WORKERS_CI:'1', WORKERS_CI_COMMIT_SHA:validOther,
    SITE_COMMIT_SHA:'not-a-sha'
  },null),validOther);
  assert.equal(resolveBuildCommit({CI:'true',GITHUB_SHA:'ABCDEF1234567890ABCDEF1234567890ABCDEF12'},null),
    'abcdef1234567890abcdef1234567890abcdef12');
  assert.throws(()=>resolveBuildCommit({WORKERS_CI:'1',WORKERS_CI_COMMIT_SHA:'short-sha'},null),
    /cannot determine a full 40-character Git commit SHA/);
  assert.equal(resolveBuildCommit({},null),'local-development');
});
