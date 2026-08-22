const APP_NAME = "Meridian Oil Radar";
const APP_VERSION = "2.0.0-web";
const DEFAULT_NEWS_QUERY = '("crude oil" OR petroleum OR OPEC OR "oil price" OR refinery OR tanker OR sanctions OR "Strait of Hormuz" OR "oil production")';
const USER_AGENT = "MeridianOilRadar/2.0 (+https://meridian-oil-radar.pages.dev; research dashboard)";

const MARKET_SERIES = {
  wti: { series_id:"DCOILWTICO", label:"WTI Spot", short:"WTI", unit:"$/bbl", decimals:2, cadence:"daily", source_label:"EIA via FRED" },
  brent: { series_id:"DCOILBRENTEU", label:"Brent Spot", short:"BRENT", unit:"$/bbl", decimals:2, cadence:"daily", source_label:"EIA via FRED" },
  natgas: { series_id:"DHHNGSP", label:"Henry Hub Natural Gas", short:"NATGAS", unit:"$/MMBtu", decimals:2, cadence:"daily", source_label:"EIA via FRED" },
  gasoline: { series_id:"DGASNYH", label:"NY Harbor Gasoline", short:"GASOLINE", unit:"$/gal", decimals:3, cadence:"daily", source_label:"EIA via FRED" },
  heating_oil: { series_id:"DHOILNYH", label:"NY Harbor Heating Oil", short:"HEAT OIL", unit:"$/gal", decimals:3, cadence:"daily", source_label:"EIA via FRED" },
  ovx: { series_id:"OVXCLS", label:"CBOE Crude Oil Volatility", short:"OVX", unit:"index", decimals:2, cadence:"daily", source_label:"CBOE via FRED" },
  usd_broad: { series_id:"DTWEXBGS", label:"Trade-Weighted U.S. Dollar", short:"USD BROAD", unit:"index", decimals:2, cadence:"daily", source_label:"Federal Reserve via FRED" },
  us10y: { series_id:"DGS10", label:"U.S. 10-Year Yield", short:"US10Y", unit:"%", decimals:2, cadence:"daily", source_label:"U.S. Treasury via FRED" },
  sp500: { series_id:"SP500", label:"S&P 500", short:"S&P 500", unit:"index", decimals:2, cadence:"daily", source_label:"S&P Dow Jones via FRED" },
  gold: { series_id:"GOLDAMGBD228NLBM", label:"Gold Fixing Price", short:"GOLD", unit:"$/oz", decimals:2, cadence:"daily", source_label:"LBMA via FRED" }
};

const FUNDAMENTAL_SERIES = {
  crude_stocks: { series_id:"WCESTUS1", label:"U.S. Commercial Crude Stocks ex-SPR", short:"CRUDE STOCKS", unit:"thousand bbl", display_divisor:1000, display_unit:"MMbbl", decimals:1, bullish_when_down:true },
  cushing_stocks: { series_id:"WCRSTUS1", label:"Cushing Crude Stocks", short:"CUSHING", unit:"thousand bbl", display_divisor:1000, display_unit:"MMbbl", decimals:1, bullish_when_down:true },
  spr: { series_id:"WCSSTUS1", label:"Strategic Petroleum Reserve Stocks", short:"SPR", unit:"thousand bbl", display_divisor:1000, display_unit:"MMbbl", decimals:1, bullish_when_down:false },
  gasoline_stocks: { series_id:"WGTSTUS1", label:"U.S. Total Gasoline Stocks", short:"GASOLINE STOCKS", unit:"thousand bbl", display_divisor:1000, display_unit:"MMbbl", decimals:1, bullish_when_down:true },
  distillate_stocks: { series_id:"WDISTUS1", label:"U.S. Distillate Stocks", short:"DISTILLATES", unit:"thousand bbl", display_divisor:1000, display_unit:"MMbbl", decimals:1, bullish_when_down:true },
  us_production: { series_id:"WPULEUS3", label:"U.S. Field Production of Crude Oil", short:"U.S. PRODUCTION", unit:"thousand bbl/day", display_divisor:1000, display_unit:"MMbbl/d", decimals:2, bullish_when_down:true }
};

