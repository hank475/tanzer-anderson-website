const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const DEFAULT_TIME_ZONE = 'America/Chicago';
export const LINK_TTL_SECONDS = 72 * 60 * 60;

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56) || 'item';
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

export function encodeJson(value) {
  return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

export function decodeJson(value) {
  return JSON.parse(decoder.decode(base64UrlToBytes(value)));
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signToken(secret, payload) {
  if (!secret || secret.length < 24) throw new Error('Approval signing secret is missing or too short');
  const encoded = encodeJson(payload);
  const key = await importHmacKey(secret);
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encoder.encode(encoded)),
  );
  return `${encoded}.${bytesToBase64Url(signature)}`;
}

export async function verifyToken(secret, token, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!token || !token.includes('.')) throw new Error('Invalid approval token');
  const [encoded, signatureText] = token.split('.', 2);
  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signatureText),
    encoder.encode(encoded),
  );
  if (!valid) throw new Error('Approval token signature is invalid');
  const payload = decodeJson(encoded);
  if (!payload.exp || payload.exp < nowSeconds) throw new Error('Approval link has expired');
  if (!payload.bid || !payload.aud || !payload.scope || !payload.jti) {
    throw new Error('Approval token payload is incomplete');
  }
  return payload;
}

export async function sha256Hex(value) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(String(value))));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function localParts(dateOrMs, timeZone = DEFAULT_TIME_ZONE) {
  const date = dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'long',
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function localDateKey(dateOrMs, timeZone = DEFAULT_TIME_ZONE) {
  const parts = localParts(dateOrMs, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isLocalSendWindow(dateOrMs, timeZone = DEFAULT_TIME_ZONE) {
  const parts = localParts(dateOrMs, timeZone);
  return Number(parts.hour) === 7 && Number(parts.minute) === 15;
}

export function formatLongDate(dateKey, timeZone = DEFAULT_TIME_ZONE) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date).toUpperCase();
}

function normalizeTextItem(item, prefix, index, defaults = {}) {
  const source = typeof item === 'string' ? { text: item } : { ...(item || {}) };
  const text = String(source.text || source.title || '').trim();
  if (!text) return null;
  return {
    id: String(source.id || `${prefix}-${index + 1}-${slugify(text)}`),
    text,
    detail: String(source.detail || '').trim(),
    requiresApproval: source.requiresApproval ?? defaults.requiresApproval ?? false,
    automationSafe: source.automationSafe ?? defaults.automationSafe ?? false,
    executionKey: String(source.executionKey || ''),
    owner: String(source.owner || ''),
    due: String(source.due || ''),
  };
}

export function normalizeBriefing(raw = {}, audience = 'henry', dateKey = localDateKey(Date.now())) {
  const topPriorities = (raw.topPriorities || raw.priorities || [])
    .map((item, index) => normalizeTextItem(item, 'priority', index))
    .filter(Boolean);
  const decisions = (raw.decisions || [])
    .map((item, index) => normalizeTextItem(item, 'decision', index, { requiresApproval: true }))
    .filter(Boolean);
  const meetings = (raw.meetings || []).map((meeting) => {
    if (typeof meeting === 'string') return { time: '', title: meeting };
    return {
      time: String(meeting?.time || ''),
      title: String(meeting?.title || meeting?.text || ''),
    };
  }).filter((meeting) => meeting.title);
  const risks = (raw.risks || [])
    .map((item, index) => normalizeTextItem(item, 'risk', index))
    .filter(Boolean);
  const nextActions = (raw.nextActions || raw.actions || [])
    .map((item, index) => normalizeTextItem(item, 'action', index, { requiresApproval: true }))
    .filter(Boolean);

  const briefing = {
    id: String(raw.id || `${dateKey}-${audience}`),
    audience,
    dateKey,
    title: String(raw.title || (audience === 'destiny' ? 'Daily Coordinator Briefing' : 'Daily Executive Briefing')),
    subtitle: String(raw.subtitle || ''),
    summary: String(raw.summary || ''),
    sourceLabel: String(raw.sourceLabel || 'Independent continuity engine'),
    sourceStatus: String(raw.sourceStatus || 'fallback'),
    topPriorities,
    decisions,
    meetings,
    risks,
    nextActions,
  };

  briefing.approvalItems = [...decisions, ...nextActions].filter((item) => item.requiresApproval);
  return briefing;
}

export function fallbackBriefing(audience, dateKey) {
  if (audience === 'destiny') {
    return normalizeBriefing({
      sourceLabel: 'Independent continuity engine',
      sourceStatus: 'fallback',
      summary: 'A concise coordinator view that remains operational outside ChatGPT. Connect the governed Google Workspace feed to replace continuity items with live queues and calendar evidence.',
      topPriorities: [
        'Review the coordinator queue and surface any item that requires Henry’s decision',
        'Protect candidate, client, and meeting follow-through from missed handoffs',
        'Confirm that no paused outreach is released before wrapped-email QA passes',
      ],
      decisions: [
        { id: 'destiny-hold-outreach', text: 'Keep external outreach on hold until Henry releases the wrapped-email standard', automationSafe: true, executionKey: 'outreach.hold' },
      ],
      meetings: [],
      risks: [
        'Google Workspace live-source adapter is not yet connected to this independent briefing engine',
        'Unverified queue data must not be treated as a live commitment',
      ],
      nextActions: [
        { id: 'destiny-review-queue', text: 'Complete the morning coordinator queue review', automationSafe: false },
        { id: 'destiny-escalate-decisions', text: 'Escalate decision-ready exceptions to Henry', automationSafe: false },
      ],
    }, audience, dateKey);
  }

  return normalizeBriefing({
    sourceLabel: 'Independent continuity engine',
    sourceStatus: 'fallback',
    summary: 'The delivery, approval, audit, and continuity layers are active without a ChatGPT dependency. The governed Google Workspace source adapter can replace these continuity items with live calendar, queue, and commitment data.',
    topPriorities: [
      'Review the first decision queue and protect the highest-consequence commitment',
      'Keep client delivery and candidate-response capacity ahead of acquisition expansion',
      'Advance one evidence-backed business-development action without releasing paused outreach',
    ],
    decisions: [
      { id: 'henry-maintain-outreach-hold', text: 'Maintain the external-outreach hold until the wrapped-email release gate passes', automationSafe: true, executionKey: 'outreach.hold' },
      { id: 'henry-approve-source-connection', text: 'Approve activation of the governed Google Workspace briefing source adapter', automationSafe: false, executionKey: 'briefing.source.activate' },
    ],
    meetings: [],
    risks: [
      'The independent engine is not yet receiving live Gmail, Calendar, Drive, or CRM evidence',
      'Approvals are recorded safely, but consequential execution remains pending until the governed executor webhook is connected',
    ],
    nextActions: [
      { id: 'henry-review-briefing-controls', text: 'Review the independent briefing and approval controls', automationSafe: false },
      { id: 'henry-connect-executor', text: 'Connect the approved-action executor after final safety review', automationSafe: false, executionKey: 'executor.connect' },
    ],
  }, audience, dateKey);
}

function renderList(items) {
  if (!items.length) return '<div style="color:#777;font-size:13px;line-height:1.55">No material item recorded.</div>';
  return `<ul style="margin:0;padding:0 0 0 18px;color:#202934;font-size:14px;line-height:1.55">${items.map((item) => `<li style="margin:0 0 8px">${escapeHtml(item.text || item)}</li>`).join('')}</ul>`;
}

function renderMeetings(meetings) {
  if (!meetings.length) return '<div style="color:#777;font-size:13px;line-height:1.55">No verified meeting supplied by the current source.</div>';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${meetings.map((meeting) => `<tr><td style="padding:0 12px 8px 0;white-space:nowrap;color:#9b7848;font-weight:700;font-size:13px">${escapeHtml(meeting.time)}</td><td style="padding:0 0 8px;color:#202934;font-size:14px">${escapeHtml(meeting.title)}</td></tr>`).join('')}</table>`;
}

function sectionBlock(icon, title, body) {
  return `<td valign="top" width="50%" style="padding:24px;border:1px solid #ddd5c8;background:#fffdf8">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="top" width="44" style="font-size:26px;color:#a8834b">${icon}</td>
      <td valign="top"><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#86663a;font-weight:700;margin:2px 0 14px">${escapeHtml(title)}</div>${body}</td>
    </tr></table>
  </td>`;
}

function actionButtons(item, link) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr><td style="border-radius:4px;background:#b08b51"><a href="${escapeHtml(link)}" style="display:inline-block;padding:9px 14px;color:#fff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.04em">Approve</a></td></tr></table>`;
}

function renderApprovalItems(items, individualLinks) {
  if (!items.length) return '<div style="color:#777;font-size:13px">No approval-required action item.</div>';
  return items.map((item) => `<div style="padding:14px 0;border-bottom:1px solid #e7e0d5">
    <div style="font-size:14px;line-height:1.45;color:#202934;font-weight:600">${escapeHtml(item.text)}</div>
    ${item.detail ? `<div style="margin-top:4px;font-size:12px;line-height:1.45;color:#72777d">${escapeHtml(item.detail)}</div>` : ''}
    ${actionButtons(item, individualLinks[item.id])}
  </div>`).join('');
}

export function renderBriefingEmail({ briefing, baseUrl, tokens, recipientName }) {
  const longDate = formatLongDate(briefing.dateKey);
  const individualLinks = Object.fromEntries(Object.entries(tokens.individual).map(([id, token]) => [id, `${baseUrl}/approve#${encodeURIComponent(token)}`]));
  const allLink = `${baseUrl}/approve#${encodeURIComponent(tokens.all)}`;
  const reviewLink = `${baseUrl}/select#${encodeURIComponent(tokens.review)}`;
  const approvalItems = briefing.approvalItems;
  const subject = `Tanzer Anderson | ${briefing.title} | ${longDate.replace(/^[A-Z]+,\s*/, '')}`;

  const html = `<!doctype html><html><body style="margin:0;background:#0a192b;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#202934">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;border-collapse:separate;background:#f7f1e7;border:1px solid #c9b38c;box-shadow:0 18px 60px rgba(0,0,0,.22)">
      <tr><td style="background:#091b2e;padding:24px 30px;border-bottom:2px solid #b08b51">
        <div style="color:#fff;font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:.09em">TANZER ANDERSON</div>
        <div style="color:#c6a66f;font-size:10px;letter-spacing:.18em;text-transform:uppercase;margin-top:6px">Private Search &amp; Leadership Advisory</div>
      </td></tr>
      <tr><td style="padding:34px 34px 18px;background:linear-gradient(135deg,#fbf7ef,#efe6d7)">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.05;color:#0b1c2f">${escapeHtml(briefing.title)}</div>
        <div style="margin-top:12px;color:#987443;font-size:12px;letter-spacing:.15em;text-transform:uppercase">${escapeHtml(longDate)}</div>
        <div style="margin-top:18px;padding:14px 16px;border-left:3px solid #b08b51;background:rgba(255,255,255,.55);font-size:13px;line-height:1.55;color:#555e66">${escapeHtml(briefing.summary || `Good morning, ${recipientName}.`)}</div>
        <div style="margin-top:10px;font-size:10px;color:#857b6b;letter-spacing:.08em">SOURCE: ${escapeHtml(briefing.sourceLabel)} · STATUS: ${escapeHtml(briefing.sourceStatus.toUpperCase())}</div>
      </td></tr>
      <tr><td style="padding:0 28px 28px;background:#f7f1e7">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
          ${sectionBlock('◎', 'Top Priorities', renderList(briefing.topPriorities))}
          ${sectionBlock('⚖', 'Decisions Required', renderList(briefing.decisions))}
        </tr><tr>
          ${sectionBlock('▣', 'Meetings', renderMeetings(briefing.meetings))}
          ${sectionBlock('◇', 'Risks', renderList(briefing.risks))}
        </tr></table>
      </td></tr>
      <tr><td style="padding:0 34px 30px;background:#f7f1e7">
        <div style="border:1px solid #d7cbb9;background:#fffdf8;padding:22px">
          <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#86663a;font-weight:700;margin-bottom:4px">Action Approval Center</div>
          <div style="font-size:12px;color:#6f767c;line-height:1.45;margin-bottom:8px">Approve every action, approve individual items below, or open the selection view. Approval links expire after 72 hours and are recorded against the exact briefing and action checksum.</div>
          ${renderApprovalItems(approvalItems, individualLinks)}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;width:100%"><tr>
            <td style="padding-right:8px"><a href="${escapeHtml(allLink)}" style="display:block;text-align:center;background:#091b2e;color:#fff;text-decoration:none;padding:14px 12px;font-size:13px;font-weight:700">Approve All Action Items</a></td>
            <td style="padding-left:8px"><a href="${escapeHtml(reviewLink)}" style="display:block;text-align:center;border:1px solid #a8834b;color:#775a32;text-decoration:none;padding:13px 12px;font-size:13px;font-weight:700;background:#fff">Review / Approve Selected</a></td>
          </tr></table>
        </div>
      </td></tr>
      <tr><td style="padding:0 34px 30px;background:#f7f1e7">
        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#86663a;font-weight:700;margin-bottom:12px">Next Actions</div>
        ${renderList(briefing.nextActions)}
      </td></tr>
      <tr><td style="background:#091b2e;padding:22px 30px;color:#d8c7aa">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px">Insight. Strategy. Impact.</div>
        <div style="margin-top:7px;font-size:10px;color:#9eabb6;line-height:1.5">Independent delivery and approval controls remain operational without a ChatGPT subscription. High-consequence execution still follows the configured approval policy and downstream executor gate.</div>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;

  const textLines = [
    briefing.title,
    longDate,
    '',
    briefing.summary,
    '',
    'TOP PRIORITIES',
    ...briefing.topPriorities.map((item) => `- ${item.text}`),
    '',
    'DECISIONS REQUIRED',
    ...briefing.decisions.map((item) => `- ${item.text}`),
    '',
    'MEETINGS',
    ...(briefing.meetings.length ? briefing.meetings.map((meeting) => `- ${meeting.time} ${meeting.title}`) : ['- No verified meeting supplied by the current source.']),
    '',
    'RISKS',
    ...briefing.risks.map((item) => `- ${item.text}`),
    '',
    'APPROVALS',
    `Approve all: ${allLink}`,
    `Review / approve selected: ${reviewLink}`,
    ...briefing.approvalItems.map((item) => `Approve “${item.text}”: ${individualLinks[item.id]}`),
    '',
    'NEXT ACTIONS',
    ...briefing.nextActions.map((item) => `- ${item.text}`),
  ];

  return { subject, html, text: textLines.join('\n') };
}

export function approvalShell({ title, subtitle, bodyHtml, script = '' }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${escapeHtml(title)}</title><style>
  :root{--navy:#091b2e;--paper:#f7f1e7;--gold:#b08b51;--ink:#202934;--line:#d7cbb9}*{box-sizing:border-box}body{margin:0;background:linear-gradient(135deg,#061421,#0d2942);font-family:Arial,Helvetica,sans-serif;color:var(--ink);min-height:100vh;padding:28px}.card{max-width:720px;margin:5vh auto;background:var(--paper);border:1px solid #c9b38c;box-shadow:0 24px 80px rgba(0,0,0,.35)}.head{background:var(--navy);padding:25px 30px;border-bottom:2px solid var(--gold)}.brand{font:500 25px Georgia,'Times New Roman',serif;color:#fff;letter-spacing:.1em}.tag{margin-top:6px;color:#c9a96f;font-size:10px;letter-spacing:.18em;text-transform:uppercase}.main{padding:32px}.main h1{font:500 34px/1.1 Georgia,'Times New Roman',serif;color:var(--navy);margin:0 0 10px}.subtitle{color:#6f767c;line-height:1.5;margin-bottom:24px}.status{padding:16px;border-left:3px solid var(--gold);background:#fffdf8;line-height:1.5}.button{display:inline-block;border:0;background:var(--navy);color:#fff;padding:13px 18px;text-decoration:none;font-weight:700;cursor:pointer}.button.alt{background:#fff;color:#775a32;border:1px solid var(--gold)}.items{margin:18px 0}.item{padding:13px 0;border-bottom:1px solid #e4dccf}.item label{display:flex;gap:12px;align-items:flex-start;cursor:pointer}.footer{padding:19px 30px;background:#ede4d5;color:#786d5f;font-size:11px}</style></head><body><div class="card"><div class="head"><div class="brand">TANZER ANDERSON</div><div class="tag">Daily Briefing Approval Center</div></div><div class="main"><h1>${escapeHtml(title)}</h1><div class="subtitle">${escapeHtml(subtitle)}</div>${bodyHtml}</div><div class="footer">Approval tokens are briefing-specific, time-limited, audited, and idempotent.</div></div>${script}</body></html>`;
}
