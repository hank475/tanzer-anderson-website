const TA_MAX_SAFE_V9 = Object.freeze({
  version: 'TA_MAX_SAFE_V9',
  senderName: 'Henry Anderson',
  senderAddress: 'director@tanzeranderson.com',
  replyTo: 'director@tanzeranderson.com',
  title: 'Managing Director - Strategy and Business Development',
  reviewLabel: 'TA / Max Safe V9 Review',
  testRecipients: Object.freeze(['hankfrisco972@gmail.com', 'henryand83@live.com']),
  maximumHtmlBytes: 50000
});

function createMaxSafeV9Draft(payload) {
  const alias = requireDirectorAliasV9_();
  const p = normalizeV9_(payload || {});
  const html = buildMaxSafeHtmlV9_(p);
  validateMaxSafeV9_(html);
  const draft = GmailApp.createDraft(p.to, p.subject, buildPlainV9_(p), {
    from: alias,
    replyTo: TA_MAX_SAFE_V9.replyTo,
    name: TA_MAX_SAFE_V9.senderName,
    htmlBody: html
  });
  draft.getMessage().getThread().addLabel(getOrCreateV9Label_());
  return {
    status: 'DRAFT_CREATED',
    version: TA_MAX_SAFE_V9.version,
    draftId: draft.getId(),
    messageId: draft.getMessage().getId(),
    htmlBytes: Utilities.newBlob(html).getBytes().length
  };
}

function createMaxSafeV9DraftBatch(payloads) {
  if (!Array.isArray(payloads) || !payloads.length) throw new Error('A non-empty payload array is required.');
  return payloads.map(function(payload) {
    return createMaxSafeV9Draft(payload);
  });
}

function sendMaxSafeV9InternalTests() {
  const alias = requireDirectorAliasV9_();
  const sample = normalizeV9_(samplePayloadV9_());
  const results = [];
  TA_MAX_SAFE_V9.testRecipients.forEach(function(recipient) {
    assertInternalV9_(recipient);
    const p = Object.assign({}, sample, {
      to: recipient,
      subject: /@live\.com$/i.test(recipient)
        ? 'TEST — Max Safe V9 — Outlook — no images'
        : 'TEST — Max Safe V9 — Gmail — no images'
    });
    const html = buildMaxSafeHtmlV9_(p);
    validateMaxSafeV9_(html);
    GmailApp.sendEmail(recipient, p.subject, buildPlainV9_(p), {
      from: alias,
      replyTo: TA_MAX_SAFE_V9.replyTo,
      name: TA_MAX_SAFE_V9.senderName,
      htmlBody: html
    });
    results.push({recipient: recipient, status: 'SENT_INTERNAL_TEST'});
  });
  return {version: TA_MAX_SAFE_V9.version, results: results};
}

