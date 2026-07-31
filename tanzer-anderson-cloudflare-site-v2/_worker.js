
const securityHeaders = {
  'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self' mailto:; base-uri 'self'; frame-ancestors 'self'"
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8',...securityHeaders}})}
function validEmail(v){return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v||'')}
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/contact'&&request.method==='POST'){
    let body;try{body=await request.json()}catch{return json({error:'Invalid request'},400)}
    if(body.website)return json({ok:true});
    if(!body.name||!body.company||!validEmail(body.email)||!body.message)return json({error:'Please complete all required fields.'},400);
    if(!env.CONTACT_WEBHOOK_URL)return json({error:'Email routing is not configured.',fallback:'mailto'},503);
    const upstream=await fetch(env.CONTACT_WEBHOOK_URL,{method:'POST',headers:{'content-type':'application/json','x-tanzer-source':'website'},body:JSON.stringify({...body,receivedAt:new Date().toISOString(),source:'tanzeranderson.com'})});
    if(!upstream.ok)return json({error:'Delivery failed.',fallback:'mailto'},502);
    return json({ok:true});
  }
  const response=await env.ASSETS.fetch(request);const h=new Headers(response.headers);Object.entries(securityHeaders).forEach(([k,v])=>h.set(k,v));
  if(/\\.(css|js|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname))h.set('Cache-Control','public, max-age=604800, immutable');
  else h.set('Cache-Control','public, max-age=300');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
}};
