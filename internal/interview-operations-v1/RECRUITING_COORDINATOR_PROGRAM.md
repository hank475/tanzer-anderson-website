# Tanzer Anderson + Alder & Rowe Recruiting Coordinator Program

**Employee:** Destiny Anderson  
**Role:** Recruiting Coordinator  
**Operating surface:** Interview Operations  
**Authorized workspaces:** Tanzer Anderson and Alder & Rowe  
**Infrastructure decision:** One Google Workspace account; Alder & Rowe added as a secondary domain  
**Objective:** Make excellent coordination the default while minimizing memory work, repetitive follow-up, calendar reconstruction, workspace confusion, and wrong-company communication risk.

## 1. Destiny's job in one sentence

Keep candidates, clients, interviewers, and internal teams moving through interviews calmly, accurately, and on time across both companies—while the system surfaces the next action, protects company boundaries, and handles routine preparation.

## 2. Operating model

Destiny receives one Interview Operations experience with three scopes:

- **All Workspaces:** Read-only triage showing labeled priorities, deadlines, counts, owners, and severity across both companies.
- **Tanzer Anderson:** Permitted Tanzer Anderson detail and actions using Tanzer mailboxes, calendars, templates, Drive locations, and Google Cloud credentials.
- **Alder & Rowe:** Permitted Alder & Rowe detail and actions using Alder mailboxes, calendars, templates, Drive locations, and Google Cloud credentials.

The current workspace remains visible on every screen and every consequential confirmation. Switching workspaces changes the underlying data scope, sender identity, templates, calendars, Drive location, reporting, escalation path, OAuth project, and audit context.

### Non-negotiable separation rules

- Every record, request, event, cache key, notification, export, and audit entry carries a required `workspace_id`.
- No candidate, client, interview, message, note, attachment, calendar event, report, or search result may appear outside its authorized workspace.
- External messages are locked to a genuine sender identity belonging to the selected company.
- All Workspaces cannot send, schedule, share, export, or change status.
- A stale browser tab must revalidate company, identity, record ownership, and authorization immediately before any write.
- Copying or moving information between companies requires an explicit, logged, Henry-approved workflow.
- Workspace changes and blocked cross-workspace attempts are recorded in the event ledger.

## 3. Selected Google Workspace structure

Alder & Rowe will be added to the existing Google Workspace account as a **secondary domain**, not a user alias domain and not a separate Workspace tenant.

### Why

- One Admin console and one Workspace billing relationship.
- No second Workspace tenant subscription.
- Genuine Alder & Rowe users can sign in under their Alder identity and use that identity for Gmail, Calendar invitations, and Drive sharing.
- Users from each company can be placed in separate organizational units and groups.
- The dashboard can preserve one operating experience while enforcing company boundaries.

### Limitation

A single Workspace account still has one top-level administration environment. Policies cannot be assigned directly by domain, and Drive sharing cannot be isolated purely by domain. Organizational units, groups, mailbox separation, Drive permissions, Google Cloud IAM, and server-side `workspace_id` enforcement are therefore mandatory.

## 4. Identity plan

### Tanzer Anderson

- `destiny@tanzeranderson.com`
- Optional Tanzer aliases or delegated groups: `coordinator@tanzeranderson.com`, `interviews@tanzeranderson.com`, and `scheduling@tanzeranderson.com`

### Alder & Rowe

The recommended minimum production account is:

- `destiny@alderandrowe.com`

Optional Alder role aliases or delegated groups:

- `coordinator@alderandrowe.com`
- `interviews@alderandrowe.com`
- `scheduling@alderandrowe.com`
- `clientservices@alderandrowe.com`

A full Alder mailbox and Calendar identity requires one additional user license on the existing Workspace subscription. It does not require a second Workspace tenant.

### Zero-seat preparation stage

Before the Alder user license is activated, the domain, organizational unit, groups, Cloud Identity Free account, Google Cloud project, IAM, OAuth design, dashboard workspace, and security controls may be prepared. External Alder email, Calendar invitations, and Drive ownership remain disabled until a genuine Alder Workspace user exists.

Do not place Alder aliases inside Destiny's Tanzer mailbox. Do not use automatic cross-domain forwarding, shared passwords, or cross-brand Send Mail As settings.

Destiny uses a separate browser profile for each company account.

## 5. What the system does for Destiny

The system should:

- Consolidate interviews, deadlines, missing confirmations, and exceptions with visible company labels.
- Rank the next best action without exposing unnecessary sensitive detail in All Workspaces.
- Normalize time zones and display candidate-local time.
- Prepare availability requests, holds, confirmations, reminders, and feedback prompts using the selected company's approved language.
- Validate workspace, company, role, stage, participants, links, timing, privacy, sender identity, calendar, Drive source, OAuth credential, and mobile rendering.
- Preserve interview loops during rescheduling when possible.
- Separate safe coordinator actions from actions requiring Henry or the applicable search lead.
- Record company, actor, approval basis, request, result, and delivery receipt for every consequential action.
- Escalate only material exceptions.

## 6. Day-to-day operating rhythm

### Start of day — 15 minutes

