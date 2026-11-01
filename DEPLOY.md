# ZYVORA DOMAINS — deployment guide

This project has two separately deployed parts:
- **Frontend:** GitHub Pages (static website)
- **API + database:** Cloudflare Worker + D1

A GitHub Pages deployment does not create DNS records. This repository currently accepts subdomain requests for manual review only after the API is configured. It is not a registrar.

## 1. Publish the GitHub Pages frontend

1. Open https://github.com/teamzyvorax/ZYVORA-DOMAINS/settings/pages
2. Under **Build and deployment**, select **GitHub Actions**.
3. Open the repository's **Actions** tab and wait for the Pages workflow to finish successfully.
4. The expected project URL is https://teamzyvorax.github.io/ZYVORA-DOMAINS/

## 2. Create the Cloudflare D1 database

Install Node.js, then run:

```bash
npm install -g wrangler
wrangler login
cd backend
wrangler d1 create zyvora-domains
```

Copy the `database_id` returned by Cloudflare. Open `backend/wrangler.toml` and replace `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID` with that ID.

Apply the database migration and deploy the Worker:

```bash
wrangler d1 migrations apply zyvora-domains --remote
wrangler deploy
```

Copy the Worker URL printed by the deploy command. Test it by opening `https://YOUR-WORKER-URL/health`; it should return JSON with `"ok":true`.

## 3. Connect the frontend to the API

Open `index.html` and find:

```js
const API_BASE = "";
```

Set it to the exact Worker origin, with no trailing slash:

```js
const API_BASE = "https://YOUR-WORKER-URL";
```

Commit the change. In `backend/wrangler.toml`, set `ALLOWED_ORIGIN` to the exact GitHub Pages origin:

```toml
[vars]
ALLOWED_ORIGIN = "https://teamzyvorax.github.io"
```

Deploy again with `wrangler deploy`.

## 4. Smoke tests

Health check:

```bash
curl https://YOUR-WORKER-URL/health
```

Name check:

```bash
curl "https://YOUR-WORKER-URL/api/check?name=my-project"
```

A request is submitted from the website form. It should return a pending/manual-review response. Do not repeatedly submit test requests using real email addresses.

## 5. Parent domain and real DNS

Before creating names such as `game.zyvorax.in`, confirm that you control the registered `zyvorax.in` domain and its DNS zone. Then configure the DNS provider and implement authenticated, server-side DNS changes. Never put DNS API tokens in `index.html`, public GitHub files, or browser JavaScript.

## Current limitations

- No live domain registration or automatic DNS record creation.
- No user login, email verification, CAPTCHA, or admin approval dashboard yet.
- The current API is a request-intake starter; add abuse protection and an authenticated admin workflow before public launch.
- Do not promise that a requested name is reserved until an authorized DNS action succeeds.
