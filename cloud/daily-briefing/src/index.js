import { DurableObject } from 'cloudflare:workers';
import {
  DEFAULT_TIME_ZONE,
  LINK_TTL_SECONDS,
  approvalShell,
  fallbackBriefing,
  isLocalSendWindow,
  localDateKey,
  normalizeBriefing,
  renderBriefingEmail,
  sha256Hex,
  signToken,
  verifyToken,
} from './lib.js';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'x-frame-options': 'DENY',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    },
  });
}

async function readJson(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error('Expected application/json');
  return request.json();
}

function sameOrigin(request, env) {
  const expected = new URL(env.PUBLIC_BASE_URL).origin;
  const origin = request.headers.get('origin');
  return !origin || origin === expected;
}

function actorConfig(env) {
  return [
    {
      audience: 'henry',
      name: 'Henry',
      email: env.HENRY_EMAIL || 'henry@tanzeranderson.com',
      enabled: env.HENRY_ENABLED !== 'false',
    },
    {
      audience: 'destiny',
      name: 'Destiny',
      email: env.DESTINY_EMAIL || 'coordinator@tanzeranderson.com',
      enabled: env.DESTINY_ENABLED !== 'false',
    },
  ];
}

async function ledgerFetch(env, ledgerName, path, payload = null, method = 'POST') {
  const id = env.LEDGER.idFromName(ledgerName);
  const stub = env.LEDGER.get(id);
  const init = { method, headers: { 'content-type': 'application/json' } };
  if (payload !== null) init.body = JSON.stringify(payload);
  const response = await stub.fetch(`https://ledger.internal${path}`, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Ledger request failed (${response.status})`);
  return data;
}

async function storeBriefing(env, briefing) {
  const hash = await sha256Hex(JSON.stringify(briefing));
  await ledgerFetch(env, `briefing:${briefing.id}`, '/put-briefing', { briefing, hash });
  return hash;
}

async function fetchPushedBriefing(env, audience, dateKey) {
  try {
    const result = await ledgerFetch(env, 'briefing-source', '/source-get', { audience, dateKey });
    return result.briefing || null;
  } catch (error) {
    console.warn('Pushed briefing lookup failed', error);
    return null;
  }
}

async function fetchRemoteBriefing(env, audience, dateKey) {
  if (!env.BRIEFING_SOURCE_URL) return null;
  const response = await fetch(env.BRIEFING_SOURCE_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(env.BRIEFING_SOURCE_TOKEN ? { authorization: `Bearer ${env.BRIEFING_SOURCE_TOKEN}` } : {}),
    },
    body: JSON.stringify({ audience, date: dateKey }),
  });
  if (!response.ok) throw new Error(`Briefing source returned ${response.status}`);
  return response.json();
}

async function loadBriefing(env, audience, dateKey) {
  const pushed = await fetchPushedBriefing(env, audience, dateKey);
  if (pushed) return normalizeBriefing({ ...pushed, sourceStatus: pushed.sourceStatus || 'live-pushed' }, audience, dateKey);

  try {
    const remote = await fetchRemoteBriefing(env, audience, dateKey);
    if (remote) return normalizeBriefing({ ...remote, sourceStatus: remote.sourceStatus || 'live-remote' }, audience, dateKey);
  } catch (error) {
    console.error('Remote briefing source failed', { audience, dateKey, message: error.message });
  }

  return fallbackBriefing(audience, dateKey);
}

async function buildTokens(env, briefing, briefingHash) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Number(env.LINK_TTL_SECONDS || LINK_TTL_SECONDS);
  const shared = { v: 1, bid: briefing.id, aud: briefing.audience, bh: briefingHash, iat: now, exp };
  const individual = {};

  for (const item of briefing.approvalItems) {
    individual[item.id] = await signToken(env.APPROVAL_SIGNING_SECRET, {
      ...shared,
      scope: 'one',
      ids: [item.id],
      jti: crypto.randomUUID(),
    });
  }

  return {
    individual,
    all: await signToken(env.APPROVAL_SIGNING_SECRET, {
      ...shared,
      scope: 'all',
      jti: crypto.randomUUID(),
    }),
    review: await signToken(env.APPROVAL_SIGNING_SECRET, {
      ...shared,
      scope: 'review',
      jti: crypto.randomUUID(),
    }),
  };
}

async function sendOne(env, actor, dateKey, reason = 'scheduled') {
  const briefing = await loadBriefing(env, actor.audience, dateKey);
  const briefingHash = await storeBriefing(env, briefing);
  const ledgerName = `briefing:${briefing.id}`;
  const claim = await ledgerFetch(env, ledgerName, '/claim-send', { recipient: actor.email, reason });
  if (!claim.claimed) return { audience: actor.audience, skipped: true, reason: claim.reason };

  try {
    const tokens = await buildTokens(env, briefing, briefingHash);
    const rendered = renderBriefingEmail({
      briefing,
      baseUrl: env.PUBLIC_BASE_URL,
      tokens,
      recipientName: actor.name,
    });

    if (env.EMAIL_ENABLED !== 'true' || !env.EMAIL) {
      await ledgerFetch(env, ledgerName, '/release-send', { recipient: actor.email, reason: 'email-binding-disabled' });
      console.log('Briefing preview generated; email not sent', { audience: actor.audience, subject: rendered.subject });
      return { audience: actor.audience, preview: true, subject: rendered.subject };
    }

    const result = await env.EMAIL.send({
      from: env.SENDER_EMAIL || 'briefings@tanzeranderson.com',
      to: actor.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        'X-TA-Briefing-ID': briefing.id,
        'X-TA-Briefing-Hash': briefingHash,
        'X-TA-Audience': actor.audience,
      },
    });

    await ledgerFetch(env, ledgerName, '/mark-sent', {
      recipient: actor.email,
      messageId: result?.messageId || '',
      reason,
    });

    return { audience: actor.audience, sent: true, messageId: result?.messageId || null };
  } catch (error) {
    await ledgerFetch(env, ledgerName, '/release-send', { recipient: actor.email, reason: error.message });
    throw error;
  }
}

async function sendDaily(env, scheduledTime = Date.now(), reason = 'scheduled') {
  const timeZone = env.TIME_ZONE || DEFAULT_TIME_ZONE;
  if (reason === 'scheduled' && !isLocalSendWindow(scheduledTime, timeZone)) {
    return { skipped: true, reason: 'outside-local-07:15-window' };
  }
  const dateKey = localDateKey(scheduledTime, timeZone);
  const results = [];
  for (const actor of actorConfig(env).filter((entry) => entry.enabled)) {
    try {
      results.push(await sendOne(env, actor, dateKey, reason));
    } catch (error) {
      console.error('Briefing send failed', { audience: actor.audience, error: error.message });
      results.push({ audience: actor.audience, error: error.message });
    }
  }
  return { dateKey, results };
}

async function dispatchApproved(env, briefing, approvedItems, approvalRecord) {
  const safeItems = approvedItems.filter((item) => item.automationSafe && item.executionKey);
  const heldItems = approvedItems.filter((item) => !item.automationSafe || !item.executionKey);
  if (!safeItems.length || !env.APPROVAL_WEBHOOK_URL) {
    return {
      mode: 'record-only',
      queued: 0,
      held: approvedItems.length,
      note: env.APPROVAL_WEBHOOK_URL
        ? 'No approved item was marked automation-safe.'
        : 'No governed executor webhook is connected; approval was recorded for later execution.',
    };
  }

  const payload = {
    event: 'tanzer.daily-briefing.approved',
    briefingId: briefing.id,
    briefingDate: briefing.dateKey,
    audience: briefing.audience,
    approvalId: approvalRecord.approvalId,
    approvedAt: approvalRecord.approvedAt,
    items: safeItems.map((item) => ({
      id: item.id,
      text: item.text,
      executionKey: item.executionKey,
      automationSafe: item.automationSafe,
    })),
  };
  const body = JSON.stringify(payload);
  const signature = env.APPROVAL_WEBHOOK_SECRET
    ? await signToken(env.APPROVAL_WEBHOOK_SECRET, {
        bid: briefing.id,
        aud: briefing.audience,
        scope: 'webhook',
        ids: safeItems.map((item) => item.id),
        exp: Math.floor(Date.now() / 1000) + 300,
        jti: approvalRecord.approvalId,
      })
    : '';

  const response = await fetch(env.APPROVAL_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(signature ? { 'x-ta-approval-token': signature } : {}),
    },
    body,
  });

  if (!response.ok) {
    return {
      mode: 'executor-error',
      queued: 0,
      held: approvedItems.length,
      note: `The executor returned HTTP ${response.status}; approval remains recorded and pending.`,
    };
  }

  return {
    mode: 'queued',
    queued: safeItems.length,
    held: heldItems.length,
    note: heldItems.length
      ? 'Automation-safe items were queued; higher-consequence items remain approval-recorded for governed execution.'
      : 'Approved automation-safe items were queued for governed execution.',
  };
}

async function approveFromToken(env, token, selectedIds = null) {
  const payload = await verifyToken(env.APPROVAL_SIGNING_SECRET, token);
  if (!['one', 'all', 'review'].includes(payload.scope)) throw new Error('Approval scope is not supported');
  const ledgerName = `briefing:${payload.bid}`;
  const review = await ledgerFetch(env, ledgerName, '/review', null, 'GET');
  if (!review.briefing) throw new Error('Briefing was not found');
  if (review.hash !== payload.bh) throw new Error('The briefing changed after this link was issued');

  const available = review.briefing.approvalItems || [];
  let itemIds;
  if (payload.scope === 'all') itemIds = available.map((item) => item.id);
  else if (payload.scope === 'one') itemIds = payload.ids || [];
  else {
    const requested = Array.isArray(selectedIds) ? selectedIds : [];
    const allowed = new Set(available.map((item) => item.id));
    itemIds = requested.filter((id) => allowed.has(id));
  }
  if (!itemIds.length) throw new Error('No action item was selected');

  const approval = await ledgerFetch(env, ledgerName, '/approve', {
    jti: payload.jti,
    itemIds,
    actor: payload.aud,
    source: 'email-approval-link',
  });
  const approvedItems = available.filter((item) => itemIds.includes(item.id));
  const execution = await dispatchApproved(env, review.briefing, approvedItems, approval);
  return { briefing: review.briefing, approval, approvedItems, execution };
}

function approvePage() {
  const body = `<div id="status" class="status">Recording your approval…</div><div style="margin-top:18px"><button id="manual" class="button" hidden>Confirm approval</button></div>`;
  const script = `<script>
  (()=>{const status=document.getElementById('status');const manual=document.getElementById('manual');let token='';let running=false;
  try{token=decodeURIComponent(location.hash.slice(1));history.replaceState(null,'',location.pathname);}catch(e){}
  async function run(){if(running)return;running=true;manual.hidden=true;if(!token){status.textContent='This approval link is incomplete.';return;}status.textContent='Recording your approval…';try{const r=await fetch('/api/approve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Approval failed');status.innerHTML='<strong>Approval recorded.</strong><br>'+d.message;}catch(e){status.textContent=e.message;manual.hidden=false;}finally{running=false;}}
  manual.addEventListener('click',run);function start(){if(document.visibilityState==='visible')setTimeout(run,180);else manual.hidden=false;}document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!running)start();},{once:true});start();})();
  </script>`;
  return approvalShell({ title: 'Approval in progress', subtitle: 'Your signed briefing link is being validated and recorded.', bodyHtml: body, script });
}

function selectPage() {
  const body = `<div id="status" class="status">Loading the approval list…</div><div id="items" class="items"></div><button id="approve" class="button" hidden>Approve Selected</button>`;
  const script = `<script>
  (()=>{let token='';try{token=decodeURIComponent(location.hash.slice(1));history.replaceState(null,'',location.pathname);}catch(e){}const status=document.getElementById('status'),items=document.getElementById('items'),approve=document.getElementById('approve');
  function text(el,value){el.textContent=value;}
  async function load(){if(!token){text(status,'This selection link is incomplete.');return;}try{const r=await fetch('/api/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load actions');text(status,'Choose the action items to approve.');for(const item of d.items){const row=document.createElement('div');row.className='item';const label=document.createElement('label');const box=document.createElement('input');box.type='checkbox';box.value=item.id;box.checked=!item.approved;box.disabled=item.approved;const span=document.createElement('span');span.textContent=item.text+(item.approved?' — already approved':'');label.append(box,span);row.append(label);items.append(row);}approve.hidden=false;}catch(e){text(status,e.message);}}
  approve.addEventListener('click',async()=>{const ids=[...items.querySelectorAll('input:checked:not(:disabled)')].map(x=>x.value);if(!ids.length){text(status,'Select at least one action item.');return;}approve.disabled=true;text(status,'Recording selected approvals…');try{const r=await fetch('/api/approve-selected',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,itemIds:ids})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Approval failed');status.innerHTML='<strong>Selected approvals recorded.</strong><br>'+d.message;items.innerHTML='';approve.hidden=true;}catch(e){text(status,e.message);approve.disabled=false;}});load();})();
  </script>`;
  return approvalShell({ title: 'Review action items', subtitle: 'Select any subset. Already-approved items remain visible and cannot be duplicated.', bodyHtml: body, script });
}

function homePage(env) {
  return approvalShell({
    title: 'Daily Briefing Control',
    subtitle: 'Independent Cloudflare delivery, email, approval, and audit surface for Tanzer Anderson.',
    bodyHtml: `<div class="status"><strong>Service online.</strong><br>Scheduled for 7:15 AM America/Chicago, with duplicate-send protection and recipient-specific briefings.</div><div style="margin-top:18px;font-size:13px;color:#687078">Email mode: ${env.EMAIL_ENABLED === 'true' && env.EMAIL ? 'LIVE' : 'PREVIEW / ACTIVATION REQUIRED'}</div>`,
  });
}

async function handleApi(request, env, path) {
  if (!sameOrigin(request, env)) return json({ error: 'Origin is not permitted' }, 403);

  if (path === '/api/approve') {
    const { token } = await readJson(request);
    const result = await approveFromToken(env, token);
    const message = `${result.approvedItems.length} item(s) approved. ${result.execution.note}`;
    return json({ ok: true, message, execution: result.execution });
  }

  if (path === '/api/review') {
    const { token } = await readJson(request);
    const payload = await verifyToken(env.APPROVAL_SIGNING_SECRET, token);
    if (payload.scope !== 'review') throw new Error('This link cannot open the selection view');
    const review = await ledgerFetch(env, `briefing:${payload.bid}`, '/review', null, 'GET');
    if (review.hash !== payload.bh) throw new Error('The briefing changed after this link was issued');
    const approvals = review.approvals || {};
    return json({
      ok: true,
      briefingId: payload.bid,
      items: (review.briefing?.approvalItems || []).map((item) => ({
        id: item.id,
        text: item.text,
        approved: Boolean(approvals[item.id]),
      })),
    });
  }

  if (path === '/api/approve-selected') {
    const { token, itemIds } = await readJson(request);
    const result = await approveFromToken(env, token, itemIds);
    const message = `${result.approvedItems.length} selected item(s) approved. ${result.execution.note}`;
    return json({ ok: true, message, execution: result.execution });
  }

  if (path === '/api/source/push') {
    if (!env.SOURCE_PUSH_SECRET) return json({ error: 'Source push is disabled' }, 503);
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${env.SOURCE_PUSH_SECRET}`) return json({ error: 'Unauthorized' }, 401);
    const body = await readJson(request);
    const briefings = Array.isArray(body.briefings) ? body.briefings : [body];
    const stored = [];
    for (const entry of briefings) {
      const audience = String(entry.audience || '').toLowerCase();
      const dateKey = String(entry.dateKey || entry.date || '');
      if (!['henry', 'destiny'].includes(audience) || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        throw new Error('Each pushed briefing requires audience henry|destiny and YYYY-MM-DD dateKey');
      }
      const briefing = normalizeBriefing({ ...entry, sourceStatus: 'live-pushed' }, audience, dateKey);
      await ledgerFetch(env, 'briefing-source', '/source-put', { audience, dateKey, briefing });
      stored.push(briefing.id);
    }
    return json({ ok: true, stored });
  }

  if (path === '/api/admin/send-now') {
    if (!env.ADMIN_TOKEN) return json({ error: 'Admin endpoint disabled' }, 503);
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorized' }, 401);
    const result = await sendDaily(env, Date.now(), 'manual');
    return json({ ok: true, ...result });
  }

  return json({ error: 'Not found' }, 404);
}

export class ApprovalLedger extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.storage = ctx.storage;
  }

  async fetch(request) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const body = request.method === 'GET' ? null : await request.json();

      if (path === '/put-briefing') {
        const existing = await this.storage.get('briefing');
        if (existing && existing.hash !== body.hash) {
          const history = (await this.storage.get('history')) || [];
          history.push({ hash: existing.hash, replacedAt: new Date().toISOString() });
          await this.storage.put('history', history.slice(-20));
        }
        await this.storage.put('briefing', { briefing: body.briefing, hash: body.hash, updatedAt: new Date().toISOString() });
        return json({ ok: true });
      }

      if (path === '/claim-send') {
        const send = (await this.storage.get('send')) || {};
        if (send.sentAt) return json({ claimed: false, reason: 'already-sent', sentAt: send.sentAt });
        if (send.claimedAt && Date.now() - Date.parse(send.claimedAt) < 10 * 60 * 1000) {
          return json({ claimed: false, reason: 'send-in-progress', claimedAt: send.claimedAt });
        }
        const next = { claimedAt: new Date().toISOString(), recipient: body.recipient, reason: body.reason };
        await this.storage.put('send', next);
        return json({ claimed: true, ...next });
      }

      if (path === '/mark-sent') {
        const current = (await this.storage.get('send')) || {};
        const next = { ...current, sentAt: new Date().toISOString(), messageId: body.messageId || '', reason: body.reason };
        await this.storage.put('send', next);
        return json({ ok: true, ...next });
      }

      if (path === '/release-send') {
        const current = (await this.storage.get('send')) || {};
        await this.storage.put('send', { ...current, claimedAt: null, lastError: body.reason || 'released', releasedAt: new Date().toISOString() });
        return json({ ok: true });
      }

      if (path === '/review') {
        const stored = await this.storage.get('briefing');
        return json({
          briefing: stored?.briefing || null,
          hash: stored?.hash || null,
          approvals: (await this.storage.get('approvals')) || {},
          send: (await this.storage.get('send')) || {},
        });
      }

      if (path === '/approve') {
        const used = (await this.storage.get('usedTokens')) || {};
        const approvals = (await this.storage.get('approvals')) || {};
        const approvalId = used[body.jti]?.approvalId || crypto.randomUUID();
        const approvedAt = used[body.jti]?.approvedAt || new Date().toISOString();
        for (const itemId of body.itemIds || []) {
          if (!approvals[itemId]) approvals[itemId] = { approvalId, approvedAt, actor: body.actor, source: body.source };
        }
        used[body.jti] = { approvalId, approvedAt };
        await this.storage.put('approvals', approvals);
        await this.storage.put('usedTokens', used);
        return json({ ok: true, approvalId, approvedAt, approvals });
      }

      if (path === '/source-put') {
        const key = `source:${body.dateKey}:${body.audience}`;
        await this.storage.put(key, { briefing: body.briefing, storedAt: new Date().toISOString() });
        return json({ ok: true, key });
      }

      if (path === '/source-get') {
        const key = `source:${body.dateKey}:${body.audience}`;
        const stored = await this.storage.get(key);
        return json({ briefing: stored?.briefing || null, storedAt: stored?.storedAt || null });
      }

      return json({ error: 'Ledger route not found' }, 404);
    } catch (error) {
      return json({ error: error.message || 'Ledger error' }, 400);
    }
  }
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/health') {
        return json({
          ok: true,
          service: 'tanzer-anderson-daily-briefing',
          timeZone: env.TIME_ZONE || DEFAULT_TIME_ZONE,
          schedule: '07:15 America/Chicago',
          emailEnabled: env.EMAIL_ENABLED === 'true' && Boolean(env.EMAIL),
          sourcePushEnabled: Boolean(env.SOURCE_PUSH_SECRET),
          executorEnabled: Boolean(env.APPROVAL_WEBHOOK_URL),
        });
      }
      if (url.pathname === '/approve') return html(approvePage());
      if (url.pathname === '/select') return html(selectPage());
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, url.pathname);
      if (url.pathname === '/' || url.pathname === '/index.html') return html(homePage(env));
      return json({ error: 'Not found' }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: error.message || 'Unexpected error' }, 400);
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(sendDaily(env, controller.scheduledTime, 'scheduled'));
  },
};
