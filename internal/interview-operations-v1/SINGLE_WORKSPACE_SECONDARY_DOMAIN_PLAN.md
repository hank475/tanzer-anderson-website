# Alder & Rowe — Single-Workspace Secondary-Domain Plan

## Selected decision

Alder & Rowe will operate as a **secondary domain inside the existing Google Workspace account** used by Tanzer Anderson.

This is not a user alias domain and not a second Google Workspace tenant.

The intended domain is `alderandrowe.com`, subject to final availability and owner purchase at the registrar.

## Why this is the strongest affordable structure

- There is one Google Workspace administration and billing relationship.
- Adding the domain itself does not create a second Workspace subscription.
- Alder & Rowe can have genuine users whose primary identities end in `@alderandrowe.com`.
- A genuine Alder & Rowe user can send email, create calendar invitations, share Drive material, and sign in under the Alder & Rowe identity.
- Tanzer Anderson and Alder & Rowe can use separate organizational units, groups, mailboxes, calendars, Drive locations, OAuth clients, Cloud projects, secrets, logs, and dashboard data scopes.
- The Interview Operations dashboard retains one combined read-only triage surface while requiring entry into the correct company workspace before any consequential action.

## Important cost distinction

### No second Workspace tenant fee

Adding `alderandrowe.com` as a secondary domain is managed inside the current Workspace account.

### User licenses still apply

A separate full Alder & Rowe mailbox, Calendar identity, and Workspace account requires a user license. The recommended minimum is one additional licensed account:

- `destiny@alderandrowe.com`

That is one additional user on the existing Workspace subscription, not a second Workspace subscription.

Role addresses can then be aliases or groups within the Alder & Rowe domain:

- `coordinator@alderandrowe.com`
- `interviews@alderandrowe.com`
- `scheduling@alderandrowe.com`
- `clientservices@alderandrowe.com`

Do not add Alder & Rowe as an alias domain to Tanzer Anderson users. Do not put Alder & Rowe aliases inside Destiny's Tanzer mailbox.

## Zero-additional-seat bridge

The domain and security structure can be established before purchasing an additional Workspace seat:

1. Register the domain.
2. Add it as a secondary domain.
3. Verify ownership and configure email authentication.
4. Create the Alder & Rowe organizational unit and groups.
5. Enable Cloud Identity Free and create a Cloud-only Alder administrator identity if needed.
6. Create the Alder & Rowe Google Cloud project and IAM boundaries.
7. Keep external Alder & Rowe sends, calendar invitations, and Drive ownership disabled until a genuine Alder & Rowe Workspace user is licensed.

This bridge preserves the architecture without pretending that a group or alias is a separate mailbox. It is not the final operating state.

## Recommended launch identity

Create one dedicated Alder & Rowe user account when the first active client, candidate, or outbound campaign requires it:

- Primary account: `destiny@alderandrowe.com`
- Role aliases or delegated groups: `coordinator@`, `interviews@`, `scheduling@`, and `clientservices@`

Destiny then uses:

- A Tanzer Anderson browser profile signed in only to `destiny@tanzeranderson.com`.
- An Alder & Rowe browser profile signed in only to `destiny@alderandrowe.com`.
- The Interview Operations dashboard for governed cross-company triage and execution.

No automatic forwarding, cross-domain Gmail delegation, shared passwords, or cross-brand Send Mail As configuration is permitted.

## Google Workspace structure

### Organizational units

- `/Tanzer Anderson`
- `/Alder & Rowe`
- `/Privileged Administration`
- `/Cloud Identity Only`

Google Workspace policies cannot be assigned directly by domain, so user placement in organizational units is mandatory.

### Groups

Create separate groups for each company. Never reuse the same group for both businesses.

Tanzer examples:

- `tanzer-operations@tanzeranderson.com`
- `tanzer-approvals@tanzeranderson.com`

Alder examples:

- `alder-operations@alderandrowe.com`
- `alder-approvals@alderandrowe.com`

### Residual shared-tenant limitations

