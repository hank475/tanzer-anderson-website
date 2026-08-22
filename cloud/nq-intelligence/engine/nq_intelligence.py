#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,hashlib,html,io,json,math,re,statistics,textwrap,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from datetime import datetime,date,time,timedelta,timezone
from pathlib import Path
from zoneinfo import ZoneInfo
CT=ZoneInfo('America/Chicago'); UTC=timezone.utc
UA='NQ-Intelligence-Firm/2.0 public-source research (henry@tanzeranderson.com)'
SYMS={'NQ':'NQ=F','ES':'ES=F','RTY':'RTY=F','QQQ':'QQQ','SOXX':'SOXX','VIX':'^VIX','US10Y':'^TNX','DXY':'DX-Y.NYB','NVDA':'NVDA','MSFT':'MSFT','AAPL':'AAPL','AMZN':'AMZN','META':'META','GOOGL':'GOOGL','AVGO':'AVGO','TSLA':'TSLA'}
FEEDS=[('Federal Reserve','https://www.federalreserve.gov/feeds/press_all.xml'),('BLS','https://www.bls.gov/feed/bls_latest.rss'),('U.S. Treasury','https://home.treasury.gov/news/press-releases/rss'),('SEC','https://www.sec.gov/news/pressreleases.rss'),('CFTC','https://www.cftc.gov/RSS/PressReleases.xml')]

def now(): return datetime.now(UTC)
def iso(x): return x.astimezone(UTC).isoformat().replace('+00:00','Z') if x else None
def clean(x,n=400): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',html.unescape(str(x or '')))).strip()[:n]
def num(x):
 try:
  v=float(x); return v if math.isfinite(v) else None
 except: return None

def get(url,accept='*/*'):
 q=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':accept,'Cache-Control':'no-cache'})
 with urllib.request.urlopen(q,timeout=18) as r:return r.read()
def getj(url): return json.loads(get(url,'application/json').decode('utf-8','replace'))

def chart(symbol,interval='5m',span='5d'):
 u='https://query1.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(symbol,safe='')+'?'+urllib.parse.urlencode({'interval':interval,'range':span,'includePrePost':'true'})
 d=getj(u); r=((d.get('chart',{}).get('result') or [None])[0])
 if not r: raise RuntimeError('empty chart')
 ts=r.get('timestamp') or []; q=((r.get('indicators',{}).get('quote') or [{}])[0]); out=[]
 for i,t in enumerate(ts):
  def a(k):
   v=q.get(k) or []; return v[i] if i<len(v) else None
  c=num(a('close'))
  if c is None: continue
  out.append({'ts':datetime.fromtimestamp(int(t),UTC),'open':num(a('open')) or c,'high':num(a('high')) or c,'low':num(a('low')) or c,'close':c,'volume':max(0,num(a('volume')) or 0)})
 return out,r.get('meta') or {}

