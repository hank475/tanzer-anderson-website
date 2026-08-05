# Tanzer Anderson Recruiting Coordinator Program

**Employee:** Destiny Anderson  
**Role:** Recruiting Coordinator  
**Operating surface:** Interview Operations  
**Objective:** Make excellent coordination the default while minimizing memory work, repetitive follow-up, calendar reconstruction, and uncertainty.

## 1. Destiny’s job in one sentence

Keep candidates, clients, interviewers, and internal teams moving through interviews calmly, accurately, and on time—while the system surfaces the next action and handles routine preparation.

## 2. What the system should do for her

The program should prepare routine work, detect risk, and explain what matters. Destiny should not have to search through inboxes, compare time zones manually, rebuild interview loops after a cancellation, remember who owes feedback, or wonder whether a message was sent.

The system should:

- Consolidate today’s interviews, deadlines, missing confirmations, and exceptions.
- Rank the next best action.
- Normalize time zones and display candidate-local time.
- Prepare availability requests, holds, confirmations, reminders, and feedback prompts.
- Validate company, role, stage, participants, links, timing, privacy, and mobile rendering.
- Preserve an interview loop during rescheduling when possible.
- Separate routine safe actions from actions that require Henry or a search lead.
- Record what changed, who approved it, what was sent, and whether delivery succeeded.
- Escalate only material exceptions.

## 3. Day-to-day operating rhythm

### Start of day — 15 minutes

1. Open **Today**.
2. Review the recommended next action and all high-severity exceptions.
3. Confirm every interview in the next four hours has a valid link, confirmed participants, preparation status, and a feedback owner.
4. Release approved reminders.
5. Escalate only items marked outside coordinator authority.

### Throughout the day

- Work from the chronological operating list rather than the inbox.
- Resolve exceptions from the Exception Desk using the recommended remedy and safe-action boundary.
- Use the Communications Center for every candidate, interviewer, and client message.
- Keep candidate-sensitive notes within the correct role-based view.
- Confirm attendance and technical issues immediately after each interview.
- Trigger feedback prompts and watch the deadline.

### End of day — 15 minutes

1. Clear or hand off every open high-severity exception.
2. Confirm tomorrow morning’s first interviews are ready.
3. Review overdue feedback and schedule approved reminders.
4. Verify that all sent communications have delivery receipts or a documented failure.
5. Leave a concise handoff: what changed, what matters, the recommendation, and who owns the next action.

## 4. Dashboard modules

### Today

Shows the day’s interview sequence, readiness, deadlines, responsible coordinator, next action, and intervention priority.

### Interviews

Shows each active loop, stage, participants, confirmations, Meet-link health, preparation, feedback owner, and completion state.

### Availability

Collects candidate availability, reads permitted free/busy data, normalizes time zones, applies working-hour and buffer rules, and ranks viable slots.

### Communications

Prepares approved messages with recipient, purpose, timing commitment, approval state, delivery status, and plain-text fallback.

### Exceptions

Prioritizes no common time, cancellation, withdrawal risk, broken links, time-zone mismatch, accommodation requests, missing participants, late feedback, failed communication, and policy conflict.

### Reporting

Tracks time to confirmed loop, reschedule frequency, response latency, feedback completion, preventable failures, coordinator intervention minutes, candidate-experience exceptions, and cost per completed loop.

## 5. Authority model

### System may prepare automatically

- Draft availability requests.
- Draft confirmations and reminders from approved templates.
- Identify common time slots.
- Flag conflicts, stale status, missing feedback, and invalid links.
- Prepare tentative holds.
- Generate an end-of-day handoff.

### Destiny may execute without executive approval

- Send approved routine scheduling communications.
- Place and release tentative holds within policy.
- Correct non-material formatting or link errors after validation.
- Send approved reminders.
- Record attendance and routine service issues.
- Apply a documented recovery playbook within its limits.

### Henry or the search lead must approve

- Candidate rejection, withdrawal interpretation, or substantive status commitment.
- Client-facing explanation of a material failure.
- Changes to interview structure, assessment design, commercial terms, or candidate presentation.
- Recording or transcription activation.
- Sharing sensitive candidate information outside the approved group.
- Any action outside the documented safe-action boundary.

## 6. Recommended Google Workspace identities

Create one primary employee account and aliases rather than multiple separate inboxes unless a business reason requires separate accounts.

- Primary employee identity: `destiny@tanzeranderson.com`
- Coordinator alias: `coordinator@tanzeranderson.com`
- Interview operations alias: `interviews@tanzeranderson.com`
- Scheduling alias: `scheduling@tanzeranderson.com`

Use shared/group addresses only when ownership, retention, and handoff rules are explicit. Destiny’s personal Gmail should remain a temporary onboarding contact, not the production operating identity.

## 7. Candidate and client experience standard

Every interaction should be calm, concise, accurate, and easy to act on. Each message should answer:

1. What is happening?
2. What does the recipient need to do?
3. By when?
4. What happens next?
5. How can they reach Destiny if something changes?

No internal codenames, requisition IDs, proprietary scores, audit terminology, migration language, or unsupported status claims may appear externally.

## 8. Production integration plan

### GitHub

- Keep source control, issues, review, and release history.
- Use a protected feature branch and draft pull request for the initial implementation.
- Require review before merge or production deployment.

### Cloudflare

- Host the internal application separately from the public website.
- Require Cloudflare Access authentication.
- Use a Worker for policy enforcement and controlled integrations.
- Use D1 for operational state and an append-only event ledger.
- Do not expose internal routes or data in public site navigation or search indexing.

### Google Cloud / Workspace

- Use a dedicated Google Cloud project for OAuth credentials and auditability.
- Connect only the Gmail, Calendar, Drive, Contacts, and Meet permissions required for the approved workflow.
- Use employee identity and role-based access; avoid shared passwords.
- Require action receipts and round-trip verification for every write.

## 9. Acceptance standard

The program is ready for Destiny only when:

- She can identify the highest-risk interview in under five seconds.
- She can repair a standard reschedule without reconstructing the full loop.
- Every Meet link is validated before an interview is marked ready.
- Every external message has one primary action and explicit timing.
- Every consequential write has an owner, authorization basis, timestamp, and result.
- Mobile use is practical and accessible.
- Revoked access stops future use immediately.
- No production surface claims synchronization before authenticated read/write tests pass.
