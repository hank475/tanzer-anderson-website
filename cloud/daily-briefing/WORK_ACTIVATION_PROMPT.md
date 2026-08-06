# Work Activation Prompt — Independent Daily Briefing

## Mission

Activate the already-built Tanzer Anderson independent daily briefing through Google Workspace. This is an implementation assignment, not a planning assignment.

The desired result is a live Workspace-restricted Apps Script that:

- emails Henry at `henry@tanzeranderson.com` each day at 7:15 AM America/Chicago;
- emails Destiny separately at `coordinator@tanzeranderson.com`;
- renders the approved Version 2 beige, deep-navy and restrained-gold HTML briefing;
- includes **Approve All**, **Review / Approve Selected**, and one **Approve** control for each approval-required action;
- records approvals, sends, snapshots and queued actions in the existing control workbook;
- remains operational without ChatGPT or a ChatGPT subscription;
- never releases external outreach, candidates, invitations or commercial commitments merely because a briefing action was approved.

## Authoritative assets

Repository:

`https://github.com/hank475/tanzer-anderson-website/tree/main/cloud/daily-briefing`

Apps Script files:

- `apps-script/Code.gs`
- `apps-script/IndependentBriefing.gs`
- `apps-script/appsscript.json`

Control workbook:

`https://docs.google.com/spreadsheets/d/1nB6JIRhCCpoN3NyrQrhik2yiozWjFnfU1OqbjimtQX4/edit`

Deployment ledger:

`https://github.com/hank475/tanzer-anderson-website/issues/6`

## Execution

1. Sign into the Tanzer Anderson Google Workspace as Henry.
2. Create one standalone Apps Script project named **Tanzer Anderson Independent Daily Briefing**.
3. Replace the default project files with the three authoritative files above. Preserve their contents exactly unless a verified Apps Script compatibility issue requires a narrow correction.
4. Confirm project timezone is `America/Chicago`.
5. Deploy as a web app:
   - execute as Henry / the deploying Workspace owner;
   - restrict access to users in the Tanzer Anderson Workspace;
   - do not make it public or anonymous.
6. Complete the minimum OAuth consent for Calendar read, Sheets, script triggers, email send and user email identity.
7. Run `installIndependentDailyBriefing()` once.
8. Confirm the installer:
   - recognizes the existing control workbook;
   - creates or validates Approval Ledger, Send Ledger, Briefing Snapshots and Execution Queue;
   - stores the web-app URL and signing secret;
   - schedules the next 7:15 AM America/Chicago run.
9. Do not set `DESTINY_CALENDAR_ID` unless a verified separate work calendar exists and Henry authorizes its use. Destiny's briefing must not inherit Henry's private calendar by default.
10. Run `sendIndependentDailyBriefingsNow()` once as a controlled internal test.
11. Verify two separate emails arrive:
    - Henry receives Daily Executive Briefing;
    - Destiny's work address receives Daily Coordinator Briefing.
12. In Henry's test email, approve only the non-consequential item about reviewing briefing controls. Verify:
    - the approval page loads under the Workspace-restricted web app;
    - the Approval Ledger receives one record;
    - the Execution Queue receives one controlled record;
    - refreshing or repeating the same link does not create a duplicate;
    - no external email, invitation, outreach, candidate release or commercial action occurs.
13. Test **Review / Approve Selected** with a disposable internal test item and verify only the selected item is recorded.
14. Confirm the Send Ledger prevents a duplicate briefing for the same audience and date.
15. Confirm the next scheduled trigger remains present after the test run.
16. Record in GitHub Issue #6:
    - Apps Script project name;
    - Workspace-restricted deployment status;
    - deployment URL, without exposing secrets;
    - next trigger time;
    - Henry delivery result;
    - Destiny delivery result;
    - approval test result;
    - duplicate-control result;
    - any remaining blocker.

## Fail-closed rules

- Do not enable or resume any outreach campaign.
- Do not alter the four paused Search Partner batches.
- Do not make the Apps Script web app public.
- Do not use Destiny's private Gmail address.
- Do not add recipient-company logos.
- Do not expose script properties, signing secrets, OAuth tokens or deployment credentials.
- Do not claim the system is live until both emails and at least one approval receipt have been verified.
- If any permission, deployment or sender restriction fails, stop at the exact failed gate and record the evidence in Issue #6.

## Acceptance

The assignment is complete only when the 7:15 schedule, both separate internal emails, approve-all, approve-selected, individual approval, ledger recording, idempotency and no-ChatGPT runtime independence have each been verified with evidence.
