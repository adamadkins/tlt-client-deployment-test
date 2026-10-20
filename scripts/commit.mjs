// Resolve the exact commit that produced the staging artifact. Cloudflare and
// GitHub inject different environment variables; malformed overrides must not
// make a checked-out, valid Git commit unusable.
const fullSha = value => typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value.trim());
const normalize = value => value.trim().toLowerCase();

/**
 * Prefer the SHA of the actual checked-out repository. If the build runner
 * doesn't expose Git metadata, use a validated CI-provided SHA. Never stamp
 * an arbitrary or shortened value into a client-approval preview.
 */
export function resolveBuildCommit(env, checkedOutSha) {
  if (fullSha(checkedOutSha)) return normalize(checkedOutSha);
  const candidates = [
    env.WORKERS_CI_COMMIT_SHA,
    env.GITHUB_SHA,
    env.SITE_COMMIT_SHA,
    env.CF_PAGES_COMMIT_SHA
  ];
  const found = candidates.find(fullSha);
  if (found) return normalize(found);
  const inCI = env.WORKERS_CI === '1' || env.GITHUB_ACTIONS === 'true' ||
    env.CI === 'true' || Boolean(env.CF_PAGES);
  if (inCI) {
    throw new Error('Build cannot determine a full 40-character Git commit SHA. Check CI checkout and build environment.');
  }
  return 'local-development';
}
