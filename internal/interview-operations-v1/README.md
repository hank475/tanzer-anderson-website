# Tanzer Anderson + Alder & Rowe — Interview Operations v1

Internal dual-workspace recruiting-coordinator dashboard and operating program for Destiny Anderson.

## Selected infrastructure

- One Google Workspace account.
- `tanzeranderson.com` remains the primary domain.
- `alderandrowe.com` is to be added as a **secondary domain**, subject to final availability and owner purchase.
- One Google Cloud organization resource with separate company folders and projects.
- One Cloud Billing account may support both projects.
- Cloudflare remains the primary application runtime and policy perimeter.

## Current state

- Responsive and keyboard-accessible static prototype.
- Synthetic demonstration data only.
- Includes **All Workspaces**, **Tanzer Anderson**, and **Alder & Rowe** scopes.
- Includes Today, Interviews, Availability, Communications, Exceptions, and Reporting.
- Changes queues, messages, exceptions, reports, and permitted actions with the selected workspace.
- Blocks action preparation from the All Workspaces triage view.
- Includes coordinator authority boundaries, daily operating rhythm, domain structure, Google Cloud separation, and acceptance criteria.
- Does **not** contain authentication, live candidate or client data, email or calendar writes, or claims of live synchronization.

## Cost model

- Adding the secondary domain does not create a second Google Workspace tenant subscription.
- A genuine separate Alder mailbox and Calendar identity requires a paid user on the existing Workspace subscription.
- Recommended first Alder user: `destiny@alderandrowe.com`.
- Cloud Identity Free may be used for Google Cloud-only identities that do not need Gmail or Calendar.
- Creating separate Google Cloud projects does not create a separate subscription; charges arise from billable services and usage.

## Safety boundary

Do not link this application from either public website or deploy it to a publicly accessible route. Before live data is connected, require:

1. Destiny's Tanzer Anderson Workspace account.
2. Verified ownership of the Alder & Rowe secondary domain.
3. A genuine Alder & Rowe Workspace user before external Alder email, Calendar, or Drive actions are activated.
4. Cloudflare Access restricted to approved identities.
5. Separate Google Cloud projects, OAuth clients, service accounts, secrets, logs, quotas, budgets, and IAM groups.
6. Server-side `workspace_id` enforcement for every record, query, notification, export, and write.
7. Role-based authorization for every consequential action.
8. Round-trip verification, delivery receipts, duplicate prevention, retries, stale-tab revalidation, cache isolation, search isolation, and immutable receipts.

## Recommended production architecture

- **Frontend:** Cloudflare Pages, separated from both public marketing sites.
- **Identity perimeter:** Cloudflare Access using approved Workspace identities.
- **Policy/API layer:** Cloudflare Worker that rejects missing or unauthorized company context.
- **Operational state:** Cloudflare D1 with required `workspace_id` fields and an append-only event ledger.
- **Documents:** Separate company Drive locations and role-based permissions; no public document URLs.
- **Workspace:** One tenant, secondary domain, separate organizational units, groups, mailboxes, calendars, and browser profiles.
- **Google Cloud:** `tanzer-anderson-operations-prod` and `alder-rowe-operations-prod` under separate company folders.
- **Sender protection:** The active company determines the only permitted mailbox, Calendar identity, template, signature, Drive source, OAuth client, and audit context.
- **Release control:** GitHub feature branch, draft pull request, review, and controlled deployment.

## Production deployment gates

### Domain and identity

- [ ] Confirm availability and purchase `alderandrowe.com`.
- [ ] Add the domain in Google Admin as **Secondary domain**, never User alias domain.
- [ ] Complete ownership verification and Gmail MX configuration.
- [ ] Configure SPF, DKIM, and DMARC.
- [ ] Create `/Alder & Rowe` and `/Tanzer Anderson` organizational units.
- [ ] Create separate company operations and approvals groups.
- [ ] Create `destiny@tanzeranderson.com`.
- [ ] When monthly budget permits, create `destiny@alderandrowe.com` as the first genuine Alder user.
- [ ] Prohibit cross-domain forwarding, shared passwords, cross-company delegation, and cross-brand Send Mail As entries.

### Google Cloud

- [ ] Confirm the existing Google Cloud organization resource.
- [ ] Create company folders.
- [ ] Create `tanzer-anderson-operations-prod`.
- [ ] Create `alder-rowe-operations-prod`.
- [ ] Apply separate IAM groups, service accounts, OAuth clients, secrets, logs, quotas, budgets, and alerts.
- [ ] Link both projects to one Cloud Billing account only where billing is required.
- [ ] Optionally enable Cloud Identity Free for Cloud-only administrators without Workspace licenses.

### Access and isolation

- [ ] Establish Cloudflare Access policy for approved identities.
- [ ] Require authenticated `workspace_id` on every API request.
- [ ] Test that Tanzer records never appear in Alder lists, search, contacts, exports, notifications, cache, browser history, attachments, or stale tabs.
- [ ] Test the reciprocal Alder-to-Tanzer boundary.
- [ ] Verify that All Workspaces exposes only labeled triage metadata and cannot execute actions.
- [ ] Verify that mailbox, Calendar, Drive source, templates, reporting, Google Cloud project, and audit context change with the selected company.

### Integrations and release

- [ ] Complete independent authenticated read tests for each company.
- [ ] Complete independent controlled-write and round-trip tests.
- [ ] Test retries, duplicate prevention, delivery failures, revocation, stale state, and wrong-company sends.
- [ ] Confirm no internal terminology, private data, or other-company content appears externally.
- [ ] Complete mobile, accessibility, privacy, and permission QA.
- [ ] Refresh the branch against current `main`, resolve any conflicts, and re-run validation.
- [ ] Obtain release approval before merge or deployment.

## Reference documents

- `RECRUITING_COORDINATOR_PROGRAM.md`
- `DUAL_WORKSPACE_ACCESS_MATRIX.md`
- `SINGLE_WORKSPACE_SECONDARY_DOMAIN_PLAN.md`

## Local preview

Open `index.html` in a modern browser. The prototype is self-contained except for its local `styles.css`, `workspace.css`, and `app.js` files.
