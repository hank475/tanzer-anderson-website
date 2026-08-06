const TA_PURE_HTML_V8 = Object.freeze({
  version: 'TA_PURE_HTML_V8',
  senderName: 'Henry Anderson',
  senderAddress: 'director@tanzeranderson.com',
  replyTo: 'director@tanzeranderson.com',
  title: 'Managing Director - Strategy and Business Development',
  reviewLabel: 'TA / Pure HTML V8 Review',
  testRecipients: Object.freeze(['hankfrisco972@gmail.com', 'henryand83@live.com']),
  maximumHtmlBytes: 50000
});

function createPureHtmlV8Draft(payload) {
  const alias = requireDirectorAliasV8_();
  const p = normalizeV8_(payload || {});
  const html = p.mode === 'maximum_safe_html' ? buildMaximumSafeHtmlV8_(p) : buildBaselineSafeHtmlV8_(p);
  validatePureHtmlV8_(html);
  const draft = GmailApp.createDraft(p.to, p.subject, buildPlainV8_(p), {
    from: alias,
    replyTo: TA_PURE_HTML_V8.replyTo,
    name: TA_PURE_HTML_V8.senderName,
    htmlBody: html
  });
  draft.getMessage().getThread().addLabel(getOrCreateV8Label_());
  return {
    status: 'DRAFT_CREATED',
    version: TA_PURE_HTML_V8.version,
    mode: p.mode,
    draftId: draft.getId(),
    messageId: draft.getMessage().getId(),
    htmlBytes: Utilities.newBlob(html).getBytes().length
  };
}

function sendPureHtmlV8InternalTests() {
  const alias = requireDirectorAliasV8_();
  const sample = samplePayloadV8_();
  const results = [];
  TA_PURE_HTML_V8.testRecipients.forEach(function(recipient) {
    ['baseline_safe', 'maximum_safe_html'].forEach(function(mode) {
      assertInternalV8_(recipient);
      const p = normalizeV8_(Object.assign({}, sample, {
        to: recipient,
        firstName: 'Henry',
        mode: mode,
        subject: mode === 'baseline_safe'
          ? 'TEST A — Pure HTML Baseline — no images'
          : 'TEST B — Maximum Safe HTML — no images'
      }));
      const html = mode === 'baseline_safe' ? buildBaselineSafeHtmlV8_(p) : buildMaximumSafeHtmlV8_(p);
      validatePureHtmlV8_(html);
      GmailApp.sendEmail(recipient, p.subject, buildPlainV8_(p), {
        from: alias,
        replyTo: TA_PURE_HTML_V8.replyTo,
        name: TA_PURE_HTML_V8.senderName,
        htmlBody: html
      });
      results.push({recipient: recipient, mode: mode, status: 'SENT_INTERNAL_TEST'});
    });
  });
  return {version: TA_PURE_HTML_V8.version, results: results};
}

