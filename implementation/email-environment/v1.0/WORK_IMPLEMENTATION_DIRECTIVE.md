# WORK Implementation Directive
## Tanzer Anderson Universal Email Environment v1.0

### Objective

Make the supplied email renderer the single source of truth for all Tanzer Anderson automated and prepared email communication, internal and external, without degrading deliverability or reply-chain usability.

### Approved architecture

1. **Central renderer:** use `renderer/render-email.mjs` for all generated messages.
2. **Cloudflare service:** deploy `cloudflare/worker.mjs` as a private render endpoint.
3. **Gmail delivery:** send the resulting HTML and plain text through the Gmail API or the supplied Apps Script pathway.
4. **Manual Gmail:** install the compact signatures in the relevant Gmail accounts. Use saved templates for new full-stationery threads.
5. **Reply logic:** detect replies/forwards and switch to `threadMode: "compact"`.

### Mandatory sender routing

| Message type | Default sender |
|---|---|
| Henry-authored client/prospect/candidate outreach | Henry Anderson / henry@tanzeranderson.com |
| Scheduling, confirmations, operational follow-up | Tanzer Anderson Operations / coordinator@tanzeranderson.com |
| Internal approval and release notices | coordinator@tanzeranderson.com |
| Sensitive exception | Hold for Henry approval |

### Implementation sequence

1. Place approved email assets under a stable first-party path such as `https://tanzeranderson.com/email-assets/`.
2. Deploy the Cloudflare Worker with an `EMAIL_RENDERER_TOKEN` secret and a strict origin allowlist.
3. Route every automated email producer through `/render`.
4. Send both returned fields: `html` as the HTML MIME part and `text` as the plain-text MIME part.
5. Install `signatures/henry.html` and `signatures/coordinator.html` into the correct Gmail accounts.
6. Create Gmail saved templates from the supplied external and internal HTML examples for human-originated new threads.
7. Add a thread-state rule: full environment on the initial outbound message; compact signature for replies and forwards.
8. QA in Gmail web, Gmail mobile, Apple Mail, Outlook desktop, Outlook web, and image-blocked mode.

### Non-negotiable constraints

- Do not use a full-image background inside production emails.
- Do not replace live text with an image of the whole email.
- Do not add external fonts, videos, scripts, forms, or JavaScript to an email body.
- Do not use recipient logos by default.
- Do not expose Destiny’s personal Gmail address in any public or external template.
- Do not change Henry’s approved title.
- Do not release candidate/client content before the relevant approval gate.
- Do not add tracking pixels without Henry’s explicit approval.

### Merge-field contract

Use the JSON structure in `templates/example-models.json`. At minimum, populate:

- `variant`
- `classification`
- `eyebrow`
- `headline`
- `greeting`
- `paragraphs`
- `cta`
- `sender`

Optional fields:

- `recipientCompany`
- `recipientLogoUrl`
- `bulletsHeading`
- `bullets`
- `callout`
- `secondaryCta`
- `closing`
- `footerLine`
- `confidentiality`
- `threadMode`

### Acceptance criteria

The work is complete only when:

- All automated email paths use the centralized renderer.
- HTML and plain-text versions are present.
- The message is readable with images disabled.
- The mobile layout fits without horizontal scrolling.
- Henry and coordinator identities are correct.
- New threads and replies use the correct modes.
- No unauthorized recipient logo appears.
- No public template exposes a personal email address.
- Test messages pass Gmail, Outlook, and Apple Mail review.
