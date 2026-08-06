const TA_CANVAS_V4 = Object.freeze({
  version: 'TA_PRIVATE_MONOGRAPH_CANVAS_V4',
  senderName: 'Henry Anderson',
  senderAddress: 'director@tanzeranderson.com',
  replyTo: 'director@tanzeranderson.com',
  title: 'Managing Director - Strategy and Business Development',
  assetOrigin: 'https://tanzer-private-monograph-canvas-v4.pages.dev',
  sprintUrl: 'https://tanzeranderson.com/commercial-talent-sprint/',
  checkoutUrl: 'https://buy.stripe.com/3cI9AVeob9nx9TuapJ3sI0b',
  reviewLabel: 'TA / Canvas v4 Review',
  testRecipients: Object.freeze([
    'hankfrisco972@gmail.com',
    'henryand83@live.com',
  ]),
  queueSheetIdProperty: 'CANVAS_V4_QUEUE_SHEET_ID',
  queueSheetNameProperty: 'CANVAS_V4_QUEUE_SHEET_NAME',
  assetOriginProperty: 'CANVAS_V4_ASSET_ORIGIN',
});

/**
 * One-time installation. This refuses to activate unless the director address
 * is already configured as a Gmail Send mail as identity for this account.
 */
function installPrivateMonographCanvasV4() {
  const alias = requireDirectorAlias_();
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(TA_CANVAS_V4.assetOriginProperty)) {
    props.setProperty(TA_CANVAS_V4.assetOriginProperty, TA_CANVAS_V4.assetOrigin);
  }
  getOrCreateReviewLabel_();
  const master = fetchCanvasBlob_('private-monograph-canvas-v4.jpg');
  return {
    installed: true,
    version: TA_CANVAS_V4.version,
    senderAlias: alias,
    masterCanvasBytes: master.getBytes().length,
    queueConfigured: Boolean(props.getProperty(TA_CANVAS_V4.queueSheetIdProperty)),
    automaticExternalSend: false,
    externalReleaseRequiresHenry: true,
  };
}

/**
 * Connects a private Google Sheet that contains the governed release queue.
 * The Sheet remains private; no recipient addresses are stored in public code.
 */
function configurePrivateMonographCanvasV4Queue(sheetId, sheetName) {
  if (!sheetId) throw new Error('A Google Sheet ID is required.');
  const spreadsheet = SpreadsheetApp.openById(String(sheetId).trim());
  const name = String(sheetName || 'Canvas v4 Queue').trim();
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error('Queue sheet not found: ' + name);
  validateQueueHeaders_(sheet);

  const props = PropertiesService.getScriptProperties();
  props.setProperty(TA_CANVAS_V4.queueSheetIdProperty, spreadsheet.getId());
  props.setProperty(TA_CANVAS_V4.queueSheetNameProperty, name);
  return {
    configured: true,
    spreadsheetUrl: spreadsheet.getUrl(),
    sheetName: name,
    queueRows: Math.max(0, sheet.getLastRow() - 1),
  };
}

