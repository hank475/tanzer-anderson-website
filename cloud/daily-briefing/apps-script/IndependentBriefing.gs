/**
 * Tanzer Anderson Independent Daily Briefing — Google Workspace runtime.
 *
 * This companion can deliver Henry and Destiny's separate Version 2 briefings,
 * host approve-all / approve-selected / approve-one controls, and maintain an
 * auditable execution queue without ChatGPT or Cloudflare.
 *
 * Deployment boundary:
 * 1. Create a standalone Apps Script project under the Tanzer Anderson Workspace.
 * 2. Add Code.gs, IndependentBriefing.gs, and appsscript.json from this folder.
 * 3. Deploy as a web app: execute as the owner; access restricted to the Workspace.
 * 4. Run installIndependentDailyBriefing() once.
 *
 * It sends only to the two internal destinations below. It never releases an
 * external outreach campaign or candidate identity.
 */

const TA_BRIEFING_TIME_ZONE = 'America/Chicago';
const TA_BRIEFING_CONTROL_SHEET_ID = '1nB6JIRhCCpoN3NyrQrhik2yiozWjFnfU1OqbjimtQX4';
const TA_BRIEFING_TOKEN_TTL_SECONDS = 72 * 60 * 60;
const TA_BRIEFING_RECIPIENTS = Object.freeze({
  henry: Object.freeze({
    name: 'Henry',
    email: 'henry@tanzeranderson.com',
    title: 'Daily Executive Briefing',
  }),
  destiny: Object.freeze({
    name: 'Destiny',
    email: 'coordinator@tanzeranderson.com',
    title: 'Daily Coordinator Briefing',
  }),
});

const TA_LEDGER_HEADERS = Object.freeze({
  approvals: ['Timestamp', 'ApprovalID', 'BriefingID', 'Audience', 'Actor', 'ItemIDs', 'Scope', 'TokenJTI', 'BriefingHash', 'ExecutionState', 'Detail'],
  sends: ['Timestamp', 'BriefingID', 'Audience', 'Recipient', 'Subject', 'Status', 'MessageReference', 'BriefingHash', 'Detail'],
  snapshots: ['Timestamp', 'BriefingID', 'Audience', 'DateKey', 'BriefingHash', 'BriefingJSON'],
  queue: ['Timestamp', 'QueueID', 'ApprovalID', 'BriefingID', 'Audience', 'ItemID', 'ExecutionKey', 'State', 'Detail'],
});

function installIndependentDailyBriefing() {
  const serviceUrl = ScriptApp.getService().getUrl();
  if (!serviceUrl) {
    throw new Error('Deploy this project as a Workspace-restricted web app before running installation.');
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty('BRIEFING_CONTROL_SHEET_ID', props.getProperty('BRIEFING_CONTROL_SHEET_ID') || TA_BRIEFING_CONTROL_SHEET_ID);
  props.setProperty('BRIEFING_WEB_APP_URL', serviceUrl);
  if (!props.getProperty('BRIEFING_SIGNING_SECRET')) {
    props.setProperty('BRIEFING_SIGNING_SECRET', Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid());
  }

  const spreadsheet = SpreadsheetApp.openById(props.getProperty('BRIEFING_CONTROL_SHEET_ID'));
  ensureBriefingRuntimeSheets_(spreadsheet);
  scheduleNextIndependentBriefing_();

  return {
    installed: true,
    webAppUrl: serviceUrl,
    controlSheetUrl: spreadsheet.getUrl(),
    nextScheduledRun: props.getProperty('BRIEFING_NEXT_RUN') || '',
    recipients: Object.values(TA_BRIEFING_RECIPIENTS).map((entry) => entry.email),
    runtimeDependency: 'Google Workspace only',
  };
}

function runIndependentDailyBriefing() {
  try {
    return sendIndependentDailyBriefings_('scheduled');
  } finally {
    scheduleNextIndependentBriefing_();
  }
}

function sendIndependentDailyBriefingsNow() {
  return sendIndependentDailyBriefings_('manual');
}

function scheduleNextIndependentBriefing_() {
  const handler = 'runIndependentDailyBriefing';
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === handler)
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  const now = new Date();
  let dateKey = Utilities.formatDate(now, TA_BRIEFING_TIME_ZONE, 'yyyy-MM-dd');
  let next = Utilities.parseDate(dateKey + ' 07:15', TA_BRIEFING_TIME_ZONE, 'yyyy-MM-dd HH:mm');
  if (next.getTime() <= now.getTime() + 30 * 1000) {
    const tomorrowProbe = new Date(now.getTime() + 36 * 60 * 60 * 1000);
    dateKey = Utilities.formatDate(tomorrowProbe, TA_BRIEFING_TIME_ZONE, 'yyyy-MM-dd');
    next = Utilities.parseDate(dateKey + ' 07:15', TA_BRIEFING_TIME_ZONE, 'yyyy-MM-dd HH:mm');
  }

  ScriptApp.newTrigger(handler).timeBased().at(next).create();
  PropertiesService.getScriptProperties().setProperty('BRIEFING_NEXT_RUN', next.toISOString());
  return next;
}

