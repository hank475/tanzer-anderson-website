# Tanzer Anderson — Interview Operations v1

Internal recruiting-coordinator dashboard prototype and operating program for Destiny Anderson.

## Current state

- Responsive and keyboard-accessible static prototype.
- Uses synthetic demonstration data only.
- Includes Today, Interviews, Availability, Communications, Exceptions, and Reporting.
- Includes coordinator authority boundaries, daily operating rhythm, integration architecture, and acceptance criteria.
- Does **not** contain authentication, live candidate/client data, email or calendar writes, or claims of live synchronization.

## Safety boundary

Do not link this application from the public website or deploy it to a publicly accessible route. Before any live data is connected, require:

1. Destiny's Tanzer Anderson Google Workspace account.
2. Cloudflare Access restricted to approved Workspace identities.
3. Least-privilege Google OAuth credentials in a dedicated Google Cloud project.
4. Role-based authorization for every consequential action.
5. Round-trip verification, delivery receipts, duplicate prevention, retry controls, and an append-only event ledger.
6. Tested revocation, stale-state handling, privacy controls, and audit review.

## Recommended production architecture

- **Frontend:** Cloudflare Pages, separated from the public marketing site.
- **Identity perimeter:** Cloudflare Access using Tanzer Anderson Workspace identity.
- **Policy/API layer:** Cloudflare Worker.
- **Operational state:** Cloudflare D1 with an append-only event ledger.
- **Documents:** Google Drive references with role-based permissions; no public document URLs.
- **Workspace integrations:** Gmail, Calendar, Contacts, Drive, and approved Meet workflows through a dedicated Google Cloud OAuth application.
- **Release control:** GitHub feature branch, draft pull request, review, and controlled deployment.

## Production deployment gates

- [ ] Create `destiny@tanzeranderson.com`.
- [ ] Configure `coordinator@`, `interviews@`, and `scheduling@` aliases or groups.
- [ ] Establish Cloudflare Access policy.
- [ ] Register the Google Cloud OAuth application and approve minimal scopes.
- [ ] Complete authenticated read tests.
- [ ] Complete controlled write and round-trip tests.
- [ ] Test retries, duplicate-event prevention, delivery failures, revocation, and stale-state behavior.
- [ ] Confirm no internal terminology or private data appears in external messages.
- [ ] Complete mobile, accessibility, privacy, and permission QA.
- [ ] Obtain release approval before merge or deployment.

## Local preview

Open `index.html` in a modern browser. The prototype is self-contained except for its local `styles.css` and `app.js` files.
