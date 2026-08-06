# Tanzer Anderson Pure HTML V8

Pure HTML V8 is the no-image first-touch email standard staged after the Exact Body experiments proved that inline imagery can still be transformed, exposed, blocked, or reclassified by receiving clients.

## Two production modes

### A. Baseline Safe

Use when maximum cross-client consistency matters more than decorative complexity.

- one 620px table;
- one-column proof map;
- inline CSS only;
- solid colors only;
- Georgia, Arial and standard cursive fallbacks;
- no images, attachments, background images, web fonts, style blocks, media queries, scripts, flexbox, grid, transforms or remote assets.

### B. Maximum Safe HTML

Use when a more differentiated visual presentation is justified.

- one 680px table;
- table-based two-column architecture;
- pure-HTML blue architectural panel that automatically shares the content-row height;
- 2 × 2 proof-map cards;
- funnel, role section, proof boundary and CTA footer;
- inline CSS and solid colors only;
- no images or remote assets.

## Canonical content order

1. Personalized greeting.
2. Body-sized opening beginning `Rather than send a general agency pitch I’d suggest`.
3. Visual proof-of-concept map.
4. Role-specific section.
5. Process boundary.
6. Low-friction next step.
7. Dark-blue, thin, right-slanted signature treatment.
8. Exact title and `director@tanzeranderson.com` identity.

## Why this is the stable architecture

The email is composed entirely from HTML tables, attributes, inline typography, borders and background colors. There is no image that a client can block, shorten, proxy, move into an attachment tray or render at an independent height. The right-side panel in Maximum Safe HTML is a table cell in the same row as the body, so it always reaches the footer.

## Delivery contract

- multipart/alternative only;
- one plain-text part and one HTML part;
- no multipart/mixed;
- no `<img>` tag;
- no CID, data URI or remote image;
- no ordinary attachment and no inline-image MIME part;
- no external stylesheet;
- external drafts remain unsent until Henry separately authorizes release.

## Selection rule

Baseline Safe is the default for recipients or organizations with unknown email clients, conservative security gateways, legal/procurement functions or known Outlook-heavy environments. Maximum Safe HTML may be used when the recipient experience supports richer table layouts and the differentiated visual proof map materially improves the pitch.

The two modes use the same structured company, role, proof-map and funnel data, so changing modes does not require rewriting the outreach.