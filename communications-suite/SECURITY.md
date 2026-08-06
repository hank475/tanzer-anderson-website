# Security policy

## Non-negotiable controls

1. Never commit Google, Neon, Cloudflare, OAuth, session, handoff, or signature secrets.
2. Keep all three production locks false during build and QA.
3. Never store email bodies, subjects, recipients, raw MIME, attachments, user profile email/name/photo, or provider authentication tokens in Neon.
4. Restrict Google sign-in by both hosted domain and explicit approved-email allowlist.
5. Use the Google account `sub` claim as the stable identity; do not key authorization by mutable email alone.
6. Store refresh/access tokens only after AES-256-GCM encryption with a deployment secret.
7. Use independent host-only session cookies for Tanzer Mail and Tanzer Meet.
8. Allow cross-application host login only through a short-lived encrypted, hash-tracked, single-use handoff.
9. Use pseudonymous UUIDs—not email addresses or phone numbers—as Cloudflare `custom_participant_id` values.
10. Preserve Google MX/SPF/DKIM/DMARC and the existing Tanzer Anderson website deployment.
11. Do not expose `TA_SIGNATURE_PNG_B64` in source control. It is a Worker secret and an inline MIME asset only at render time.
12. Rotate credentials immediately after suspected disclosure and invalidate affected Google grants.

## Reporting

Report security concerns privately to `henry@tanzeranderson.com`. Do not open a public issue containing credentials, mailbox content, participant tokens, or personal data.