function buildBaselineSafeHtmlV8_(p) {
  const c = colorsV8_();
  let ringRows = '';
  p.rings.forEach(function(ring, index) {
    ringRows += '<tr>' +
      '<td width="54" valign="top" style="width:54px;padding:14px 12px;background:' + c.navy + ';color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:bold;text-align:center;border-bottom:1px solid ' + c.cream + ';">' + padV8_(index + 1) + '</td>' +
      '<td valign="top" style="padding:12px 16px;background:#FFFDF8;border-bottom:1px solid ' + c.border + ';font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' +
        '<div style="font-size:11px;line-height:16px;letter-spacing:1.5px;color:' + c.gold + ';font-weight:bold;">' + escapeV8_(ring.title) + '</div>' +
        '<div style="margin-top:3px;font-family:Georgia,Times New Roman,serif;font-size:17px;line-height:23px;color:' + c.navy + ';font-weight:bold;">' + escapeV8_(ring.head) + '</div>' +
        '<div style="margin-top:3px;font-size:14px;line-height:21px;">' + escapeV8_(ring.description) + '</div>' +
      '</td>' +
    '</tr>';
  });

  const funnel = buildFunnelV8_(p, 24, 11);
  return '<!doctype html><html><body style="margin:0;padding:0;background:' + c.outer + ';">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.outer + ';mso-table-lspace:0pt;mso-table-rspace:0pt;">' +
      '<tr><td align="center" style="padding:18px 6px;">' +
        '<table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="width:620px;max-width:100%;border-collapse:collapse;background:' + c.cream + ';border:1px solid ' + c.border + ';mso-table-lspace:0pt;mso-table-rspace:0pt;">' +
          '<tr><td style="height:8px;background:' + c.navy + ';font-size:0;line-height:0;">&nbsp;</td></tr>' +
          '<tr><td style="padding:24px 28px 20px;background:' + c.navy + ';color:#ffffff;">' +
            '<div style="font-family:Georgia,Times New Roman,serif;font-size:25px;line-height:30px;letter-spacing:4px;">TANZER ANDERSON</div>' +
            '<div style="margin-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;letter-spacing:3px;color:' + c.gold + ';font-weight:bold;">INSIGHT. STRATEGY. IMPACT.</div>' +
          '</td></tr>' +
          '<tr><td style="padding:30px 32px 14px;background:' + c.cream + ';font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' +
            '<div style="font-family:Georgia,Times New Roman,serif;font-size:18px;line-height:26px;color:' + c.navy + ';">Dear ' + escapeV8_(p.firstName) + ',</div>' +
            '<div style="margin-top:18px;font-family:Georgia,Times New Roman,serif;font-size:17px;line-height:27px;color:' + c.navy + ';">' + escapeV8_(p.opening) + '</div>' +
            '<div style="width:56px;border-top:2px solid ' + c.gold + ';margin:20px 0 16px;"></div>' +
            '<div style="font-family:Georgia,Times New Roman,serif;font-size:25px;line-height:31px;text-align:center;color:' + c.gold + ';">PROOF OF CONCEPT</div>' +
            '<div style="margin-top:3px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;text-align:center;color:' + c.navy + ';font-weight:bold;">' + escapeV8_(p.role) + ' — ' + escapeV8_(p.subtitle) + '</div>' +
          '</td></tr>' +
          '<tr><td style="padding:8px 32px 10px;background:' + c.cream + ';">' +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid ' + c.border + ';">' + ringRows + '</table>' +
          '</td></tr>' +
          '<tr><td style="padding:10px 32px 8px;background:' + c.cream + ';">' + funnel + '</td></tr>' +
          '<tr><td style="padding:18px 32px 12px;background:' + c.cream + ';font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' +
            '<div style="font-size:11px;line-height:16px;letter-spacing:1.7px;color:' + c.gold + ';font-weight:bold;">THE ROLE YOU POSTED</div>' +
            '<div style="margin-top:7px;font-family:Georgia,Times New Roman,serif;font-size:17px;line-height:24px;color:' + c.navy + ';font-weight:bold;">' + escapeV8_(p.role) + '</div>' +
            '<div style="margin-top:3px;font-size:14px;line-height:22px;">' + escapeV8_(p.roleCopy) + '</div>' +
          '</td></tr>' +
          '<tr><td style="padding:8px 32px 0;background:' + c.cream + ';">' + buildBoundaryV8_(c, 15) + '</td></tr>' +
          '<tr><td style="padding:24px 32px 30px;background:' + c.cream + ';font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' + buildSignatureV8_(c, 31) + '</td></tr>' +
          '<tr><td align="center" style="padding:16px 18px;background:' + c.navy + ';font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;letter-spacing:3px;color:' + c.gold + ';font-weight:bold;">INSIGHT. STRATEGY. IMPACT.</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
  '</body></html>';
}

