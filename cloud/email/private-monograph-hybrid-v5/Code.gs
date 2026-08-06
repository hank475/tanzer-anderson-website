const TA_HYBRID_V5 = Object.freeze({
  version: 'TA_PRIVATE_MONOGRAPH_HYBRID_V5_2',
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
      isOutlook ? 'HYBRID V5.2 — Outlook proof-map test' : 'HYBRID V5.2 — Gmail proof-map test',
      buildPlainV5_('Henry'),
      {
        from: alias,
        replyTo: TA_HYBRID_V5.replyTo,
        name: TA_HYBRID_V5.senderName,
        htmlBody: buildHybridHtmlV5_({
          firstName: 'Henry',
          intro: 'Rather than send a general agency pitch I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.',
          proofTitle: 'PROOF OF CONCEPT',
          roleTitle: 'Managed Care Disputes Lawyer',
          roleObservation: 'Your posting points to a search where provider-side managed-care disputes, reimbursement recovery, contract interpretation, arbitration and litigation depth matter more than broad healthcare-law exposure.',
          boundary: 'No résumé dump and no candidate submission outside your approved process.',
          close: 'If the work is useful, we can discuss whether Tanzer Anderson belongs in your approved search-firm rotation.'
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
  const intro = escapeV5_(p.intro || 'Rather than send a general agency pitch I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.');
  const roleTitle = escapeV5_(p.roleTitle || 'Your current opening');
  const roleObservation = escapeV5_(p.roleObservation || 'We would translate the posting into a role-specific market map before outreach begins.');

  return '<!doctype html><html><body style="margin:0;padding:0;background:#E9E2D7;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">A focused proof of concept from Tanzer Anderson</div>' +
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
          '<tr><td style="padding:32px 38px 18px;font-family:Arial,Helvetica,sans-serif;color:' + ink + ';">' +
            '<div style="font:18px/28px Georgia,Times New Roman,serif;color:' + navy + ';font-weight:bold;">' + escapeV5_(greeting) + '</div>' +
            '<div style="margin-top:17px;font:22px/32px Georgia,Times New Roman,serif;color:' + navy + ';font-weight:bold;">' + intro + '</div>' +
          '</td></tr>' +
          '<tr><td style="padding:8px 38px 8px;">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EEE6D8;border:1px solid #D5C8B5;">' +
              '<tr><td align="center" style="padding:14px 12px;background:' + navy + ';font:11px Arial,Helvetica,sans-serif;letter-spacing:2.2px;font-weight:bold;color:#F7F3EA;">' + escapeV5_(p.proofTitle || 'PROOF OF CONCEPT') + '</td></tr>' +
              '<tr><td style="padding:20px 16px 18px;">' + buildProofGraphV5_(navy, gold) + '</td></tr>' +
            '</table>' +
          '</td></tr>' +
          '<tr><td style="padding:18px 38px 8px;font-family:Arial,Helvetica,sans-serif;color:' + ink + ';">' +
            '<div style="font-size:10px;line-height:16px;letter-spacing:2px;color:' + gold + ';font-weight:bold;">THE ROLE YOU POSTED</div>' +
            '<div style="margin-top:8px;font:24px/31px Georgia,Times New Roman,serif;color:' + navy + ';font-weight:bold;">' + roleTitle + '</div>' +
            '<div style="margin-top:10px;font-size:15px;line-height:24px;">' + roleObservation + '</div>' +
          '</td></tr>' +
          '<tr><td style="padding:14px 38px 34px;font-family:Arial,Helvetica,sans-serif;color:' + ink + ';font-size:15px;line-height:24px;">' +
            '<div style="padding:15px 17px;background:#F0E8DC;border-left:3px solid ' + gold + ';">' + escapeV5_(p.boundary || 'No résumé dump and no candidate submission outside your approved process.') + '</div>' +
            '<div style="margin-top:16px;">' + escapeV5_(p.close || 'If the work is useful, we can discuss whether Tanzer Anderson belongs in your approved search-firm rotation.') + '</div>' +
            '<div style="margin-top:30px;border-top:1px solid #D6CBB9;padding-top:20px;">' +
              '<div style="font:15px/22px Georgia,Times New Roman,serif;color:#4E5357;">Warmly,</div>' +
              '<div style="margin-top:1px;font-family:Segoe Script,Snell Roundhand,URW Z003,Brush Script MT,cursive;font-size:35px;line-height:46px;font-weight:400;font-style:italic;color:' + blueInk + ';">Henry Anderson</div>' +
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

function buildProofGraphV5_(navy, gold) {
  const steps = [
    ['01', 'MARKET', 'Direct competitors + adjacent talent pools'],
    ['02', 'SCREEN', 'Role-specific evidence criteria'],
    ['03', 'RANK', 'Strengths, gaps + source-backed fit'],
    ['04', 'APPROACH', '5 first-contact candidates']
  ];
  let cells = '';
  steps.forEach(function(step, index) {
    cells += '<td width="25%" valign="top" align="center" style="padding:0 5px;">' +
      '<div style="width:38px;height:38px;line-height:38px;border-radius:19px;background:' + navy + ';color:#F7F3EA;font:bold 12px Arial,Helvetica,sans-serif;margin:0 auto;">' + step[0] + '</div>' +
      '<div style="margin-top:9px;font:bold 10px Arial,Helvetica,sans-serif;letter-spacing:1.3px;color:' + gold + ';">' + step[1] + '</div>' +
      '<div style="margin-top:5px;font:12px/17px Arial,Helvetica,sans-serif;color:#263340;">' + step[2] + '</div>' +
      '</td>' + (index < steps.length - 1 ? '<td width="3%" align="center" style="font:18px Georgia,serif;color:' + gold + ';">→</td>' : '');
  });
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>' + cells + '</tr></table>' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;border-top:1px solid #D5C8B5;"><tr>' +
      '<td align="center" style="padding-top:14px;font:11px/17px Arial,Helvetica,sans-serif;color:#5B6269;"><b style="color:' + navy + ';">112</b> potential profiles &nbsp;→&nbsp; <b style="color:' + navy + ';">35</b> direct-practice matches &nbsp;→&nbsp; <b style="color:' + navy + ';">8–12</b> priority prospects &nbsp;→&nbsp; <b style="color:' + navy + ';">5</b> first-contact candidates</td>' +
    '</tr></table>';
}

function buildPlainV5_(firstName, p) {
  p = p || {};
  return [
    'Hello ' + (firstName || '') + ',', '',
    p.intro || 'Rather than send a general agency pitch I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.', '',
    'PROOF OF CONCEPT',
    'MARKET → SCREEN → RANK → APPROACH',
    '112 potential profiles → 35 direct-practice matches → 8–12 priority prospects → 5 first-contact candidates', '',
    'THE ROLE YOU POSTED',
    p.roleTitle || 'Your current opening',
    p.roleObservation || 'We would translate the posting into a role-specific market map before outreach begins.', '',
    p.boundary || 'No résumé dump and no candidate submission outside your approved process.', '',
    p.close || 'If the work is useful, we can discuss whether Tanzer Anderson belongs in your approved search-firm rotation.', '',
    'Warmly,', 'Henry Anderson', TA_HYBRID_V5.title, 'Tanzer Anderson', TA_HYBRID_V5.senderAddress
  ].join('\n');
}

function normalizePayloadV5_(p) {
  if (!p.to) throw new Error('Recipient email is required.');
  if (!p.subject) throw new Error('Subject is required.');
  return {
    to: String(p.to).trim(),
    subject: String(p.subject).trim(),
    firstName: String(p.firstName || '').trim(),
    intro: String(p.intro || 'Rather than send a general agency pitch I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.'),
    proofTitle: String(p.proofTitle || 'PROOF OF CONCEPT'),
    roleTitle: String(p.roleTitle || 'Your current opening'),
    roleObservation: String(p.roleObservation || 'We would translate the posting into a role-specific market map before outreach begins.'),
    boundary: String(p.boundary || ''),
    close: String(p.close || '')
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
