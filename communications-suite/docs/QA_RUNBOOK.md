# QA runbook

## Automated

- Renderer and MIME tests
- Header-injection rejection
- Reply-thread header preservation
- Plain-text and HTML alternatives
- No hardcoded signature asset
- No remote background image dependency
- Database forbidden-column scan, including profile PII and provider tokens
- No MX/nameserver configuration
- Host-only session and one-time handoff controls
- All production locks false
- Custom-domain scope limited to `mail.` and `meet.`

## Gmail draft QA

Use only an owner-controlled disposable draft. Do not call the send endpoint.

1. Create a draft with To, CC, BCC, body, and a small attachment.
2. Confirm it appears in Gmail Drafts.
3. Open it in Tanzer Mail and Gmail.
4. Add a small attachment in Gmail, update the draft from Tanzer Mail, and confirm the attachment remains.
5. Confirm one draft remains after the update.
6. Create reply and reply-all drafts from a known thread; confirm they remain in that thread and exclude Henry's own send-as identities from recipient routing.
7. Delete the disposable draft.

## Client rendering QA

Render the preview in Gmail web/mobile, Apple Mail/iOS Mail, Outlook web/new Outlook, Classic Outlook Windows fallback, and Yahoo/AOL.

Acceptance is semantic and visual consistency, not pixel identity across historic rendering engines. All text and actions must remain readable with images disabled.

## Meeting QA

Before activation, validate only the lobby, route handling, feature lock, CSP, and provider request construction. Do not create a provider meeting or issue a participant token.

## Authentication handoff QA

1. Sign in to Tanzer Mail with the approved account.
2. Open Tanzer Meet and use Host sign-in.
3. Confirm the Meet host session is created without a domain-wide session cookie.
4. Reuse the captured handoff URL; it must return `handoff_invalid`.
5. Confirm Neon contains only the handoff hash and expiry, and the consumed row is deleted.