const CATEGORY_KEYWORDS = {
  "OPEC & supply": ["opec","production cut","output cut","quota","compliance","supply deal"],
  "Geopolitics & sanctions": ["sanction","iran","russia","ukraine","israel","attack","war","missile","conflict","embargo"],
  "Shipping & chokepoints": ["tanker","shipping","strait of hormuz","red sea","suez","bab el-mandeb","pipeline","port","freight"],
  "Inventories": ["inventory","inventories","stockpile","stocks","cushing","eia report","draw","build"],
  "Refineries": ["refinery","refining","crack spread","turnaround","maintenance","outage","fire"],
  "Production": ["production","output","drilling","rig count","oilfield","well","upstream"],
  "Demand & macro": ["demand","consumption","growth","recession","china","india","dollar","interest rate","inflation","pmi"],
  "Weather": ["hurricane","storm","cyclone","freeze","weather","gulf of mexico"],
  "Policy & regulation": ["policy","regulation","tax","price cap","reserve release","spr","legislation"]
};
const BULLISH_TERMS = ["cut","cuts","disruption","outage","attack","sanction","closure","closed","draw","strike","hurricane","embargo","shortage","lower output","production decline","fire","force majeure","supply risk"];
const BEARISH_TERMS = ["build","surplus","increase output","higher output","raise production","production growth","weak demand","demand slowdown","ceasefire","reopen","restart","recovery","reserve release","spr release"];
const HIGH_IMPACT_TERMS = ["strait of hormuz","opec","million barrels","sanctions","attack","pipeline","refinery fire","force majeure","hurricane","inventory","production cut"];
const SOURCE_TIER_1 = new Set(["reuters.com","apnews.com","bloomberg.com","ft.com","wsj.com","eia.gov","energy.gov","iea.org","opec.org","cftc.gov"]);
const SOURCE_TIER_2 = new Set(["cnbc.com","marketwatch.com","spglobal.com","argusmedia.com","oilprice.com","rigzone.com","axios.com","bbc.com","theguardian.com"]);
const LOCATION_RULES = [
  [["strait of hormuz","hormuz"],"Strait of Hormuz",26.56,56.25], [["bab el-mandeb","red sea"],"Red Sea / Bab el-Mandeb",13.5,43.3], [["suez","suez canal"],"Suez Canal",30.45,32.35],
  [["gulf of mexico"],"Gulf of Mexico",25.5,-90.0], [["saudi","saudi arabia"],"Saudi Arabia",23.9,45.1], [["iran","tehran"],"Iran",32.4,53.7], [["iraq","baghdad"],"Iraq",33.2,43.7],
  [["united arab emirates","uae","abu dhabi"],"United Arab Emirates",24.2,54.3], [["kuwait"],"Kuwait",29.3,47.5], [["qatar"],"Qatar",25.3,51.2], [["russia","moscow","siberia"],"Russia",60,90],
  [["ukraine","kyiv"],"Ukraine",49,31.4], [["libya","tripoli"],"Libya",27,17], [["nigeria"],"Nigeria",9.1,8.7], [["angola"],"Angola",-11.2,17.9], [["venezuela"],"Venezuela",6.4,-66.6],
  [["guyana"],"Guyana",4.9,-58.9], [["brazil"],"Brazil",-10.8,-52.9], [["canada","alberta"],"Canada",56.1,-106.3], [["united states","u.s.","texas","cushing"],"United States",37.1,-95.7],
  [["mexico"],"Mexico",23.6,-102.5], [["norway","north sea"],"North Sea",59.5,2], [["kazakhstan"],"Kazakhstan",48,67], [["china","beijing"],"China",35.9,104.2],
  [["india","new delhi"],"India",20.6,78.9], [["japan"],"Japan",36.2,138.3], [["south korea","korea"],"South Korea",36.5,127.9], [["europe","european union","eu "],"Europe",50.1,10.4]
];
const STOPWORDS = new Set(["the","and","for","with","from","that","this","oil","crude","price","prices","market","markets","says","amid","after","over","into","could","will","are","has","have"]);
const EIA_RSS_FEEDS = {
  "EIA Today in Energy":"https://www.eia.gov/rss/todayinenergy.xml",
  "EIA Press Releases":"https://www.eia.gov/rss/press_rss.xml"
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isoNow = () => new Date().toISOString();
const safeNumber = value => {
  if (value == null || value === "" || value === ".") return null;
  const n = Number(String(value).replaceAll(",", ""));
  return Number.isFinite(n) ? n : null;
};
const round = (n, digits=2) => Number(Number(n).toFixed(digits));
const signed = (n, digits=1) => `${n >= 0 ? "+" : ""}${Number(n).toFixed(digits)}`;
const hashText = text => {
  let h = 2166136261;
  for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8,"0");
};
const stripHtml = value => decodeEntities(String(value || "").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());
function decodeEntities(value) {
  return String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function parseDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
function daysAgoISO(days) {
  const d = new Date(); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0,10);
}
function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), { status, headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...headers} });
}
function healthOk(map, name, detail="Connected", lastSuccess=null) {
  map[name] = { status:"ok", detail, checked_at:isoNow(), last_success:lastSuccess || isoNow() };
}
function healthError(map, name, detail) {
  map[name] = { status:"error", detail:String(detail).slice(0,500), checked_at:isoNow(), last_success:null };
}
function mergeHealth(...maps) { return Object.assign({}, ...maps.filter(Boolean)); }
function cacheRequest(request, key) {
  const u = new URL(request.url); u.pathname = `/__meridian_cache/${encodeURIComponent(key)}`; u.search = ""; return new Request(u.toString(), {method:"GET"});
}
async function cachedPayload(request, ctx, key, ttl, producer, bypass=false) {
  const cache = caches.default;
  const ckey = cacheRequest(request, key);
  if (!bypass) {
    const hit = await cache.match(ckey);
    if (hit) {
      const payload = await hit.json();
      const fetchedAt = payload.__cached_at || payload.generated_at || isoNow();
      delete payload.__cached_at;
      payload.cache = {cache:"edge", fetched_at:fetchedAt, error:null};
      return payload;
    }
  }
  const payload = await producer();
  const fetchedAt = isoNow();
  const stored = {...payload, __cached_at:fetchedAt};
  const response = new Response(JSON.stringify(stored), {headers:{"content-type":"application/json","cache-control":`public, max-age=${ttl}`}});
  ctx.waitUntil(cache.put(ckey, response));
  payload.cache = {cache:"network", fetched_at:fetchedAt, error:null};
  return payload;
}
async function fetchWithTimeout(url, timeoutMs=18000, init={}) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort("timeout"), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal:controller.signal, headers:{"user-agent":USER_AGENT,"accept":"*/*",...(init.headers||{})} });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  } finally { clearTimeout(timer); }
}
function parseFredCSV(text, seriesId) {
  const lines = String(text).replace(/^\uFEFF/,"").trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(x=>x.trim());
  const dateIndex = Math.max(0, headers.findIndex(h=>/^(DATE|observation_date|date)$/i.test(h)));
  let valueIndex = headers.findIndex(h=>h === seriesId);
  if (valueIndex < 0) valueIndex = headers.findIndex((_,i)=>i !== dateIndex);
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const parts = line.split(",");
    const date = parts[dateIndex]?.trim();
    const value = safeNumber(parts[valueIndex]);
    if (date && value != null) rows.push({date,value});
  }
  return rows;
}
async function fetchFredSeries(seriesId, start, health) {
  const name = `FRED:${seriesId}`;
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}&cosd=${encodeURIComponent(start)}`;
  try {
    const res = await fetchWithTimeout(url, 20000);
    const rows = parseFredCSV(await res.text(), seriesId);
    if (!rows.length) throw new Error("FRED CSV returned no usable observations");
    healthOk(health, name, "FRED public chart CSV", rows.at(-1).date);
    return rows;
  } catch (err) { healthError(health, name, err.message || err); throw err; }
}
function summarizeSeries(key, meta, rows) {
  const values = rows.filter(r=>Number.isFinite(Number(r.value))).map(r=>({date:r.date,value:Number(r.value)}));
  if (!values.length) return {key,...meta,status:"unavailable",series:[]};
  const latest = values.at(-1);
  const changeFrom = offset => {
    if (values.length <= offset) return null;
    const prior = values[values.length - 1 - offset].value;
    return prior === 0 ? null : (latest.value / prior - 1) * 100;
  };
  const recent = values.slice(-Math.min(values.length,60)).map(x=>x.value);
  const mean = recent.reduce((a,b)=>a+b,0)/recent.length;
  const variance = recent.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,recent.length-1);
  const zscore = variance > 0 ? (latest.value-mean)/Math.sqrt(variance) : 0;
  const d = parseDate(latest.date);
  const ageDays = d ? (Date.now()-d.getTime())/86400000 : null;
  const staleThreshold = meta.cadence === "weekly" ? 10 : 5;
  return {key,...meta,status:"ok",value:latest.value,as_of:latest.date,change_1:changeFrom(1),change_5:changeFrom(5),change_20:changeFrom(20),zscore_60:zscore,stale:ageDays!=null && ageDays>staleThreshold,series:values};
}
async function getMarket(request, ctx, days=365, bypass=false) {
  days = Math.round(clamp(Number(days)||365,30,1200));
  return cachedPayload(request,ctx,`market:${days}`,300,async()=>{
    const health={}; const start=daysAgoISO(days); const instruments={};
    await Promise.all(Object.entries(MARKET_SERIES).map(async([key,meta])=>{
      try { instruments[key]=summarizeSeries(key,meta,await fetchFredSeries(meta.series_id,start,health)); }
      catch(err) { instruments[key]={key,...meta,status:"unavailable",error:String(err.message||err),series:[]}; }
    }));
    const wti=instruments.wti||{}, brent=instruments.brent||{};
    let spread={key:"brent_wti_spread",label:"Brent-WTI Spread",short:"BRENT-WTI",unit:"$/bbl",decimals:2,status:"unavailable",series:[],source_label:"Derived from EIA/FRED"};
    if (wti.status==="ok" && brent.status==="ok") {
      const wb=new Map(wti.series.map(r=>[r.date,r.value]));
      const derived=brent.series.filter(r=>wb.has(r.date)).map(r=>({date:r.date,value:r.value-wb.get(r.date)}));
      spread=summarizeSeries("brent_wti_spread",spread,derived);
    }
    instruments.brent_wti_spread=spread;
    const available=Object.values(instruments).filter(v=>v.status==="ok").length;
    return {status:available?"ok":"unavailable",generated_at:isoNow(),demo:false,provider:"FRED public series",provider_note:"Delayed/end-of-day public economic series; not an exchange-grade real-time feed.",available_count:available,instruments,source_health:health};
  },bypass);
}
async function getFundamentals(request,ctx,days=2200,bypass=false) {
  days=Math.round(clamp(Number(days)||2200,365,3650));
  return cachedPayload(request,ctx,`fundamentals:${days}`,1800,async()=>{
    const health={}; const start=daysAgoISO(days); const indicators={};
    await Promise.all(Object.entries(FUNDAMENTAL_SERIES).map(async([key,meta])=>{
      try {
        const merged={...meta,cadence:"weekly",source_label:"EIA via FRED"};
        const item=summarizeSeries(key,merged,await fetchFredSeries(meta.series_id,start,health));
        if (item.status==="ok") {
          const prior=item.series.length>1?item.series.at(-2).value:null;
          item.change_absolute=prior==null?null:item.value-prior;
          const hist=item.series.slice(-260).map(r=>r.value);
          if (hist.length>=20) { item.percentile_5y=hist.filter(v=>v<=item.value).length/hist.length*100; item.range_5y={min:Math.min(...hist),max:Math.max(...hist)}; }
          item.display_value=item.value/(meta.display_divisor||1);
          item.display_change=item.change_absolute==null?null:item.change_absolute/(meta.display_divisor||1);
        }
        indicators[key]=item;
      } catch(err) { indicators[key]={key,...meta,status:"unavailable",error:String(err.message||err),series:[]}; }
    }));
    const available=Object.values(indicators).filter(v=>v.status==="ok").length;
    return {status:available?"ok":"unavailable",generated_at:isoNow(),demo:false,available_count:available,indicators,consensus_status:"not_connected",consensus_note:"Inventory surprise is disabled until a licensed consensus source is configured.",source_health:health};
  },bypass);
}
function titleTokens(title) { return new Set((String(title).toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>t.length>2&&!STOPWORDS.has(t))); }
function sourceTier(url,domain=null) {
  let dom=(domain||"").toLowerCase().replace(/^www\./,"");
  if (!dom) { try { dom=new URL(url).hostname.toLowerCase().replace(/^www\./,""); } catch{} }
  const matches=set=>[...set].some(d=>dom===d||dom.endsWith(`.${d}`));
  if (matches(SOURCE_TIER_1)) return [1,.93];
  if (matches(SOURCE_TIER_2)) return [2,.78];
  return [3,.62];
}
function classifyNews(title,summary="") {
  const text=`${title} ${summary}`.toLowerCase();
  let category="General oil intelligence",best=0;
  for (const [cat,terms] of Object.entries(CATEGORY_KEYWORDS)) { const score=terms.filter(t=>text.includes(t)).length; if(score>best){best=score;category=cat;} }
  const bullish=BULLISH_TERMS.filter(t=>text.includes(t)).length;
  const bearish=BEARISH_TERMS.filter(t=>text.includes(t)).length;
  const direction=bullish>bearish?"bullish":bearish>bullish?"bearish":"mixed";
  const direction_sign=direction==="bullish"?1:direction==="bearish"?-1:0;
  const high=HIGH_IMPACT_TERMS.filter(t=>text.includes(t)).length;
  const impact=Math.round(clamp(28+high*13+Math.max(bullish,bearish)*8,15,96));
  let location={name:"Global",lat:18,lon:10,confidence:.25,basis:"No explicit place in headline"};
  for (const [keywords,name,lat,lon] of LOCATION_RULES) { const matched=keywords.find(k=>text.includes(k)); if(matched){location={name,lat,lon,confidence:.88,basis:`Headline/summary contains \"${matched}\"`};break;} }
  const reason=[]; if(category!=="General oil intelligence") reason.push(category.toLowerCase());
  reason.push(direction==="bullish"?"signals tighter supply or higher risk premium":direction==="bearish"?"signals looser supply or weaker demand":"has mixed or unconfirmed directional implications");
  return {category,direction,direction_sign,impact,location,why_it_matters:`${reason.join("; ").replace(/^./,c=>c.toUpperCase())}.`};
}
function buildNewsItem({title,url,publisher,publishedAt,summary="",sourceCountry=null,sourceKind="GDELT"}) {
  title=stripHtml(title); summary=stripHtml(summary);
  let domain=""; try{domain=new URL(url).hostname.toLowerCase().replace(/^www\./,"");}catch{domain=String(publisher||"").toLowerCase();}
  const [tier,baseConfidence]=sourceTier(url,domain); const classified=classifyNews(title,summary); const p=publishedAt||new Date();
  const ageHours=Math.max(0,(Date.now()-p.getTime())/3600000); const freshness=Math.round(clamp(100-ageHours*3.2,10,100));
  const confidence=Math.round(clamp(baseConfidence*100+Math.min(8,classified.impact/15),45,98));
  return {id:hashText(`${title}|${url}`),title,url,publisher:publisher||domain,domain,published_at:p.toISOString(),age_hours:round(ageHours,2),freshness,summary:summary.slice(0,700),source_country:sourceCountry,source_kind:sourceKind,source_tier:tier,confidence,corroboration_count:1,...classified};
}
async function fetchGdelt(query,timespan,maxrecords,health) {
  const name="GDELT DOC 2.0";
  const params=new URLSearchParams({query,mode:"artlist",maxrecords:String(maxrecords),format:"json",sort:"datedesc",timespan});
  try {
    const res=await fetchWithTimeout(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`,20000,{headers:{accept:"application/json"}});
    const data=await res.json(); const articles=data.articles||data.items||[]; const items=[];
    for(const a of articles){const title=a.title||a.name,url=a.url||a.external_url;if(!title||!url)continue;let domain=a.domain;try{domain=domain||new URL(url).hostname;}catch{}
      items.push(buildNewsItem({title,url,publisher:domain,publishedAt:parseDate(a.seendate||a.date_published||a.date_modified),summary:a.description||a.summary||"",sourceCountry:a.sourcecountry,sourceKind:"GDELT"}));}
    if(!items.length)throw new Error("GDELT returned no usable articles"); healthOk(health,name,`${items.length} articles`,items[0].published_at); return items;
  } catch(err){healthError(health,name,err.message||err);throw err;}
}
function tagValue(block,tag){const m=block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,`i`));return m?decodeEntities(m[1].trim()):"";}
async function fetchRSS(name,url,health){const hname=`RSS:${name}`;try{const res=await fetchWithTimeout(url,18000);const xml=await res.text();const blocks=xml.match(/<item\b[\s\S]*?<\/item>/gi)||[];const items=[];for(const b of blocks){const title=tagValue(b,"title"),link=tagValue(b,"link"),summary=tagValue(b,"description"),pub=tagValue(b,"pubDate")||tagValue(b,"date");if(title&&link)items.push(buildNewsItem({title,url:link,publisher:name,publishedAt:parseDate(pub),summary,sourceKind:"Official RSS"}));}healthOk(health,hname,`${items.length} items`,items[0]?.published_at||null);return items;}catch(err){healthError(health,hname,err.message||err);return[];}}
function normalizedTitle(title){return [...titleTokens(title)].sort().join(" ");}
function dedupeAndCorroborate(items){const seenUrls=new Set(),seenNorm=new Set(),deduped=[];for(const item of [...items].sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)))){const norm=normalizedTitle(item.title);if(seenUrls.has(item.url)||(norm&&seenNorm.has(norm)))continue;seenUrls.add(item.url);if(norm)seenNorm.add(norm);deduped.push(item);}const sets=deduped.map(i=>titleTokens(i.title));for(let i=0;i<deduped.length;i++){const domains=new Set([deduped[i].domain]);for(let j=0;j<deduped.length;j++){if(i===j)continue;const union=new Set([...sets[i],...sets[j]]);if(!union.size)continue;let inter=0;for(const t of sets[i])if(sets[j].has(t))inter++;if(inter/union.size>=.38)domains.add(deduped[j].domain);}deduped[i].corroboration_count=[...domains].filter(Boolean).length;deduped[i].confidence=Math.round(clamp(deduped[i].confidence+Math.min(10,(deduped[i].corroboration_count-1)*4),45,99));}return deduped;}
async function getNews(request,ctx,query=DEFAULT_NEWS_QUERY,timespan="24h",maxrecords=100,bypass=false){query=String(query||"").trim()||DEFAULT_NEWS_QUERY;timespan=/^\d+(h|d|w)$/i.test(timespan)?timespan.toLowerCase():"24h";maxrecords=Math.round(clamp(Number(maxrecords)||100,10,250));const key=`news:${hashText(`${query}|${timespan}|${maxrecords}`)}`;return cachedPayload(request,ctx,key,60,async()=>{const health={};const settled=await Promise.allSettled([fetchGdelt(query,timespan,maxrecords,health),...Object.entries(EIA_RSS_FEEDS).map(([n,u])=>fetchRSS(n,u,health))]);let items=[],errors=[];for(const r of settled){if(r.status==="fulfilled")items.push(...r.value);else errors.push(String(r.reason?.message||r.reason));}items=dedupeAndCorroborate(items);const category_counts={},direction_counts={bullish:0,bearish:0,mixed:0};for(const item of items){category_counts[item.category]=(category_counts[item.category]||0)+1;direction_counts[item.direction]=(direction_counts[item.direction]||0)+1;}return{status:items.length?"ok":"unavailable",generated_at:isoNow(),demo:false,query,timespan,scan_count:items.length,category_counts,direction_counts,errors,items,source_health:health};},bypass);}
function signedNewsScore(items){if(!items?.length)return[null,"No live news observations available"];const usable=items.filter(i=>i.direction_sign===1||i.direction_sign===-1);if(!usable.length)return[0,"Recent headlines are directionally mixed"];const weighted=usable.reduce((a,i)=>a+i.direction_sign*i.impact*(i.confidence/100),0),denom=usable.reduce((a,i)=>a+i.impact*(i.confidence/100),0);const score=clamp(denom?weighted/denom*100:0,-100,100);return[score,score>10?"Headline balance skews toward tighter supply/risk":score<-10?"Headline balance skews toward looser supply/demand":"Headline balance is near neutral"];}
function computePressure(market,fundamentals,news){const components=[];const wti=market?.instruments?.wti||{};if(wti.status==="ok"&&wti.change_20!=null){const score=clamp(Math.tanh(wti.change_20/8)*100,-100,100);components.push({key:"price_momentum",label:"Price momentum",default_weight:.30,score,as_of:wti.as_of,reason:`WTI 20-observation change is ${signed(wti.change_20,1)}%.`,source:wti.source_label});}const crude=fundamentals?.indicators?.crude_stocks||{};if(crude.status==="ok"&&crude.change_absolute!=null){const mm=crude.change_absolute/1000,score=clamp(-mm*12,-100,100);components.push({key:"inventories",label:"Commercial inventories",default_weight:.20,score,as_of:crude.as_of,reason:`Commercial crude stocks changed ${signed(mm,1)} MMbbl week over week; draws are scored bullish.`,source:crude.source_label});}const prod=fundamentals?.indicators?.us_production||{};if(prod.status==="ok"&&prod.change_1!=null){const score=clamp(-prod.change_1*22,-100,100);components.push({key:"supply",label:"U.S. supply pulse",default_weight:.15,score,as_of:prod.as_of,reason:`U.S. field production changed ${signed(prod.change_1,2)}% week over week.`,source:prod.source_label});}const[ns,nr]=signedNewsScore(news?.items||[]);if(ns!=null)components.push({key:"news_risk",label:"News & geopolitical risk",default_weight:.20,score:ns,as_of:news.generated_at,reason:`${nr}.`,source:"GDELT + official RSS"});const ovx=market?.instruments?.ovx||{};if(ovx.status==="ok"){const score=clamp((ovx.value-30)*3,-100,100);components.push({key:"volatility",label:"Oil volatility / risk premium",default_weight:.10,score,as_of:ovx.as_of,reason:`OVX is ${Number(ovx.value).toFixed(1)}; readings above 30 add risk-premium pressure.`,source:ovx.source_label});}const usd=market?.instruments?.usd_broad||{};if(usd.status==="ok"&&usd.change_20!=null){const score=clamp(-usd.change_20*12,-100,100);components.push({key:"macro",label:"Dollar macro pressure",default_weight:.05,score,as_of:usd.as_of,reason:`Broad U.S. dollar index changed ${signed(usd.change_20,1)}% over 20 observations; a stronger dollar is scored as an oil headwind.`,source:usd.source_label});}if(!components.length)return{status:"unavailable",score:null,label:"Insufficient live inputs",coverage:0,components:[],generated_at:isoNow()};const total=components.reduce((a,c)=>a+c.default_weight,0),composite=components.reduce((a,c)=>a+c.score*c.default_weight,0)/total,index=round(clamp(50+composite/2,0,100),1);const label=index>=72?"High upward pressure":index>=58?"Moderate upward pressure":index>=42?"Balanced / mixed":index>=28?"Moderate downward pressure":"High downward pressure";for(const c of components){c.normalized_weight=round(c.default_weight/total,4);c.contribution=round(c.score*c.normalized_weight,2);}return{status:"ok",score:index,raw_pressure:round(composite,2),label,coverage:round(total*100,1),components,generated_at:isoNow(),method_note:"Transparent rules-based synthesis, not a price forecast or trading signal."};}
async function buildSnapshot(request,ctx,bypass=false){const [market,fundamentals,news]=await Promise.all([getMarket(request,ctx,365,bypass),getFundamentals(request,ctx,2200,bypass),getNews(request,ctx,DEFAULT_NEWS_QUERY,"24h",100,bypass)]);const pressure=computePressure(market,fundamentals,news);const sourceHealth=mergeHealth(market.source_health,fundamentals.source_health,news.source_health);const healthy=Object.values(sourceHealth).filter(h=>h.status==="ok").length,failed=Object.values(sourceHealth).filter(h=>h.status==="error").length;return{status:[market,fundamentals,news].some(x=>x.status==="ok")?"ok":"unavailable",generated_at:isoNow(),demo:false,market,fundamentals,news,pressure,source_summary:{healthy,failed,total:Object.keys(sourceHealth).length}};}
async function deleteCaches(request){const keys=["market:365","fundamentals:2200",`news:${hashText(`${DEFAULT_NEWS_QUERY}|24h|100`)}`];await Promise.all(keys.map(k=>caches.default.delete(cacheRequest(request,k))));return keys.length;}

export async function onRequest(context){
  const {request,env,params}=context; const url=new URL(request.url); const segments=Array.isArray(params.path)?params.path:[params.path].filter(Boolean); const route=segments.join("/");
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"}});
  try {
    if(route==="ping") return json({status:"ok",app:APP_NAME,version:APP_VERSION,time:isoNow(),demo:false,hosting:"Cloudflare Pages Functions"});
    if(route==="config") return json({app:APP_NAME,version:APP_VERSION,demo:false,generated_at:isoNow(),keys:{fred:false,eia:false,alpha_vantage:false},capabilities:{live_news:true,public_delayed_market_data:true,exchange_grade_realtime:false,consensus_inventory_surprise:false,trade_execution:false},refresh_defaults:{news_seconds:60,market_seconds:300,fundamentals_seconds:1800},timezone:"UTC",hosting:"Cloudflare Pages"});
    if(route==="market") return json(await getMarket(request,context,url.searchParams.get("days")||365,url.searchParams.has("bypass")));
    if(route==="fundamentals") return json(await getFundamentals(request,context,url.searchParams.get("days")||2200,url.searchParams.has("bypass")));
    if(route==="news") return json(await getNews(request,context,url.searchParams.get("query")||DEFAULT_NEWS_QUERY,url.searchParams.get("timespan")||"24h",url.searchParams.get("maxrecords")||100,url.searchParams.has("bypass")));
    if(route==="snapshot") return json(await buildSnapshot(request,context,url.searchParams.has("bypass")));
    if(route==="source-health") {const [m,f,n]=await Promise.all([getMarket(request,context,365,false),getFundamentals(request,context,2200,false),getNews(request,context,DEFAULT_NEWS_QUERY,"24h",100,false)]);return json({generated_at:isoNow(),demo:false,sources:mergeHealth(m.source_health,f.source_health,n.source_health),environment:{fred_key_configured:false,eia_key_configured:false,alpha_vantage_key_configured:false},hosting:"Cloudflare Pages Functions"});}
    if(route==="cache/clear"&&request.method==="POST") return json({status:"ok",cleared_at:isoNow(),deleted:await deleteCaches(request)});
    return json({status:"not_found",route:`/api/${route}`},404);
  } catch(err){return json({status:"error",error:String(err?.message||err),generated_at:isoNow()},500);}
}