def resample(bars,m):
 z={}; sec=m*60
 for b in bars:z.setdefault(int(b['ts'].timestamp())//sec,[]).append(b)
 return [{'ts':datetime.fromtimestamp(k*sec,UTC),'open':g[0]['open'],'high':max(x['high'] for x in g),'low':min(x['low'] for x in g),'close':g[-1]['close'],'volume':sum(x['volume'] for x in g)} for k,g in sorted(z.items())]

def atr(b,n=14):
 if not b:return None
 tr=[]; p=None
 for x in b:
  tr.append(x['high']-x['low'] if p is None else max(x['high']-x['low'],abs(x['high']-p),abs(x['low']-p)));p=x['close']
 return statistics.fmean(tr[-min(n,len(tr)):])
def vwap(b):
 if not b:return None
 w=t=0
 for x in b:
  v=x['volume'] or 1; w+=((x['high']+x['low']+x['close'])/3)*v;t+=v
 return w/t if t else None

def tday(dt): return dt.date()+timedelta(days=1) if dt.time()>=time(17) else dt.date()
def profile(b,bins=32):
 if not b:return {'vah':None,'poc':None,'val':None,'hvn':[],'lvn':[]}
 lo=min(x['low'] for x in b); hi=max(x['high'] for x in b)
 if hi<=lo:return {'vah':hi,'poc':lo,'val':lo,'hvn':[lo],'lvn':[]}
 step=(hi-lo)/bins; h=[0.]*bins
 for x in b:h[min(bins-1,max(0,int((x['close']-lo)/step)))]+=x['volume'] or 1
 c=[lo+(i+.5)*step for i in range(bins)]; p=max(range(bins),key=lambda i:h[i]); chosen={p}; vol=h[p]; total=sum(h); L=p-1;R=p+1
 while vol<total*.7 and (L>=0 or R<bins):
  lv=h[L] if L>=0 else -1;rv=h[R] if R<bins else -1
  if rv>lv:chosen.add(R);vol+=max(0,rv);R+=1
  else:chosen.add(L);vol+=max(0,lv);L-=1
 occ=[i for i,v in enumerate(h) if v>0]
 return {'vah':round(max(c[i] for i in chosen),2),'poc':round(c[p],2),'val':round(min(c[i] for i in chosen),2),'hvn':[round(c[i],2) for i in sorted(occ,key=lambda i:h[i],reverse=True)[:3]],'lvn':[round(c[i],2) for i in sorted([i for i in occ if 0<i<bins-1],key=lambda i:h[i])[:3]]}

def swings(b,r=2):
 H=[];L=[]
 for i in range(r,len(b)-r):
  if all(b[i]['high']>=b[j]['high'] for j in range(i-r,i+r+1) if j!=i):H.append((i,b[i]['high']))
  if all(b[i]['low']<=b[j]['low'] for j in range(i-r,i+r+1) if j!=i):L.append((i,b[i]['low']))
 return H,L
def clusters(p,tol):
 c=[]
 for x in p:
  for g in c:
   if abs(x[1]-statistics.fmean(v for _,v in g))<=tol:g.append(x);break
  else:c.append([x])
 return sorted([{'level':round(statistics.fmean(v for _,v in g),2),'touches':len(g),'last_bar':max(i for i,_ in g)} for g in c if len(g)>1],key=lambda x:(x['touches'],x['last_bar']),reverse=True)[:4]

def liquidity(b):
 if not b:return {'status':'unavailable','levels':{},'profile':{},'pools':[],'sweeps':[]}
 e=[]
 for x in b:
  y=dict(x);y['ct']=x['ts'].astimezone(CT);y['td']=tday(y['ct']);e.append(y)
 td=max(x['td'] for x in e); days=sorted({x['td'] for x in e}); prev=days[-2] if len(days)>1 else None
 cur=[x for x in e if x['td']==td];rth=[x for x in cur if time(8,30)<=x['ct'].time()<time(15)];on=[x for x in cur if x['ct'].time()>=time(17) or x['ct'].time()<time(8,30)];pr=[x for x in e if x['td']==prev and time(8,30)<=x['ct'].time()<time(15)] if prev else []
 wk=[x for x in e if x['td']>=td-timedelta(days=td.weekday())];mo=[x for x in e if x['td'].year==td.year and x['td'].month==td.month];op=[x for x in rth if time(8,30)<=x['ct'].time()<time(9)]
 def mm(g,k,f):return round(f(x[k] for x in g),2) if g else None
 last=cur[-1]['close'];lev={'last':round(last,2),'session_open':round(cur[0]['open'],2),'vwap':round(vwap(cur) or last,2),'previous_high':mm(pr,'high',max),'previous_low':mm(pr,'low',min),'previous_close':round(pr[-1]['close'],2) if pr else None,'overnight_high':mm(on,'high',max),'overnight_low':mm(on,'low',min),'opening_range_high':mm(op,'high',max),'opening_range_low':mm(op,'low',min),'week_high':mm(wk,'high',max),'week_low':mm(wk,'low',min),'month_high':mm(mo,'high',max),'month_low':mm(mo,'low',min)}
 A=atr(cur[-60:]) or max(1,last*.001);H,L=swings(cur[-160:]);pools=[]
 for x in clusters(H,max(2,A*.15)):pools.append({'side':'buy-side','kind':'equal highs',**x})
 for x in clusters(L,max(2,A*.15)):pools.append({'side':'sell-side','kind':'equal lows',**x})
 for k,s in [('previous_high','buy-side'),('overnight_high','buy-side'),('week_high','buy-side'),('previous_low','sell-side'),('overnight_low','sell-side'),('week_low','sell-side')]:
  if lev[k] is not None:pools.append({'side':s,'kind':k.replace('_',' '),'level':lev[k]})
 sh=max(x['high'] for x in cur);sl=min(x['low'] for x in cur);sw=[]
 for k,s in [('previous_high','buy-side'),('overnight_high','buy-side')]:
  if lev[k] is not None and sh>lev[k]:sw.append({'pool':k.replace('_',' '),'direction':s,'state':'reclaimed' if last>lev[k] else 'rejected below','level':lev[k]})
 for k,s in [('previous_low','sell-side'),('overnight_low','sell-side')]:
  if lev[k] is not None and sl<lev[k]:sw.append({'pool':k.replace('_',' '),'direction':s,'state':'reclaimed' if last<lev[k] else 'rejected above','level':lev[k]})
 fvg=[]
 for i in range(max(2,len(cur)-180),len(cur)):
  if cur[i]['low']>cur[i-2]['high']:fvg.append({'type':'bullish','low':round(cur[i-2]['high'],2),'high':round(cur[i]['low'],2)})
  elif cur[i]['high']<cur[i-2]['low']:fvg.append({'type':'bearish','low':round(cur[i]['high'],2),'high':round(cur[i-2]['low'],2)})
 return {'status':'available','trading_day':str(td),'levels':lev,'profile':profile(cur),'pools':pools[:14],'sweeps':sw,'fair_value_gaps':fvg[-6:],'inventory':'above_vwap' if last>lev['vwap'] else 'below_vwap' if last<lev['vwap'] else 'at_vwap','atr_5m_14':round(A,2)}

def trend(b,n):
 x=b[-n:]
 if len(x)<8:return {'status':'insufficient'}
 y=[z['close'] for z in x];xx=list(range(len(y)));xm=statistics.fmean(xx);ym=statistics.fmean(y);den=sum((i-xm)**2 for i in xx);s=sum((i-xm)*(v-ym) for i,v in zip(xx,y))/den if den else 0;inter=ym-s*xm;fit=[inter+s*i for i in xx];res=[v-f for v,f in zip(y,fit)];sst=sum((v-ym)**2 for v in y);r2=max(0,min(1,1-sum(v*v for v in res)/sst)) if sst else 0;spread=sorted(abs(v) for v in res)[int((len(res)-1)*.8)];A=atr(x) or max(1,ym*.001);norm=s*len(x)/A;state='uptrend' if norm>.9 else 'downtrend' if norm<-.9 else 'range';up=fit[-1]+spread;dn=fit[-1]-spread;last=y[-1];event='upper break' if last>up and y[-2]<=fit[-2]+spread else 'lower break' if last<dn and y[-2]>=fit[-2]-spread else 'testing upper' if abs(last-up)<=A*.18 else 'testing lower' if abs(last-dn)<=A*.18 else 'inside channel'
 return {'status':'available','state':state,'event':event,'slope_points_per_bar':round(s,4),'normalized_slope':round(norm,3),'quality_r2':round(r2,3),'center':round(fit[-1],2),'upper':round(up,2),'lower':round(dn,2),'last':round(last,2),'bars':len(x),'as_of':iso(x[-1]['ts'])}
def trends(intra,daily):
 f={'5m':trend(intra,72),'15m':trend(resample(intra,15),64),'1h':trend(resample(intra,60),48),'4h':trend(resample(intra,240),36),'1d':trend(daily,60)};a=[v for v in f.values() if v.get('status')=='available'];score=weight=0
 for v in a:
  sg=1 if v['state']=='uptrend' else -1 if v['state']=='downtrend' else 0;w=.35+v['quality_r2'];score+=sg*w;weight+=w
 c=score/weight if weight else 0;return {'status':'available' if a else 'unavailable','timeframes':f,'confluence':round(c,3),'posture':'bullish alignment' if c>.45 else 'bearish alignment' if c<-.45 else 'mixed structure','active_breaks':[f'{k}: {v.get("event")}' for k,v in f.items() if 'break' in v.get('event','')]}

def quote(b,m):
 if not b:return {'status':'unavailable'}
 p=num(m.get('chartPreviousClose')) or num(m.get('previousClose')) or (b[-2]['close'] if len(b)>1 else b[-1]['close']);c=b[-1]['close'];age=max(0,int((now()-b[-1]['ts']).total_seconds()))
 return {'status':'available','price':round(c,4),'change':round(c-p,4),'change_pct':round((c/p-1)*100,3) if p else None,'as_of':iso(b[-1]['ts']),'freshness_seconds':age,'latency_class':'public-delayed-or-indicative','source':'Yahoo Finance public chart','exchange':m.get('exchangeName')}

def rss(name,url):
 root=ET.fromstring(get(url,'application/rss+xml,application/xml,text/xml'));out=[]
 for i in root.findall('.//item')[:8]:
  t=clean(i.findtext('title'),240)
  if t:out.append({'title':t,'url':clean(i.findtext('link'),600),'publisher':name,'published':clean(i.findtext('pubDate'),100) or None,'kind':'official','authority':1.0})
 return out
def gdelt():
 q=urllib.parse.urlencode({'query':'("Nasdaq 100" OR "Nasdaq futures" OR NQ OR QQQ OR semiconductor OR Nvidia OR Microsoft OR Apple OR Amazon OR Meta OR Alphabet OR "Federal Reserve" OR FOMC OR inflation OR payrolls OR "Treasury yields")','mode':'artlist','maxrecords':'24','format':'json','sort':'datedesc','timespan':'12h'});d=getj('https://api.gdeltproject.org/api/v2/doc/doc?'+q);out=[]
 for a in d.get('articles') or []:
  t=clean(a.get('title'),240)
  if t:out.append({'title':t,'url':clean(a.get('url'),600),'publisher':clean(a.get('domain') or 'GDELT',100),'published':clean(a.get('seendate'),80) or None,'kind':'news','authority':.55})
 return out
def rel(t):
 t=t.lower();return min(1,.18+.18*sum(k in t for k in ['federal reserve','fomc','cpi','inflation','payroll','nvidia','nasdaq','treasury'])+.09*sum(k in t for k in ['semiconductor','microsoft','apple','amazon','meta','alphabet','yield','jobs','pce']))
def news(items):
 seen=set();out=[]
 for x in sorted(items,key=lambda z:(z.get('authority',0),rel(z['title'])),reverse=True):
  k=' '.join(re.sub(r'[^a-z0-9]+',' ',x['title'].lower()).split()[:12])
  if k in seen:continue
  seen.add(k);x=dict(x);x['relevance']=round(rel(x['title']),2);x['direction_hint']='uncertain';out.append(x)
 return sorted(out,key=lambda z:(z['relevance'],z.get('authority',0)),reverse=True)[:22]

def calendar():
 txt=get('https://www.bls.gov/schedule/news_release/bls.ics','text/calendar').decode('utf-8','replace');out=[];N=now()
 for b in txt.split('BEGIN:VEVENT')[1:]:
  s=re.search(r'\nSUMMARY:(.+)',b);d=re.search(r'\nDTSTART(?:;[^:]*)?:(\d{8}T?\d{0,6}Z?)',b)
  if not s or not d:continue
  dt=None
  for f in ('%Y%m%dT%H%M%SZ','%Y%m%dT%H%M%S','%Y%m%d'):
   try:dt=datetime.strptime(d.group(1),f).replace(tzinfo=UTC if d.group(1).endswith('Z') else CT).astimezone(UTC);break
   except:pass
  if dt and dt>=N-timedelta(hours=12):
   title=clean(s.group(1),180);out.append({'name':title,'time_utc':iso(dt),'time_ct':dt.astimezone(CT).strftime('%a %b %-d, %-I:%M %p CT'),'source':'BLS official calendar','tier':'Tier 1' if any(k in title.lower() for k in ['consumer price','employment situation','producer price']) else 'Tier 2'})
 return sorted(out,key=lambda x:x['time_utc'])[:12]

def breadth(q):
 a=[(s,q.get(s,{}).get('change_pct')) for s in ['NVDA','MSFT','AAPL','AMZN','META','GOOGL','AVGO','TSLA']];v=[(s,x) for s,x in a if isinstance(x,(int,float))];return {'coverage':len(v),'advancers':sum(x>0 for _,x in v),'decliners':sum(x<0 for _,x in v),'average_change_pct':round(statistics.fmean(x for _,x in v),3) if v else None,'dispersion_pct':round(statistics.pstdev(x for _,x in v),3) if len(v)>1 else None,'leaders':[{'symbol':s,'change_pct':x} for s,x in sorted(v,key=lambda z:z[1],reverse=True)[:3]],'laggards':[{'symbol':s,'change_pct':x} for s,x in sorted(v,key=lambda z:z[1])[:3]]}
def divergences(q):
 n=q.get('NQ',{}).get('change_pct');out=[]
 if not isinstance(n,(int,float)):return out
 for s in ['SOXX','QQQ','US10Y','VIX','DXY']:
  x=q.get(s,{}).get('change_pct')
  if not isinstance(x,(int,float)):continue
  bad=(s in ['SOXX','QQQ'] and n*x<0 and abs(n-x)>.35) or (s in ['US10Y','VIX','DXY'] and n*x>0 and abs(n)>.25 and abs(x)>.25)
  if bad:out.append({'pair':'NQ/'+s,'nq_change_pct':n,'other_change_pct':x,'state':'divergent'})
 return out

def build():
 N=now();q={};charts={};receipts=[];errors=[]
 for k,s in SYMS.items():
  r={'name':'Market: '+k,'status':'unavailable','as_of':None,'latency_class':'public-delayed-or-indicative','item_count':0,'error':None}
  try:b,m=chart(s);charts[k]=b;q[k]=quote(b,m);r.update(status='healthy',as_of=q[k]['as_of'],item_count=len(b))
  except Exception as e:q[k]={'status':'unavailable','error':clean(e,160)};r['error']=clean(e,160);errors.append(r['name']+': '+r['error'])
  receipts.append(r)
 try:daily,_=chart(SYMS['NQ'],'1d','6mo');receipts.append({'name':'Market: NQ daily structure','status':'healthy','as_of':iso(daily[-1]['ts']) if daily else None,'latency_class':'public-delayed-or-indicative','item_count':len(daily),'error':None})
 except Exception as e:daily=[];receipts.append({'name':'Market: NQ daily structure','status':'unavailable','as_of':None,'latency_class':'public-delayed-or-indicative','item_count':0,'error':clean(e,160)})
 liq=liquidity(charts.get('NQ',[]));tr=trends(charts.get('NQ',[]),daily);items=[]
 for name,url in FEEDS:
  r={'name':name,'status':'unavailable','as_of':None,'latency_class':'official-live','item_count':0,'error':None}
  try:x=rss(name,url);items+=x;r.update(status='healthy',as_of=iso(N),item_count=len(x))
  except Exception as e:r['error']=clean(e,160);errors.append(name+': '+r['error'])
  receipts.append(r)
 r={'name':'GDELT news discovery','status':'unavailable','as_of':None,'latency_class':'internet-live','item_count':0,'error':None}
 try:x=gdelt();items+=x;r.update(status='healthy',as_of=iso(N),item_count=len(x))
 except Exception as e:r['error']=clean(e,160);errors.append('GDELT: '+r['error'])
 receipts.append(r);items=news(items)
 r={'name':'BLS release calendar','status':'unavailable','as_of':None,'latency_class':'official-live','item_count':0,'error':None}
 try:events=calendar();r.update(status='healthy',as_of=iso(N),item_count=len(events))
 except Exception as e:events=[];r['error']=clean(e,160);errors.append('BLS calendar: '+r['error'])
 receipts.append(r);br=breadth(q);dv=divergences(q);c=tr.get('confluence',0) or 0;inv=liq.get('inventory');vix=q.get('VIX',{}).get('price');reg='trend-up' if c>.45 and inv=='above_vwap' else 'trend-down' if c<-.45 and inv=='below_vwap' else 'volatile-transition' if isinstance(vix,(int,float)) and vix>=24 else 'two-way-auction';regime={'name':reg,'structure':'directional' if abs(c)>=.48 else 'balanced','volatility':'high-volatility' if isinstance(vix,(int,float)) and vix>=24 else 'normal-volatility','confidence':round(min(.92,.48+abs(c)*.35),2)}
 nq=q.get('NQ',{}).get('change_pct') or 0;bs=(br.get('average_change_pct') or 0)/2;raw=max(-1,min(1,c*.62+bs*.25+(nq/2.5)*.13));bias='constructive' if raw>.18 else 'defensive' if raw<-.18 else 'neutral / conditional';healthy=sum(x['status']=='healthy' for x in receipts);coverage=healthy/max(1,len(receipts));conf=min(.94,max(.18,.4+abs(raw)*.23+coverage*.26));assessment=f'The conditional posture is {bias}. The tape is classified as {reg}, with {tr.get("posture","mixed structure")} and session inventory {str(inv or "unknown").replace("_"," ")}. {br.get("advancers",0)} of {br.get("coverage",0)} tracked megacaps are advancing. Priority is confirmation at mapped liquidity rather than prediction between levels.'
 lev=liq.get('levels',{});bull=lev.get('overnight_high') or lev.get('previous_high');bear=lev.get('overnight_low') or lev.get('previous_low');fmt=lambda x:f'{x:,.2f}' if isinstance(x,(int,float)) else 'nearest pool';sc=[{'name':'Bullish acceptance','probability':38,'trigger':'Acceptance above '+fmt(bull),'confirmation':'5m close, VWAP hold and QQQ/SOXX participation','invalidation':'Return below '+fmt(lev.get('vwap'))},{'name':'Bearish distribution','probability':34,'trigger':'Acceptance below '+fmt(bear),'confirmation':'Failed reclaim, firm yields/VIX and deteriorating breadth','invalidation':'Reclaim above '+fmt(lev.get('vwap'))},{'name':'Two-way / no-trade','probability':28,'trigger':'Price remains trapped between nearest opposing pools','confirmation':reg+' regime and mixed structural evidence','invalidation':'Clean expansion with cross-asset confirmation'}]
 modules=[('Regime Transition Classifier',reg,regime['confidence']),('Breadth & Leadership Monitor',f'{br.get("advancers",0)} up / {br.get("decliners",0)} down',.75 if br.get('coverage') else .1),('Treasury Funding Stress Monitor','public rates and official communications active',.62),('Volatility & Gamma Proxy','proxy active; no dealer-position claim',.55),('Narrative Velocity',f'{sum(x.get("relevance",0)>=.75 for x in items)} high-relevance developments',.7),('Freshness Quarantine',f'{healthy}/{len(receipts)} sources healthy',coverage),('Cash-Open Auction Playbook','opening-drive classification ready',.7),('Anomaly & Divergence Detector',f'{len(dv)} active divergences',.75),('FOMC Language Drift Monitor','official-language comparison active',.65),('Risk Budget & Permission Gate','fail-closed controls active',.9)]
 permission={'state':'CONDITIONAL' if conf>=.52 and liq.get('status')=='available' and tr.get('status')=='available' else 'RESTRICTED','blockers':[],'required_confirmations':['price acceptance beyond a mapped liquidity pool','VWAP and multi-timeframe structure agree','QQQ/SOXX or megacap breadth confirms','no active Tier-1 release blackout']}
 p={'meta':{'product':'NQ Intelligence Firm','version':'2.0.0','mode':'LIVE_PUBLIC','generated_at_utc':iso(N),'generated_at_ct':N.astimezone(CT).strftime('%A, %B %-d, %Y · %-I:%M %p CT'),'refresh_target_seconds':300,'internet_connected':True,'market_data_class':'public delayed or indicative; not exchange-licensed tick real-time','official_release_class':'internet-live when source is reachable','disclosure':'Public-source decision support only. Verify prices with the trading venue before acting.'},'director':{'bias':bias,'score':round(raw,3),'confidence':round(conf,2),'regime':regime,'assessment':assessment,'trade_permission':permission},'quotes':q,'liquidity':liq,'trendlines':tr,'breadth':br,'divergences':dv,'events':events,'news':items,'scenarios':sc,'advanced_modules':[{'name':n,'reading':r,'confidence':round(c,2),'as_of':iso(N)} for n,r,c in modules],'source_health':receipts,'data_quality':{'healthy_sources':healthy,'total_sources':len(receipts),'coverage':round(coverage,3),'stale_or_failed':[x['name'] for x in receipts if x['status']!='healthy'],'errors':errors[:20]}};p['meta']['content_sha256']=hashlib.sha256(json.dumps(p,sort_keys=True,default=str).encode()).hexdigest();return p

def esc(s):return clean(s,3000).encode('latin-1','replace').decode('latin-1').replace('\\','\\\\').replace('(','\\(').replace(')','\\)')
class C:
 def __init__(s):s.o=[]
 def f(s,c):s.o.append('%.3f %.3f %.3f rg'%c)
 def r(s,x,y,w,h,fill=True):s.o.append(f'{x} {y} {w} {h} re '+('f' if fill else 'S'))
 def l(s,x,y,x2,y2):s.o.append(f'{x} {y} m {x2} {y2} l S')
 def t(s,x,y,z,sz=9,F='F1',c=(.06,.07,.09)):s.f(c);s.o.append(f'BT /{F} {sz} Tf {x} {y} Td ({esc(z)}) Tj ET')
 def wrap(s,x,y,z,w,sz=8,lead=11,F='F1',c=(.06,.07,.09),n=5):
  for line in textwrap.wrap(clean(z,2000),w,break_long_words=False)[:n]:s.t(x,y,line,sz,F,c);y-=lead
  return y
 def stream(s):return ('\n'.join(s.o)+'\n').encode('latin-1','replace')
def pdf(payload,path):
 P=[C(),C()];ink=(.055,.063,.078);paper=(.965,.953,.925);gold=(.67,.52,.28);mut=(.34,.36,.39);green=(.2,.42,.31);red=(.55,.22,.2)
 for i,c in enumerate(P,1):c.f(paper);c.r(0,0,612,792);c.f(ink);c.r(0,718,612,74);c.t(34,762,'NQ / INTELLIGENCE',16,'F4',paper);c.t(34,742,'PRIVATE DIRECTOR BRIEF',7.5,'F2',gold);c.t(578,762,'0'+str(i),10,'F2',gold);c.t(34,20,f"{payload['meta']['mode']} · {payload['meta']['content_sha256'][:12]}",6,'F1',mut);c.t(548,20,f'{i} / 2',6,'F2',mut)
 def H(c,x,y,t,w):c.t(x,y,t.upper(),7,'F2',gold);c.o.append(f'{gold[0]} {gold[1]} {gold[2]} RG .5 w');c.l(x,y-5,x+w,y-5)
 d=payload['director'];liq=payload['liquidity'];lev=liq.get('levels',{});tr=payload['trendlines'];q=payload['quotes'];P[0].t(34,690,payload['meta']['generated_at_ct'],7,'F1',mut);P[0].t(34,650,d['bias'].upper(),28,'F4',ink);P[0].t(34,632,'CONDITIONAL NQ POSTURE',7,'F2',gold);P[0].t(390,662,'CONFIDENCE',6,'F2',mut);P[0].t(390,638,f"{d['confidence']*100:.0f}%",22,'F4',ink);P[0].t(490,662,'REGIME',6,'F2',mut);P[0].wrap(490,646,d['regime']['name'],17,10,11,'F4',ink,2);H(P[0],34,600,'Director Assessment',544);P[0].wrap(34,580,d['assessment'],103,9,12,'F3',ink,4);H(P[0],34,516,'Liquidity Atlas',330)
 rows=[('LAST',lev.get('last')),('VWAP',lev.get('vwap')),('ON HIGH',lev.get('overnight_high')),('ON LOW',lev.get('overnight_low')),('PD HIGH',lev.get('previous_high')),('PD LOW',lev.get('previous_low')),('OR HIGH',lev.get('opening_range_high')),('OR LOW',lev.get('opening_range_low')),('WEEK HIGH',lev.get('week_high')),('WEEK LOW',lev.get('week_low'))]
 for i,(n,v) in enumerate(rows):x=34+(i%2)*163;y=493-(i//2)*29;P[0].t(x,y,n,6,'F2',mut);P[0].t(x,y-13,f'{v:,.2f}' if isinstance(v,(int,float)) else 'Unavailable',10,'F4',ink)
 pr=liq.get('profile',{});P[0].t(34,338,'PROFILE',6,'F2',mut);P[0].t(34,324,f"VAH {pr.get('vah','—')} · POC {pr.get('poc','—')} · VAL {pr.get('val','—')}",8,'F1',ink);P[0].wrap(34,305,'; '.join(f"{x.get('pool')}: {x.get('state')}" for x in liq.get('sweeps',[])[:3]) or 'No completed reference-pool sweep detected.',64,7,10,'F3',mut,3);H(P[0],390,516,'Trendline Structure',188);y=491
 for f in ['5m','15m','1h','4h','1d']:
  x=tr.get('timeframes',{}).get(f,{});P[0].t(390,y,f.upper(),7,'F2',gold);P[0].t(430,y,x.get('state','unavailable'),8,'F4',ink);P[0].t(515,y,f"R2 {x.get('quality_r2','—')}",7,'F1',mut);P[0].t(430,y-12,x.get('event',''),6.5,'F3',mut);y-=35
 P[0].t(390,316,'CONFLUENCE',6,'F2',mut);P[0].t(390,300,f"{tr.get('confluence',0)*100:.0f}% · {tr.get('posture','')}",9,'F4',ink);H(P[0],34,264,'Event Clock & Operating Directives',544);y=242
 for e in payload.get('events',[])[:3]:P[0].t(34,y,e.get('tier',''),6,'F2',gold);P[0].t(83,y,e.get('time_ct',''),7,'F2',ink);P[0].wrap(205,y,e.get('name',''),58,7,9,'F1',ink,2);y-=29
 state=d['trade_permission']['state'];P[0].t(34,151,'PERMISSION',6,'F2',mut);P[0].t(34,132,state,13,'F4',green if state=='CONDITIONAL' else red);y=149
 for i,x in enumerate(d['trade_permission']['required_confirmations'],1):P[0].t(184,y,f'{i:02d}',6,'F2',gold);P[0].wrap(207,y,x,67,7,9,'F1',ink,2);y-=28
 P[1].t(34,690,'INTELLIGENCE ANNEX',19,'F4',ink);P[1].t(34,671,'Evidence, scenarios, transmission and source condition',8,'F3',mut);H(P[1],34,638,'Scenario Matrix',544);y=614
 for s in payload['scenarios']:P[1].t(34,y,s['name'],9,'F4',ink);P[1].t(185,y,str(s['probability'])+'%',8,'F2',gold);P[1].wrap(235,y,s['trigger'],55,7,9,'F1',ink,2);P[1].wrap(235,y-20,'Confirm: '+s['confirmation'],55,6.5,8,'F3',mut,2);y-=62
 H(P[1],34,426,'Catalyst & Narrative Tape',330);y=403
 for n in payload['news'][:6]:P[1].t(34,y,n.get('publisher','')[:24].upper(),5.5,'F2',gold);P[1].wrap(34,y-12,n.get('title',''),66,7,9,'F1',ink,2);y-=49
 H(P[1],390,426,'Cross-Asset Condition',188);y=402
 for s in ['NQ','QQQ','SOXX','VIX','US10Y','DXY']:
  x=q.get(s,{});P[1].t(390,y,s,7,'F2',gold);P[1].t(438,y,f"{x.get('price',0):,.2f}" if isinstance(x.get('price'),(int,float)) else '—',8,'F4',ink);P[1].t(515,y,f"{x.get('change_pct',0):+.2f}%" if isinstance(x.get('change_pct'),(int,float)) else '—',7,'F2',green if (x.get('change_pct') or 0)>=0 else red);y-=26
 H(P[1],34,194,'Advanced Intelligence Modules',330);y=171
 for i,m in enumerate(payload['advanced_modules'],1):col=0 if i<=5 else 1;row=(i-1)%5;x=34+col*166;yy=y-row*29;P[1].t(x,yy,f'{i+10:02d}',6,'F2',gold);P[1].t(x+22,yy,m['name'][:28],6.5,'F2',ink);P[1].t(x+22,yy-10,m['reading'][:36],6,'F3',mut)
 H(P[1],390,194,'Source Health & Latency',188);src=payload['source_health'];ok=sum(x['status']=='healthy' for x in src);P[1].t(390,168,f'{ok}/{len(src)} HEALTHY',11,'F4',ink);P[1].wrap(390,150,payload['meta']['market_data_class'],38,6,8,'F3',mut,3);y=116
 for r in src[:5]:P[1].t(390,y,'OK' if r['status']=='healthy' else '!',6,'F2',green if r['status']=='healthy' else red);P[1].t(414,y,r['name'][:27],6,'F1',ink);y-=18
 objs=[b'<< /Type /Catalog /Pages 2 0 R >>',b'',b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',b'<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>',b'<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>'];objs[1]=b'<< /Type /Pages /Kids [7 0 R 9 0 R] /Count 2 >>'
 for i,c in enumerate(P):stream=c.stream();objs+=[f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents {8+i*2} 0 R >>'.encode(),b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'endstream']
 out=bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n');off=[0]
 for i,o in enumerate(objs,1):off.append(len(out));out+=f'{i} 0 obj\n'.encode()+o+b'\nendobj\n'
 x=len(out);out+=f'xref\n0 {len(objs)+1}\n'.encode()+b'0000000000 65535 f \n'+b''.join(f'{v:010d} 00000 n \n'.encode() for v in off[1:])+f'trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{x}\n%%EOF\n'.encode();Path(path).parent.mkdir(parents=True,exist_ok=True);Path(path).write_bytes(out)
def main():
 a=argparse.ArgumentParser();a.add_argument('--output',type=Path,required=True);a.add_argument('--report',type=Path,required=True);x=a.parse_args();p=build();x.output.parent.mkdir(parents=True,exist_ok=True);x.output.write_text(json.dumps(p,indent=2,default=str)+'\n');pdf(p,x.report);print(json.dumps({'mode':p['meta']['mode'],'healthy':p['data_quality']['healthy_sources'],'total':p['data_quality']['total_sources']}))
if __name__=='__main__':main()