1. Open **All Workspaces**.
2. Review the recommended next action and high-severity exceptions, each carrying a visible company label.
3. Enter the correct company workspace before opening sensitive detail or taking action.
4. Confirm every interview in the next four hours has a valid link, confirmed participants, preparation status, and feedback owner.
5. Release approved reminders from the correct company identity.
6. Escalate only items outside coordinator authority.

### Throughout the day

- Work from the dashboard rather than a blended inbox.
- Confirm the active company before every send, calendar write, document share, or status change.
- Resolve exceptions through the documented remedy and safe-action boundary.
- Use the Communications Center for candidate, interviewer, and client messages.
- Keep candidate-sensitive notes inside the correct company workspace.
- Record attendance and technical issues immediately after interviews.
- Trigger feedback prompts and monitor deadlines.

### End of day — 15 minutes

1. Clear or hand off every high-severity exception.
2. Confirm tomorrow morning's first interviews are ready.
3. Review overdue feedback and approved reminders.
4. Verify delivery receipts or document failures.
5. Leave separate Tanzer Anderson and Alder & Rowe handoffs: what changed, why it matters, the recommendation, and the next owner.

## 7. Dashboard modules

### Today

Shows interview sequence, company, readiness, deadlines, owner, next action, and intervention priority.

### Interviews

Shows each active loop, company, stage, participants, confirmations, Meet-link health, preparation, feedback owner, and completion state.

### Availability

Reads only permitted free/busy data, normalizes time zones, applies company-specific rules and buffers, and ranks viable slots.

### Communications

Shows company, sender identity, recipient, purpose, timing commitment, approval state, delivery status, and plain-text fallback.

### Exceptions

Prioritizes no common time, cancellation, withdrawal risk, broken links, time-zone mismatch, accommodation requests, missing participants, late feedback, failed delivery, policy conflict, wrong-workspace selection, and sender mismatch.

### Reporting

Keeps company reporting separate while allowing labeled operational aggregates for Henry.

## 8. Authority model

### System may prepare automatically

- Approved availability requests, confirmations, reminders, and feedback prompts.
- Viable common slots.
- Conflict, stale-state, invalid-link, missing-feedback, and workspace-mismatch alerts.
- Tentative holds.
- Separate end-of-day handoffs.

### Destiny may execute without executive approval

- Approved routine scheduling communications from the correct company mailbox.
- Tentative holds and releases within policy.
- Non-material formatting or link corrections after validation.
- Approved reminders.
- Attendance and routine service records.
- Documented recovery playbooks within their limits.

### Henry or the applicable search lead must approve

- Candidate rejection, withdrawal interpretation, or substantive status commitment.
- Client-facing explanation of a material failure.
- Interview design, assessment, commercial-term, or candidate-presentation changes.
- Recording or transcription activation.
- Sensitive information sharing outside the approved company group.
- Any cross-company record transfer.
- Any action outside the documented safe boundary.

## 9. Google Cloud structure

The single Workspace account produces one Google Cloud organization resource. Company separation is implemented below it.

### Folders

- `Tanzer Anderson`
- `Alder & Rowe`

### Production projects

- `tanzer-anderson-operations-prod`
- `alder-rowe-operations-prod`

Each project has separate OAuth clients, service accounts, enabled APIs, secrets, logs, quotas, budgets, IAM groups, and Cloudflare credentials. No company service account receives access to the other company's project.

A Cloud Identity Free account may be used for Alder Google Cloud-only administration without a Workspace user license. It does not provide Gmail or Calendar.

Both projects may use one Cloud Billing account. There is no second Cloud subscription; costs arise only from billable services and usage. The runtime remains on Cloudflare unless a Google Cloud service is deliberately approved.

## 10. Candidate and client experience standard

Every interaction must be calm, concise, accurate, correctly branded, and easy to act on. It answers:

1. What is happening?
2. What must the recipient do?
3. By when?
4. What happens next?
5. How can they reach Destiny?

No internal codenames, requisition IDs, proprietary scores, audit terminology, unsupported status claims, or information from the other company may appear externally.

## 11. Production integration plan

### GitHub

- Protected feature branch, reviewable policy, tests, release history, and controlled merge.

### Cloudflare

- Internal application separated from public sites.
- Cloudflare Access authentication.
- Worker-enforced company policy.
- D1 state with required `workspace_id` and append-only event ledger.
- No public navigation, indexing, or unauthenticated route.

### Google Workspace and Google Cloud

- Alder domain added as Secondary domain.
- Users separated by organizational unit and groups.
- Least-privilege OAuth and IAM per company project.
- Independent mailbox, Calendar, Drive, send, receive, revocation, and round-trip tests.
- Action receipts for every write.

## 12. Acceptance standard

The program is ready only when:

- Destiny identifies the highest-risk item across both companies within five seconds.
- The active company is visible on every screen and confirmation.
- All Workspaces is read-only.
- Every external action uses the correct mailbox, domain, Calendar identity, template, signature, Drive source, and OAuth project.
- Tanzer and Alder data cannot leak through lists, search, exports, notifications, cache, browser history, stale tabs, contacts, or attachments.
- A standard reschedule can be repaired without reconstructing the full loop.
- Every Meet link is validated before an interview is marked ready.
- Every consequential write has a company, actor, authorization basis, timestamp, request, and result.
- Revoked access stops future use immediately.
- No production surface claims synchronization until independent read/write and isolation tests pass.
