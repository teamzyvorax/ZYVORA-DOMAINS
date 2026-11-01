# ZYVORA DOMAINS

A free-first subdomain platform foundation for developers and creators.

## Current status

This repository currently contains the public landing-page preview. The name checker performs **format validation only**. It does not check availability, reserve a name, create DNS records, or authenticate users.

## Planned architecture

- Static frontend: HTML, CSS and JavaScript (GitHub Pages compatible)
- Authentication: GitHub OAuth through a trusted backend
- Database: free-tier PostgreSQL where available
- Domain workflow: request, moderation, audit trail and abuse controls
- DNS: provider API with least-privilege credentials held only on the server
- Admin: approve/reject requests, suspend abusive names, inspect audit logs

## Important domain requirement

A free hosting account does not provide ownership of a public DNS suffix. To issue names such as `project.example.org`, ZYVORA must own/control the parent domain or have explicit delegation/permission from its owner. DNS provider credentials must never be placed in frontend JavaScript or committed to this repository.

## Local preview

Open `index.html` in a browser. No build step is required.

## GitHub Pages

The included workflow deploys the static preview from the repository root. In GitHub, open **Settings → Pages** and set the publishing source to **GitHub Actions** if it is not already configured.

The expected project URL is:

`https://teamzyvorax.github.io/ZYVORA-DOMAINS/`

GitHub Pages only hosts static files; it cannot run the authentication, database or DNS backend. Those components must be deployed separately to a compatible backend provider.

## Security checklist before live registration

- Verify ownership/delegation of the parent domain.
- Use server-side OAuth callback and secure, HTTP-only sessions.
- Store DNS/API secrets only in backend environment variables.
- Add rate limits, CAPTCHA, email verification and abuse reporting.
- Validate DNS record types, hostnames and target values server-side.
- Add admin audit logs, backups, privacy policy and terms.