A single Workspace account still has one top-level organization, one Admin console, one primary-domain organization identity, and some shared directory and Drive administration characteristics. Domain-only policy separation is not supported, and Drive sharing cannot be restricted purely by domain.

The system therefore treats organizational units, groups, project IAM, dashboard `workspace_id`, separate mailboxes, and server-side authorization as mandatory compensating controls.

## Google Cloud structure

There will be one Google Cloud organization resource because there is one Google Workspace account. Inside that organization, create separate company folders and projects.

### Folders

- `Tanzer Anderson`
- `Alder & Rowe`

### Projects

- `tanzer-anderson-operations-prod`
- `alder-rowe-operations-prod`

Optional development projects may be added later, but production credentials must never be shared across company projects.

### Project separation

Each project receives its own:

- OAuth consent configuration and OAuth clients
- Service accounts
- API enablement
- Secrets
- Logs and audit views
- Quotas
- Budget and alerts
- IAM groups
- Cloudflare integration credentials

No Tanzer service account receives permissions in the Alder project, and no Alder service account receives permissions in the Tanzer project.

### Cloud Identity Free

Cloud Identity Free may be enabled for Google Cloud-only users who do not need Gmail or Calendar. For example:

- `alder-cloud-admin@alderandrowe.com`

This can provide managed Cloud access without a Workspace user license. It is not a substitute for a genuine Alder & Rowe mailbox or Calendar identity.

## Cloud billing

A second Cloud subscription is not required.

- Both company projects may be linked to the same existing Cloud Billing account.
- The billing account tracks each project's usage separately.
- Project creation and Resource Manager use do not create a recurring subscription.
- Charges arise only from billable Google Cloud services and actual usage.
- A project may remain unlinked from billing until a service requires billing.
- The planned runtime remains primarily on Cloudflare, limiting Google Cloud to identity, OAuth, and specifically approved integrations unless expanded later.

Create separate project budgets and alerts even when both projects use the same billing account.

## Wrong-company-send controls

Before every external send, invitation, document share, or status change, the system must validate:

1. Active company workspace.
2. Record ownership.
3. User authorization.
4. Sender mailbox and domain.
5. Calendar identity.
6. Message template and signature.
7. Attachment and Drive source.
8. OAuth project and credential.
9. Destination domain and recipients.
10. Fresh server-side authorization immediately before execution.

The All Workspaces view remains read-only. It cannot send, schedule, share, export, or change status.

## Setup sequence

### Owner-required actions

1. Purchase the confirmed domain at the chosen registrar.
2. Give an administrator access to DNS or enter the supplied records.
3. In Google Admin, add the domain as **Secondary domain**, never User alias domain.
4. Complete Google ownership verification.
5. Activate Gmail by adding the required MX records.
6. Approve the first Alder & Rowe licensed user when monthly budget allows.

### System work after domain ownership

1. Specify and validate TXT, MX, SPF, DKIM, and DMARC records.
2. Create the organizational-unit and group map.
3. Create the Alder & Rowe Google Cloud project and IAM design.
4. Create separate OAuth clients and credential boundaries.
5. Connect the dashboard to the correct mailbox, calendar, Drive scope, and Cloud project.
6. Run inbound, outbound, calendar, Drive, stale-tab, revocation, duplicate, and wrong-workspace tests.
7. Activate external Alder & Rowe actions only after all isolation tests pass.

## Acceptance standard

- Alder & Rowe is visibly configured as a secondary domain, not an alias domain.
- Destiny has separate browser sessions for Tanzer Anderson and Alder & Rowe.
- No Tanzer mailbox can send from an Alder identity and no Alder mailbox can send from a Tanzer identity.
- Calendar invitations expose the correct company identity.
- Company Drive locations, templates, contacts, OAuth clients, logs, and audit receipts remain separated.
- A single Cloud Billing account may pay for both projects without blending IAM or credentials.
- Every consequential dashboard action records company, actor, sender, authorization basis, request, time, and result.