function sendIndependentDailyBriefings_(reason) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const now = new Date();
    const dateKey = Utilities.formatDate(now, TA_BRIEFING_TIME_ZONE, 'yyyy-MM-dd');
    const results = [];
    Object.keys(TA_BRIEFING_RECIPIENTS).forEach((audience) => {
      try {
        results.push(sendIndependentBriefingFor_(audience, dateKey, reason));
      } catch (error) {
        results.push({ audience: audience, status: 'ERROR', error: String(error && error.message || error) });
      }
    });
    return { dateKey: dateKey, results: results };
  } finally {
    lock.releaseLock();
  }
}

function sendIndependentBriefingFor_(audience, dateKey, reason) {
  const recipient = TA_BRIEFING_RECIPIENTS[audience];
  if (!recipient) throw new Error('Unsupported briefing audience: ' + audience);

  const spreadsheet = getBriefingSpreadsheet_();
  ensureBriefingRuntimeSheets_(spreadsheet);
  const briefing = buildIndependentBriefing_(spreadsheet, audience, dateKey);
  const briefingHash = sha256HexAppsScript_(JSON.stringify(briefing));
  briefing.hash = briefingHash;

  const briefingId = briefing.id;
  if (wasBriefingSent_(spreadsheet, briefingId, recipient.email)) {
    return { audience: audience, status: 'SKIPPED_ALREADY_SENT', briefingId: briefingId };
  }

  saveBriefingSnapshot_(spreadsheet, briefing);
  const webAppUrl = getBriefingWebAppUrl_();
  const tokens = buildIndependentApprovalTokens_(briefing);
  const email = renderIndependentBriefingEmail_(briefing, recipient, webAppUrl, tokens);

  MailApp.sendEmail({
    to: recipient.email,
    subject: email.subject,
    body: email.text,
    htmlBody: email.html,
    name: 'Tanzer Anderson Briefing Office',
    noReply: false,
  });

  appendRows_(spreadsheet.getSheetByName('Send Ledger'), [[
    new Date(), briefingId, audience, recipient.email, email.subject, 'SENT', reason, briefingHash, 'MailApp accepted the message.'
  ]]);

  return { audience: audience, status: 'SENT', briefingId: briefingId, recipient: recipient.email };
}