function buildMaximumSafeHtmlV8_(p) {
  const c = colorsV8_();
  const cards = p.rings.map(function(ring, index) {
    return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid ' + c.border + ';background:#FFFDF8;">' +
      '<tr><td style="padding:9px 10px;background:' + c.navy + ';font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:15px;color:#ffffff;font-weight:bold;letter-spacing:.4px;">RING ' + padV8_(index + 1) + ' — ' + escapeV8_(ring.title) + '</td></tr>' +
      '<tr><td style="padding:11px 11px 12px;font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';font-size:13px;line-height:19px;"><b style="font-family:Georgia,Times New Roman,serif;color:' + c.navy + ';font-size:15px;">' + escapeV8_(ring.head) + '</b><br>' + escapeV8_(ring.description) + '</td></tr>' +
    '</table>';
  });
  const funnel = buildFunnelV8_(p, 23, 10);

  return '<!doctype html><html><body style="margin:0;padding:0;background:' + c.outer + ';">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.outer + ';mso-table-lspace:0pt;mso-table-rspace:0pt;">' +
      '<tr><td align="center" style="padding:16px 4px;">' +
        '<table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width:680px;max-width:100%;border-collapse:collapse;border:1px solid ' + c.border + ';background:' + c.cream + ';mso-table-lspace:0pt;mso-table-rspace:0pt;">' +
          '<tr><td colspan="2" style="padding:0;background:' + c.navy + ';">' + buildMaximumHeaderV8_(c) + '</td></tr>' +
          '<tr>' +
            '<td width="500" valign="top" style="width:500px;padding:0;background:' + c.cream + ';">' +
              '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">' +
                '<tr><td style="padding:28px 30px 10px;font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' +
                  '<div style="font-family:Georgia,Times New Roman,serif;font-size:18px;line-height:25px;color:' + c.navy + ';">Dear ' + escapeV8_(p.firstName) + ',</div>' +
                  '<div style="margin-top:16px;font-family:Georgia,Times New Roman,serif;font-size:17px;line-height:27px;color:' + c.navy + ';">' + escapeV8_(p.opening) + '</div>' +
                  '<div style="width:55px;border-top:2px solid ' + c.gold + ';margin:19px 0 14px;"></div>' +
                  '<div style="font-family:Georgia,Times New Roman,serif;font-size:25px;line-height:30px;text-align:center;color:' + c.gold + ';">PROOF OF CONCEPT</div>' +
                  '<div style="margin-top:3px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:19px;text-align:center;color:' + c.navy + ';font-weight:bold;">' + escapeV8_(p.role) + ' — ' + escapeV8_(p.subtitle) + '</div>' +
                '</td></tr>' +
                '<tr><td style="padding:8px 22px 0;">' +
                  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:8px;">' +
                    '<tr><td width="50%" valign="top" style="width:50%;">' + cards[0] + '</td><td width="50%" valign="top" style="width:50%;">' + cards[1] + '</td></tr>' +
                    '<tr><td width="50%" valign="top" style="width:50%;">' + cards[2] + '</td><td width="50%" valign="top" style="width:50%;">' + cards[3] + '</td></tr>' +
                  '</table>' +
                '</td></tr>' +
                '<tr><td style="padding:10px 30px 0;">' + funnel + '</td></tr>' +
                '<tr><td style="padding:18px 30px 10px;font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' + buildMaximumLowerV8_(p, c) + '</td></tr>' +
                '<tr><td style="padding:6px 30px 0;">' + buildBoundaryV8_(c, 14) + '</td></tr>' +
                '<tr><td style="padding:20px 30px 28px;font-family:Arial,Helvetica,sans-serif;color:' + c.ink + ';">' + buildSignatureV8_(c, 31) + '</td></tr>' +
              '</table>' +
            '</td>' +
            '<td width="180" valign="top" style="width:180px;padding:0;background:' + c.blue + ';border-left:1px solid ' + c.border + ';">' + buildArchitecturalPanelV8_(c) + '</td>' +
          '</tr>' +
          '<tr><td colspan="2" style="padding:0;background:' + c.navy + ';">' + buildMaximumFooterV8_(c) + '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
  '</body></html>';
}

function buildMaximumHeaderV8_(c) {
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">' +
    '<tr>' +
      '<td width="90" align="center" valign="middle" style="width:90px;padding:22px 10px 20px;"><table role="presentation" width="60" cellspacing="0" cellpadding="0" border="0" style="width:60px;border-collapse:collapse;border:1px solid ' + c.gold + ';"><tr><td align="center" style="padding:15px 4px;font-family:Georgia,Times New Roman,serif;font-size:22px;line-height:25px;color:' + c.gold + ';">TA</td></tr></table></td>' +
      '<td valign="middle" style="padding:22px 10px 20px;color:#ffffff;"><div style="font-family:Georgia,Times New Roman,serif;font-size:27px;line-height:31px;letter-spacing:6px;">TANZER ANDERSON</div><div style="margin-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;letter-spacing:3px;color:' + c.gold + ';font-weight:bold;">INSIGHT. STRATEGY. IMPACT.</div></td>' +
      '<td width="78" align="center" valign="middle" style="width:78px;padding:18px 12px;color:#0E2945;font-family:Georgia,Times New Roman,serif;font-size:51px;line-height:55px;">TA</td>' +
    '</tr>' +
  '</table>';
}

