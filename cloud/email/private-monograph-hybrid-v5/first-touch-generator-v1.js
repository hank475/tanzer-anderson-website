const TA_FIRST_TOUCH_V1 = Object.freeze({
  version: 'TA_FIRST_TOUCH_VISUAL_V1',
  sender: 'director@tanzeranderson.com',
  title: 'Managing Director - Strategy and Business Development',
  draftOnly: true
});

function createFirstTouchVisualDraft(payload) {
  const p = normalizeFirstTouchPayload_(payload || {});
  const subject = p.subject || (p.company + ' — ' + p.role + ' market map');
  const html = buildFirstTouchVisualHtml_(p);
  const text = buildFirstTouchPlain_(p);

  const alias = requireDirectorAliasV5_();
  const draft = GmailApp.createDraft(p.to, subject, text, {
    from: alias,
    replyTo: TA_FIRST_TOUCH_V1.sender,
    name: 'Henry Anderson',
    htmlBody: html
  });
  draft.getMessage().getThread().addLabel(getOrCreateReviewLabelV5_());
  return {status:'DRAFT_CREATED', version:TA_FIRST_TOUCH_V1.version, draftId:draft.getId(), messageId:draft.getMessage().getId()};
}

function normalizeFirstTouchPayload_(p) {
  ['to','firstName','company','role','roleInsight'].forEach(function(key){
    if (!String(p[key] || '').trim()) throw new Error(key + ' is required');
  });
  const pools = Array.isArray(p.pools) ? p.pools.slice(0,4) : [];
  if (pools.length < 3) throw new Error('At least three talent pools are required');
  const funnel = p.funnel || {};
  return {
    to:String(p.to).trim(),
    subject:String(p.subject || '').trim(),
    firstName:String(p.firstName).trim(),
    company:String(p.company).trim(),
    role:String(p.role).trim(),
    roleInsight:String(p.roleInsight).trim(),
    pools:pools.map(function(x){ return {title:String(x.title||''), subtitle:String(x.subtitle||''), lines:(x.lines||[]).slice(0,4)}; }),
    funnel:{mapped:Number(funnel.mapped||0), direct:Number(funnel.direct||0), aligned:Number(funnel.aligned||0), priority:String(funnel.priority||''), firstContact:Number(funnel.firstContact||0)},
    boundary:String(p.boundary || 'We do not submit resumes outside your approved process.'),
    close:String(p.close || 'If the work is valuable, we can discuss whether Tanzer Anderson belongs in your approved search-firm rotation.')
  };
}