function buildIndependentBriefing_(spreadsheet, audience, dateKey) {
  const source = spreadsheet.getSheetByName('Briefing Items');
  if (!source) throw new Error('Briefing Items sheet is missing.');
  const values = source.getDataRange().getValues();
  if (!values.length) throw new Error('Briefing Items sheet is empty.');
  const headers = values.shift().map(String);
  const col = Object.fromEntries(headers.map((header, index) => [header, index]));
  ['Audience', 'Section', 'Text', 'Status', 'DueDate', 'RequiresApproval', 'AutomationSafe', 'ExecutionKey', 'Owner', 'Detail']
    .forEach((required) => { if (col[required] === undefined) throw new Error('Missing Briefing Items column: ' + required); });

  const groups = { priority: [], decision: [], risk: [], action: [] };
  values.forEach((row, offset) => {
    const rowAudience = String(row[col.Audience] || '').trim().toLowerCase();
    const section = String(row[col.Section] || '').trim().toLowerCase();
    const status = String(row[col.Status] || 'active').trim().toLowerCase();
    const text = String(row[col.Text] || '').trim();
    const due = normalizeBriefingDate_(row[col.DueDate]);
    if (rowAudience !== audience || !groups[section] || status !== 'active' || !text) return;
    if (due && due !== dateKey) return;
    groups[section].push({
      id: section.substring(0, 1).toUpperCase() + (offset + 2) + '-' + slugBriefing_(text),
      text: text,
      detail: String(row[col.Detail] || '').trim(),
      requiresApproval: asBoolean_(row[col.RequiresApproval]),
      automationSafe: asBoolean_(row[col.AutomationSafe]),
      executionKey: String(row[col.ExecutionKey] || '').trim(),
      owner: String(row[col.Owner] || '').trim(),
      due: due,
    });
  });

  const meetings = readIndependentMeetings_(audience, dateKey);
  const title = TA_BRIEFING_RECIPIENTS[audience].title;
  const summary = audience === 'destiny'
    ? 'Coordinator priorities, verified meetings, decision gates, and follow-through for the operating day.'
    : 'Decision-ready priorities, verified meetings, material risks, and approval-controlled next actions for the operating day.';
  const approvalItems = groups.decision.concat(groups.action).filter((item) => item.requiresApproval);

  return {
    id: dateKey + '-' + audience,
    audience: audience,
    dateKey: dateKey,
    title: title,
    summary: summary,
    sourceLabel: 'Tanzer Anderson Google Workspace control sheet',
    sourceStatus: 'LIVE',
    topPriorities: groups.priority,
    decisions: groups.decision,
    meetings: meetings,
    risks: groups.risk,
    nextActions: groups.action,
    approvalItems: approvalItems,
  };
}

function readIndependentMeetings_(audience, dateKey) {
  let calendar = null;
  if (audience === 'henry') {
    calendar = CalendarApp.getDefaultCalendar();
  } else {
    const calendarId = PropertiesService.getScriptProperties().getProperty('DESTINY_CALENDAR_ID');
    if (calendarId) calendar = CalendarApp.getCalendarById(calendarId);
  }
  if (!calendar) return [];

  const date = Utilities.parseDate(dateKey + ' 12:00', TA_BRIEFING_TIME_ZONE, 'yyyy-MM-dd HH:mm');
  return calendar.getEventsForDay(date).map((event) => ({
    time: event.isAllDayEvent() ? 'ALL DAY' : Utilities.formatDate(event.getStartTime(), TA_BRIEFING_TIME_ZONE, 'h:mm a'),
    title: event.getTitle(),
  }));
}

function buildIndependentApprovalTokens_(briefing) {
  const issued = Math.floor(Date.now() / 1000);
  const shared = {
    v: 1,
    bid: briefing.id,
    aud: briefing.audience,
    bh: briefing.hash,
    iat: issued,
    exp: issued + TA_BRIEFING_TOKEN_TTL_SECONDS,
  };
  const individual = {};
  briefing.approvalItems.forEach((item) => {
    individual[item.id] = signIndependentToken_(Object.assign({}, shared, {
      scope: 'one', ids: [item.id], jti: Utilities.getUuid(),
    }));
  });
  return {
    individual: individual,
    all: signIndependentToken_(Object.assign({}, shared, { scope: 'all', jti: Utilities.getUuid() })),
    review: signIndependentToken_(Object.assign({}, shared, { scope: 'review', jti: Utilities.getUuid() })),
  };
}

