# Tanzer Communications Suite v1

A two-application communications layer for Tanzer Anderson:

- **Tanzer Mail** at `mail.tanzeranderson.com`: a Gmail-backed mailbox and composer that applies Private Monograph v2.2 to every draft it creates.
- **Tanzer Meet** at `meet.tanzeranderson.com`: a branded Cloudflare RealtimeKit meeting lobby and browser meeting experience.

Gmail remains the system of record and delivery transport. Google MX, SPF, DKIM, DMARC, mailbox storage, spam filtering, labels, threads, and sent-mail synchronization are not replaced.

## Source-branch bootstrap

The GitHub source branch is `feature/tanzer-communications-suite-v1-source`. It carries the full source as a four-part, checksum-verified archive so the authorized build can coexist with the existing website repository without an unsafe ref rewrite.

From a clean checkout of that branch:

```bash
cd communications-suite
npm run bootstrap
npm run check
```

`bootstrap.mjs` verifies each part, verifies archive SHA-256 `cbec0ba542ca886103f2303a22ac0dde38d66e27b0165fddad2c5e30071afefb`, and expands the complete `communications-suite/` tree plus its repository-level CI and deployment workflows. A clean-room bootstrap has passed all 9 tests and all 11 consolidated controls.

## Safety state

The repository ships with three independent production locks:

```text
EXTERNAL_SEND_ENABLED=false
SCHEDULING_ENABLED=false
MEETINGS_ENABLED=false
```

With those values, the application can authenticate, read mailbox data, render previews, and create or update Gmail drafts, but it cannot send external mail, execute scheduled sends, create meetings, or admit participants. Activation requires a separate deliberate configuration change after QA.

## Included mailbox operations

- OAuth sign-in restricted to the Tanzer Anderson Workspace domain and approved accounts
- Inbox and thread search/reading
- Gmail labels, stars, archive, trash, and thread modification
- Draft listing, creation, attachment-preserving update, deletion, reply/reply-all threading, CC, and BCC
- Approved Gmail `sendAs` identities
- Contact autocomplete through Google People API
- Private Monograph v2.2 HTML plus a plain-text alternative
- Draft scheduling metadata with a Cloudflare scheduled handler
- External sending protected by a server-side QA lock

Gmail-only proprietary interface features such as Google Smart Compose or Gemini panels remain available in Gmail itself; this application does not impersonate private Google UI services.

## Data boundary

Neon stores only an opaque Google subject, hosted-domain control, AES-GCM-encrypted OAuth credentials, one-time handoff hashes, scheduled-draft identifiers, template version/checksum records, meeting metadata, pseudonymous participant identifiers, and content-free audit events. It does **not** store user email/name/photo, email bodies, subjects, recipient lists, raw MIME, attachments, handoff identity, or participant tokens.

Tanzer Mail and Tanzer Meet use independent host-only encrypted sessions. Host login crosses between them through a two-minute, encrypted, single-use handoff rather than a cookie shared with every Tanzer Anderson subdomain.

## Repository layout after bootstrap

```text
apps/mail/                 Tanzer Mail Worker + PWA
apps/meet/                 Tanzer Meet Worker + PWA
packages/core/             OAuth, Gmail, Neon, security, and provider adapters
packages/email-renderer/   Private Monograph v2.2 and MIME builder
database/migrations/       Isolated `tanzer_comms` schema
scripts/                   Consolidated validation and secret-safe signature extraction
.github/workflows/         CI and manually gated deployment
```

## Local validation

```bash
npm install
npm run check
npm run cf:dry-run:mail
npm run cf:dry-run:meet
```

No tests send email or create meetings.

## Deployment sequence

Follow `docs/DEPLOYMENT.md` after bootstrap. Do not change the existing `tanzer-anderson-site2` Pages project, apex website deployment, nameservers, MX records, mail authentication records, or billing plan.
