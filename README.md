# Thread & Thistle — Client-owned Worker deployment test

A **fictional** handmade-mitten storefront built for testing The Little Things Studios' website release workflow. The static website is a realistic preview, but **there is no backend, payment collection, customer data, or real inventory**. Its bag is deliberately in-memory and checkout is disabled.

## Preview and build

Requires Node 20.11+; no npm dependencies.

```bash
npm run check
python3 -m http.server 8080 -d dist
```

Open `http://localhost:8080`. Or deploy `dist/` to a **studio-owned staging** Worker/Pages project after building it. Do not point it at a client's production hostname.

## Source structure

- `src/` — HTML/CSS/JS and SVG artwork, no external dependencies.
- `scripts/build.mjs` — copies the site into `dist/` and stamps the **exact Git SHA** into the site and `version.json` when `GITHUB_SHA` is available.
- `scripts/test.mjs` — verifies demo labels, static assets, source marker and checkout safety.
- `.github/workflows/verify.yml` — checks every push/PR and uploads `dist/` as a verified build artifact.
- `wrangler.jsonc` — named **preview only**; not a client production deployment credential or target.

## Intended end-to-end test

1. Build this repository in GitHub Actions and obtain the full 40-character commit SHA and the verified artifact.
2. Stage the website at an HTTPS address owned by The Little Things Studios.
3. In the Client Portal, create a project assigned to the **test client's** Cloudflare account and prepare an immutable release referencing this repository, SHA and preview URL.
4. Have the client review and approve the preview.
5. Use the upcoming studio-only **Publish website** action to send the verified build to the client-owned Worker, never to the studio's account.
6. Validate the client's production host responds, and compare `/version.json` and the HTML build marker with the approved SHA.
7. A later, separately authorized process handles the custom domain. This demo does not use a real domain.

**Current integration status:** The portal can provision a placeholder Worker in the client's account. Automated release upload and domain connection are future milestones. This repository does **not** configure a GitHub Action with Cloudflare credentials and cannot auto-deploy production on push.

### Security boundaries

- No OAuth token, Cloudflare API token, secrets or customer personal details belong in this repository or its build artifacts.
- Do not let an unapproved commit, a `main` push, or a preview deployment update client production.
- Keep client-paid services and billing in their own Cloudflare account; this demo has no purchasing flows.
- For a real client, repo visibility and access controls should be evaluated separately; `public` is suitable only for this fictional demo.
