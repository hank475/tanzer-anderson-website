# Tanzer Anderson Exact Body V7

Exact Body V7 is the canonical visual-delivery standard for Henry Anderson's first-touch correspondence.

## Why V7 exists

The prior native-HTML version rendered acceptably, but Gmail and Outlook independently changed typography, column height, and image behavior. The right architectural panel ended early in both clients, leaving an unintended blue block. Earlier CID delivery could also expose the designed correspondence as an attachment.

V7 removes those client-dependent failure points by rendering the complete approved composition before email assembly, then placing the resulting compressed JPEG directly in the HTML body as a data URI.

## Required visual standard

- navy folded-estate masthead;
- warm textured ivory correspondence field;
- full-height curved-glass architectural panel;
- explicit personalized greeting;
- body-size opening beginning `Rather than send a general agency pitch I’d suggest...`;
- visual proof-of-concept market map;
- role-specific section after the proof map;
- dark-blue, thin, right-slanted cursive `Henry Anderson` signature;
- exact title: `Managing Director - Strategy and Business Development`;
- exact sender identity: `director@tanzeranderson.com`;
- navy CTA footer.

## Delivery contract

1. No image attachment.
2. No CID dependency.
3. No background-image dependency.
4. One HTML body with one embedded JPEG.
5. Complete plain-text MIME alternative, never shown beneath the HTML version.
6. Final HTML must remain below 95 KB to avoid Gmail clipping.
7. External messages remain drafts until Henry separately authorizes release.

## Generator

`render_exact_body.py` accepts a JSON record and produces:

- a 680 × 1020 JPEG;
- an HTML body containing the JPEG as a data URI;
- a plain-text fallback;
- a QA receipt.

The renderer fixes the full composition inside the image. Gmail or Outlook may scale the image to the viewport, but they cannot independently reflow its columns, replace its fonts, shorten its architectural panel, or expose the design as an attachment.

## Acceptance gate

A first-touch draft cannot enter a send wave unless:

- the greeting names the intended person or team;
- the opening and proof map are role-specific;
- the email HTML is below 95 KB;
- the body contains no attachment reference;
- the full-height glass panel reaches the navy footer;
- Gmail mobile and Outlook mobile internal tests display one designed body, not a designed attachment plus a second version;
- the recipient route is verified;
- external release remains locked.

No email-client architecture can force an image to display when a recipient has disabled all remote/inline imagery. Subject to images being permitted, V7 is the pixel-locked standard.