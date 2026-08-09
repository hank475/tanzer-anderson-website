# Tanzer Anderson Private Monograph Email System v2.3

## Approved canonical standard

The approved Private Monograph design is the Tanzer Anderson email base for internal and external correspondence.

**Henry Anderson**  
**Managing Director - Strategy and Business Development**

The design removes the prior “Clarity. Alignment. Enduring Value.” headline, moves the message body upward, and retains the approved scripted Henry Anderson signature, ivory tactile surface, architectural-arc treatment, deep-navy panel, restrained gold details, and Private & Confidential framing.

## Activation package

The complete Apps Script package is stored in the authorized Tanzer Anderson Google Drive as fresh v2.3 uploads, without superseded package revision history:

- Package: `Tanzer_Anderson_Private_Monograph_Email_Automation_v2.3.zip`
- Drive file ID: `1o6_CZJ-pc_aSg7x7EDBGzaQipRJQSUjo`
- SHA-256 record file ID: `1Buh8gNirb1WZrZUFI6MhiGdkNcfV0ZeS`
- Start Here Google Doc ID: `1nnkCpN6mrQl2lVCbfqLmFNniDf1YLupDCVDxzjm6u1E`

## Authorized production activation

Run `activatePrivateMonographEmailSystem()` as `henry@tanzeranderson.com`.

Henry has authorized the system. Google consent is required only if the installed script project does not yet hold the declared scopes.

The system then:

1. Installs the corrected compact Gmail signature.
2. Creates a JSON backup of every current Gmail draft before any mutation.
3. Migrates drafts in controlled batches without sending them.
4. Preserves recipients, subjects, CC/BCC, original threads, and ordinary attachments.
5. Omits the external scheduling CTA on internal/control drafts.
6. Treats no-recipient recipient-facing drafts as external unless their subject/body carries an internal-control cue.
7. Repairs earlier Private Monograph drafts that still carry a superseded title.
8. Skips only drafts that already carry both the canonical `TA_PRIVATE_MONOGRAPH_V2` marker and the exact v2.3 title, preventing nested re-wrapping.
9. Retries failed migrations up to three times and exposes any permanent failures.
10. Creates a one-minute watcher for newly saved drafts.
11. Creates a migration log and rollback pathway.
12. Reports current, superseded, unwrapped, failed, and production-ready states through `systemStatus()`.

## Future-email operating rule

Gmail does not provide a native Apps Script event for draft creation. The watcher polls once per minute. To guarantee the approved shell on future correspondence, every outbound message must be saved as a draft and allowed one watcher interval before release. The message may be sent only after the full shell and exact corrected title are visible. Automated pathways remain draft-only until wrapping completes.

## Validation completed

- Apps Script source passes JavaScript syntax validation.
- Manifest parses successfully.
- The exact approved title is present.
- All superseded title variants are absent from human-readable package documents.
- No send method is present in the migration source.
- Signature bytes match the packaged approved signature asset.
- No-recipient classification, superseded-title repair, current-v2.3 skip behavior, retry handling, and status reporting passed static checks.
- Corrected preview was generated from the master HTML.
- ZIP integrity passed.

## Production gate

Do not merge this record as a production-status claim until `systemStatus()` reports `readyForProduction: true`, a zero migration queue, no permanent failures, zero superseded or unwrapped drafts, representative internal/external drafts pass desktop and mobile review, the future-draft watcher is verified, and rollback is tested on a disposable draft.