function buildMaxSafeHtmlV9_(p) {
  const c = colorsV9_();

  const cards = p.cards.map(function(card) {
    return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid ' + c.border + ';background:#FFFDF8;">' +
      '<tr><td style="padding:9px 11px;background:' + c.navy + ';font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:15px;color:#ffffff;font-weight:bold;letter-spacing:.45px;">' + escapeV9_(card.title) + '</td></tr>' +
      '<tr><td valign="top" style="height:112px;padding:11px 12px 12px;font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';font-size:13px;line-height:19px;">' +
        '<div style="font-family:Georgia,Times New Roman,serif;color:' + c.navy + ';font-size:15px;line-height:20px;font-weight:bold;">' + escapeV9_(card.head) + '</div>' +
        '<div style="margin-top:4px;">' + escapeV9_(card.description) + '</div>' +
      '</td></tr>' +
    '</table>';
  });

  const cardsHtml = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">' +
    '<tr><td width="49%" valign="top" style="width:49%;">' + cards[0] + '</td><td width="2%" style="width:2%;font-size:0;line-height:0;">&nbsp;</td><td width="49%" valign="top" style="width:49%;">' + cards[1] + '</td></tr>' +
    '<tr><td colspan="3" style="height:9px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '<tr><td width="49%" valign="top" style="width:49%;">' + cards[2] + '</td><td width="2%" style="width:2%;font-size:0;line-height:0;">&nbsp;</td><td width="49%" valign="top" style="width:49%;">' + cards[3] + '</td></tr>' +
  '</table>';

  const funnelLabels = ['mapped', 'direct', 'aligned', 'priority', 'first contact'];
  let funnelCells = '';
  p.funnel.forEach(function(value, index) {
    const divider = index < 4 ? 'border-right:1px solid ' + c.border + ';' : '';
    funnelCells += '<td width="20%" align="center" valign="middle" style="width:20%;padding:10px 3px;' + divider + 'font-family:Arial,Helvetica,sans-serif;color:' + c.navy + ';">' +
      '<div style="font-family:Georgia,Times New Roman,serif;font-size:23px;line-height:25px;font-weight:bold;">' + escapeV9_(value) + '</div>' +
      '<div style="margin-top:2px;font-size:10px;line-height:14px;">' + funnelLabels[index] + '</div>' +
    '</td>';
  });

  const band = [
    ['DIRECT MARKET', 'Exact-practice talent', c.blue, c.navy],
    ['ADJACENT MARKET', 'Transferable environments', c.cream2, c.navy],
    ['EVIDENCE', 'Strengths · gaps · sources', c.navy, '#ffffff'],
    ['FIRST CONTACT', 'A ranked priority slate', c.blue2, c.navy]
  ];
  let bandCells = '';
  band.forEach(function(item, index) {
    const divider = index < 3 ? 'border-right:1px solid ' + c.gold + ';' : '';
    bandCells += '<td width="25%" align="center" valign="middle" style="width:25%;padding:13px 7px;background:' + item[2] + ';' + divider + 'font-family:Arial,Helvetica,sans-serif;color:' + item[3] + ';">' +
      '<div style="font-size:10px;line-height:14px;letter-spacing:1.2px;font-weight:bold;">' + item[0] + '</div>' +
      '<div style="margin-top:3px;font-size:10px;line-height:14px;">' + item[1] + '</div>' +
    '</td>';
  });

  const differentiation = p.differentiation.map(function(item) {
    return '✓ ' + escapeV9_(item);
  }).join('<br>');

  return '<!doctype html><html><body style="margin:0;padding:0;background:' + c.outer + ';">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.outer + ';mso-table-lspace:0pt;mso-table-rspace:0pt;">' +
      '<tr><td align="center" style="padding:16px 5px;">' +
        '<table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:100%;border-collapse:collapse;border:1px solid ' + c.border + ';background:' + c.cream + ';mso-table-lspace:0pt;mso-table-rspace:0pt;">' +

          '<tr><td style="padding:0;background:' + c.navy + ';">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;"><tr>' +
              '<td width="78" align="center" valign="middle" style="width:78px;padding:20px 8px;">' +
                '<table role="presentation" width="52" cellspacing="0" cellpadding="0" border="0" style="width:52px;border-collapse:collapse;border:1px solid ' + c.gold + ';"><tr><td align="center" style="padding:13px 3px;font-family:Georgia,Times New Roman,serif;font-size:20px;line-height:23px;color:' + c.gold + ';">TA</td></tr></table>' +
              '</td>' +
              '<td valign="middle" style="padding:20px 8px 19px;color:#ffffff;">' +
                '<div style="font-family:Georgia,Times New Roman,serif;font-size:26px;line-height:30px;letter-spacing:5px;">TANZER ANDERSON</div>' +
                '<div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:14px;letter-spacing:2.7px;color:' + c.gold + ';font-weight:bold;">INSIGHT. STRATEGY. IMPACT.</div>' +
              '</td>' +
              '<td width="64" align="center" valign="middle" style="width:64px;padding:18px 10px;color:' + c.navy2 + ';font-family:Georgia,Times New Roman,serif;font-size:42px;line-height:46px;">TA</td>' +
            '</tr></table>' +
          '</td></tr>' +

          '<tr><td style="padding:0;border-top:1px solid ' + c.gold + ';border-bottom:1px solid ' + c.gold + ';">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;"><tr>' + bandCells + '</tr></table>' +
          '</td></tr>' +

          '<tr><td style="padding:28px 30px 10px;background:' + c.cream + ';font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' +
            '<div style="font-family:Georgia,Times New Roman,serif;font-size:18px;line-height:26px;color:' + c.navy + ';">' + escapeV9_(p.greeting) + '</div>' +
            '<div style="margin-top:16px;font-family:Georgia,Times New Roman,serif;font-size:17px;line-height:27px;color:' + c.navy + ';">' + escapeV9_(p.opening) + '</div>' +
            '<div style="width:55px;border-top:2px solid ' + c.gold + ';margin:19px 0 14px;"></div>' +
            '<div style="font-family:Georgia,Times New Roman,serif;font-size:25px;line-height:30px;text-align:center;color:' + c.gold + ';">PROOF OF CONCEPT</div>' +
            '<div style="margin-top:3px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;text-align:center;color:' + c.navy + ';font-weight:bold;">' + escapeV9_(p.role) + ' — ' + escapeV9_(p.subtitle) + '</div>' +
          '</td></tr>' +

          '<tr><td style="padding:8px 24px 0;background:' + c.cream + ';">' + cardsHtml + '</td></tr>' +

          '<tr><td style="padding:12px 30px 0;background:' + c.cream + ';">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.cream2 + ';border:1px solid ' + c.border + ';"><tr>' + funnelCells + '</tr></table>' +
          '</td></tr>' +

          '<tr><td style="padding:18px 30px 10px;background:' + c.cream + ';font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;"><tr>' +
              '<td width="48%" valign="top" style="width:48%;padding-right:14px;border-right:1px solid ' + c.border + ';">' +
                '<div style="font-size:10px;line-height:15px;letter-spacing:1.5px;color:' + c.gold + ';font-weight:bold;">OUR DIFFERENTIATION</div>' +
                '<div style="margin-top:7px;font-size:12px;line-height:19px;color:' + c.ink + ';">' + differentiation + '</div>' +
              '</td>' +
              '<td width="52%" valign="top" style="width:52%;padding-left:14px;">' +
                '<div style="font-size:10px;line-height:15px;letter-spacing:1.5px;color:' + c.gold + ';font-weight:bold;">THE ROLE YOU POSTED</div>' +
                '<div style="margin-top:6px;font-family:Georgia,Times New Roman,serif;font-size:15px;line-height:21px;color:' + c.navy + ';font-weight:bold;">' + escapeV9_(p.role) + '</div>' +
                '<div style="margin-top:3px;font-size:12px;line-height:19px;">' + escapeV9_(p.roleCopy) + '</div>' +
              '</td>' +
            '</tr></table>' +
          '</td></tr>' +

          '<tr><td style="padding:7px 30px 0;background:' + c.cream + ';">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.navy + ';"><tr><td style="padding:16px 18px;font-family:Georgia,Times New Roman,serif;font-size:14px;line-height:22px;color:' + c.cream + ';">' + escapeV9_(p.boundary) + '</td></tr></table>' +
          '</td></tr>' +

          '<tr><td style="padding:20px 30px 26px;background:' + c.cream + ';font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' +
            '<div style="font-family:Georgia,Times New Roman,serif;font-size:15px;line-height:22px;color:#555A5E;">Warmly,</div>' +
            '<div style="margin-top:1px;font-family:Snell Roundhand,Segoe Script,Brush Script MT,Lucida Handwriting,cursive;font-size:31px;line-height:40px;font-style:italic;font-weight:400;color:' + c.blueInk + ';">Henry Anderson</div>' +
            '<div style="margin-top:4px;font-size:11px;line-height:17px;letter-spacing:.9px;color:' + c.navy + ';font-weight:bold;">MANAGING DIRECTOR - STRATEGY AND BUSINESS DEVELOPMENT</div>' +
            '<div style="margin-top:3px;font-size:13px;line-height:20px;color:#62615D;">Tanzer Anderson</div>' +
            '<div style="font-size:13px;line-height:20px;"><a href="mailto:' + TA_MAX_SAFE_V9.senderAddress + '" style="color:' + c.blueInk + ';text-decoration:none;">' + TA_MAX_SAFE_V9.senderAddress + '</a></div>' +
          '</td></tr>' +

          '<tr><td style="padding:18px 22px 14px;background:' + c.navy + ';">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.gold + ';"><tr><td align="center" style="padding:14px 10px;font-family:Georgia,Times New Roman,serif;font-size:18px;line-height:24px;color:' + c.navy + ';">' + escapeV9_(p.cta) + ' &nbsp; →</td></tr></table>' +
            '<div style="padding-top:12px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:14px;letter-spacing:3px;color:' + c.gold + ';font-weight:bold;">INSIGHT. STRATEGY. IMPACT.</div>' +
          '</td></tr>' +

        '</table>' +
      '</td></tr>' +
    '</table>' +
  '</body></html>';
}

