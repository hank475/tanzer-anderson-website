# Tanzer Anderson Universal Email Environment v1.0

This branch stages the governed Tanzer Anderson email environment for review. It does **not** activate production sending and must not be merged or deployed until Henry Anderson records final approval and the Gmail/Cloudflare pathways pass client-level QA.

## Canonical operating rule

- New external threads use the full branded environment.
- New internal notices, approvals, and system alerts use the full internal environment.
- Replies and forwards use the compact branded signature so threads remain readable.
- Automated messages produce both live HTML and plain-text MIME parts from the same model.
- Recipient-company logos are optional and permitted only for researched one-to-one external communication.

## Source bundle

The complete source-only implementation is stored as five base64 chunks in `source/`.

Restore it from this directory:

```bash
cat source/email-environment-source-v1.0.tar.gz.b64.part-* \
  | base64 --decode \
  > email-environment-source-v1.0.tar.gz

sha256sum email-environment-source-v1.0.tar.gz
# Expected: ccda5eeb260417a0396fea788f97b9387c2b554f12b5a5a236b7ccd94c243352

tar -xzf email-environment-source-v1.0.tar.gz
cd renderer
npm test
```

The full review package, including rendered previews and reference imagery, is maintained separately from the production repository so binary design assets do not affect the public-site deployment.

## Release gate

Before activation:

1. Review the draft pull request.
2. Deploy the private Cloudflare renderer with its bearer-token secret and origin allowlist.
3. Install the correct Gmail signatures and saved templates in the approved Tanzer Anderson accounts.
4. Confirm full stationery on first messages and compact mode on replies/forwards.
5. Pass Gmail web/mobile, Apple Mail, Outlook web/desktop, dark-mode, image-blocked, and plain-text QA.
6. Record Henry Anderson's final authorization before any production merge or send-path change.