function renderIndependentBriefingEmail_(briefing, recipient, webAppUrl, tokens) {
  const dateText = Utilities.formatDate(
    Utilities.parseDate(briefing.dateKey + ' 12:00', TA_BRIEFING_TIME_ZONE, 'yyyy-MM-dd HH:mm'),
    TA_BRIEFING_TIME_ZONE,
    'EEEE, MMMM d, yyyy'
  ).toUpperCase();
  const link = (mode, token) => webAppUrl + '?mode=' + mode + '#' + encodeURIComponent(token);
  const allLink = link('approve', tokens.all);
  const reviewLink = link('select', tokens.review);
  const individualLinks = {};
  Object.keys(tokens.individual).forEach((id) => { individualLinks[id] = link('approve', tokens.individual[id]); });

  const listHtml = (items) => items.length
    ? '<ul style="margin:0;padding-left:18px;color:#202934;font-size:14px;line-height:1.55">' + items.map((item) => '<li style="margin-bottom:7px">' + escapeHtmlAppsScript_(item.text) + '</li>').join('') + '</ul>'
    : '<div style="color:#777;font-size:13px">No material item recorded.</div>';
  const meetingsHtml = briefing.meetings.length
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + briefing.meetings.map((meeting) => '<tr><td style="padding:0 12px 8px 0;color:#987443;font-weight:bold;white-space:nowrap">' + escapeHtmlAppsScript_(meeting.time) + '</td><td style="padding:0 0 8px;color:#202934">' + escapeHtmlAppsScript_(meeting.title) + '</td></tr>').join('') + '</table>'
    : '<div style="color:#777;font-size:13px">No verified meeting supplied by this audience calendar.</div>';
  const block = (icon, title, body) => '<td width="50%" valign="top" style="padding:23px;border:1px solid #ddd5c8;background:#fffdf8"><table role="presentation" width="100%"><tr><td width="42" valign="top" style="font-size:25px;color:#a8834b">' + icon + '</td><td valign="top"><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#86663a;font-weight:bold;margin:2px 0 13px">' + escapeHtmlAppsScript_(title) + '</div>' + body + '</td></tr></table></td>';
  const approvalHtml = briefing.approvalItems.length
    ? briefing.approvalItems.map((item) => '<div style="padding:14px 0;border-bottom:1px solid #e7e0d5"><div style="font-size:14px;line-height:1.45;color:#202934;font-weight:bold">' + escapeHtmlAppsScript_(item.text) + '</div>' + (item.detail ? '<div style="margin-top:4px;color:#72777d;font-size:12px">' + escapeHtmlAppsScript_(item.detail) + '</div>' : '') + '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr><td style="background:#b08b51;border-radius:3px"><a href="' + individualLinks[item.id] + '" style="display:inline-block;padding:9px 14px;color:#fff;text-decoration:none;font-size:12px;font-weight:bold">Approve</a></td></tr></table></div>').join('')
    : '<div style="color:#777;font-size:13px">No approval-required item.</div>';

  const subject = 'Tanzer Anderson | ' + briefing.title + ' | ' + dateText.replace(/^[A-Z]+,\s*/, '');
  const html = '<!doctype html><html><body style="margin:0;background:#091b2e;padding:24px;font-family:Arial,Helvetica,sans-serif">' +
    '<table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="720" style="width:100%;max-width:720px;background:#f7f1e7;border:1px solid #c9b38c;border-collapse:separate">' +
    '<tr><td style="background:#091b2e;padding:24px 30px;border-bottom:2px solid #b08b51"><div style="color:#fff;font:26px Georgia,serif;letter-spacing:.09em">TANZER ANDERSON</div><div style="color:#c6a66f;font-size:10px;letter-spacing:.18em;text-transform:uppercase;margin-top:6px">Private Search &amp; Leadership Advisory</div></td></tr>' +
    '<tr><td style="padding:34px 34px 18px;background:#f7f1e7"><div style="font:38px/1.05 Georgia,serif;color:#0b1c2f">' + escapeHtmlAppsScript_(briefing.title) + '</div><div style="margin-top:12px;color:#987443;font-size:12px;letter-spacing:.15em">' + dateText + '</div><div style="margin-top:18px;padding:14px 16px;border-left:3px solid #b08b51;background:#fffdf8;color:#555e66;font-size:13px;line-height:1.55">Good morning, ' + escapeHtmlAppsScript_(recipient.name) + '. ' + escapeHtmlAppsScript_(briefing.summary) + '</div></td></tr>' +
    '<tr><td style="padding:0 28px 28px;background:#f7f1e7"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + block('◎', 'Top Priorities', listHtml(briefing.topPriorities)) + block('⚖', 'Decisions Required', listHtml(briefing.decisions)) + '</tr><tr>' + block('▣', 'Meetings', meetingsHtml) + block('◇', 'Risks', listHtml(briefing.risks)) + '</tr></table></td></tr>' +
    '<tr><td style="padding:0 34px 30px;background:#f7f1e7"><div style="border:1px solid #d7cbb9;background:#fffdf8;padding:22px"><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#86663a;font-weight:bold">Action Approval Center</div><div style="margin:6px 0 8px;color:#6f767c;font-size:12px;line-height:1.45">Approve all, approve selected items, or approve one item. Links expire in 72 hours and are bound to this exact briefing hash.</div>' + approvalHtml + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr><td style="padding-right:8px"><a href="' + allLink + '" style="display:block;text-align:center;background:#091b2e;color:#fff;text-decoration:none;padding:14px 12px;font-size:13px;font-weight:bold">Approve All Action Items</a></td><td style="padding-left:8px"><a href="' + reviewLink + '" style="display:block;text-align:center;border:1px solid #a8834b;color:#775a32;text-decoration:none;padding:13px 12px;font-size:13px;font-weight:bold">Review / Approve Selected</a></td></tr></table></div></td></tr>' +
    '<tr><td style="padding:0 34px 30px;background:#f7f1e7"><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#86663a;font-weight:bold;margin-bottom:12px">Next Actions</div>' + listHtml(briefing.nextActions) + '</td></tr>' +
    '<tr><td style="background:#091b2e;padding:22px 30px;color:#d8c7aa"><div style="font:15px Georgia,serif">Insight. Strategy. Impact.</div><div style="margin-top:7px;color:#9eabb6;font-size:10px;line-height:1.5">Google Workspace delivery and approvals remain operational without a ChatGPT membership. Approvals enter the governed execution queue and never bypass external-release controls.</div></td></tr>' +
    '</table></td></tr></table></body></html>';

  const text = [briefing.title, dateText, '', briefing.summary, '', 'TOP PRIORITIES']
    .concat(briefing.topPriorities.map((item) => '- ' + item.text))
    .concat(['', 'DECISIONS REQUIRED'])
    .concat(briefing.decisions.map((item) => '- ' + item.text))
    .concat(['', 'MEETINGS'])
    .concat(briefing.meetings.map((meeting) => '- ' + meeting.time + ' ' + meeting.title))
    .concat(['', 'RISKS'])
    .concat(briefing.risks.map((item) => '- ' + item.text))
    .concat(['', 'APPROVE ALL: ' + allLink, 'REVIEW / APPROVE SELECTED: ' + reviewLink])
    .concat(briefing.approvalItems.map((item) => 'APPROVE ' + item.text + ': ' + individualLinks[item.id]))
    .join('\n');

  return { subject: subject, html: html, text: text };
}