function buildMaximumLowerV8_(p, c) {
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">' +
    '<tr>' +
      '<td width="48%" valign="top" style="width:48%;padding-right:13px;border-right:1px solid ' + c.border + ';"><div style="font-size:10px;line-height:15px;letter-spacing:1.5px;color:' + c.gold + ';font-weight:bold;">OUR DIFFERENTIATION</div><div style="margin-top:7px;font-size:12px;line-height:19px;color:' + c.ink + ';">✓ Direct + adjacent market architecture<br>✓ Evidence-backed strengths and gaps<br>✓ Operating-scale and environment fit<br>✓ Low-noise approach strategy</div></td>' +
      '<td width="52%" valign="top" style="width:52%;padding-left:14px;"><div style="font-size:10px;line-height:15px;letter-spacing:1.5px;color:' + c.gold + ';font-weight:bold;">THE ROLE YOU POSTED</div><div style="margin-top:6px;font-family:Georgia,Times New Roman,serif;font-size:15px;line-height:21px;color:' + c.navy + ';font-weight:bold;">' + escapeV8_(p.role) + '</div><div style="margin-top:3px;font-size:12px;line-height:19px;">' + escapeV8_(p.roleCopy) + '</div></td>' +
    '</tr>' +
  '</table>';
}

function buildArchitecturalPanelV8_(c) {
  return '<table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;height:100%;border-collapse:collapse;">' +
    '<tr><td align="center" style="height:122px;background:' + c.blue2 + ';padding:16px 10px;font-family:Georgia,Times New Roman,serif;color:' + c.navy + ';font-size:46px;line-height:50px;">TA</td></tr>' +
    '<tr><td style="height:10px;background:' + c.gold + ';font-size:0;line-height:0;">&nbsp;</td></tr>' +
    '<tr><td align="center" valign="middle" style="padding:27px 16px;background:' + c.navy + ';font-family:Arial,Helvetica,sans-serif;color:#ffffff;">' +
      '<div style="font-size:10px;line-height:15px;letter-spacing:2px;color:' + c.gold + ';font-weight:bold;">MARKET ARCHITECTURE</div>' +
      '<div style="margin-top:16px;font-family:Georgia,Times New Roman,serif;font-size:24px;line-height:30px;">DIRECT</div><div style="margin-top:6px;font-size:12px;line-height:18px;color:#DCE6EE;">Exact-practice talent</div>' +
      '<div style="width:40px;border-top:1px solid ' + c.gold + ';margin:19px auto;"></div>' +
      '<div style="font-family:Georgia,Times New Roman,serif;font-size:24px;line-height:30px;">ADJACENT</div><div style="margin-top:6px;font-size:12px;line-height:18px;color:#DCE6EE;">Transferable markets</div>' +
      '<div style="width:40px;border-top:1px solid ' + c.gold + ';margin:19px auto;"></div>' +
      '<div style="font-family:Georgia,Times New Roman,serif;font-size:24px;line-height:30px;">EVIDENCE</div><div style="margin-top:6px;font-size:12px;line-height:18px;color:#DCE6EE;">Strengths · gaps · sources</div>' +
    '</td></tr>' +
    '<tr><td align="center" valign="middle" style="padding:30px 15px;background:' + c.blue + ';font-family:Georgia,Times New Roman,serif;color:' + c.navy + ';"><div style="font-size:15px;line-height:23px;">A visual proof before any candidate is submitted.</div><div style="width:42px;border-top:2px solid ' + c.gold + ';margin:22px auto;"></div><div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;letter-spacing:2px;color:' + c.navy + ';font-weight:bold;">PRIVATE SEARCH<br>& LEADERSHIP ADVISORY</div></td></tr>' +
  '</table>';
}

function buildMaximumFooterV8_(c) {
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">' +
    '<tr><td width="65%" align="center" style="width:65%;padding:18px 18px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.gold + ';"><tr><td align="center" style="padding:14px 10px;font-family:Georgia,Times New Roman,serif;font-size:18px;line-height:24px;color:' + c.navy + ';">REPLY WITH ONE ROLE &nbsp; →</td></tr></table></td><td width="35%" align="center" style="width:35%;padding:18px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#ffffff;">One role.<br>Research before submission.</td></tr>' +
    '<tr><td colspan="2" align="center" style="padding:3px 10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:14px;letter-spacing:3px;color:' + c.gold + ';font-weight:bold;">INSIGHT. STRATEGY. IMPACT.</td></tr>' +
  '</table>';
}

