# Tanzer Anderson Private Monograph Email System v2.2

## Approved canonical standard

The approved Private Monograph design is the Tanzer Anderson email base for internal and external correspondence.

**Henry Anderson**  
**Managing Director of Business Development & Account Management**

The design removes the prior “Clarity. Alignment. Enduring Value.” headline, moves the message body upward, and retains the approved scripted Henry Anderson signature, ivory tactile surface, architectural-arc treatment, deep-navy panel, restrained gold details, and Private & Confidential framing.

## Activation package

The complete Apps Script package is stored in the authorized Tanzer Anderson Google Drive:

- Package: `Tanzer_Anderson_Private_Monograph_Email_Automation_v2.2.zip`
- Drive file ID: `1iPS8tvEVi93xsn-H9vtYSYI1uHKHIcq3`
- SHA-256 record file ID: `1R59JJXgMN99ZiRLpuL0l7WFDu9gGQKon`
- Start Here Google Doc ID: `1nnkCpN6mrQl2lVCbfqLmFNniDf1YLupDCVDxzjm6u1E`

## One-run activation

Run `activatePrivateMonographEmailSystem()` as `henry@tanzeranderson.com`.

The system then:

1. Installs the corrected compact Gmail signature.
2. Creates a JSON backup of every current Gmail draft before any mutation.
3. Migrates drafts in controlled batches without sending them.
4. Preserves recipients, subjects, CC/BCC, original threads, and ordinary attachments.
5. Omits the external scheduling CTA on internal/control drafts.
6. Treats no-recipient recipient-facing drafts as external unless their subject/body carries an internal-control cue.
7. Skips drafts already carrying the canonical `TA_PRIVATE_MONOGRAPH_V2` marker, preventing nested re-wrapping.
8. Creates a one-minute watcher for newly saved drafts.
9. Creates a migration log and rollback pathway.

## Validation completed

- Apps Script source passes JavaScript syntax validation.
- Manifest parses successfully.
- The exact approved title is present.
- The superseded Strategy & Business Development title is absent.
- No send method is present in the migration source.
- Signature bytes match the packaged approved signature asset.
- No-recipient and already-wrapped draft handling passed static checks.
- ZIP integrity passed.
- Master Gmail template and v2.2 activation draft were created unsent.
- The 163 pre-existing drafts were labeled `TA / PRIVATE MONOGRAPH / PENDING MIGRATION` for controlled cutover.

## Production gate

Do not merge this record as a production-status claim until the Google authorization run completes, `systemStatus()` reports a zero migration queue, representative internal/external drafts pass desktop and mobile review, and rollback is verified on a disposable draft.
