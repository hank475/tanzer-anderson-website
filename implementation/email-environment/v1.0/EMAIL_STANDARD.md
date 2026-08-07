# Tanzer Anderson Universal Email Standard — v1.0

## Canonical decision

This package is the mandatory visual and structural standard for Tanzer Anderson email communication.

- **New external threads:** full branded environment.
- **New internal notices, approvals, and system alerts:** full internal variant.
- **Replies and forwards:** compact branded signature, not the full stationery.
- **Automated messages:** HTML and plain-text versions generated from the same data model.
- **Recipient-company logo:** optional, never required, and limited to researched one-to-one external communication.

The shared shell is intentionally built from live HTML, system fonts, background colors, borders, and tables. The architectural image is used for the hosted preview and brand environment, not as the body background of an email. That protects readability, deliverability, dark-mode behavior, and compatibility when images are blocked.

## Visual system

| Element | Standard |
|---|---|
| Canvas | Warm stone / sand |
| Message surface | Museum white / ivory |
| Structure | Deep navy |
| Accent | Restrained limestone gold |
| Display typography | Georgia / Times New Roman fallback |
| Body typography | Arial / Helvetica fallback |
| Maximum width | 640px |
| Primary CTA | Navy field with gold text |
| Secondary CTA | Ivory field with gold border |
| Footer | Sand field, small classification and confidentiality copy |

## Required message anatomy

1. Hidden preheader.
2. Tanzer Anderson live-text brand header.
3. Classification label: external, candidate, client, internal, approval, or confirmation.
4. Optional recipient context/logo strip.
5. Short eyebrow.
6. One outcome-led headline.
7. Concise message body.
8. Optional bullets or callout.
9. One primary CTA; one secondary CTA only when operationally necessary.
10. Correct sender identity and title.
11. Classification and confidentiality footer.
12. Plain-text fallback.

## Sender identity rules

**Henry Anderson**

Managing Director of Business Development & Account Management  
Tanzer Anderson  
henry@tanzeranderson.com

Do not label Henry as Founder or Managing Partner.

**Tanzer Anderson Operations**

Search Coordination & Client Operations  
coordinator@tanzeranderson.com

Use the operations identity for scheduling, confirmations, approval notices, and system-generated messages unless Henry is intended to be the direct sender.

## Recipient logo rules

A recipient-company logo may be used only when all of the following are true:

- The message is one-to-one and individually researched.
- The company is named openly in the communication.
- The logo improves context rather than creating a false endorsement.
- A text label remains visible if the image is blocked.

Do not use recipient logos in bulk outreach, confidential candidate outreach, internal messages, blind-market mapping, or any communication where the client/company identity must remain confidential.

## Thread behavior

The full environment appears once at the start of a thread. Replies and forwards use the compact signature. This preserves the desired brand setting without making long threads visually heavy or increasing clipping and spam risk.

## Accessibility and deliverability

- Body copy is at least 15–16px with generous line height.
- No meaning depends on an image.
- No external web fonts.
- No tracking pixel by default.
- Buttons remain understandable as ordinary links in the plain-text version.
- Images, when used, require useful alt text.
- HTML and text versions are both sent as `multipart/alternative`.