function setPrivateMonographCanvasV4AssetOrigin(origin) {
  const value = String(origin || '').trim().replace(/\/$/, '');
  if (!/^https:\/\//i.test(value)) throw new Error('Asset origin must be HTTPS.');
  PropertiesService.getScriptProperties().setProperty(TA_CANVAS_V4.assetOriginProperty, value);
  return { assetOrigin: value };
}

/**
 * Sends two controlled rendering tests only. It cannot send to any other
 * address and it requires director@tanzeranderson.com to be a real alias.
 */
function sendPrivateMonographCanvasV4Tests() {
  const alias = requireDirectorAlias_();
  const blob = fetchCanvasBlob_('private-monograph-canvas-v4.jpg');
  const results = [];

  TA_CANVAS_V4.testRecipients.forEach(function(recipient) {
    assertInternalTestRecipient_(recipient);
    const subject = recipient.endsWith('@live.com')
      ? 'EXACT-RENDER CANVAS v4 — Outlook rendering test'
      : 'EXACT-RENDER CANVAS v4 — Gmail rendering test';
    const plain = buildTestPlainText_();
    const html = buildCanvasShellHtml_(
      'Henry',
      'private-monograph-canvas-v4.jpg',
      'Private Monograph Canvas v4 exact-render test'
    );

    GmailApp.sendEmail(recipient, subject, plain, {
      from: alias,
      replyTo: TA_CANVAS_V4.replyTo,
      name: TA_CANVAS_V4.senderName,
      htmlBody: html,
      inlineImages: { canvas: blob.copyBlob().setName('tanzer-private-monograph-canvas-v4.jpg') },
    });
    results.push({ recipient: recipient, status: 'SENT_INTERNAL_TEST' });
  });

  return {
    version: TA_CANVAS_V4.version,
    sender: alias,
    results: results,
  };
}

/**
 * Creates one exact-render draft. It never sends the draft.
 */
function createPrivateMonographCanvasV4Draft(payload) {
  requireDirectorAlias_();
  const record = normalizeQueueRecord_(payload || {});
  if (record.channel !== 'GMAIL_DRAFT') {
    throw new Error('Only GMAIL_DRAFT records can create Gmail drafts.');
  }
  if (!record.to) throw new Error('Recipient email is required.');
  if (findExistingCanvasDraft_(record.slug, record.to)) {
    return { status: 'SKIPPED_EXISTING_DRAFT', slug: record.slug, to: record.to };
  }

  const result = createCanvasDraft_(record);
  return {
    status: 'DRAFT_CREATED',
    draftId: result.draftId,
    messageId: result.messageId,
    slug: record.slug,
    to: record.to,
  };
}

/**
 * Creates all governed Gmail drafts from the configured private Sheet.
 * OFFICIAL_FORM rows are retained for review but are never submitted here.
 */
function createPrivateMonographCanvasV4SprintDrafts() {
  requireDirectorAlias_();
  const context = getQueueSheet_();
  const rows = readQueueRows_(context.sheet);
  const results = [];

  rows.forEach(function(row) {
    if (!row.active) {
      results.push({ row: row.rowNumber, company: row.company, status: 'SKIPPED_INACTIVE' });
      return;
    }
    if (row.releaseState === 'HOLD' || row.releaseState === 'SENT') {
      results.push({ row: row.rowNumber, company: row.company, status: 'SKIPPED_' + row.releaseState });
      return;
    }
    if (row.channel !== 'GMAIL_DRAFT') {
      writeQueueResult_(context.sheet, context.headers, row.rowNumber, {
        status: 'FORM_COPY_READY',
        draftId: '',
        detail: 'Exact canvas hosted; official form remains unsent.',
      });
      results.push({ row: row.rowNumber, company: row.company, status: 'FORM_COPY_READY' });
      return;
    }
    if (findExistingCanvasDraft_(row.slug, row.to)) {
      writeQueueResult_(context.sheet, context.headers, row.rowNumber, {
        status: 'DRAFT_ALREADY_EXISTS',
        detail: 'No duplicate created.',
      });
      results.push({ row: row.rowNumber, company: row.company, status: 'DRAFT_ALREADY_EXISTS' });
      return;
    }

    try {
      const created = createCanvasDraft_(row);
      writeQueueResult_(context.sheet, context.headers, row.rowNumber, {
        status: 'DRAFT_CREATED',
        draftId: created.draftId,
        detail: 'Created with CID-inline exact-render canvas; not sent.',
      });
      results.push({
        row: row.rowNumber,
        company: row.company,
        status: 'DRAFT_CREATED',
        draftId: created.draftId,
      });
    } catch (error) {
      writeQueueResult_(context.sheet, context.headers, row.rowNumber, {
        status: 'ERROR',
        detail: String(error && error.message || error),
      });
      results.push({
        row: row.rowNumber,
        company: row.company,
        status: 'ERROR',
        error: String(error && error.message || error),
      });
    }
  });

  return {
    version: TA_CANVAS_V4.version,
    queueSheetUrl: context.spreadsheet.getUrl(),
    automaticExternalSend: false,
    results: results,
  };
}

function systemStatusPrivateMonographCanvasV4() {
  const props = PropertiesService.getScriptProperties();
  const aliases = GmailApp.getAliases();
  const aliasActive = aliases.some(function(value) {
    return String(value).toLowerCase() === TA_CANVAS_V4.senderAddress.toLowerCase();
  });
  let queueRows = 0;
  let queueUrl = '';
  let queueError = '';
  try {
    const context = getQueueSheet_();
    queueRows = Math.max(0, context.sheet.getLastRow() - 1);
    queueUrl = context.spreadsheet.getUrl();
  } catch (error) {
    queueError = String(error && error.message || error);
  }

  return {
    version: TA_CANVAS_V4.version,
    directorAliasActive: aliasActive,
    availableAliases: aliases,
    assetOrigin: getAssetOrigin_(),
    queueConfigured: Boolean(props.getProperty(TA_CANVAS_V4.queueSheetIdProperty)),
    queueRows: queueRows,
    queueUrl: queueUrl,
    queueError: queueError,
    automaticExternalSend: false,
    onlyInternalTestSendAvailable: true,
    externalReleaseRequiresHenry: true,
  };
}

function createCanvasDraft_(record) {
  const alias = requireDirectorAlias_();
  const asset = 'prospects/' + encodeURIComponent(record.slug) + '.jpg';
  const blob = fetchCanvasBlob_(asset).setName('tanzer-' + record.slug + '-private-monograph.jpg');
  const plain = buildProspectPlainText_(record);
  const html = buildCanvasShellHtml_(record.firstName, asset, record.company + ' × Tanzer Anderson');
  const draft = GmailApp.createDraft(record.to, record.subject, plain, {
    from: alias,
    replyTo: TA_CANVAS_V4.replyTo,
    name: TA_CANVAS_V4.senderName,
    htmlBody: html,
    inlineImages: { canvas: blob },
  });
  const message = draft.getMessage();
  message.getThread().addLabel(getOrCreateReviewLabel_());
  return { draftId: draft.getId(), messageId: message.getId() };
}

function buildCanvasShellHtml_(firstName, assetPath, altText) {
  const greeting = escapeHtml_(firstName ? 'Hello ' + firstName + ',' : 'Hello,');
  const marker = TA_CANVAS_V4.version + '_' + String(assetPath).replace(/[^a-z0-9]+/gi, '_').toUpperCase();
  return '<!doctype html><html><body style="margin:0;padding:0;background:#eee7dc;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' + greeting +
    ' A private exact-render correspondence from Tanzer Anderson.</div>' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#eee7dc;">' +
    '<tr><td align="center" style="padding:18px 8px 10px;">' +
    '<a href="' + TA_CANVAS_V4.sprintUrl + '" style="text-decoration:none;">' +
    '<img src="cid:canvas" width="640" alt="' + escapeHtml_(altText) + '" ' +
    'style="display:block;width:640px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">' +
    '</a></td></tr>' +
    '<tr><td align="center" style="padding:10px 14px 28px;font-family:Arial,Helvetica,sans-serif;">' +
    '<a href="' + TA_CANVAS_V4.sprintUrl + '" style="display:inline-block;margin:4px;padding:13px 18px;background:#05182f;color:#fff;text-decoration:none;font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Review the Sprint</a>' +
    '<a href="' + TA_CANVAS_V4.checkoutUrl + '" style="display:inline-block;margin:4px;padding:12px 18px;border:1px solid #b28a4a;color:#8d6933;text-decoration:none;font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Secure Checkout</a>' +
    '<div style="margin-top:14px;font-size:11px;color:#68645e;">' +
    '<a href="mailto:' + TA_CANVAS_V4.senderAddress + '" style="color:#68645e;text-decoration:none;">' + TA_CANVAS_V4.senderAddress + '</a></div>' +
    '</td></tr></table>' +
    '<div style="font-size:0;line-height:0;height:0;overflow:hidden;">' + marker + '</div>' +
    '</body></html>';
}

function buildProspectPlainText_(record) {
  return [
    'Hello ' + record.firstName + ',',
    '',
    record.intro,
    '',
    'Tanzer Anderson has built a fixed-scope Commercial Talent Sprint for search and staffing firms that need an additional research lane on one difficult requisition—without hiring another researcher, transferring candidate contact, or adding a placement fee.',
    '',
    'Within 72 hours of accepted intake, the $3,000 Sprint delivers:',
    '',
    '• 25–40 evidence-backed potential candidates, ranked with fit reasoning',
    '• source links, strengths, gaps, and risk flags',
    '• a practical sourcing strategy and personalized opening copy',
    '• a private, handoff-ready client room',
    '• one written refinement',
    '',
    'The individuals are presented as researched prospects, not as interested or available unless that has been separately verified. Your team retains every candidate interaction, assessment decision, and client relationship.',
    '',
    record.recommendedUse,
    '',
    'Review the Sprint: ' + TA_CANVAS_V4.sprintUrl,
    'Secure checkout: ' + TA_CANVAS_V4.checkoutUrl,
    '',
    'No call is required. Questions and the full engagement can be handled in writing.',
    '',
    'Henry Anderson',
    TA_CANVAS_V4.title,
    'Tanzer Anderson',
    TA_CANVAS_V4.senderAddress,
    '',
    TA_CANVAS_V4.version + '_' + record.slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
  ].join('\n');
}

function buildTestPlainText_() {
  return [
    'Hello Henry,',
    '',
    'This is the Private Monograph Canvas v4 exact-render delivery test.',
    'The complete correspondence is pre-rendered as finished artwork and embedded as a CID-inline image so Gmail or Outlook cannot reinterpret its texture, spacing, typography, architecture, or gold signature.',
    '',
    'Review the Sprint: ' + TA_CANVAS_V4.sprintUrl,
    'Secure checkout: ' + TA_CANVAS_V4.checkoutUrl,
    '',
    'Henry Anderson',
    TA_CANVAS_V4.title,
    'Tanzer Anderson',
    TA_CANVAS_V4.senderAddress,
  ].join('\n');
}

function getQueueSheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(TA_CANVAS_V4.queueSheetIdProperty);
  const name = props.getProperty(TA_CANVAS_V4.queueSheetNameProperty) || 'Canvas v4 Queue';
  if (!id) throw new Error('Queue is not configured. Run configurePrivateMonographCanvasV4Queue(sheetId, sheetName).');
  const spreadsheet = SpreadsheetApp.openById(id);
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error('Configured queue sheet is missing: ' + name);
  const headers = validateQueueHeaders_(sheet);
  return { spreadsheet: spreadsheet, sheet: sheet, headers: headers };
}