function doGet(e) {
  const mode = String(e && e.parameter && e.parameter.mode || 'approve');
  const selected = mode === 'select';
  const title = selected ? 'Review action items' : 'Approval in progress';
  const body = '<!doctype html><html><head><base target="_top"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><style>' +
    'body{margin:0;background:linear-gradient(135deg,#061421,#0d2942);font-family:Arial,sans-serif;color:#202934;min-height:100vh;padding:28px}.card{max-width:720px;margin:5vh auto;background:#f7f1e7;border:1px solid #c9b38c;box-shadow:0 24px 80px rgba(0,0,0,.35)}.head{background:#091b2e;padding:25px 30px;border-bottom:2px solid #b08b51}.brand{font:25px Georgia,serif;color:#fff;letter-spacing:.1em}.tag{margin-top:6px;color:#c9a96f;font-size:10px;letter-spacing:.18em;text-transform:uppercase}.main{padding:32px}.main h1{font:34px Georgia,serif;color:#091b2e;margin:0 0 10px}.status{padding:16px;border-left:3px solid #b08b51;background:#fffdf8;line-height:1.5}.item{padding:13px 0;border-bottom:1px solid #e4dccf}.button{display:inline-block;border:0;background:#091b2e;color:#fff;padding:13px 18px;font-weight:bold;cursor:pointer;margin-top:18px}.footer{padding:19px 30px;background:#ede4d5;color:#786d5f;font-size:11px}</style></head><body>' +
    '<div class="card"><div class="head"><div class="brand">TANZER ANDERSON</div><div class="tag">Daily Briefing Approval Center</div></div><div class="main"><h1>' + title + '</h1><div id="status" class="status">' + (selected ? 'Loading the approval list…' : 'Validating and recording your approval…') + '</div><div id="items"></div><button id="approve" class="button" style="display:none">Approve Selected</button></div><div class="footer">Briefing-specific · time-limited · idempotent · auditable</div></div>' +
    '<script>let token="";try{token=decodeURIComponent(location.hash.slice(1));history.replaceState(null,"",location.pathname+location.search)}catch(e){}const status=document.getElementById("status"),items=document.getElementById("items"),btn=document.getElementById("approve");' +
    (selected
      ? 'google.script.run.withSuccessHandler(function(d){status.textContent="Choose the items to approve.";d.items.forEach(function(i){const row=document.createElement("div");row.className="item";const label=document.createElement("label");const box=document.createElement("input");box.type="checkbox";box.value=i.id;box.checked=!i.approved;box.disabled=i.approved;const span=document.createElement("span");span.textContent=" "+i.text+(i.approved?" — already approved":"");label.appendChild(box);label.appendChild(span);row.appendChild(label);items.appendChild(row)});btn.style.display="inline-block"}).withFailureHandler(function(e){status.textContent=e.message}).reviewIndependentBriefing(token);btn.onclick=function(){const ids=[].slice.call(document.querySelectorAll("input:checked:not(:disabled)")).map(x=>x.value);if(!ids.length){status.textContent="Select at least one item.";return}btn.disabled=true;status.textContent="Recording selected approvals…";google.script.run.withSuccessHandler(function(d){status.innerHTML="<b>Selected approvals recorded.</b><br>"+d.message;items.innerHTML="";btn.style.display="none"}).withFailureHandler(function(e){status.textContent=e.message;btn.disabled=false}).approveIndependentBriefing(token,ids)};'
      : 'setTimeout(function(){google.script.run.withSuccessHandler(function(d){status.innerHTML="<b>Approval recorded.</b><br>"+d.message}).withFailureHandler(function(e){status.textContent=e.message}).approveIndependentBriefing(token,null)},180);') +
    '</script></body></html>';
  return HtmlService.createHtmlOutput(body).setTitle(title).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function reviewIndependentBriefing(token) {
  const payload = verifyIndependentToken_(token);
  if (payload.scope !== 'review') throw new Error('This link cannot open the selection view.');
  const spreadsheet = getBriefingSpreadsheet_();
  const snapshot = loadBriefingSnapshot_(spreadsheet, payload.bid);
  if (!snapshot || snapshot.hash !== payload.bh) throw new Error('The briefing snapshot is missing or changed.');
  const approved = getApprovedItemMap_(spreadsheet, payload.bid);
  return {
    items: snapshot.briefing.approvalItems.map((item) => ({ id: item.id, text: item.text, approved: Boolean(approved[item.id]) })),
  };
}

function approveIndependentBriefing(token, selectedIds) {
  const payload = verifyIndependentToken_(token);
  const spreadsheet = getBriefingSpreadsheet_();
  const snapshot = loadBriefingSnapshot_(spreadsheet, payload.bid);
  if (!snapshot || snapshot.hash !== payload.bh) throw new Error('The briefing snapshot is missing or changed.');
  const items = snapshot.briefing.approvalItems || [];
  const allowed = Object.fromEntries(items.map((item) => [item.id, item]));
  let ids = [];
  if (payload.scope === 'all') ids = items.map((item) => item.id);
  else if (payload.scope === 'one') ids = payload.ids || [];
  else if (payload.scope === 'review') ids = Array.isArray(selectedIds) ? selectedIds : [];
  else throw new Error('Unsupported approval scope.');
  ids = ids.filter((id, index) => allowed[id] && ids.indexOf(id) === index);
  if (!ids.length) throw new Error('No valid action item was selected.');

  const existing = findApprovalByJti_(spreadsheet, payload.jti);
  if (existing) return { message: 'This approval was already recorded. No duplicate action was created.', approvalId: existing.approvalId };

  const approvalId = Utilities.getUuid();
  const actor = Session.getActiveUser().getEmail() || payload.aud;
  const now = new Date();
  const queueRows = [];
  let executionState = 'APPROVED_REVIEW_REQUIRED';
  ids.forEach((id) => {
    const item = allowed[id];
    const state = item.automationSafe && item.executionKey ? 'QUEUED_GOVERNED_EXECUTION' : 'APPROVED_REVIEW_REQUIRED';
    if (state === 'QUEUED_GOVERNED_EXECUTION') executionState = 'PARTIALLY_QUEUED';
    queueRows.push([now, Utilities.getUuid(), approvalId, payload.bid, payload.aud, id, item.executionKey || '', state, item.text]);
  });
  appendRows_(spreadsheet.getSheetByName('Execution Queue'), queueRows);
  appendRows_(spreadsheet.getSheetByName('Approval Ledger'), [[
    now, approvalId, payload.bid, payload.aud, actor, ids.join(','), payload.scope, payload.jti, payload.bh, executionState,
    'Approval recorded. No external campaign release or candidate disclosure is authorized.'
  ]]);

  return {
    approvalId: approvalId,
    approvedItemIds: ids,
    message: ids.length + ' item(s) approved. Automation-safe items entered the governed queue; all others remain approved for controlled follow-through.',
  };
}

function signIndependentToken_(payload) {
  const secret = getBriefingSigningSecret_();
  const encoded = base64UrlEncodeString_(JSON.stringify(payload));
  const signature = Utilities.computeHmacSha256Signature(encoded, secret);
  return encoded + '.' + base64UrlEncodeBytes_(signature);
}

function verifyIndependentToken_(token) {
  if (!token || String(token).indexOf('.') < 0) throw new Error('Approval token is missing or invalid.');
  const parts = String(token).split('.');
  if (parts.length !== 2) throw new Error('Approval token is malformed.');
  const expected = Utilities.computeHmacSha256Signature(parts[0], getBriefingSigningSecret_());
  const actual = base64UrlDecodeBytes_(parts[1]);
  if (!constantTimeEqual_(expected, actual)) throw new Error('Approval token signature is invalid.');
  const payload = JSON.parse(base64UrlDecodeString_(parts[0]));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Approval link has expired.');
  if (!payload.bid || !payload.aud || !payload.scope || !payload.jti) throw new Error('Approval token payload is incomplete.');
  return payload;
}

function getBriefingSigningSecret_() {
  const secret = PropertiesService.getScriptProperties().getProperty('BRIEFING_SIGNING_SECRET');
  if (!secret || secret.length < 48) throw new Error('Briefing signing secret is not installed.');
  return secret;
}

function getBriefingWebAppUrl_() {
  const url = PropertiesService.getScriptProperties().getProperty('BRIEFING_WEB_APP_URL') || ScriptApp.getService().getUrl();
  if (!url) throw new Error('Briefing web app deployment URL is unavailable.');
  return url;
}

function getBriefingSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('BRIEFING_CONTROL_SHEET_ID') || TA_BRIEFING_CONTROL_SHEET_ID;
  return SpreadsheetApp.openById(id);
}

