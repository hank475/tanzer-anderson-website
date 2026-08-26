(() => {
  "use strict";
  const ORIGINAL = [
    ["Intelligence Delta Engine","Evidence","Isolates material changes from the prior published package."],
    ["Red-Team Contradiction Matrix","Evidence","Surfaces the strongest evidence against the primary posture."],
    ["NQ Concentration-Transmission Map","Flow","Translates megacap and semiconductor movement into index risk."],
    ["Claims Graph & Source Receipts","Evidence","Preserves provenance, authority, timestamps, corroboration, and hashes."],
    ["Three-Path Conditional Scenario Tree","Execution","Maintains bullish, bearish, and no-trade paths with invalidations."],
    ["Economic Surprise & Revision Ledger","Macro","Tracks official releases, revisions, and expectation gaps when available."],
    ["Historical Event-Analog Engine","Evidence","Builds a comparison archive across policy, macro, and volatility regimes."],
    ["Forecast-Calibration Scorecard","Risk","Measures probability discipline after outcomes resolve."],
    ["Flash-Intelligence Mode","Macro","Escalates material Tier-1 changes and cash-open developments."],
    ["Decision Journal & After-Action Review","Execution","Separates intelligence quality from execution quality."]
  ];
  const V2 = [
    ["Regime Transition Classifier","Structure","Accepts a regime change only when structural evidence confirms."],
    ["Breadth & Leadership Monitor","Flow","Tracks megacap and semiconductor participation behind NQ."],
    ["Treasury Funding Stress Monitor","Macro","Monitors rates, policy communication, and duration pressure."],
    ["Volatility & Gamma Proxy","Risk","Flags compression, expansion, and pin-risk proxies without dealer-position claims."],
    ["Narrative Velocity & Correlation","Macro","Measures topic acceleration and repeated catalyst clusters."],
    ["Freshness Quarantine & Confidence Decay","Evidence","Downgrades stale observations and isolates failed sources."],
    ["Cash-Open Auction Playbook","Execution","Classifies opening drive, rejection, test-drive, and rotational states."],
    ["Anomaly & Cross-Asset Divergence Detector","Flow","Flags inconsistent movement across NQ, QQQ, SOXX, rates, dollar, and VIX."],
    ["FOMC Language-Drift Monitor","Macro","Tracks changes in official policy language and risk framing."],
    ["Risk-Budget & Trade-Permission Gate","Risk","Fails closed when evidence quality or structural confirmation is insufficient."]
  ];
  const V22 = [
    ["Dealer Positioning Proxy","Flow","Infers a cautious positioning proxy from volatility, breadth dispersion, and index/ETF divergence."],
    ["Opening Drive Probability Engine","Execution","Scores acceptance outside the opening range using price, VWAP, and structural confirmation."],
    ["Session Archetype Memory","Structure","Classifies the current session into trend, reversal, balanced, or failed-break archetypes."],
    ["Cross-Market Liquidity Vacuum Detector","Flow","Detects simultaneous directional gaps across index, semiconductors, rates, dollar, and volatility."],
    ["Earnings Sensitivity Grid","Risk","Ranks current megacap leadership and concentration sensitivity."],
    ["Macro Release Impact Ladder","Macro","Ranks the next official macro events by tier and time proximity."],
    ["Orderflow Confirmation Gate","Execution","Requires liquidity, VWAP, trend, and breadth agreement before confirmation."],
    ["Risk-Reward Route Mapper","Risk","Maps the nearest opposing liquidity objectives and implied route asymmetry."],
    ["Oil-to-NQ Transmission Decomposer","Macro","Separates oil inflation, rates, volatility, and geopolitical channels affecting NQ."],
    ["Weekly Narrative Drift Monitor","Evidence","Measures which NQ narratives are gaining persistence across current headlines."]
  ];
  const n = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const cap = v => String(v ?? "").replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  const fmt = (v,d=2) => n(v) == null ? "—" : n(v).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
  const pct = (v,d=2) => n(v) == null ? "—" : `${n(v)>0?"+":""}${n(v).toFixed(d)}%`;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const nearestPool = (liq, direction) => {
    const cur=n(liq?.levels?.last), pools=(liq?.pools||[]).filter(p=>n(p.level)!=null && (direction==="up"?n(p.level)>cur:n(p.level)<cur));
    return pools.sort((a,b)=>Math.abs(n(a.level)-cur)-Math.abs(n(b.level)-cur))[0] || null;
  };
  function derive(nq={}, oil={}, previous=null) {
    const q=nq.quotes||{}, liq=nq.liquidity||{}, tr=nq.trendlines||{}, br=nq.breadth||{}, dv=nq.divergences||[], news=nq.news||[], events=nq.events||[];
    const cur=n(liq.levels?.last) ?? n(q.NQ?.price), vwap=n(liq.levels?.vwap), con=n(tr.confluence)||0;
    const delta=previous && previous.meta?.content_sha256 !== nq.meta?.content_sha256 ? `${cap(previous.director?.bias||"—")} → ${cap(nq.director?.bias||"—")}` : "Current baseline established";
    const contradictions=[];
    if((n(q.NQ?.change_pct)||0)<0 && con>0) contradictions.push("price/trend");
    if((n(q.NQ?.change_pct)||0)>0 && (n(br.average_change_pct)||0)<0) contradictions.push("price/breadth");
    if((n(oil.pressure?.score)||50)>65 && (n(q.US10Y?.change_pct)||0)<0) contradictions.push("oil/rates");
    const original=[
      [delta,72],
      [`${contradictions.length} contradiction${contradictions.length===1?"":"s"}${contradictions.length?` · ${contradictions.join(", ")}`:""}`,75],
      [`${br.advancers??0}/${br.coverage??0} megacaps advancing`,78],
      [`${nq.data_quality?.healthy_sources??0}/${nq.data_quality?.total_sources??0} sources · ${String(nq.meta?.content_sha256||"").slice(0,10)}`,92],
      [`${(nq.scenarios||[]).length} live paths · ${(nq.scenarios||[]).reduce((a,s)=>a+(n(s.probability)||0),0)}% allocated`,88],
      [`${events.length} official release windows`,65],
      ["Archive accumulating",45],["Awaiting resolved forecasts",35],
      [`${news.filter(x=>(n(x.relevance)||0)>=.75).length} high-relevance developments`,72],
      ["Browser-local review surface active",62]
    ];
    const liveV2=new Map((nq.advanced_modules||[]).map(m=>[m.name,[m.reading,Math.round((n(m.confidence)||0)*100)]]));
    const v2=V2.map(([name])=>liveV2.get(name) || ["Operational proxy",60]);
    const openHi=n(liq.levels?.opening_range_high), openLo=n(liq.levels?.opening_range_low);
    const openState=cur!=null&&openHi!=null&&cur>openHi?"Accepted above OR":cur!=null&&openLo!=null&&cur<openLo?"Accepted below OR":"Inside opening range";
    const driveScore=clamp(50+(cur!=null&&vwap!=null?(cur>vwap?12:-12):0)+con*25+(n(br.average_change_pct)||0)*4,5,95);
    const archetype=Math.abs(con)>.55?"Directional trend":(liq.sweeps||[]).length>=2?"Sweep-and-reversal":"Two-way auction";
    const megas=["NVDA","MSFT","AAPL","AMZN","META","GOOGL","AVGO","TSLA"].map(s=>({s,v:n(q[s]?.change_pct)})).filter(x=>x.v!=null).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
    const up=nearestPool(liq,"up"), down=nearestPool(liq,"down");
    const upDist=up&&cur!=null?n(up.level)-cur:null, downDist=down&&cur!=null?cur-n(down.level):null, rr=upDist!=null&&downDist?upDist/downDist:null;
    const checks=[cur!=null&&vwap!=null&&Math.sign(cur-vwap)===Math.sign(con),Math.sign(n(br.average_change_pct)||0)===Math.sign(con),(liq.sweeps||[]).some(s=>String(s.state).includes("reclaim"))];
    const confirmed=checks.filter(Boolean).length;
    const themes={rates:0,ai:0,inflation:0,earnings:0,semis:0,policy:0};
    news.forEach(item=>{const t=String(item.title||"").toLowerCase();if(/treasury|yield|rates/.test(t))themes.rates++;if(/ai|artificial intelligence|nvidia/.test(t))themes.ai++;if(/inflation|cpi|pce/.test(t))themes.inflation++;if(/earnings|revenue|guidance/.test(t))themes.earnings++;if(/semiconductor|chip|soxx/.test(t))themes.semis++;if(/federal reserve|fomc|policy/.test(t))themes.policy++});
    const topTheme=Object.entries(themes).sort((a,b)=>b[1]-a[1])[0]||["none",0];
    const oilScore=n(oil.pressure?.score), oilChannel=oilScore==null?"Oil layer unavailable":`${oilScore>=58?"Inflationary":"Disinflationary / balanced"} pressure · ${fmt(oilScore,1)}/100`;
    const v22=[
      [`${fmt(q.VIX?.price,1)} VIX · breadth dispersion ${fmt(br.dispersion_pct,2)}%`,68],
      [`${openState} · ${Math.round(driveScore)}% continuation proxy`,74],
      [`${archetype} · ${cap(nq.director?.regime?.name||"—")}`,76],
      [`${dv.length} divergence${dv.length===1?"":"s"} · ${dv.map(x=>x.pair).slice(0,2).join(", ")||"none"}`,72],
      [`${megas[0]?.s||"—"} ${pct(megas[0]?.v)} leads sensitivity`,70],
      [`${events[0]?.tier||"No tier"} · ${events[0]?.name||"No event"} · ${events[0]?.time_ct||"—"}`,78],
      [`${confirmed}/3 confirmation gates aligned`,80],
      [rr==null?"Opposing pools unavailable":`${fmt(rr,2)}× upside/downside · ${fmt(upDist)} / ${fmt(downDist)} pts`,73],
      [oilChannel,67],
      [`${cap(topTheme[0])} leads · ${topTheme[1]} current headlines`,69]
    ];
    return {original,v2,v22};
  }
  function modules(nq,oil,previous) {
    const readings=derive(nq,oil,previous), out=[];
    ORIGINAL.forEach((m,i)=>out.push({index:i+1,phase:"original",phaseLabel:"Original",name:m[0],category:m[1],description:m[2],reading:readings.original[i][0],confidence:readings.original[i][1]}));
    V2.forEach((m,i)=>out.push({index:i+11,phase:"v2",phaseLabel:"v2",name:m[0],category:m[1],description:m[2],reading:readings.v2[i][0],confidence:readings.v2[i][1]}));
    V22.forEach((m,i)=>out.push({index:i+21,phase:"v22",phaseLabel:"New v2.2",name:m[0],category:m[1],description:m[2],reading:readings.v22[i][0],confidence:readings.v22[i][1]}));
    return out;
  }
  window.NQModels={ORIGINAL,V2,V22,modules,cap,fmt,pct,clamp,n};
})();