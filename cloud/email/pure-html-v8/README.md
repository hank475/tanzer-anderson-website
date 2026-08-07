# Tanzer Anderson Max Safe Portal

Max Safe Portal is the canonical first-touch email standard for Henry Anderson.

The textured, image-based, CID, data-URI and exact-body email experiments are halted. Their visual language is retained for later PDF communications, where a recipient has already established enough trust to open an attachment or hosted document.

## Canonical architecture

- one 640px table with `max-width:100%`;
- one-column body, preventing Gmail or Outlook from moving a decorative side panel below the message;
- pure-HTML architectural band directly below the masthead;
- 2 × 2 proof-map cards;
- five-stage market funnel without arrows that can wrap unpredictably;
- role-specific section after the proof map;
- process boundary;
- dark-blue cursive signature;
- full-width navy and gold CTA footer;
- inline CSS and solid colors only.

The word `ring` is prohibited. The proof map uses direct-market, adjacent-market, capability and evidence labels instead.

## Role-intake CTA

**Reply with one role** is a real link to:

`https://tanzeranderson.com/role-intake/`

Each generated link can prefill:

- recipient first name;
- company;
- recipient business email;
- role title;
- campaign reference;
- source attribution.

The button has a stable inline presentation in every supported client. A tightly scoped `:hover` rule raises the button by two pixels and adds a deeper shadow in clients that honor email hover CSS. Clients that ignore hover still display a working gold CTA and open the same portal.

The portal lets the recipient provide title, function, employment type, compensation, on-site/hybrid/remote/flexible arrangement, location, timing, posting link, business outcome, must-haves, flexible qualifications, target markets, exclusions, confidentiality and free-form notes. Every field is optional; more detail is encouraged because it sharpens the initial market map. Submission does not begin candidate outreach.

## Canonical content order

1. Personalized greeting.
2. Body-sized opening beginning `Rather than send a general agency pitch I’d suggest`.
3. Architectural market-intelligence band.
4. Visual proof-of-concept map.
5. Five-stage talent funnel.
6. Differentiation and role-specific observation.
7. Process boundary.
8. Dark-blue cursive signature.
9. Personalized role-intake CTA.

## Delivery contract

- multipart/alternative only;
- one plain-text part and one HTML part;
- no multipart/mixed;
- no images;
- no ordinary attachments;
- no inline-image MIME parts;
- no CID, data URI or remote assets;
- no background images;
- no web fonts or external stylesheets;
- no JavaScript, flexbox, CSS grid, absolute positioning, transforms or media queries;
- one scoped progressive hover rule is permitted for the CTA anchor;
- HTML below 50 KB;
- external messages remain drafts until Henry separately authorizes release.

## Why this is the stable standard

Every visible component is ordinary email-native HTML: nested tables, text, borders and solid background colors. A receiving client can substitute a system font or scale the message for its viewport, but it cannot block an architectural image, expose the design as an attachment, end a side photograph early, or create a blank colored panel beneath it.

## PDF boundary

A PDF cannot be reliably superimposed as live email content. Standard clients generally treat it as an attachment or link; embedded-object, iframe and similar approaches are not dependable in outbound mail. The Private Monograph visual system is therefore reserved for PDF communications after trust is established.

## Acceptance gate

- personalized greeting present;
- approved opening present;
- proof map contains exactly four cards;
- the word `ring` is absent;
- no forbidden asset or CSS token;
- personalized portal URL present;
- CTA works without hover;
- progressive hover is isolated to the CTA anchor;
- HTML below 50 KB;
- Gmail and Outlook mobile tests show one complete body;
- recipient route verified;
- external release locked.
