# Private Monograph Hybrid V5

## Objective

Hybrid V5 removes the single-image failure mode seen in Outlook mobile. The complete correspondence now renders as native table-based HTML with inline styles, so the message remains branded, legible, and usable even when remote or CID images are blocked.

## Visual standard

- Warm ivory / paper field with deep-navy structural bands and restrained gold rules.
- Native HTML typography and spacing; no single inline image is required for the message to render.
- Henry Anderson signature: thin dark-blue cursive, right-slanted, followed by the exact title `Managing Director - Strategy and Business Development` and `director@tanzeranderson.com`.
- Optional artwork can be added later as a progressive enhancement, never as the sole content surface.

## First-touch copy standard

Every first-touch message must follow: specific observation → low-friction proof mechanism → concrete deliverable → clear boundary → easy next step.

For the Commercial Talent Sprint, the pre-purchase proof demonstrates method and output architecture only. Candidate research, ranking, evidence and the completed handoff remain paid work.

## Controls

- Real sender and Reply-To must be `director@tanzeranderson.com`.
- Hybrid V5 refuses to run unless that address exists in `GmailApp.getAliases()`.
- Internal rendering tests are hard-limited to `hankfrisco972@gmail.com` and `henryand83@live.com`.
- External messages are created as drafts only through `createPrivateMonographHybridV5Draft()`.
- There is no external batch-send function.
- Gmail mobile and Outlook mobile visual QA are required before prospect release.

## Acceptance criteria

1. No broken-image placeholder is required for the message to make sense.
2. Greeting, proof block, commercial boundary, signature, title and contact address remain visible with images disabled.
3. Signature appears as thin dark-blue right-slanted cursive where the client supports script fonts, with a cursive fallback stack otherwise.
4. Layout remains within a 640px responsive table and scales to mobile width.
5. All prospect drafts remain unsent until Henry separately authorizes release.