function buildPlainV9_(p) {
  const cardText = p.cards.map(function(card) {
    return card.title + '\n' + card.head + '\n' + card.description;
  }).join('\n\n');
  return [
    p.greeting, '',
    p.opening, '',
    'PROOF OF CONCEPT',
    p.role + ' — ' + p.subtitle, '',
    cardText, '',
    p.funnel.join(' | '), '',
    'THE ROLE YOU POSTED',
    p.role,
    p.roleCopy, '',
    p.boundary, '',
    'Warmly,',
    'Henry Anderson',
    TA_MAX_SAFE_V9.title,
    'Tanzer Anderson',
    TA_MAX_SAFE_V9.senderAddress
  ].join('\n');
}

function normalizeV9_(payload) {
  if (!payload.to) throw new Error('Recipient email is required.');
  if (!payload.subject) throw new Error('Subject is required.');
  const cards = Array.isArray(payload.cards) ? payload.cards : [];
  if (cards.length !== 4) throw new Error('Exactly four proof-map cards are required.');
  const funnel = Array.isArray(payload.funnel) ? payload.funnel : [];
  if (funnel.length !== 5) throw new Error('Exactly five funnel values are required.');
  const firstName = String(payload.firstName || '').trim();
  return {
    to: String(payload.to).trim(),
    subject: String(payload.subject).trim(),
    firstName: firstName,
    greeting: firstName ? 'Dear ' + firstName + ',' : 'Dear Hiring Team,',
    company: String(payload.company || '').trim(),
    role: String(payload.role || '').trim(),
    subtitle: String(payload.subtitle || 'Talent Market Map').trim(),
    opening: String(payload.opening || '').trim(),
    roleCopy: String(payload.roleCopy || '').trim(),
    cards: cards.map(function(card) {
      return {
        title: String(card.title || '').trim(),
        head: String(card.head || '').trim(),
        description: String(card.description || '').trim()
      };
    }),
    funnel: funnel.map(function(value) { return String(value); }),
    differentiation: Array.isArray(payload.differentiation) && payload.differentiation.length
      ? payload.differentiation.map(String)
      : [
          'Direct + adjacent market architecture',
          'Evidence-backed strengths and gaps',
          'Operating-scale and environment fit',
          'Low-noise approach strategy'
        ],
    boundary: String(payload.boundary || 'No résumé dump and no candidate submission outside your approved process. If the work is useful, we can discuss whether Tanzer Anderson belongs in the appropriate search-firm rotation.').trim(),
    cta: String(payload.cta || 'REPLY WITH ONE ROLE').trim()
  };
}

