# Tanzer Anderson Daily Briefing Control

Independent daily briefing delivery and approval system. It is designed to continue operating even when ChatGPT is unavailable or Henry no longer has a ChatGPT subscription.

## What this build does

- Runs on Cloudflare Workers at **7:15 AM America/Chicago** every day.
- Sends separate briefings to:
  - `henry@tanzeranderson.com`
  - `coordinator@tanzeranderson.com` for Destiny's work briefing.
- Renders the approved Version 2 quiet-luxury briefing look as real responsive HTML email.
- Adds real approval controls:
  - **Approve All Action Items**
  - **Review / Approve Selected**
  - one **Approve** button beside each action item
- Uses signed, time-limited links and an auditable Durable Object ledger.
- Prevents duplicate sends and duplicate approvals.
- Uses URL fragments plus same-origin POST requests so ordinary email-security link previews do not mutate approval state.
- Records approvals even when no downstream executor is connected.
- Dispatches only actions explicitly marked `automationSafe=true` when a governed executor webhook is configured.
- Supports an independent Google Apps Script source adapter for live Calendar and briefing-control Sheet data.

## Independence model

| Layer | Service | ChatGPT required? |
|---|---|---:|
| Source control and deployment | GitHub | No |
| Scheduler, approval pages, audit state | Cloudflare Workers + Durable Objects | No |
| Daily email | Cloudflare Email Service | No |
| Live Google Calendar / control data | Google Apps Script companion | No |
| Optional action execution | Governed webhook / AION Work Bridge | No |

## Safety model

- Approval tokens expire after 72 hours.
- Tokens are bound to the briefing ID, audience, exact briefing SHA-256 hash, action scope, and one-time token ID.
- GET requests never directly mutate state. The email link opens a same-origin page; the browser then performs the signed POST.
- Every action is idempotent.
- `automationSafe=false` actions are approval-recorded but not automatically executed.
- No external outreach is released by this system unless a separately configured executor is permitted to perform that exact action.

## Deployment states

### Live
Cloudflare Email Service is onboarded for `tanzeranderson.com`, the two destination addresses are verified, and the `EMAIL` binding deploys successfully.

### Preview
The Worker, scheduler, approval pages, audit ledger, and source adapter are deployed, but email sending is disabled. The GitHub workflow automatically falls back to this mode when Email Service is not yet ready.

## Required GitHub secrets already used by the repository

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Optional GitHub secrets

- `DAILY_BRIEFING_SOURCE_PUSH_SECRET` — shared with the Google Apps Script companion.
- `DAILY_BRIEFING_ADMIN_TOKEN` — enables the protected manual send endpoint and workflow validation send.
- `DAILY_BRIEFING_SOURCE_TOKEN` — bearer token for an optional remote source URL.
- `DAILY_BRIEFING_WEBHOOK_SECRET` — signs downstream approval-executor calls.

## Optional GitHub repository variables

- `DAILY_BRIEFING_SOURCE_URL`
- `DAILY_BRIEFING_WEBHOOK_URL`

## Google Workspace source adapter

Files are in `apps-script/`.

1. Create a standalone Google Apps Script project.
2. Add `Code.gs` and `appsscript.json`.
3. Set Script Properties:
   - `WORKER_SOURCE_URL`
   - `WORKER_SOURCE_PUSH_SECRET`
4. Run `installDailyBriefingSource()` once and approve Calendar, Sheets, external-request, and trigger permissions.
5. Review the generated **Tanzer Anderson | Daily Briefing Control** Sheet.
6. Run `publishDailyBriefings()` once as a controlled test.

The script publishes at approximately 6:45 AM Central; the Cloudflare Worker sends at exactly 7:15 AM Central.

## Email activation

Cloudflare Email Service must be onboarded for the Tanzer Anderson domain. The Worker is restricted to the two briefing recipients and the sender `briefings@tanzeranderson.com`. The public website Pages project, nameservers, Google Workspace MX records, and existing production deployment are not changed by this build.