function validateQueueHeaders_(sheet) {
  const values = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getDisplayValues()[0];
  const headers = {};
  values.forEach(function(value, index) { headers[String(value).trim()] = index + 1; });
  [
    'Active', 'Wave', 'Company', 'Slug', 'First Name', 'Channel', 'Recipient / Route',
    'Subject', 'Intro', 'Recommended Use', 'Release State', 'Status', 'Draft ID',
    'Draft Created At', 'Detail'
  ].forEach(function(required) {
    if (!headers[required]) throw new Error('Missing queue header: ' + required);
  });
  return headers;
}

function readQueueRows_(sheet) {
  const headers = validateQueueHeaders_(sheet);
  if (sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.map(function(row, offset) {
    return normalizeQueueRecord_({
      active: row[headers['Active'] - 1],
      wave: row[headers['Wave'] - 1],
      company: row[headers['Company'] - 1],
      slug: row[headers['Slug'] - 1],
      firstName: row[headers['First Name'] - 1],
      channel: row[headers['Channel'] - 1],
      to: row[headers['Recipient / Route'] - 1],
      subject: row[headers['Subject'] - 1],
      intro: row[headers['Intro'] - 1],
      recommendedUse: row[headers['Recommended Use'] - 1],
      releaseState: row[headers['Release State'] - 1],
      rowNumber: offset + 2,
    });
  });
}

function normalizeQueueRecord_(value) {
  const record = value || {};
  const normalized = {
    active: asBoolean_(record.active === undefined ? true : record.active),
    wave: Number(record.wave || 0),
    company: String(record.company || '').trim(),
    slug: String(record.slug || '').trim().toLowerCase(),
    firstName: String(record.firstName || '').trim(),
    channel: String(record.channel || 'GMAIL_DRAFT').trim().toUpperCase(),
    to: String(record.to || '').trim(),
    subject: String(record.subject || '').trim(),
    intro: String(record.intro || '').trim(),
    recommendedUse: String(record.recommendedUse || '').trim(),
    releaseState: String(record.releaseState || 'REVIEW_ONLY').trim().toUpperCase(),
    rowNumber: Number(record.rowNumber || 0),
  };
  ['company', 'slug', 'firstName', 'subject', 'intro', 'recommendedUse'].forEach(function(field) {
    if (!normalized[field]) throw new Error('Queue record is missing ' + field + '.');
  });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized.slug)) {
    throw new Error('Invalid slug: ' + normalized.slug);
  }
  if (normalized.channel === 'GMAIL_DRAFT' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.to)) {
    throw new Error('Invalid recipient email for ' + normalized.company + '.');
  }
  return normalized;
}

