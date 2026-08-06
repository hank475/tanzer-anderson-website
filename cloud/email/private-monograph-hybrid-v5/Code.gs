const TA_HYBRID_V5 = Object.freeze({
  version: 'TA_PRIVATE_MONOGRAPH_HYBRID_V5',
  senderName: 'Henry Anderson',
  senderAddress: 'director@tanzeranderson.com',
  replyTo: 'director@tanzeranderson.com',
  title: 'Managing Director - Strategy and Business Development',
  sprintUrl: 'https://tanzeranderson.com/commercial-talent-sprint/',
  checkoutUrl: 'https://buy.stripe.com/3cI9AVeob9nx9TuapJ3sI0b',
  testRecipients: Object.freeze(['hankfrisco972@gmail.com', 'henryand83@live.com']),
  reviewLabel: 'TA / Hybrid v5 Review'
});

function sendPrivateMonographHybridV5Tests() {
  const alias = requireDirectorAliasV5_();
  const results = [];
  TA_HYBRID_V5.testRecipients.forEach(function(recipient) {
    assertInternalTestRecipientV5_(recipient);
    const isOutlook = /@live\.com$/i.test(recipient);
    GmailApp.sendEmail(
      recipient,
      isOutlook ? 'HYBRID V5 — Outlook rendering test' : 'HYBRID V5 — Gmail rendering test',
      buildPlainV5_('Henry'),
      {
        from: alias,
        replyTo: TA_HYBRID_V5.replyTo,
        name: TA_HYBRID_V5.senderName,
        htmlBody: buildHybridHtmlV5_({
          firstName: 'Henry',
          eyebrow: 'PRIVATE SEARCH & LEADERSHIP ADVISORY',
          title: 'A focused proof of concept',
          intro: 'Rather than send a general agency pitch, I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.',
          proofTitle: 'PROOF OF CONCEPT',
          proof: 'Target firms + adjacent talent pools → role-specific screening criteria → ranked prospects with evidence notes, strengths, gaps, and source links.',
          boundary: 'No résumé dump and no candidate submission outside your approved process.',
          close: 'If the work is useful, we can discuss whether Tanzer Anderson belongs in the search-firm rotation.'
        })
      }
    );
    results.push({recipient: recipient, status: 'SENT_INTERNAL_TEST'});
  });
  return {version: TA_HYBRID_V5.version, sender: alias, results: results};
}

function createPrivateMonographHybridV5Draft(payload) {
  const alias = requireDirectorAliasV5_();
  const p = normalizePayloadV5_(payload || {});
  const draft = GmailApp.createDraft(p.to, p.subject, buildPlainV5_(p.firstName, p), {
    from: alias,
    replyTo: TA_HYBRID_V5.replyTo,
    name: TA_HYBRID_V5.senderName,
    htmlBody: buildHybridHtmlV5_(p)
  });
  draft.getMessage().getThread().addLabel(getOrCreateReviewLabelV5_());
  return {status: 'DRAFT_CREATED', draftId: draft.getId(), messageId: draft.getMessage().getId()};
}

