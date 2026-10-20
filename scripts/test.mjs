import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
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
});
test('No live checkout, credential collection, or hosted payment integrations', async () => {
  const js = await get('app.js');
  const html = await get('index.html');
  assert.doesNotMatch(js, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(html, /stripe\.com|paypal\.com|checkout\.stripe\.com|<form[^>]*action=/i);
});