function buildFunnelV8_(p, numberSize, labelSize) {
  const c = colorsV8_();
  const labels = ['mapped', 'direct', 'aligned', 'priority', 'first contact'];
  let cells = '';
  p.funnel.forEach(function(value, index) {
    cells += '<td align="center" valign="middle" style="padding:10px 4px;font-family:Arial,Helvetica,sans-serif;color:' + c.navy + ';"><div style="font-family:Georgia,Times New Roman,serif;font-size:' + numberSize + 'px;line-height:' + (numberSize + 2) + 'px;font-weight:bold;">' + escapeV8_(value) + '</div><div style="font-size:' + labelSize + 'px;line-height:' + (labelSize + 4) + 'px;">' + labels[index] + '</div></td>';
    if (index < p.funnel.length - 1) {
      cells += '<td align="center" style="font-family:Georgia,serif;color:' + c.gold + ';font-size:20px;">→</td>';
    }
  });
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.cream2 + ';border:1px solid ' + c.border + ';"><tr>' + cells + '</tr></table>';
}

function buildBoundaryV8_(c, size) {
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:' + c.navy + ';"><tr><td style="padding:16px 18px;font-family:Georgia,Times New Roman,serif;font-size:' + size + 'px;line-height:' + (size + 8) + 'px;color:#F7F3EA;">No résumé dump and no candidate submission outside your approved process. If the work is useful, we can discuss whether Tanzer Anderson belongs in the appropriate search-firm rotation.</td></tr></table>';
}

function buildSignatureV8_(c, size) {
  return '<div style="font-family:Georgia,Times New Roman,serif;font-size:15px;line-height:22px;color:#555A5E;">Warmly,</div>' +
    '<div style="margin-top:1px;font-family:Segoe Script,Snell Roundhand,Brush Script MT,cursive;font-size:' + size + 'px;line-height:' + (size + 9) + 'px;font-style:italic;font-weight:400;color:' + c.blueInk + ';">Henry Anderson</div>' +
    '<div style="margin-top:5px;font-size:11px;line-height:17px;letter-spacing:1px;color:' + c.navy + ';font-weight:bold;">MANAGING DIRECTOR - STRATEGY AND BUSINESS DEVELOPMENT</div>' +
    '<div style="margin-top:3px;font-size:13px;line-height:20px;color:#62615D;">Tanzer Anderson</div>' +
    '<div style="font-size:13px;line-height:20px;"><a href="mailto:' + TA_PURE_HTML_V8.senderAddress + '" style="color:' + c.blueInk + ';text-decoration:none;">' + TA_PURE_HTML_V8.senderAddress + '</a></div>';
}

function buildPlainV8_(p) {
  const ringText = p.rings.map(function(ring, index) {
    return padV8_(index + 1) + ' — ' + ring.title + '\n' + ring.head + '\n' + ring.description;
  }).join('\n\n');
  return [
    'Dear ' + p.firstName + ',', '',
    p.opening, '',
    'PROOF OF CONCEPT',
    p.role + ' — ' + p.subtitle, '',
    ringText, '',
    p.funnel.join(' → '), '',
    'THE ROLE YOU POSTED',
    p.role,
    p.roleCopy, '',
    'No résumé dump and no candidate submission outside your approved process. If the work is useful, we can discuss whether Tanzer Anderson belongs in the appropriate search-firm rotation.', '',
    'Warmly,',
    'Henry Anderson',
    TA_PURE_HTML_V8.title,
    'Tanzer Anderson',
    TA_PURE_HTML_V8.senderAddress
  ].join('\n');
}