function buildHybridHtmlV5_(p) {
  const firstName = escapeV5_(p.firstName || '');
  const greeting = firstName ? 'Hello ' + firstName + ',' : 'Hello,';
  const navy = '#071B33';
  const blueInk = '#0B2A4A';
  const gold = '#B28A4A';
  const paper = '#F7F3EA';
  const paper2 = '#EFE7DA';
  const ink = '#263340';
  return '<!doctype html><html><body style="margin:0;padding:0;background:#E9E2D7;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' + escapeV5_(p.title || 'Private correspondence from Tanzer Anderson') + '</div>' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;background:#E9E2D7;">' +
      '<tr><td align="center" style="padding:18px 8px;">' +
        '<table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:100%;background:' + paper + ';border:1px solid #D1C6B6;">' +
          '<tr><td style="height:9px;background:' + navy + ';font-size:0;line-height:0;">&nbsp;</td></tr>' +
          '<tr><td style="padding:24px 30px 17px;border-bottom:1px solid #D7CCBB;background:' + paper2 + ';font-family:Georgia,Times New Roman,serif;">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>' +
              '<td style="font-size:18px;letter-spacing:2.4px;color:' + navy + ';">TANZER ANDERSON</td>' +
              '<td align="right" style="font:11px Arial,Helvetica,sans-serif;letter-spacing:1.5px;color:' + gold + ';">PRIVATE MONOGRAPH</td>' +
            '</tr></table>' +
          '</td></tr>' +
          '<tr><td style="padding:34px 38px 18px;font-family:Arial,Helvetica,sans-serif;color:' + ink + ';">' +
            '<div style="font-size:10px;line-height:16px;letter-spacing:2px;color:' + gold + ';font-weight:bold;">' + escapeV5_(p.eyebrow || 'PRIVATE SEARCH & LEADERSHIP ADVISORY') + '</div>' +
            '<div style="margin-top:12px;font:30px/36px Georgia,Times New Roman,serif;color:' + navy + ';">' + escapeV5_(p.title || 'A focused proof of concept') + '</div>' +
            '<div style="width:58px;border-top:2px solid ' + gold + ';margin:20px 0 25px;"></div>' +
            '<div style="font:18px/28px Georgia,Times New Roman,serif;color:' + navy + ';font-weight:bold;">' + escapeV5_(greeting) + '</div>' +
            '<div style="margin-top:18px;font-size:15px;line-height:24px;">' + escapeV5_(p.intro || '') + '</div>' +
          '</td></tr>' +
          '<tr><td style="padding:8px 38px 10px;">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EEE6D8;border-left:3px solid ' + gold + ';">' +
              '<tr><td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;color:' + ink + ';">' +
                '<div style="font-size:10px;letter-spacing:2px;font-weight:bold;color:' + gold + ';">' + escapeV5_(p.proofTitle || 'PROOF OF CONCEPT') + '</div>' +
                '<div style="margin-top:10px;font-size:15px;line-height:24px;">' + escapeV5_(p.proof || '') + '</div>' +
              '</td></tr>' +
            '</table>' +
          '</td></tr>' +
          '<tr><td style="padding:14px 38px 34px;font-family:Arial,Helvetica,sans-serif;color:' + ink + ';font-size:15px;line-height:24px;">' +
            '<div>' + escapeV5_(p.boundary || '') + '</div>' +
            '<div style="margin-top:16px;">' + escapeV5_(p.close || '') + '</div>' +
            '<div style="margin-top:30px;border-top:1px solid #D6CBB9;padding-top:20px;">' +
              '<div style="font:15px/22px Georgia,Times New Roman,serif;color:#4E5357;">Warmly,</div>' +
              '<div style="margin-top:1px;font-family:Segoe Script,Snell Roundhand,URW Z003,Brush Script MT,cursive;font-size:35px;line-height:46px;font-weight:400;font-style:italic;color:' + blueInk + ';transform:skewX(-8deg);transform-origin:left center;">Henry Anderson</div>' +
              '<div style="margin-top:3px;font-size:11px;line-height:17px;letter-spacing:1.1px;color:' + navy + ';font-weight:bold;">MANAGING DIRECTOR - STRATEGY AND BUSINESS DEVELOPMENT</div>' +
              '<div style="margin-top:4px;font-size:13px;line-height:20px;color:#62615D;">Tanzer Anderson</div>' +
              '<div style="font-size:13px;line-height:20px;"><a href="mailto:' + TA_HYBRID_V5.senderAddress + '" style="color:' + blueInk + ';text-decoration:none;">' + TA_HYBRID_V5.senderAddress + '</a></div>' +
            '</div>' +
          '</td></tr>' +
          '<tr><td style="height:6px;background:' + navy + ';font-size:0;line-height:0;">&nbsp;</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
  '</body></html>';
}

function buildPlainV5_(firstName, p) {
  p = p || {};
  return [
    'Hello ' + (firstName || '') + ',', '',
    p.intro || 'Rather than send a general agency pitch, I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.', '',
    'PROOF OF CONCEPT',
    p.proof || 'Target firms + adjacent talent pools → role-specific screening criteria → ranked prospects with evidence notes, strengths, gaps, and source links.', '',
    p.boundary || 'No résumé dump and no candidate submission outside your approved process.', '',
    p.close || 'If the work is useful, we can discuss whether Tanzer Anderson belongs in the search-firm rotation.', '',
    'Warmly,', 'Henry Anderson', TA_HYBRID_V5.title, 'Tanzer Anderson', TA_HYBRID_V5.senderAddress
  ].join('\n');
}

function normalizePayloadV5_(p) {
  if (!p.to) throw new Error('Recipient email is required.');
  if (!p.subject) throw new Error('Subject is required.');
  return {
    to: String(p.to).trim(), subject: String(p.subject).trim(), firstName: String(p.firstName || '').trim(),
    eyebrow: String(p.eyebrow || 'PRIVATE SEARCH & LEADERSHIP ADVISORY'), title: String(p.title || 'A focused proof of concept'),
    intro: String(p.intro || ''), proofTitle: String(p.proofTitle || 'PROOF OF CONCEPT'), proof: String(p.proof || ''),
    boundary: String(p.boundary || ''), close: String(p.close || '')
  };
}

function requireDirectorAliasV5_() {
  const aliases = GmailApp.getAliases();
  const alias = aliases.find(function(value) { return String(value).toLowerCase() === TA_HYBRID_V5.senderAddress.toLowerCase(); });
  if (!alias) throw new Error('director@tanzeranderson.com must be configured as a Gmail Send mail as identity before Hybrid v5 can run.');
  return alias;
}

function assertInternalTestRecipientV5_(recipient) {
  if (TA_HYBRID_V5.testRecipients.indexOf(String(recipient).toLowerCase()) === -1) throw new Error('Hybrid v5 test sender is restricted to Henry internal test inboxes.');
}

function getOrCreateReviewLabelV5_() {
  return GmailApp.getUserLabelByName(TA_HYBRID_V5.reviewLabel) || GmailApp.createLabel(TA_HYBRID_V5.reviewLabel);
}

function escapeV5_(value) {
  return String(value == null ? '' : value).replace(/[&<>\"]/g, function(character) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[character];
  });
}