function ensureBriefingRuntimeSheets_(spreadsheet) {
  ensureSheetWithHeaders_(spreadsheet, 'Approval Ledger', TA_LEDGER_HEADERS.approvals);
  ensureSheetWithHeaders_(spreadsheet, 'Send Ledger', TA_LEDGER_HEADERS.sends);
  ensureSheetWithHeaders_(spreadsheet, 'Briefing Snapshots', TA_LEDGER_HEADERS.snapshots);
  ensureSheetWithHeaders_(spreadsheet, 'Execution Queue', TA_LEDGER_HEADERS.queue);
}

function ensureSheetWithHeaders_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#091b2e').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function saveBriefingSnapshot_(spreadsheet, briefing) {
  const sheet = spreadsheet.getSheetByName('Briefing Snapshots');
  const values = sheet.getDataRange().getValues();
  for (let row = 1; row < values.length; row++) {
    if (String(values[row][1]) === briefing.id) {
      sheet.getRange(row + 1, 1, 1, 6).setValues([[new Date(), briefing.id, briefing.audience, briefing.dateKey, briefing.hash, JSON.stringify(briefing)]]);
      return;
    }
  }
  appendRows_(sheet, [[new Date(), briefing.id, briefing.audience, briefing.dateKey, briefing.hash, JSON.stringify(briefing)]]);
}

