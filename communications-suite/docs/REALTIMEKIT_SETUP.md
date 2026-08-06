# Cloudflare RealtimeKit setup

## Purpose

Create the provider application and permission presets required by Tanzer Meet. This setup does not create a meeting, participant, invitation, recording, or transcription.

## Application

1. Create one Cloudflare RealtimeKit application for Tanzer Meet.
2. Record its application ID as the Meet Worker secret `REALTIMEKIT_APP_ID`.
3. Create a scoped Cloudflare API token that can administer RealtimeKit for the selected account, and store it as `CLOUDFLARE_REALTIME_API_TOKEN`.
4. Keep recording, livestreaming, and transcription disabled for v1.

## Presets

Create or verify these exact preset names:

```text
group-call-host
group-call-participant
```

The host preset should permit normal host controls, screen sharing, participant management, and ending the meeting. The guest preset should permit joining, camera, microphone, chat, and screen sharing only as approved by the host policy.

If different preset names are required, update both the root and `production` variables in `apps/meet/wrangler.jsonc` before deployment.

## Locked QA verification

With `MEETINGS_ENABLED=false`:

- `/api/meetings` must return `feature_locked` before any RealtimeKit API call.
- `/api/meetings/{slug}/participants` must return `feature_locked` before any participant token is issued.
- No test should create a public or private provider meeting.
