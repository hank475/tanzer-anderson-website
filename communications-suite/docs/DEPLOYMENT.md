# Deployment runbook

## Protected existing infrastructure

- Cloudflare account: `45d0c5f0595a21c89e6cc071512e8fb1`
- Existing website project: `tanzer-anderson-site2`
- Existing production website: `tanzeranderson.com`

Do not alter or redeploy that project. Do not change nameservers, MX, SPF, DKIM, DMARC, billing, or plans.

## 1. Preflight

```bash
npm install
npm run check
npm run cf:dry-run:mail
npm run cf:dry-run:meet
```

Both `wrangler.jsonc` files must still contain false production locks.

## 2. Neon

Apply `database/migrations/001_tanzer_comms.sql` to the existing Solar Core Production database only after its temporary-branch migration has passed verification and received explicit commit approval.

## 3. Create cryptographic values

Generate four independent 32-byte values:

```bash
openssl rand -base64 32   # TOKEN_ENCRYPTION_KEY_B64: Mail only
openssl rand -base64 32   # SESSION_SECRET_B64: Mail value
openssl rand -base64 32   # SESSION_SECRET_B64: Meet value
openssl rand -base64 32   # HANDOFF_ENCRYPTION_KEY_B64: identical value on both Workers
```

Mail and Meet must use different `SESSION_SECRET_B64` values. Both must receive the same `HANDOFF_ENCRYPTION_KEY_B64` value.

## 4. Configure Worker secrets

Mail secrets:

```text
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
TOKEN_ENCRYPTION_KEY_B64
SESSION_SECRET_B64
HANDOFF_ENCRYPTION_KEY_B64
TA_SIGNATURE_PNG_B64
```

The approved signature is intentionally excluded from public Git. Verify and stream it directly from the approved Private Monograph source without writing a plaintext secret file:

```bash
node scripts/extract-signature.mjs /secure/path/to/approved-private-monograph.html --verify
node scripts/extract-signature.mjs /secure/path/to/approved-private-monograph.html \
  | npx wrangler secret put TA_SIGNATURE_PNG_B64 \
      --config apps/mail/wrangler.jsonc --env production
```

Meet secrets:

```text
DATABASE_URL
SESSION_SECRET_B64
HANDOFF_ENCRYPTION_KEY_B64
REALTIMEKIT_APP_ID
CLOUDFLARE_REALTIME_API_TOKEN
```

`CLOUDFLARE_ACCOUNT_ID` is non-secret configuration already present in the Meet Worker config.

Set each secret in the `production` environment. Never place values in GitHub source, workflow text, artifacts, or logs.

## 5. Configure RealtimeKit

Follow `docs/REALTIMEKIT_SETUP.md`. Create the application and presets, but do not create a provider meeting during build or locked QA.

## 6. Deploy with QA locks

```bash
npx wrangler deploy --config apps/mail/wrangler.jsonc --env production
npx wrangler deploy --config apps/meet/wrangler.jsonc --env production
```

The production environments declare only the two new custom domains. They do not touch the apex website or mail-routing records.

## 7. Owner-controlled QA

- Confirm Google login is restricted correctly.
- Verify inbox, search, labels, threads, send-as identities, contacts, and drafts.
- Create, update, and delete disposable drafts.
- Verify existing draft attachments survive an edit.
- Verify no send endpoint can bypass the server-side lock.
- Inspect Private Monograph preview at desktop and mobile sizes.
- Verify a reply draft carries the original `threadId`, matching subject, `References`, and `In-Reply-To`.
- Confirm no message body, recipient, subject, attachment, email/name/photo, or participant token appears in Neon.
- Confirm the Mail-to-Meet handoff can be consumed once only.
- Confirm meeting creation and admission return a locked response.

## 8. Separate activation gate

Production sending, scheduling, and meetings remain disabled until separately authorized. Activation is not part of this build authorization.