function normalizeV8_(payload) {
  if (!payload.to) throw new Error('Recipient email is required.');
  if (!payload.subject) throw new Error('Subject is required.');
  const rings = Array.isArray(payload.rings) ? payload.rings : [];
  if (rings.length !== 4) throw new Error('Exactly four proof-map rings are required.');
  const funnel = Array.isArray(payload.funnel) ? payload.funnel : [];
  if (funnel.length !== 5) throw new Error('Exactly five funnel values are required.');
  const mode = payload.mode === 'maximum_safe_html' ? 'maximum_safe_html' : 'baseline_safe';
  return {
    to: String(payload.to).trim(),
    subject: String(payload.subject).trim(),
    firstName: String(payload.firstName || '').trim() || 'there',
    company: String(payload.company || '').trim(),
    role: String(payload.role || '').trim(),
    subtitle: String(payload.subtitle || 'Talent Market Map').trim(),
    opening: String(payload.opening || '').trim(),
    roleCopy: String(payload.roleCopy || '').trim(),
    rings: rings.map(function(ring) {
      return {
        title: String(ring.title || '').trim(),
        head: String(ring.head || '').trim(),
        description: String(ring.description || '').trim()
      };
    }),
    funnel: funnel.map(function(value) { return String(value); }),
    mode: mode
  };
}

function validatePureHtmlV8_(html) {
  const lowered = String(html).toLowerCase();
  const forbidden = [
    '<img', 'background-image', 'url(', 'cid:', 'data:image', '<style',
    '@media', '<script', 'display:flex', 'display:grid', 'position:absolute',
    'position:fixed', 'transform:'
  ];
  forbidden.forEach(function(token) {
    if (lowered.indexOf(token) !== -1) throw new Error('Pure HTML V8 forbidden token: ' + token);
  });
  const bytes = Utilities.newBlob(html).getBytes().length;
  if (bytes > TA_PURE_HTML_V8.maximumHtmlBytes) {
    throw new Error('Pure HTML V8 body exceeds ' + TA_PURE_HTML_V8.maximumHtmlBytes + ' bytes: ' + bytes);
  }
}

function colorsV8_() {
  return {
    navy: '#071B33',
    blueInk: '#0B2A4A',
    gold: '#B28A4A',
    cream: '#F7F3EA',
    cream2: '#EFE7DA',
    outer: '#E9E2D7',
    ink: '#263340',
    blue: '#D9E5EF',
    blue2: '#C7D7E5',
    border: '#D2C6B4'
  };
}

function samplePayloadV8_() {
  return {
    to: 'hankfrisco972@gmail.com',
    subject: 'TEST — Pure HTML V8',
    firstName: 'Henry',
    company: 'Palo Alto Networks',
    role: 'Principal Enterprise Security Engineer',
    subtitle: 'Talent Market Map',
    opening: 'Rather than send a general agency pitch I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.',
    roleCopy: 'Identity, application and endpoint security architecture; production-scale automation; enterprise control ownership and evidence of operating across complex environments.',
    rings: [
      {title: 'DIRECT SECURITY PLATFORMS', head: 'CrowdStrike · Zscaler · Fortinet', description: 'Enterprise security architecture, platform depth and category-level operating context.'},
      {title: 'IDENTITY & ENDPOINT', head: 'Okta · CyberArk · Microsoft', description: 'Identity engineering, endpoint security and application-control ownership.'},
      {title: 'CLOUD SECURITY', head: 'AWS · Google Cloud · Azure · Wiz', description: 'Cloud-native controls, hyperscale systems and automation-first security.'},
      {title: 'ADJACENT CONVERTERS', head: 'AppSec · platform security · SRE', description: 'Transferable systems depth from high-scale infrastructure and secure software delivery.'}
    ],
    funnel: ['148', '48', '19', '9–12', '5'],
    mode: 'baseline_safe'
  };
}

function requireDirectorAliasV8_() {
  const aliases = GmailApp.getAliases();
  const alias = aliases.find(function(value) {
    return String(value).toLowerCase() === TA_PURE_HTML_V8.senderAddress.toLowerCase();
  });
  if (!alias) throw new Error(TA_PURE_HTML_V8.senderAddress + ' must be configured as a Gmail Send mail as identity.');
  return alias;
}

function assertInternalV8_(recipient) {
  if (TA_PURE_HTML_V8.testRecipients.indexOf(String(recipient).toLowerCase()) === -1) {
    throw new Error('Pure HTML V8 internal sender is restricted to Henry test inboxes.');
  }
}

function getOrCreateV8Label_() {
  return GmailApp.getUserLabelByName(TA_PURE_HTML_V8.reviewLabel) || GmailApp.createLabel(TA_PURE_HTML_V8.reviewLabel);
}

function escapeV8_(value) {
  return String(value == null ? '' : value).replace(/[&<>"]/g, function(character) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character];
  });
}

function padV8_(number) {
  return number < 10 ? '0' + number : String(number);
}
