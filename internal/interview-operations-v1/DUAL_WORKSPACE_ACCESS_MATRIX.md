# Destiny Anderson — Dual-Workspace Access Matrix

## Access decision

Destiny is an authorized Recruiting Coordinator for both **Tanzer Anderson** and **Alder & Rowe**.

Both companies will be administered through one Google Workspace account. Alder & Rowe will be added as a **secondary domain**, while the dashboard, mailboxes, calendars, Drive locations, Google Cloud projects, and operational records remain company-scoped.

## Workspace scopes

| Scope | What Destiny can see | What Destiny can do |
|---|---|---|
| All Workspaces | Labeled priority, deadline, count, owner, company, and severity metadata | Triage and enter the correct company workspace; no messages, calendar writes, document shares, exports, status changes, or sensitive-record opens |
| Tanzer Anderson | Permitted Tanzer candidate, client, interview, communication, calendar, Drive, and reporting detail | Execute approved routine actions using Tanzer mailbox, templates, Calendar identity, Drive location, and Google Cloud credentials |
| Alder & Rowe | Permitted Alder candidate, client, interview, communication, calendar, Drive, and reporting detail | Execute approved routine actions only after a genuine Alder Workspace user is active, using Alder mailbox, templates, Calendar identity, Drive location, and Google Cloud credentials |

## Permission matrix

| Capability | Destiny | Henry | Applicable search lead | System |
|---|---:|---:|---:|---:|
| View labeled cross-workspace triage | Yes | Yes | Own workspace only | Prepare |
| View sensitive candidate detail | Authorized workspace only | Yes | Own workspace | Policy-controlled |
| Prepare availability requests | Yes | Yes | Yes | Yes |
| Send approved routine scheduling messages | Correct company mailbox only | Yes | Yes | Execute after authorization |
| Place or release tentative holds | Within company policy | Yes | Yes | Execute after authorization |
| Repair a documented standard reschedule | Within playbook | Yes | Yes | Recommend and validate |
| Change interview design or assessment structure | No | Approve | Propose or approve as assigned | No |
| Reject a candidate or make substantive status commitments | No | Approve | Approve as assigned | No |
| Share candidate-sensitive information outside approved company group | No | Approve | Approve as assigned | No |
| Move or copy records between companies | No | Explicit approval required | No | Block by default |
| Activate recording or transcription | No | Explicit approval required | Explicit approval required | Block without consent and policy |
| Change commercial terms or client commitments | No | Approve | No unless separately authorized | No |
| View or export combined reporting | Labeled operational aggregate only | Yes | Own workspace only | Enforce scope |
| Administer Workspace domains, Google Cloud IAM, OAuth, Cloudflare Access, or retention | No | Owner or delegated admin | No | Service role only |

## Required technical controls

1. Every record, API request, cache key, event, notification, export, and audit entry requires a `workspace_id`.
2. The server independently authorizes company scope; the interface selector is not an authorization control.
3. The selected workspace determines the only permitted sender mailbox, Calendar identity, templates, Drive location, Google Cloud project, escalation route, and retention context.
4. All Workspaces is read-only triage.
5. Before every write, the system revalidates identity, role, workspace, record ownership, sender, calendar, Drive source, OAuth project, destination, and approval.
6. Browser back navigation, stale tabs, cached responses, notifications, contacts, autocomplete, and search results must not reintroduce the prior company's data.
7. Cross-company transfer is blocked by default and requires a named, logged, Henry-approved workflow.
8. Every external action produces an immutable receipt containing company, actor, sender, OAuth project, authorization basis, request, timestamp, and result.
9. No Tanzer service account, secret, API key, or OAuth token may be used by Alder & Rowe, and vice versa.
10. Revocation is tested independently at the company mailbox, group, Cloudflare Access, dashboard role, Drive, and Google Cloud IAM layers.

## Google Workspace structure

### Domain decision

- Primary domain: `tanzeranderson.com`
- Secondary domain: `alderandrowe.com`, subject to owner purchase and verification
- Prohibited configuration: adding Alder & Rowe as a user alias domain

### Organizational units

- `/Tanzer Anderson`
- `/Alder & Rowe`
- `/Privileged Administration`
- `/Cloud Identity Only`

Policies are applied through organizational units because Google Workspace does not apply separate settings directly by domain.

### Tanzer identity

- `destiny@tanzeranderson.com`
- Optional Tanzer aliases or groups: `coordinator@`, `interviews@`, and `scheduling@`

### Alder identity

Recommended first production user:

- `destiny@alderandrowe.com`

Optional Alder aliases or groups:

- `coordinator@alderandrowe.com`
- `interviews@alderandrowe.com`
- `scheduling@alderandrowe.com`
- `clientservices@alderandrowe.com`

The full Alder identity consumes one additional user license on the existing Workspace subscription. It is not a second Workspace subscription.

Until that user is licensed, Alder external sends, Calendar invitations, and Drive ownership remain disabled. Cloud Identity Free may be used for Cloud-only access, not Gmail or Calendar.

## Google Cloud access model

One Workspace account produces one Google Cloud organization resource. Separation occurs through company folders, projects, groups, and IAM.

### Folders and projects

- Folder `Tanzer Anderson` → project `tanzer-anderson-operations-prod`
- Folder `Alder & Rowe` → project `alder-rowe-operations-prod`

Each project has independent OAuth clients, service accounts, secrets, API settings, logs, quotas, budgets, alerts, and Cloudflare credentials.

Both projects may use the same Cloud Billing account. Project access and credentials remain separate even though billing is consolidated.

## Browser and human controls

- A Tanzer browser profile is signed in only to the Tanzer account.
- An Alder browser profile is signed in only to the Alder account.
- Profiles use visibly different names, icons, colors, bookmarks, and pinned dashboard links.
- No unified inbox is used for sending.
- No automatic forwarding between company mailboxes.
- No cross-company Gmail delegation.
- No cross-brand Send Mail As entries.
- Routine external communication is initiated from Interview Operations rather than a generic compose window whenever practical.

## Acceptance tests

- Destiny can switch between Tanzer Anderson and Alder & Rowe in one dashboard action.
- The active company is visible on every screen and confirmation dialog.
- All Workspaces cannot send, schedule, share, export, or change status.
- A Tanzer sender, calendar, Drive source, or OAuth token cannot be selected while Alder is active, and vice versa.
- Search, contacts, browser history, cache, exports, notifications, and stale tabs remain company-scoped.
- Revocation from either company takes effect immediately at every relevant layer.
- Calendar invitations expose the correct company identity.
- Every consequential action produces an immutable company-scoped receipt.