function validateMaxSafeV9_(html) {
  const lowered = String(html).toLowerCase();
  const forbidden = [
    '<img', 'background-image', 'url(', 'cid:', 'data:image', '<style',
    '@media', '<script', 'display:flex', 'display:grid', 'position:absolute',
    'position:fixed', 'transform:'
  ];
  forbidden.forEach(function(token) {
    if (lowered.indexOf(token) !== -1) throw new Error('Max Safe V9 forbidden token: ' + token);
  });
  if (/\bring\b/i.test(String(html))) throw new Error('Max Safe V9 cannot use the word "ring".');
  const bytes = Utilities.newBlob(html).getBytes().length;
  if (bytes > TA_MAX_SAFE_V9.maximumHtmlBytes) {
    throw new Error('Max Safe V9 body exceeds ' + TA_MAX_SAFE_V9.maximumHtmlBytes + ' bytes: ' + bytes);
  }
}

function colorsV9_() {
  return {
    navy: '#071B33',
    navy2: '#0D2A47',
    blueInk: '#0B2A4A',
    gold: '#B28A4A',
    cream: '#F7F3EA',
    cream2: '#EFE7DA',
    outer: '#E9E2D7',
    ink: '#263340',
    blue: '#D9E5EF',
    blue2: '#C8D8E5',
    border: '#D2C6B4'
  };
}