function loadBriefingSnapshot_(spreadsheet, briefingId) {
  const sheet = spreadsheet.getSheetByName('Briefing Snapshots');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const values = sheet.getDataRange().getValues();
  for (let row = values.length - 1; row >= 1; row--) {
    if (String(values[row][1]) === briefingId) {
      return { hash: String(values[row][4]), briefing: JSON.parse(String(values[row][5])) };
    }
  }
  return null;
}

function wasBriefingSent_(spreadsheet, briefingId, recipient) {
  const sheet = spreadsheet.getSheetByName('Send Ledger');
  if (!sheet || sheet.getLastRow() < 2) return false;
  return sheet.getDataRange().getValues().slice(1).some((row) => String(row[1]) === briefingId && String(row[3]) === recipient && String(row[5]) === 'SENT');
}

function findApprovalByJti_(spreadsheet, jti) {
  const sheet = spreadsheet.getSheetByName('Approval Ledger');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const values = sheet.getDataRange().getValues();
  for (let row = values.length - 1; row >= 1; row--) {
    if (String(values[row][7]) === jti) return { approvalId: String(values[row][1]), row: row + 1 };
  }
  return null;
}

function getApprovedItemMap_(spreadsheet, briefingId) {
  const result = {};
  const sheet = spreadsheet.getSheetByName('Approval Ledger');
  if (!sheet || sheet.getLastRow() < 2) return result;
  sheet.getDataRange().getValues().slice(1).forEach((row) => {
    if (String(row[2]) !== briefingId) return;
    String(row[5] || '').split(',').filter(Boolean).forEach((id) => { result[id] = true; });
  });
  return result;
}

function appendRows_(sheet, rows) {
  if (!rows || !rows.length) return;
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function normalizeBriefingDate_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return Utilities.formatDate(value, TA_BRIEFING_TIME_ZONE, 'yyyy-MM-dd');
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function asBoolean_(value) {
  if (value === true || value === 1) return true;
  return ['true', 'yes', 'y', '1'].indexOf(String(value).toLowerCase().trim()) >= 0;
}

function slugBriefing_(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 42) || 'item';
}

function escapeHtmlAppsScript_(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function sha256HexAppsScript_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)
    .map((byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join('');
}

function base64UrlEncodeString_(value) {
  return Utilities.base64EncodeWebSafe(String(value), Utilities.Charset.UTF_8).replace(/=+$/g, '');
}

function base64UrlEncodeBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function base64UrlDecodeString_(value) {
  return Utilities.newBlob(base64UrlDecodeBytes_(value)).getDataAsString(Utilities.Charset.UTF_8);
}

function base64UrlDecodeBytes_(value) {
  let padded = String(value);
  while (padded.length % 4) padded += '=';
  return Utilities.base64DecodeWebSafe(padded);
}

function constantTimeEqual_(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= (left[i] & 255) ^ (right[i] & 255);
  return diff === 0;
}
