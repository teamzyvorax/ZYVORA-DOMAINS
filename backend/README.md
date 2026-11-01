# ZYVORA DOMAINS API starter

This is a **request-intake starter**, not a live domain registrar. It stores pending requests in Cloudflare D1. It never creates DNS records and does not claim that a name is registered.

## Endpoints

- `GET /health` — health check
- `GET /api/check?name=my-project` — checks the Zyvora request database
- `POST /api/requests` — submits a pending request

Example request body:

```json
{
  "name": "my-project",
  "email": "owner@example.com",
  "projectUrl": "https://example.com",
  "reason": "Personal portfolio",
  "website": ""
}
```

## Cloudflare setup

1. Create a Cloudflare account and a D1 database named `zyvora-domains`.
2. Replace the placeholder `database_id` in `wrangler.toml`.
3. Install Wrangler and authenticate: `npm install -g wrangler`, then `wrangler login`.
4. From this directory, apply the schema: `wrangler d1 migrations apply zyvora-domains --remote`.
5. Deploy: `wrangler deploy`.
6. Set `ALLOWED_ORIGIN` to the exact deployed frontend origin. If using a custom domain, update it accordingly.

## Before accepting public traffic

This starter is intentionally limited. Add verified email ownership, CAPTCHA/Turnstile, stronger abuse controls, an authenticated admin review interface, privacy/retention rules, monitoring and backups. The simple IP limit is only a basic first layer. Configure a real parent domain and delegated DNS authority before offering any public suffix. DNS provider secrets must remain in backend secrets, never in frontend code or Git.

No OAuth or DNS automation is included yet. Do not advertise requests as registered domains.
