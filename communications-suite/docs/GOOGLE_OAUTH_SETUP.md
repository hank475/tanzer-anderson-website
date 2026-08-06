# Google OAuth setup

1. Use the existing Tanzer Anderson Google Cloud/Workspace administration context.
2. Enable Gmail API and People API.
3. Create an OAuth 2.0 Web application client.
4. Add this exact redirect URI:

```text
https://mail.tanzeranderson.com/api/auth/google/callback
```

5. Configure the consent screen for internal Workspace use where eligible.
6. Store the client ID and secret as Cloudflare Worker secrets.
7. Keep the application allowlist set to `henry@tanzeranderson.com` until additional users are explicitly approved.
8. Complete one owner-controlled browser authorization. This is a security consent step, not recurring production work.

Requested scopes:

```text
openid
email
profile
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.settings.basic
https://www.googleapis.com/auth/contacts.readonly
```

Calendar invitations are intentionally not requested in v1. Tanzer Meet links can be inserted into Gmail drafts without issuing invitations during QA.