function writeQueueResult_(sheet, headers, rowNumber, result) {
  const now = new Date();
  sheet.getRange(rowNumber, headers['Status']).setValue(result.status || '');
  if (result.draftId !== undefined) sheet.getRange(rowNumber, headers['Draft ID']).setValue(result.draftId || '');
  sheet.getRange(rowNumber, headers['Draft Created At']).setValue(now);
  sheet.getRange(rowNumber, headers['Detail']).setValue(result.detail || '');
}

function findExistingCanvasDraft_(slug, recipient) {
  const marker = TA_CANVAS_V4.version + '_' + slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const query = 'in:drafts to:' + recipient + ' "' + marker + '"';
  return GmailApp.search(query, 0, 1).length > 0;
}

function fetchCanvasBlob_(path) {
  const origin = getAssetOrigin_();
  const url = origin + '/' + String(path || '').replace(/^\/+/, '');
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    followRedirects: true,
    muteHttpExceptions: true,
    validateHttpsCertificates: true,
  });
  const code = response.getResponseCode();
  if (code !== 200) throw new Error('Canvas fetch failed (' + code + '): ' + url);
  const headers = response.getHeaders();
  const contentType = String(headers['Content-Type'] || headers['content-type'] || '').toLowerCase();
  if (contentType.indexOf('image/jpeg') === -1) {
    throw new Error('Canvas did not return image/jpeg: ' + contentType);
  }
  const blob = response.getBlob().setContentType('image/jpeg');
  if (blob.getBytes().length < 100000) throw new Error('Canvas asset is unexpectedly small: ' + url);
  return blob;
}

