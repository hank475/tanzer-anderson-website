# Architecture

## Request path

```text
Tanzer Mail PWA
  -> Cloudflare Worker
      -> Google OAuth / Gmail / People APIs
      -> Neon Postgres (`tanzer_comms` metadata only)

Tanzer Meet PWA
  -> Cloudflare Worker
      -> Neon Postgres (`tanzer_comms` metadata only)
      -> Cloudflare RealtimeKit API
```

## Mail invariants

- Gmail remains authoritative for messages, drafts, attachments, labels, threads, send-as identities, and delivery.
- The composer submits raw RFC 2822/MIME to Gmail as base64url.
- Draft replies include `threadId`, matching subject, `References`, and `In-Reply-To`.
- Reply and reply-all routing excludes the approved sender identities when possible.
- Existing draft attachments are fetched from Gmail and reattached before an edited draft is replaced; a draft above the 18 MB safe-edit threshold is not opened for editing.
- Every new or updated Tanzer Mail draft carries `X-Tanzer-Template: TA_PRIVATE_MONOGRAPH_V2_2`.
- The template is table-native, uses solid-color fallbacks, includes a plain-text part, and does not depend on a remote background image.
- The approved scripted signature is injected from the `TA_SIGNATURE_PNG_B64` Worker secret as a CID inline image; it is never placed in Git.

## Authentication

- Authorization Code flow with PKCE S256, state, nonce, offline access, ID-token signature validation, and exact claim validation.
- The OAuth state is held both as one-time encrypted server metadata and as an encrypted, host-only browser transaction cookie.
- Both `hd=tanzeranderson.com` and an explicit email allowlist are enforced.
- Tanzer Mail and Tanzer Meet each use an independent AES-GCM-encrypted, HttpOnly, Secure, host-only session cookie.
- Host authentication moves from Mail to Meet through a two-minute encrypted token. Neon stores only its SHA-256 hash and expiry, and consumption deletes the hash so the token cannot be replayed.
- The handoff token contains the identity only inside authenticated encryption; email, name, and photo are never persisted in Neon.

## Neon boundary

The dedicated `tanzer_comms` schema is tenant-keyed to the existing Tanzer Anderson tenant. Application queries always include that tenant ID. Schema privileges are revoked from `PUBLIC`.

Persisted authorization data is limited to the opaque Google `sub`, hosted domain, encrypted OAuth credentials, scopes, status, and timestamps. User email, name, and photo remain in the encrypted browser session or short-lived encrypted handoff only.

## Meeting path

1. An authenticated host requests a meeting.
2. The Worker creates the provider meeting only if `MEETINGS_ENABLED=true`.
3. Neon stores provider IDs and timing/status metadata.
4. A guest joins through a branded lobby.
5. The Worker creates a participant using a random UUID as `custom_participant_id` and returns the participant token only to that browser.
6. The browser initializes Cloudflare RealtimeKit and renders the meeting UI inside the Tanzer shell.

Recording and transcription are absent from v1 to avoid unapproved storage and paid media processing.
