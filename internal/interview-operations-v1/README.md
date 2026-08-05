# Tanzer Anderson + Alder & Rowe — Interview Operations v1

Internal dual-workspace recruiting-coordinator dashboard prototype and operating program for Destiny Anderson.

## Current state

- Responsive and keyboard-accessible static prototype.
- Uses synthetic demonstration data only.
- Includes **All Workspaces**, **Tanzer Anderson**, and **Alder & Rowe** scopes.
- Includes Today, Interviews, Availability, Communications, Exceptions, and Reporting.
- Changes queues, messages, exceptions, reports, and permitted actions when the selected workspace changes.
- Blocks action preparation from the All Workspaces triage view.
- Includes coordinator authority boundaries, daily operating rhythm, integration architecture, workspace-separation rules, and acceptance criteria.
- Does **not** contain authentication, live candidate/client data, email or calendar writes, or claims of live synchronization.

## Safety boundary

Do not link this application from either public website or deploy it to a publicly accessible route. Before any live data is connected, require:

1. Destiny's Tanzer Anderson Google Workspace account.
2. A verified Alder & Rowe identity, alias, or delegated account on the approved Alder & Rowe domain.
3. Cloudflare Access restricted to approved identities.
4. Least-privilege Google OAuth credentials and explicit authorization for each company.
5. Server-side `workspace_id` enforcement for every record, query, notification, export, and write.
6. Role-based authorization for every consequential action.
7. Round-trip verification, delivery receipts, duplicate prevention, retry controls, and an append-only event ledger.
8. Tested revocation, stale-tab revalidation, privacy controls, cache isolation, search isolation, and audit review.

## Recommended production architecture

- **Frontend:** Cloudflare Pages, separated from both public marketing sites.
- **Identity perimeter:** Cloudflare Access using approved Google Workspace identities.
- **Policy/API layer:** Cloudflare Worker that rejects missing or unauthorized workspace context.
- **Operational state:** Cloudflare D1 with required `workspace_id` fields and an append-only event ledger.
- **Documents:** Separate Google Drive locations and role-based permissions for each company; no public document URLs.
- **Workspace integrations:** Gmail, Calendar, Contacts, Drive, and approved Meet workflows through verified Google Cloud OAuth applications or administrative delegation.
- **Sender protection:** The active workspace determines the only permitted sender identities, templates, calendars, and Drive locations.
- **Release control:** GitHub feature branch, draft pull request, review, and controlled deployment.

## Production deployment gates

### Destiny identity

- [ ] Create `destiny@tanzeranderson.com`.
- [ ] Configure Tanzer Anderson `coordinator@`, `interviews@`, and `scheduling@` aliases or groups.
- [ ] Confirm the Alder & Rowe domain and Google Workspace ownership.
- [ ] Create or delegate Destiny’s approved Alder & Rowe employee/coordinator identity.
- [ ] Prohibit unmanaged forwarding and shared passwords.

### Access and isolation

- [ ] Establish Cloudflare Access policy for both approved company identities.
- [ ] Require an authenticated `workspace_id` on every API request.
- [ ] Test that Tanzer Anderson records never appear in Alder & Rowe lists, search, exports, notifications, cache, browser history, or stale tabs.
- [ ] Test the reciprocal Alder & Rowe-to-Tanzer Anderson boundary.
- [ ] Verify that All Workspaces exposes only labeled triage metadata and cannot execute actions.
- [ ] Verify that sender identity, calendar, Drive folder, templates, reporting, and audit context change with the workspace.

### Integrations and release

- [ ] Register the Google Cloud OAuth applications or approved delegated-access model and approve minimal scopes.
- [ ] Complete authenticated read tests independently for Tanzer Anderson and Alder & Rowe.
- [ ] Complete controlled write and round-trip tests independently for both workspaces.
- [ ] Test retries, duplicate-event prevention, delivery failures, revocation, and stale-state behavior.
- [ ] Confirm no internal terminology, private data, or other-workspace content appears in external messages.
- [ ] Complete mobile, accessibility, privacy, and permission QA.
- [ ] Obtain release approval before merge or deployment.

## Local preview

Open `index.html` in a modern browser. The prototype is self-contained except for its local `styles.css`, `workspace.css`, and `app.js` files.
