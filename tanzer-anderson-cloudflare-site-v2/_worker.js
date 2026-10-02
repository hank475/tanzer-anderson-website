const securityHeaders={'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self' mailto:; base-uri 'self'; frame-ancestors 'self'"};
const RAAS_STYLE='<link rel="stylesheet" href="/assets/raas-integration.css">';
const RAAS_NAV='<a href="/raas/">RaaS</a>';
const RAAS_HOME='<!-- HALEX_RaaS_HOME_START --><section class="raas-home-band" aria-labelledby="raas-home-title"><div class="home-shell raas-home-grid"><div><p class="section-label">Recruiting-as-a-Service</p><h2 id="raas-home-title">Recruiting without the agency fee.</h2><p>Add recruiting capacity when you need it. Professional recruiting from $1,250 per opening through Senior Manager, with initial candidate delivery targeted within 10 business days and no percentage-of-salary placement fee.</p><a class="arrow-link" href="/raas/">Explore Recruiting-as-a-Service <span>→</span></a><p class="raas-inline-note">Director and above remain separate Leadership and Executive Search engagements.</p></div><div class="raas-home-facts"><strong>$1,250</strong><span>Standard Professional Search</span><strong>$2,000–$2,500</strong><span>Specialized Professional Search</span><small>A search starts only after payment or credit allocation and acceptance of the completed official intake.</small></div></div></section><!-- HALEX_RaaS_HOME_END -->';
const RAAS_EXPERTISE='<!-- HALEX_RaaS_EXPERTISE_START --><section class="band raas-expertise-band"><div class="shell split"><div><p class="eyebrow">Recruiting-as-a-Service</p><h2 class="display">Flexible recruiting capacity for professional openings.</h2><p>For individual contributor through Senior Manager roles, Tanzer Anderson provides opening-specific sourcing, direct outreach and candidate qualification without a percentage placement fee.</p></div><div><ul class="list-clean"><li><span>Standard Professional Search</span><small>$1,250 per opening</small></li><li><span>Specialized Professional Search</span><small>$2,000–$2,500 per opening</small></li><li><span>Initial candidate delivery</span><small>Targeted within 10 business days after official start</small></li><li><span>Executive Search</span><small>Director and above, separately engaged</small></li></ul><a class="arrow-link" href="/raas/">Review the RaaS model <span>→</span></a></div></div></section><!-- HALEX_RaaS_EXPERTISE_END -->';
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8',...securityHeaders}})}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v||'')}
function injectRaas(html,path){
  if(!html.includes('/assets/raas-integration.css'))html=html.replace('</head>',`${RAAS_STYLE}</head>`);
  if(!html.includes('href="/raas/"'))html=html.replace('<a href="/expertise/">',`${RAAS_NAV}<a href="/expertise/">`);
  if(path==='/'&&!html.includes('HALEX_RaaS_HOME_START'))html=html.replace('<section class="process-section">',`${RAAS_HOME}<section class="process-section">`);
  if((path==='/expertise/'||path==='/expertise')&&!html.includes('HALEX_RaaS_EXPERTISE_START'))html=html.replace('<section class="band" style="background:#eee6d8">',`${RAAS_EXPERTISE}<section class="band" style="background:#eee6d8">`);
  return html;
}
export default{async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/contact'&&request.method==='POST'){
    let body;try{body=await request.json()}catch{return json({error:'Invalid request'},400)}
    if(body.website)return json({ok:true});
    if(!body.name||!body.company||!validEmail(body.email)||!(body.message||body.roleTitle||body.roleMandate))return json({error:'Please complete all required fields.'},400);
    if(!env.CONTACT_WEBHOOK_URL)return json({error:'Email routing is not configured.',fallback:'mailto'},503);
    const upstream=await fetch(env.CONTACT_WEBHOOK_URL,{method:'POST',headers:{'content-type':'application/json','x-tanzer-source':'website'},body:JSON.stringify({...body,receivedAt:new Date().toISOString(),source:'tanzeranderson.com'})});
    if(!upstream.ok)return json({error:'Delivery failed.',fallback:'mailto'},502);
    return json({ok:true});
  }
  const response=await env.ASSETS.fetch(request);const h=new Headers(response.headers);Object.entries(securityHeaders).forEach(([k,v])=>h.set(k,v));
  const type=h.get('content-type')||'';
  if(response.ok&&type.includes('text/html')){
    const html=injectRaas(await response.text(),url.pathname);h.delete('content-length');h.delete('content-encoding');h.delete('etag');h.set('Cache-Control','public, max-age=300');return new Response(html,{status:response.status,statusText:response.statusText,headers:h});
  }
  if(/\.(css|js|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname))h.set('Cache-Control','public, max-age=604800, immutable');else h.set('Cache-Control','public, max-age=300');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
}};