function buildFirstTouchVisualHtml_(p) {
  const navy='#071B33', paper='#F7F3EA', gold='#B28A4A', ink='#263340', blue='#D9E4EB';
  const poolCells = p.pools.map(function(pool){
    return '<td valign="top" width="50%" style="padding:7px;">'+
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #D8CDBD;background:'+paper+';">'+
      '<tr><td style="background:'+navy+';color:#fff;padding:11px 12px;font:700 10px Arial,sans-serif;">'+escapeV5_(pool.title)+'<br><span style="color:#D7B46A;font-weight:400;">'+escapeV5_(pool.subtitle)+'</span></td></tr>'+
      '<tr><td style="padding:12px;font:12px/18px Arial,sans-serif;color:'+ink+';">'+pool.lines.map(escapeV5_).join('<br>')+'</td></tr></table></td>';
  });
  const rows = '<tr>'+poolCells.slice(0,2).join('')+'</tr><tr>'+poolCells.slice(2,4).join('')+'</tr>';
  return '<!doctype html><html><body style="margin:0;background:#E9E2D7;">'+
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#E9E2D7;"><tr><td align="center" style="padding:18px 8px;">'+
    '<table role="presentation" width="720" cellspacing="0" cellpadding="0" style="width:720px;max-width:100%;background:'+paper+';border:1px solid #D1C6B6;">'+
    '<tr><td colspan="2" style="background:'+navy+';padding:26px 34px;color:#fff;font-family:Georgia,serif;"><div style="font-size:20px;letter-spacing:5px;">TANZER ANDERSON</div><div style="margin-top:8px;font:10px Arial,sans-serif;letter-spacing:3px;color:'+gold+';">INSIGHT. STRATEGY. IMPACT.</div></td></tr>'+
    '<tr><td valign="top" width="68%" style="padding:30px 32px 20px;font-family:Georgia,serif;color:'+ink+';">'+
    '<div style="font-size:17px;line-height:26px;color:'+navy+';">Dear '+escapeV5_(p.firstName)+',</div>'+
    '<div style="margin-top:18px;font-size:15px;line-height:24px;">Rather than send a general agency pitch I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.</div>'+
    '<div style="margin:28px 0 8px;text-align:center;font:700 16px Georgia,serif;color:#8F6D34;letter-spacing:1px;">PROOF OF CONCEPT</div>'+
    '<div style="text-align:center;font:14px Georgia,serif;color:'+navy+';margin-bottom:12px;">'+escapeV5_(p.role)+' — Talent Market Map</div>'+
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0">'+rows+'</table>'+
    '<div style="margin:14px 7px;padding:14px;border:1px solid #D8CDBD;text-align:center;font:12px Arial,sans-serif;color:'+navy+';">'+p.funnel.mapped+' mapped → '+p.funnel.direct+' direct matches → '+p.funnel.aligned+' aligned → '+escapeV5_(p.funnel.priority)+' priority → '+p.funnel.firstContact+' first-contact</div>'+
    '<div style="margin-top:24px;border-top:1px solid #D7CCBB;padding-top:16px;"><div style="font:700 11px Arial,sans-serif;letter-spacing:1px;color:#8F6D34;">THE ROLE YOU POSTED</div><div style="margin-top:6px;font:700 14px Georgia,serif;color:'+navy+';">'+escapeV5_(p.role)+'</div><div style="margin-top:6px;font:12px/18px Arial,sans-serif;">'+escapeV5_(p.roleInsight)+'</div></div>'+
    '<div style="margin-top:20px;background:'+navy+';color:'+paper+';padding:16px 18px;font:13px/20px Georgia,serif;">'+escapeV5_(p.boundary)+' '+escapeV5_(p.close)+'</div>'+
    '<div style="margin-top:20px;font:14px Georgia,serif;">Warmly,</div><div style="margin-top:3px;font-family:Segoe Script,Snell Roundhand,Brush Script MT,cursive;font-size:34px;line-height:44px;font-style:italic;color:#0B2A4A;">Henry Anderson</div><div style="font:700 10px Arial,sans-serif;letter-spacing:1px;color:'+navy+';">MANAGING DIRECTOR - STRATEGY AND BUSINESS DEVELOPMENT</div><div style="margin-top:4px;font:12px Arial,sans-serif;color:#62615D;">Tanzer Anderson · director@tanzeranderson.com</div></td>'+
    '<td valign="top" width="32%" style="background:'+blue+';border-left:1px solid #D1C6B6;"><div style="min-height:860px;background:linear-gradient(180deg,#D9E4EB 0%,#AEB DCA 35%,'+navy+' 100%);padding:34px 18px;"><div style="font:700 58px Georgia,serif;color:'+navy+';opacity:.18;text-align:right;">TA</div><div style="margin-top:130px;border:2px solid rgba(255,255,255,.75);border-radius:120px 120px 8px 8px;height:340px;background:linear-gradient(135deg,rgba(255,255,255,.75) 0 12%,rgba(255,255,255,.08) 12% 48%,rgba(7,27,51,.82) 48% 100%);"></div><div style="padding:30px 0;color:#F7F3EA;font:700 11px Arial,sans-serif;letter-spacing:2px;text-align:center;">PRIVATE. PRECISE. PREPARED.</div></div></td></tr>'+
    '<tr><td colspan="2" style="background:'+navy+';padding:18px;text-align:center;color:#D7B46A;font:11px Arial,sans-serif;letter-spacing:3px;">INSIGHT. STRATEGY. IMPACT.</td></tr></table></td></tr></table></body></html>';
}

function buildFirstTouchPlain_(p) {
  return ['Dear '+p.firstName+',','',"Rather than send a general agency pitch I’d suggest a simple proof of concept: give us one current opening and we’ll show you how we would map the market before any candidate is submitted.",'','PROOF OF CONCEPT',p.role+' — Talent Market Map','',p.pools.map(function(x){return x.title+': '+x.lines.join(', ');}).join('\n'),'',p.funnel.mapped+' mapped → '+p.funnel.direct+' direct matches → '+p.funnel.aligned+' aligned → '+p.funnel.priority+' priority → '+p.funnel.firstContact+' first-contact','','THE ROLE YOU POSTED',p.role,p.roleInsight,'',p.boundary,p.close,'','Warmly,','Henry Anderson',TA_FIRST_TOUCH_V1.title,'Tanzer Anderson',TA_FIRST_TOUCH_V1.sender].join('\n');
}
