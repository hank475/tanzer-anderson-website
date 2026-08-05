# Destiny Anderson — Dual-Workspace Access Matrix

## Access decision

Destiny is an authorized Recruiting Coordinator for both **Tanzer Anderson** and **Alder & Rowe**. She should use one governed sign-in experience, with company-specific permissions and identities applied after she selects a workspace.

## Workspace scopes

| Scope | What Destiny can see | What Destiny can do |
|---|---|---|
| All Workspaces | Labeled priority, deadline, count, owner, and severity metadata | Triage and enter the correct company workspace; no messages, calendar writes, document shares, status changes, or sensitive-record opens |
| Tanzer Anderson | Permitted Tanzer candidate, client, interview, communication, calendar, and reporting detail | Execute approved routine coordinator actions using Tanzer identities, templates, calendars, and Drive locations |
| Alder & Rowe | Permitted Alder & Rowe candidate, client, interview, communication, calendar, and reporting detail | Execute approved routine coordinator actions using Alder & Rowe identities, templates, calendars, and Drive locations |

## Permission matrix

| Capability | Destiny | Henry | Applicable search lead | System |
|---|---:|---:|---:|---:|
| View labeled cross-workspace triage | Yes | Yes | Own workspace only | Prepare |
| View sensitive candidate detail | Authorized workspace only | Yes | Own workspace | Policy-controlled |
| Prepare availability requests | Yes | Yes | Yes | Yes |
| Send approved routine scheduling messages | Correct workspace only | Yes | Yes | Execute after authorization |
| Place or release tentative holds | Within policy | Yes | Yes | Execute after authorization |
| Repair a documented standard reschedule | Within playbook | Yes | Yes | Recommend and validate |
| Change interview design or assessment structure | No | Approve | Propose/approve as assigned | No |
| Reject a candidate or make substantive status commitments | No | Approve | Approve as assigned | No |
| Share candidate-sensitive information outside approved group | No | Approve | Approve as assigned | No |
| Move or copy records between companies | No | Explicit approval required | No | Block by default |
| Activate recording or transcription | No | Explicit approval required | Explicit approval required | Block without consent and policy |
| Change commercial terms or client commitments | No | Approve | No unless separately authorized | No |
| View or export combined company reporting | Labeled operational aggregate only | Yes | Own workspace only | Enforce scope |
| Administer identities, OAuth, Cloudflare Access, or retention | No | Owner/admin | No | Service role only |

## Required technical controls

1. Every record, API request, cache key, event, notification, export, and audit entry requires a `workspace_id`.
2. The user interface may display a workspace, but the server must independently authorize it.
3. The selected workspace determines permitted sender identities, calendars, templates, Drive locations, reporting, escalation routes, and retention rules.
4. All Workspaces is read-only triage. Consequential actions require entry into Tanzer Anderson or Alder & Rowe.
5. Before every write, the system revalidates identity, role, workspace, record ownership, sender, destination, and authorization.
6. Browser back navigation, stale tabs, cached responses, notifications, and search results must not reintroduce a prior workspace’s data.
7. Revoking Destiny from one company must not automatically revoke the other unless Henry requests full account suspension.
8. Cross-workspace transfer is blocked by default and requires a named, logged, executive-approved workflow.

## Identity provisioning

### Tanzer Anderson

- Employee account: `destiny@tanzeranderson.com`
- Recommended aliases or delegated groups: `coordinator@tanzeranderson.com`, `interviews@tanzeranderson.com`, `scheduling@tanzeranderson.com`

### Alder & Rowe

- Confirm the approved company domain and Google Workspace ownership.
- Create a dedicated Alder & Rowe identity or delegated aliases/groups for Destiny.
- Federate access into the Interview Operations sign-in where practical.
- Do not create or send from a guessed domain.

## Acceptance tests

- Destiny can switch between Tanzer Anderson and Alder & Rowe in one action.
- The active company is visible on every screen and confirmation dialog.
- All Workspaces cannot send, schedule, share, export, or change status.
- A Tanzer Anderson sender cannot be selected while Alder & Rowe is active, and vice versa.
- Search, browser history, cached results, exports, and notifications remain isolated.
- Revocation from either company is effective immediately and independently testable.
- Every consequential action produces an immutable receipt containing workspace, actor, authorization basis, time, request, and result.
