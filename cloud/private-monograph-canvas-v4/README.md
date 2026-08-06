# Tanzer Anderson Private Monograph Canvas v4

## Purpose

Canvas v4 is the exact-render fallback and preferred premium-delivery mode when Gmail or Outlook cannot reproduce the approved correspondence reliably with ordinary HTML.

The complete message is rendered as a high-resolution JPEG before email composition. A minimal MIME shell then embeds that canvas with a true Content-ID image, adds live Sprint and Stripe links beneath it, and includes a complete plain-text alternative.

This prevents the recipient's mail client from changing:

- the tactile paper grain;
- the white-and-blue architectural composition;
- the deep-navy field;
- typography and spacing;
- the gold cursive signature;
- the exact title and director email address.

## Identity standard

- **Name:** Henry Anderson
- **Title:** Managing Director - Strategy and Business Development
- **From / Reply-To:** director@tanzeranderson.com
- **Greeting:** `Hello {first_name},`

## Critical sender gate

Canvas v4 refuses to install, create drafts, or send internal tests unless `director@tanzeranderson.com` appears in `GmailApp.getAliases()`.

The address must therefore be configured and verified under Gmail **Settings → Accounts and Import → Send mail as** for the Workspace account running the script. Merely adding an inbound alias in the Admin console is not enough if Gmail does not expose it as a Send mail as identity.

## One-time installation

1. Sign in to the Tanzer Anderson Google Workspace account that owns the Gmail drafts.
2. Confirm `director@tanzeranderson.com` is available in Gmail's From dropdown.
3. Create a standalone Google Apps Script project.
4. Copy `Code.gs` into the project and replace the manifest with `appsscript.json`.
5. Run `installPrivateMonographCanvasV4()` and approve the requested Google scopes.
6. Run `systemStatusPrivateMonographCanvasV4()` and confirm `directorAliasActive: true`.

## Internal rendering test

Run:

```javascript
sendPrivateMonographCanvasV4Tests();
```

This function is hard-limited to:

- `hankfrisco972@gmail.com`
- `henryand83@live.com`

No other recipient can be used by the test sender.

## Private release queue

The 20-recipient routing list remains in a private Google Sheet and is never committed to the public repository.

Required headers:

| Header | Purpose |
|---|---|
| Active | Include or skip the row |
| Wave | Launch wave |
| Company | Prospect company |
| Slug | Matches `/prospects/{slug}.jpg` |
| First Name | Required greeting |
| Channel | `GMAIL_DRAFT` or `OFFICIAL_FORM` |
| Recipient / Route | Recipient email or official form URL |
| Subject | Outbound subject |
| Intro | Prospect-specific opening |
| Recommended Use | Prospect-specific use case |
| Release State | `REVIEW_ONLY`, `HOLD`, or `SENT` |
| Status | Script result |
| Draft ID | Created Gmail draft ID |
| Draft Created At | Audit timestamp |
| Detail | Audit detail or error |

Connect the Sheet once:

```javascript
configurePrivateMonographCanvasV4Queue('GOOGLE_SHEET_ID', 'Canvas v4 Queue');
```

Then create the governed drafts:

```javascript
createPrivateMonographCanvasV4SprintDrafts();
```

This function:

- creates Gmail drafts only;
- uses `director@tanzeranderson.com` as the real From alias;
- embeds the personalized JPEG as `cid:canvas` with `inlineImages`;
- adds a complete plain-text alternative;
- labels each draft `TA / Canvas v4 Review`;
- skips duplicates;
- records draft IDs and timestamps in the private Sheet;
- never submits an official web form;
- never sends an external message.

## External release control

There is intentionally no batch external-send function in Canvas v4. External prospect release remains a separate Henry authorization and must occur only after:

1. the director alias passes the sender gate;
2. the final personalized canvases pass visual QA;
3. the Gmail and Outlook internal tests pass;
4. the release queue is approved;
5. a separate external-outreach authorization is recorded.

## Hosted assets

The deployment publishes:

- Master canvas: `/private-monograph-canvas-v4.jpg`
- Personalized canvases: `/prospects/{slug}.jpg`

All canvas routes are `noindex`, `nofollow`, `noarchive`, JPEG-only, and immutable-cached. The preview page itself is no-store.
