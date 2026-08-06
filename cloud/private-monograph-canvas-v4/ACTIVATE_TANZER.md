# Tanzer Anderson Canvas v4 — One-Run Activation

## Prepared assets

- Private queue: `Tanzer Anderson — Private Monograph Canvas v4 — Governed Queue`
- Queue spreadsheet ID: `1Uxr48BV65b9TfLedl6OFtxKukavbGF-0OMAGISbahzM`
- Queue sheet: `Canvas v4 Queue`
- Hosted asset origin: `https://tanzer-private-monograph-canvas-v4.pages.dev`
- Sender: `director@tanzeranderson.com`

## Required Gmail identity gate

Before running the script, Gmail must expose `director@tanzeranderson.com` as a verified **Send mail as** identity. Canvas v4 verifies this through `GmailApp.getAliases()` and exits without creating drafts when the identity is absent.

## One run

After copying `Code.gs`, `TanzerBootstrap.gs`, and `appsscript.json` into a standalone Apps Script project, run:

```javascript
installPrivateMonographCanvasV4ForTanzer();
```

That function:

1. verifies the director sender alias;
2. verifies the hosted master canvas;
3. connects the private 20-account queue;
4. creates the review label;
5. returns the complete status record.

## Controlled validation

Run:

```javascript
sendPrivateMonographCanvasV4Tests();
```

This is hard-limited to Henry’s Gmail and Outlook test inboxes.

## Draft factory

After the internal display test passes, run:

```javascript
createPrivateMonographCanvasV4SprintDrafts();
```

This creates the 11 email-addressable prospect drafts with true CID-inline personalized canvases and records the results in the private queue. The other nine rows remain `FORM_COPY_READY`. Nothing is sent externally.

## Release boundary

Canvas v4 intentionally contains no external batch-send function. A separate Henry authorization remains required after visual QA and sender verification.