function samplePayloadV9_() {
  return {
    to: 'hankfrisco972@gmail.com',
    subject: 'TEST — Max Safe V9',
    firstName: 'Henry',
    company: 'Palo Alto Networks',
    role: 'Principal Enterprise Security Engineer',
    subtitle: 'Talent Market Map',
    opening: 'Rather than send a general agency pitch I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.',
    roleCopy: 'Identity, application and endpoint security architecture; production-scale automation; enterprise control ownership and evidence of operating across complex environments.',
    cards: [
      {title: 'DIRECT SECURITY PLATFORMS', head: 'CrowdStrike · Zscaler · Fortinet', description: 'Enterprise security architecture, platform depth and category-level operating context.'},
      {title: 'IDENTITY & ENDPOINT', head: 'Okta · CyberArk · Microsoft', description: 'Identity engineering, endpoint security and application-control ownership.'},
      {title: 'CLOUD SECURITY', head: 'AWS · Google Cloud · Azure · Wiz', description: 'Cloud-native controls, hyperscale systems and automation-first security.'},
      {title: 'ADJACENT SYSTEMS TALENT', head: 'AppSec · platform security · SRE', description: 'Transferable systems depth from high-scale infrastructure and secure software delivery.'}
    ],
    funnel: ['148', '48', '19', '9–12', '5'],
    cta: 'REPLY WITH ONE ROLE'
  };
}

function requireDirectorAliasV9_() {
  const aliases = GmailApp.getAliases();
  const alias = aliases.find(function(value) {
    return String(value).toLowerCase() === TA_MAX_SAFE_V9.senderAddress.toLowerCase();
  });
  if (!alias) throw new Error(TA_MAX_SAFE_V9.senderAddress + ' must be configured as a Gmail Send mail as identity.');
  return alias;
}

function assertInternalV9_(recipient) {
  if (TA_MAX_SAFE_V9.testRecipients.indexOf(String(recipient).toLowerCase()) === -1) {
    throw new Error('Max Safe V9 internal sender is restricted to Henry test inboxes.');
  }
}

function getOrCreateV9Label_() {
  return GmailApp.getUserLabelByName(TA_MAX_SAFE_V9.reviewLabel) || GmailApp.createLabel(TA_MAX_SAFE_V9.reviewLabel);
}

function escapeV9_(value) {
  return String(value == null ? '' : value).replace(/[&<>"]/g, function(character) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character];
  });
}