function getAssetOrigin_() {
  return (PropertiesService.getScriptProperties().getProperty(TA_CANVAS_V4.assetOriginProperty) || TA_CANVAS_V4.assetOrigin).replace(/\/$/, '');
}

function requireDirectorAlias_() {
  const target = TA_CANVAS_V4.senderAddress.toLowerCase();
  const aliases = GmailApp.getAliases();
  const alias = aliases.find(function(value) { return String(value).toLowerCase() === target; });
  if (!alias) {
    throw new Error(
      TA_CANVAS_V4.senderAddress + ' is not an active Gmail Send mail as alias. ' +
      'Add and verify it before installation or draft creation. Available aliases: ' + aliases.join(', ')
    );
  }
  return alias;
}

function assertInternalTestRecipient_(recipient) {
  const allowed = TA_CANVAS_V4.testRecipients.map(function(value) { return value.toLowerCase(); });
  if (allowed.indexOf(String(recipient).toLowerCase()) === -1) {
    throw new Error('Canvas v4 test sending is restricted to the approved internal test addresses.');
  }
}

function getOrCreateReviewLabel_() {
  return GmailApp.getUserLabelByName(TA_CANVAS_V4.reviewLabel) || GmailApp.createLabel(TA_CANVAS_V4.reviewLabel);
}

function asBoolean_(value) {
  if (value === true || value === 1) return true;
  const text = String(value || '').trim().toLowerCase();
  return ['true', 'yes', 'y', '1', 'active'].indexOf(text) >= 0;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
