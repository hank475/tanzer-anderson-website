# Data handling register

| Data class | System of record | Neon persistence |
|---|---|---|
| Email body / HTML / raw MIME | Gmail | Prohibited |
| Subject / recipients / CC / BCC | Gmail draft/message | Prohibited |
| Attachments | Gmail | Prohibited |
| Gmail draft/thread IDs | Gmail | Allowed as scheduling metadata |
| Google user email/name/photo | Google + encrypted host session | Prohibited |
| Google `sub` and hosted domain | Google authorization | Allowed as opaque authorization identity |
| OAuth refresh/access token | Google authorization | Allowed only after AES-256-GCM encryption |
| Mail-to-Meet handoff identity | Two-minute encrypted token | Prohibited; only token hash and expiry are allowed |
| Template source | Git | Checksum/version metadata only |
| Meeting title/time/provider ID | Cloudflare + Neon | Allowed |
| Participant identity | Browser/Cloudflare | Pseudonymous UUID only in Neon |
| Participant authentication token | Cloudflare/browser | Prohibited |
| Audit event | Neon | Allowed; no message or token content |

Application logs must use opaque identifiers. Never log authorization codes, OAuth tokens, session cookies, handoff tokens, participant tokens, message bodies, attachment bytes, recipient lists, or raw provider responses containing secrets.
