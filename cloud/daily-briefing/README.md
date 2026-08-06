# Tanzer Anderson Daily Briefing Control

Independent daily briefing delivery and approval system. It is designed to continue operating even when ChatGPT is unavailable or Henry no longer has a ChatGPT subscription.

## Current verified state

- **GitHub continuity briefing:** live. A 7:15 AM America/Chicago workflow creates Henry's daily briefing issue, assigns and mentions him, and preserves an auditable action checklist.
- **GitHub continuity approvals:** live and tested. `APPROVE ALL`, selected approvals such as `APPROVE A1,A3`, and explicit holds are recorded without releasing external outreach.
- **Cloudflare Worker:** code complete and QA-passed, but not deployed because the repository currently has no usable `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` in GitHub Actions.
- **Cloudflare email delivery:** not live.
- **Google Workspace email and approval runtime:** code complete, but requires one Workspace Apps Script deployment and installation.
- **Outreach hold:** remains active and independent of this briefing build.

The permanent deployment ledger is GitHub Issue #6. The current briefing control workbook is:

`https://docs.google.com/spreadsheets/d/1nB6JIRhCCpoN3NyrQrhik2yiozWjFnfU1OqbjimtQX4/edit`

## What this build provides

- Separate briefing lanes for:
  - `henry@tanzeranderson.com`
  - `coordinator@tanzeranderson.com` for Destiny's work briefing.
- The approved Version 2 quiet-luxury briefing look as responsive HTML email.
- Real approval controls:
  - **Approve All Action Items**
  - **Review / Approve Selected**
  - one **Approve** button beside each action item
- Signed, time-limited, briefing-specific approval links.
- Briefing checksum binding, one-time token IDs, duplicate-send prevention, and duplicate-approval prevention.
- Approval and execution ledgers.
- A governed execution queue. Only actions explicitly marked `AutomationSafe=TRUE` and supplied with an `ExecutionKey` may enter the automation-safe queue.
- A hard boundary preventing briefing approval from being interpreted as external campaign release authority.

## Independence model

| Layer | Primary | Continuity alternative | ChatGPT required? |
|---|---|---|---:|
| Source control | GitHub | Google Sheets control workbook | No |
| Daily schedule | Cloudflare Cron | Apps Script one-time daily trigger / GitHub schedule | No |
| Branded email | Cloudflare Email Service | Google Workspace MailApp | No |
| Approval pages | Cloudflare Worker | Workspace-restricted Apps Script web app | No |
| Audit state | Durable Object | Google Sheets ledgers | No |
| Live Calendar and control data | Google Apps Script | Control workbook without Calendar enrichment | No |
| Optional action execution | Governed webhook / AION Work Bridge | Execution Queue review | No |

## Safety model

- Approval tokens expire after 72 hours.
- Tokens are bound to briefing ID, audience, exact briefing SHA-256 hash, scope, action IDs, and one-time token ID.
- Email links use URL fragments; ordinary link-preview GET requests do not mutate approval state.
- Every approval is idempotent.
- `AutomationSafe=FALSE` actions are approved and recorded but not automatically executed.
- The GitHub continuity lane records approval only and never performs external outreach.
- No external outreach, candidate release, meeting invitation, or commercial commitment is authorized by a briefing button unless a separately governed release control explicitly permits that exact action.

## Cloudflare deployment path

The workflow `.github/workflows/deploy-daily-briefing.yml` performs QA before deployment gating. When credentials exist it:

1. resolves the Workers subdomain;
2. attempts the full Email Service deployment;
3. falls back to a non-sending preview Worker if Email Service onboarding is incomplete;
4. installs stable approval secrets;
5. verifies `/health`, `/approve`, `/select`, and the home control page;
6. records the result in Issue #6.

Required GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Cloudflare Email Service must also accept the configured sender and verify both internal destinations before daily email can be called live.

## Google Workspace direct runtime

Files are in `apps-script/`:

- `IndependentBriefing.gs` — direct 7:15 scheduling, Version 2 email, approval web app, ledgers, and execution queue.
- `Code.gs` — optional source-push adapter for the Cloudflare Worker.
- `appsscript.json` — explicit minimum scopes.

Activation:

1. Create a standalone Apps Script project under the Tanzer Anderson Workspace.
2. add all three files;
3. deploy it as a web app, executing as the owner and restricted to the Workspace;
4. run `installIndependentDailyBriefing()` once;
5. review the generated runtime tabs in the existing control workbook;
6. run `sendIndependentDailyBriefingsNow()` for a controlled Henry/Destiny test.

The installer schedules the next run for 7:15 AM America/Chicago and reschedules the following run after each execution. The Google runtime uses MailApp and therefore does not depend on Cloudflare or ChatGPT.

## GitHub no-secret continuity fallback

- `.github/workflows/daily-briefing-continuity.yml` creates or refreshes Henry's daily issue.
- `.github/workflows/daily-briefing-continuity-approvals.yml` validates owner commands and updates checkboxes with an approval receipt.
- It uses only the repository's built-in `GITHUB_TOKEN`.
- GitHub may send the issue notification by email according to Henry's GitHub notification settings, but that notification path is not treated as the final branded email service.

## Public-site isolation

This build does not alter the Tanzer Anderson public Pages project, production website, custom domains, nameservers, MX records, Google Workspace routing, or existing public-site rollback deployment.
