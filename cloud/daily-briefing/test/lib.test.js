import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fallbackBriefing,
  isLocalSendWindow,
  localDateKey,
  normalizeBriefing,
  renderBriefingEmail,
  signToken,
  verifyToken,
} from '../src/lib.js';

test('signed approval tokens verify and detect tampering', async () => {
  const secret = 'this-is-a-test-secret-longer-than-24-characters';
  const payload = {
    v: 1,
    bid: '2026-08-06-henry',
    aud: 'henry',
    bh: 'abc',
    scope: 'all',
    iat: 1_700_000_000,
    exp: 2_000_000_000,
    jti: 'test-id',
  };
  const token = await signToken(secret, payload);
  assert.deepEqual(await verifyToken(secret, token, 1_800_000_000), payload);
  await assert.rejects(() => verifyToken(secret, `${token}x`, 1_800_000_000));
});

test('Chicago local 07:15 guard handles daylight and standard time', () => {
  assert.equal(isLocalSendWindow(Date.parse('2026-08-06T12:15:00Z'), 'America/Chicago'), true);
  assert.equal(isLocalSendWindow(Date.parse('2026-12-06T13:15:00Z'), 'America/Chicago'), true);
  assert.equal(isLocalSendWindow(Date.parse('2026-08-06T13:15:00Z'), 'America/Chicago'), false);
  assert.equal(localDateKey(Date.parse('2026-08-06T12:15:00Z'), 'America/Chicago'), '2026-08-06');
});

test('briefing normalization creates stable approval items', () => {
  const briefing = normalizeBriefing({
    decisions: ['Approve the release gate'],
    nextActions: [{ text: 'Run the deployment', requiresApproval: false }],
  }, 'henry', '2026-08-06');
  assert.equal(briefing.approvalItems.length, 1);
  assert.match(briefing.approvalItems[0].id, /^decision-/);
});

test('email includes approve-all, approve-selected, and individual action links', async () => {
  const briefing = fallbackBriefing('henry', '2026-08-06');
  const tokens = {
    all: 'all-token',
    review: 'review-token',
    individual: Object.fromEntries(briefing.approvalItems.map((item) => [item.id, `token-${item.id}`])),
  };
  const email = renderBriefingEmail({
    briefing,
    baseUrl: 'https://briefing.example.com',
    tokens,
    recipientName: 'Henry',
  });
  assert.match(email.html, /Approve All Action Items/);
  assert.match(email.html, /Review \/ Approve Selected/);
  assert.match(email.html, /briefing\.example\.com\/approve#/);
  assert.match(email.text, /Approve all:/);
});
