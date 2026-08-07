const TA_ROLE_INTAKE_V10 = Object.freeze({
  version: 'TA_MAX_SAFE_V10_PORTAL',
  portalUrl: 'https://tanzeranderson.com/role-intake/',
  reviewLabel: 'TA / Max Safe Portal Review',
  maximumHtmlBytes: 50000
});

function createMaxSafePortalDraft(payload) {
  const alias = requireDirectorAliasV9_();
  const p = normalizeV9_(payload || {});
  p.reference = String(payload.reference || '').trim() || Utilities.getUuid().slice(0, 8).toUpperCase();
  const baseHtml = buildMaxSafeHtmlV9_(p);
  validateMaxSafeV9_(baseHtml);
  const html = addRoleIntakePortalV10_(baseHtml, p);
  validateMaxSafePortalV10_(html);
  const draft = GmailApp.createDraft(p.to, p.subject, buildPlainPortalV10_(p), {
    from: alias,
    replyTo: TA_MAX_SAFE_V9.replyTo,
    name: TA_MAX_SAFE_V9.senderName,
    htmlBody: html
  });
  draft.getMessage().getThread().addLabel(getOrCreatePortalV10Label_());
  return {
    status: 'DRAFT_CREATED',
    version: TA_ROLE_INTAKE_V10.version,
    draftId: draft.getId(),
    messageId: draft.getMessage().getId(),
    portalUrl: buildRoleIntakeUrlV10_(p),
    htmlBytes: Utilities.newBlob(html).getBytes().length
  };
}

function createMaxSafePortalDraftBatch(payloads) {
  if (!Array.isArray(payloads) || !payloads.length) throw new Error('A non-empty payload array is required.');
  return payloads.map(function(payload) {
    return createMaxSafePortalDraft(payload);
  });
}

function sendMaxSafePortalInternalTests() {
  const alias = requireDirectorAliasV9_();
  const results = [];
  TA_MAX_SAFE_V9.testRecipients.forEach(function(recipient) {
    assertInternalV9_(recipient);
    const p = normalizeV9_(Object.assign({}, samplePayloadV9_(), {
      to: recipient,
      subject: /@live\.com$/i.test(recipient)
        ? 'TEST — Max Safe Portal — Outlook'
        : 'TEST — Max Safe Portal — Gmail'
    }));
    p.reference = 'INTERNAL-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const baseHtml = buildMaxSafeHtmlV9_(p);
    validateMaxSafeV9_(baseHtml);
    const html = addRoleIntakePortalV10_(baseHtml, p);
    validateMaxSafePortalV10_(html);
    GmailApp.sendEmail(recipient, p.subject, buildPlainPortalV10_(p), {
      from: alias,
      replyTo: TA_MAX_SAFE_V9.replyTo,
      name: TA_MAX_SAFE_V9.senderName,
      htmlBody: html
    });
    results.push({recipient: recipient, portalUrl: buildRoleIntakeUrlV10_(p), status: 'SENT_INTERNAL_TEST'});
  });
  return {version: TA_ROLE_INTAKE_V10.version, results: results};
}

function addRoleIntakePortalV10_(baseHtml, p) {
  const c = colorsV9_();
  const label = escapeV9_(p.cta) + ' &nbsp; →';
  const oldButton = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.gold + ';"><tr><td align="center" style="padding:14px 10px;font-family:Georgia,Times New Roman,serif;font-size:18px;line-height:24px;color:' + c.navy + ';">' + label + '</td></tr></table>';
  const newButton = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:0;">' +
    '<a class="ta-role-cta" href="' + escapeV9_(buildRoleIntakeUrlV10_(p)) + '" target="_blank" rel="noopener" style="display:block;padding:14px 10px;background:' + c.gold + ';border:1px solid #D7B36D;box-shadow:0 4px 0 #8F672F;font-family:Georgia,Times New Roman,serif;font-size:18px;line-height:24px;color:' + c.navy + ';text-decoration:none;">' + label + '</a>' +
    '</td></tr></table>';
  if (baseHtml.indexOf(oldButton) === -1) throw new Error('Max Safe CTA block could not be located.');
  const hover = '<style>.ta-role-cta:hover{position:relative!important;top:-2px!important;box-shadow:0 7px 0 #8f672f,0 12px 22px rgba(7,26,49,.18)!important}</style>';
  return baseHtml.replace('<html><body', '<html><head>' + hover + '</head><body').replace(oldButton, newButton);
}

function buildRoleIntakeUrlV10_(p) {
  const params = [
    ['contact', p.firstName],
    ['company', p.company],
    ['email', p.to],
    ['role', p.role],
    ['ref', p.reference],
    ['source', 'first-touch-email']
  ].filter(function(pair) { return String(pair[1] || '').trim(); })
    .map(function(pair) { return encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]); })
    .join('&');
  return TA_ROLE_INTAKE_V10.portalUrl + (params ? '?' + params : '');
}

function buildPlainPortalV10_(p) {
  return buildPlainV9_(p) + '\n\nShare the role securely: ' + buildRoleIntakeUrlV10_(p);
}

function validateMaxSafePortalV10_(html) {
  const lowered = String(html).toLowerCase();
  const forbidden = [
    '<img', 'background-image', 'url(', 'cid:', 'data:image',
    '@media', '<script', 'display:flex', 'display:grid', 'position:absolute',
    'position:fixed', 'transform:'
  ];
  forbidden.forEach(function(token) {
    if (lowered.indexOf(token) !== -1) throw new Error('Max Safe Portal forbidden token: ' + token);
  });
  if (/\bring\b/i.test(String(html))) throw new Error('Max Safe Portal cannot use the word "ring".');
  if (html.indexOf('https://tanzeranderson.com/role-intake/') === -1) throw new Error('Role-intake portal URL is missing.');
  if (html.indexOf('class="ta-role-cta"') === -1) throw new Error('Portal CTA is missing.');
  const bytes = Utilities.newBlob(html).getBytes().length;
  if (bytes > TA_ROLE_INTAKE_V10.maximumHtmlBytes) throw new Error('Portal email exceeds the Max Safe size gate: ' + bytes);
}

function getOrCreatePortalV10Label_() {
  return GmailApp.getUserLabelByName(TA_ROLE_INTAKE_V10.reviewLabel) || GmailApp.createLabel(TA_ROLE_INTAKE_V10.reviewLabel);
}
