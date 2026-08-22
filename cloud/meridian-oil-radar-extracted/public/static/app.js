(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const API = {
    config: '/api/config',
    snapshot: '/api/snapshot',
    news: '/api/news',
    health: '/api/source-health',
    clearCache: '/api/cache/clear'
  };

  const DEFAULT_WEIGHTS = {
    price_momentum: 30,
    inventories: 20,
    supply: 15,
    news_risk: 20,
    volatility: 10,
    macro: 5
  };
  const WEIGHT_LABELS = {
    price_momentum: 'Price momentum',
    inventories: 'Commercial inventories',
    supply: 'U.S. supply pulse',
    news_risk: 'News & geopolitical risk',
    volatility: 'Oil volatility / risk premium',
    macro: 'Dollar macro pressure'
  };
  const INSTRUMENT_ORDER = ['wti','brent','brent_wti_spread','natgas','gasoline','heating_oil','ovx','usd_broad','us10y','sp500','gold'];
  const state = {
    config: null,
    snapshot: null,
    health: null,
    selectedMarket: 'wti',
    selectedFundamental: 'crude_stocks',
    selectedNews: null,
    newsSort: 'impact',
    predictionFilter: 'all',
    fullRadarFiltered: [],
    weights: loadJSON('meridian.weights', DEFAULT_WEIGHTS),
    alerts: loadJSON('meridian.alerts', []),
    alertHistory: loadJSON('meridian.alertHistory', []),
    predictions: loadJSON('meridian.predictions', []),
    scenarios: loadJSON('meridian.scenarios', []),
    settings: loadJSON('meridian.settings', { autoRefresh: true, sound: false, compact: false }),
    autoRefreshTimer: null,
    commandIndex: 0,
    commandItems: [],
    refreshing: false,
    lastFullScan: null,
    chartRange: 90,
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return structuredCloneSafe(fallback);
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : structuredCloneSafe(fallback);
      if (fallback && typeof fallback === 'object') return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? { ...structuredCloneSafe(fallback), ...parsed }
        : structuredCloneSafe(fallback);
      return parsed;
    } catch { return structuredCloneSafe(fallback); }
  }
  function structuredCloneSafe(value) {
    return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  function uid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `mrd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function fmtNumber(value, decimals = 2) {
    if (value == null || !Number.isFinite(Number(value))) return '—';
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function fmtChange(value, decimals = 1) {
    if (value == null || !Number.isFinite(Number(value))) return '—';
    const n = Number(value);
    return `${n > 0 ? '+' : ''}${n.toFixed(decimals)}%`;
  }
  function changeClass(value) {
    if (value == null || Math.abs(value) < 0.0001) return 'flat';
    return value > 0 ? 'up' : 'down';
  }
  function timeAgo(iso) {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms)) return iso;
    const mins = Math.max(0, Math.floor(ms / 60000));
    if (mins < 1) return 'NOW';
    if (mins < 60) return `${mins}M AGO`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `${hours}H AGO`;
    return `${Math.floor(hours / 24)}D AGO`;
  }
  function shortDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'2-digit', timeZone:'UTC' });
  }
  function cap(value = '') { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function debounce(fn, delay = 200) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  }

  async function fetchJSON(url, options = {}, timeout = 25000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal, headers: { 'Accept':'application/json', ...(options.headers || {}) } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  function toast(title, message = '', type = 'success', duration = 4200) {
    const stack = $('#toastStack');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<strong>${escapeHTML(title)}</strong>${message ? `<p>${escapeHTML(message)}</p>` : ''}`;
    stack.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  function setConnection(status, text) {
    const dot = $('#liveDot');
    dot.className = `live-dot ${status}`;
    $('#connectionState').textContent = text;
  }

  function updateClock() {
    const now = new Date();
    const text = now.toLocaleTimeString('en-US', { hour12:false, timeZone:'UTC' });
    $('#utcClock').textContent = text;
    $('#radarUtcLabel').textContent = `UTC ${text}`;
  }

  function navigate(view) {
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $('#sidebar').classList.remove('open');
    window.scrollTo({ top:0, behavior:'smooth' });
    if (view === 'radar') renderFullRadar();
    if (view === 'markets') renderMarkets();
    if (view === 'fundamentals') renderFundamentals();
    if (view === 'news') renderNews();
    if (view === 'decision') updateScenario();
    if (view === 'predictions') renderPredictions();
    if (view === 'alerts') renderAlerts();
    if (view === 'settings') renderSettings();
  }

  function installNavigation() {
    $$('.nav-item').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.view)));
    $$('[data-view-jump]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.viewJump)));
    $('#mobileNavToggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#focusToggle').addEventListener('click', () => document.body.classList.toggle('focus-mode'));
  }

  async function initialize() {
    installNavigation();
    installEventHandlers();
    applySettings();
    updateClock();
    setInterval(updateClock, 1000);
    drawWorldLines();
    setConnection('', 'CONNECTING');
    try {
      const [config, snapshot] = await Promise.all([fetchJSON(API.config), fetchJSON(API.snapshot, {}, 45000)]);
      state.config = config;
      state.snapshot = snapshot;
      state.lastFullScan = new Date();
      state.health = await fetchJSON(API.health).catch(() => null);
      renderAll();
      evaluateAlerts();
      setConnection(snapshot.status === 'ok' ? 'ok' : 'error', snapshot.status === 'ok' ? 'CONNECTED' : 'PARTIAL');
    } catch (err) {
      setConnection('error', 'OFFLINE');
      showDataWarning(`The terminal loaded, but its cloud data service did not answer: ${err.message}`);
      toast('Data service unavailable', err.message, 'error', 9000);
      renderAll();
    } finally {
      $('#appShell').setAttribute('aria-hidden', 'false');
      setTimeout(() => $('#bootScreen').classList.add('done'), 250);
      configureAutoRefresh();
    }
  }

  function showDataWarning(message) {
    const el = $('#dataWarning');
    el.textContent = message;
    el.classList.toggle('hidden', !message);
  }

  async function refreshAll({silent = false, clearServerCache = false} = {}) {
    if (state.refreshing) return;
    state.refreshing = true;
    const btn = $('#refreshAll');
    btn.classList.add('loading');
    if (!silent) toast('Scan started', 'Refreshing news, markets, fundamentals, and source health.', 'warning', 2500);
    try {
      if (clearServerCache) await fetchJSON(API.clearCache, { method:'POST' }).catch(() => null);
      const [snapshot, health] = await Promise.all([fetchJSON(API.snapshot, {}, 50000), fetchJSON(API.health, {}, 20000)]);
      state.snapshot = snapshot;
      state.health = health;
      state.lastFullScan = new Date();
      renderAll();
      evaluateAlerts();
      setConnection(snapshot.status === 'ok' ? 'ok' : 'error', snapshot.status === 'ok' ? 'CONNECTED' : 'PARTIAL');
      if (!silent) toast('Scan complete', `${snapshot.news?.scan_count || 0} intelligence items; ${snapshot.market?.available_count || 0} market series; ${snapshot.fundamentals?.available_count || 0} fundamental series.`, 'success');
    } catch (err) {
      setConnection('error', 'DEGRADED');
      showDataWarning(`Refresh failed. Last-good data remains visible where available. ${err.message}`);
      if (!silent) toast('Refresh failed', err.message, 'error', 7000);
    } finally {
      state.refreshing = false;
      btn.classList.remove('loading');
    }
  }

  async function rescanNews(timespan = '24h', externalTerm = '') {
    const base = '("crude oil" OR petroleum OR OPEC OR refinery OR tanker OR "oil production")';
    const query = externalTerm ? `${base} AND (${externalTerm})` : base;
    try {
      const url = `${API.news}?timespan=${encodeURIComponent(timespan)}&maxrecords=150&query=${encodeURIComponent(query)}`;
      const result = await fetchJSON(url, {}, 45000);
      if (!state.snapshot) state.snapshot = {};
      state.snapshot.news = result;
      state.snapshot.generated_at = new Date().toISOString();
      renderNewsRelated();
      evaluateAlerts();
      toast('News scan complete', `${result.scan_count || 0} deduplicated items loaded.`, result.status === 'ok' ? 'success' : 'warning');
    } catch (err) { toast('News scan failed', err.message, 'error'); }
  }

  function configureAutoRefresh() {
    clearInterval(state.autoRefreshTimer);
    if (state.settings.autoRefresh) state.autoRefreshTimer = setInterval(() => refreshAll({silent:true}), 300000);
  }

  function applySettings() {
    $('#autoRefreshToggle').checked = !!state.settings.autoRefresh;
    $('#soundToggle').checked = !!state.settings.sound;
    $('#compactToggle').checked = !!state.settings.compact;
    document.body.classList.toggle('compact', !!state.settings.compact);
  }

  function renderAll() {
    renderBanners();
    renderTicker();
    renderDashboard();
    renderFullRadar();
    renderMarkets();
    renderFundamentals();
    renderNews();
    renderPredictions();
    renderAlerts();
    renderSettings();
    renderScenarios();
    updateSidebarStatus();
  }

  function renderBanners() {
    const demo = !!(state.config?.demo || state.snapshot?.demo);
    $('#demoBanner').classList.toggle('hidden', !demo);
    if (!state.snapshot) return;
    const failures = state.snapshot.source_summary?.failed || 0;
    const hasAny = state.snapshot.status === 'ok';
    if (!hasAny) showDataWarning('No live sources are currently available. The interface will not fabricate replacement values.');
    else if (failures) showDataWarning(`${failures} source checks are failing. Last-good values are marked stale where available; inspect Sources & Settings for detail.`);
    else showDataWarning('');
  }

  function getInstruments() { return state.snapshot?.market?.instruments || {}; }
  function getFundamentals() { return state.snapshot?.fundamentals?.indicators || {}; }
  function getNewsItems() { return state.snapshot?.news?.items || []; }

  function renderTicker() {
    const instruments = getInstruments();
    const track = $('#tickerTrack');
    const items = INSTRUMENT_ORDER.map(k => instruments[k]).filter(x => x?.status === 'ok').slice(0, 10);
    if (!items.length) {
      track.innerHTML = '<span class="ticker-loading">No public market series available — inspect source health.</span>';
      $('#tickerAsOf').textContent = 'AS OF —';
      return;
    }
    track.innerHTML = items.map(i => `<div class="ticker-item"><b>${escapeHTML(i.short)}</b><strong>${fmtNumber(i.value, i.decimals ?? 2)}</strong><em class="${changeClass(i.change_1)}">${fmtChange(i.change_1)}</em><small>${i.stale ? 'STALE' : 'DELAYED'}</small></div>`).join('');
    const dates = items.map(i => i.as_of).filter(Boolean).sort();
    $('#tickerAsOf').textContent = `LATEST ${shortDate(dates.at(-1))}`;
  }

  function adjustedPressure() {
    const source = state.snapshot?.pressure;
    if (!source || source.status !== 'ok') return source || { status:'unavailable', score:null, components:[] };
    const components = source.components || [];
    let total = 0, weighted = 0;
    components.forEach(c => {
      const w = Number(state.weights[c.key] ?? Math.round((c.default_weight || 0) * 100));
      if (w > 0) { total += w; weighted += c.score * w; }
    });
    if (!total) return { ...source, status:'unavailable', score:null, label:'Weights total zero' };
    const raw = weighted / total;
    const score = clamp(50 + raw / 2, 0, 100);
    const label = score >= 72 ? 'High upward pressure' : score >= 58 ? 'Moderate upward pressure' : score >= 42 ? 'Balanced / mixed' : score >= 28 ? 'Moderate downward pressure' : 'High downward pressure';
    return { ...source, score:Math.round(score * 10) / 10, raw_pressure:Math.round(raw * 100) / 100, label, custom_weight_total: total };
  }

  function renderDashboard() {
    const instruments = getInstruments();
    const news = getNewsItems();
    const pressure = adjustedPressure();
    const wti = instruments.wti;
    const brent = instruments.brent;
    const ovx = instruments.ovx;
    const highImpact = news.filter(n => n.impact >= 70).length;

    $('#pressureScore').textContent = pressure?.score == null ? '—' : fmtNumber(pressure.score, 1);
    $('#pressureMeter').style.width = `${pressure?.score || 0}%`;
    $('#pressureLabel').textContent = pressure?.label || 'Insufficient inputs';
    $('#kpiWti').textContent = wti?.status === 'ok' ? `$${fmtNumber(wti.value, 2)}` : '—';
    $('#kpiWtiChange').innerHTML = wti?.status === 'ok' ? `<span class="change ${changeClass(wti.change_1)}">${fmtChange(wti.change_1)} · ${shortDate(wti.as_of)}</span>` : 'Series unavailable';
    $('#kpiBrent').textContent = brent?.status === 'ok' ? `$${fmtNumber(brent.value, 2)}` : '—';
    $('#kpiBrentChange').innerHTML = brent?.status === 'ok' ? `<span class="change ${changeClass(brent.change_1)}">${fmtChange(brent.change_1)} · ${shortDate(brent.as_of)}</span>` : 'Series unavailable';
    $('#kpiOvx').textContent = ovx?.status === 'ok' ? fmtNumber(ovx.value, 1) : '—';
    $('#kpiOvxState').textContent = ovx?.status === 'ok' ? (ovx.value >= 45 ? 'Elevated risk regime' : ovx.value >= 30 ? 'Active risk regime' : 'Contained volatility') : 'Series unavailable';
    $('#kpiEvents').textContent = String(highImpact);
    $('#kpiCoverage').textContent = pressure?.coverage != null ? `${fmtNumber(pressure.coverage,0)}%` : '—';
    $('#kpiCoverageText').textContent = `${pressure?.components?.length || 0} components available`;
    $('#regimeValue').textContent = pressure?.score == null ? '—' : fmtNumber(pressure.score,0);
    $('#regimeLabel').textContent = pressure?.label || 'Insufficient inputs';
    $('#regimeNarrative').textContent = regimeNarrative(pressure);
    $('#briefAsOf').textContent = `AS OF ${state.snapshot?.generated_at ? timeAgo(state.snapshot.generated_at) : '—'}`;

    renderBriefList();
    renderPriorityFeed();
    renderPressureComponents();
    renderCommandRadar();
    renderCommandMarketChart();
  }

  function regimeNarrative(pressure) {
    if (!pressure || pressure.score == null) return 'Live source coverage is insufficient for a composite read.';
    const top = [...(pressure.components || [])].sort((a,b) => Math.abs(b.score * (state.weights[b.key] || 0)) - Math.abs(a.score * (state.weights[a.key] || 0)))[0];
    return top ? `${pressure.label}. The largest weighted driver is ${top.label.toLowerCase()}: ${top.reason}` : pressure.label;
  }

  function renderBriefList() {
    const news = [...getNewsItems()].sort(rankNews).slice(0, 4);
    const box = $('#briefList');
    if (!news.length) { box.innerHTML = '<div class="empty-line">No live intelligence items available.</div>'; return; }
    box.innerHTML = news.map(n => `<div class="brief-item ${n.direction}"><strong>${escapeHTML(n.title)}</strong><span>${n.impact} IMPACT · ${n.confidence}% CONF · ${timeAgo(n.published_at)}</span></div>`).join('');
  }

  function rankNews(a,b) {
    const sa = a.impact * .5 + a.confidence * .3 + a.freshness * .2;
    const sb = b.impact * .5 + b.confidence * .3 + b.freshness * .2;
    return sb - sa;
  }

  function renderPriorityFeed() {
    const news = [...getNewsItems()].sort(rankNews).slice(0, 6);
    const box = $('#priorityFeed');
    if (!news.length) { box.innerHTML = '<div class="empty-state compact">No live stories loaded.</div>'; return; }
    box.innerHTML = news.map(n => `<div class="priority-item" data-news-id="${n.id}"><div class="impact-badge ${n.direction}">${n.impact}</div><div><h4>${escapeHTML(n.title)}</h4><div class="priority-meta"><b>${escapeHTML(n.publisher)}</b><span>${timeAgo(n.published_at)}</span><span>${escapeHTML(n.category)}</span><span>${n.corroboration_count} source${n.corroboration_count === 1 ? '' : 's'}</span></div></div></div>`).join('');
    $$('.priority-item', box).forEach(el => el.addEventListener('click', () => openNewsEvidence(el.dataset.newsId)));
  }

  function renderPressureComponents() {
    const pressure = adjustedPressure();
    const box = $('#pressureComponents');
    if (!pressure?.components?.length) { box.innerHTML = '<div class="empty-state compact">Awaiting market, fundamental, and news inputs.</div>'; return; }
    box.innerHTML = pressure.components.map(c => {
      const weight = state.weights[c.key] ?? Math.round(c.default_weight * 100);
      const width = Math.min(50, Math.abs(c.score) / 2);
      return `<div class="component-card"><header><span>${escapeHTML(c.label)}</span><strong class="${c.score >= 0 ? 'up' : 'down'}">${c.score > 0 ? '+' : ''}${fmtNumber(c.score,0)}</strong></header><div class="component-bar"><i class="${c.score < 0 ? 'down' : ''}" style="width:${width}%"></i></div><p>${escapeHTML(c.reason)}</p><footer>${weight}% WEIGHT · ${shortDate(c.as_of)}</footer></div>`;
    }).join('');
  }

  function drawWorldLines() {
    const compactPaths = [
      'M115 175 C160 130 220 125 255 157 C270 178 260 203 230 216 C210 226 198 248 172 244 C142 240 124 210 115 175',
      'M245 275 C270 260 302 280 310 312 C318 349 290 393 266 421 C250 391 239 336 245 275',
      'M418 155 C455 127 520 128 558 145 C580 158 595 180 585 198 C565 224 525 214 500 229 C471 247 446 229 432 205 C419 186 411 171 418 155',
      'M480 235 C522 214 570 229 589 265 C600 289 584 323 560 345 C545 368 526 401 500 408 C480 382 467 346 460 310 C454 278 458 251 480 235',
      'M596 167 C641 143 694 155 720 190 C742 220 719 244 685 243 C653 242 635 226 612 211 C598 201 587 183 596 167',
      'M649 355 C675 338 714 349 733 372 C746 390 735 416 709 421 C676 427 651 404 649 355'
    ];
    $('#commandWorldLines').innerHTML = compactPaths.map(d => `<path d="${d}"/>`).join('');
    const scalePath = d => d.replace(/-?\d+(?:\.\d+)?/g, (m, offset, str) => {
      const before = str.slice(0, offset);
      const nums = (before.match(/-?\d+(\.\d+)?/g) || []).length;
      const n = Number(m);
      return String(Math.round((nums % 2 === 0 ? n * 1.25 : n * 1.3077) * 10) / 10);
    });
    $('#fullWorldLines').innerHTML = compactPaths.map(d => `<path d="${scalePath(d)}"/>`).join('');
  }

  function radarCoordinates(item, full = false, maxAgeHours = 24 * 7) {
    const cx = full ? 500 : 400, cy = full ? 340 : 260;
    const maxR = full ? 385 : 295, minR = full ? 75 : 55;
    const age = clamp(Number(item.age_hours || 0), 0, maxAgeHours);
    const radius = minR + (age / maxAgeHours) * (maxR - minR);
    const lon = Number(item.location?.lon || 0), lat = Number(item.location?.lat || 0);
    const angle = ((lon + 180) / 360) * Math.PI * 2 - Math.PI / 2 + (lat / 90) * .18;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius * .68 };
  }

  function radarNodeMarkup(item, full = false, maxAgeHours = 168) {
    const {x,y} = radarCoordinates(item, full, maxAgeHours);
    const size = (full ? 4.5 : 3.5) + (item.impact || 0) / (full ? 17 : 20);
    return `<g class="radar-node ${item.direction}" data-news-id="${item.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle class="node-ring" r="${(size * 1.7).toFixed(1)}"/><circle class="node-core" r="${size.toFixed(1)}"/></g>`;
  }

  function bindRadarNodes(root) {
    $$('.radar-node', root).forEach(node => {
      const item = getNewsItems().find(n => n.id === node.dataset.newsId);
      node.addEventListener('click', () => selectRadarEvidence(node.dataset.newsId));
      node.addEventListener('mouseenter', e => showNodeTooltip(e, item));
      node.addEventListener('mousemove', e => moveNodeTooltip(e));
      node.addEventListener('mouseleave', hideNodeTooltip);
    });
  }

  function renderCommandRadar() {
    const items = [...getNewsItems()].sort(rankNews).slice(0, 34);
    $('#commandRadarNodes').innerHTML = items.map(n => radarNodeMarkup(n, false, 168)).join('');
    bindRadarNodes($('#commandRadar'));
    $('#radarScanCount').textContent = `${items.length} nodes`;
    $('#radarScanState').textContent = state.snapshot?.news?.status === 'ok' ? 'SCANNING' : 'DEGRADED';
    $('#radarBadge').textContent = String(items.length);
    $('#newsBadge').textContent = String(getNewsItems().length);
  }

  function filteredRadarItems() {
    const impact = Number($('#radarImpactFilter')?.value || 0);
    const confidence = Number($('#radarConfidenceFilter')?.value || 0);
    const direction = $('#radarDirectionFilter')?.value || 'all';
    const category = $('#radarCategoryFilter')?.value || 'all';
    return getNewsItems().filter(n => n.impact >= impact && n.confidence >= confidence && (direction === 'all' || n.direction === direction) && (category === 'all' || n.category === category));
  }

  function renderFullRadar() {
    populateCategorySelects();
    const items = filteredRadarItems().sort(rankNews).slice(0, 100);
    state.fullRadarFiltered = items;
    const span = $('#radarTimeFilter')?.value || '24h';
    const maxAgeHours = span.endsWith('h') ? Number(span.replace('h','')) : span.endsWith('d') ? Number(span.replace('d','')) * 24 : 168;
    $('#fullRadarNodes').innerHTML = items.map(n => radarNodeMarkup(n, true, maxAgeHours)).join('');
    bindRadarNodes($('#fullRadar'));
    $('#fullRadarCount').textContent = `${items.length} EVENTS`;
  }

  function showNodeTooltip(event, item) {
    if (!item) return;
    const tt = $('#nodeTooltip');
    tt.innerHTML = `<strong>${escapeHTML(item.title)}</strong><span>${item.impact} impact · ${item.confidence}% confidence · ${escapeHTML(item.location?.name || 'Global')}</span>`;
    tt.classList.remove('hidden');
    moveNodeTooltip(event);
  }
  function moveNodeTooltip(event) {
    const tt = $('#nodeTooltip');
    tt.style.left = `${Math.min(window.innerWidth - 300, event.clientX + 14)}px`;
    tt.style.top = `${Math.min(window.innerHeight - 90, event.clientY + 14)}px`;
  }
  function hideNodeTooltip() { $('#nodeTooltip').classList.add('hidden'); }

  function selectRadarEvidence(id) {
    const item = getNewsItems().find(n => n.id === id);
    if (!item) return;
    state.selectedNews = id;
    $$('.radar-node').forEach(n => n.classList.toggle('selected', n.dataset.newsId === id));
    $('#radarEvidenceEmpty').classList.add('hidden');
    const box = $('#radarEvidenceContent');
    box.classList.remove('hidden');
    box.innerHTML = `<div class="evidence-score-row"><div class="evidence-score"><span>IMPACT</span><strong>${item.impact}</strong></div><div class="evidence-score"><span>CONFIDENCE</span><strong>${item.confidence}%</strong></div><div class="evidence-score"><span>FRESHNESS</span><strong>${item.freshness}</strong></div></div><h3 class="evidence-title">${escapeHTML(item.title)}</h3><div class="evidence-meta"><span class="chip ${item.direction}">${cap(item.direction)}</span><span class="chip">${escapeHTML(item.category)}</span><span class="chip">${item.corroboration_count} source${item.corroboration_count === 1 ? '' : 's'}</span></div><div class="evidence-block"><span>WHY IT MATTERS</span><p>${escapeHTML(item.why_it_matters)}</p></div><div class="evidence-block"><span>INFERRED EVENT LOCATION</span><p>${escapeHTML(item.location?.name || 'Global')} · ${Math.round((item.location?.confidence || 0) * 100)}% inference confidence<br>${escapeHTML(item.location?.basis || '')}</p></div><div class="evidence-block"><span>SOURCE & TIME</span><p>${escapeHTML(item.publisher)} · ${timeAgo(item.published_at)} · source tier ${item.source_tier}<br>${item.summary ? escapeHTML(item.summary.slice(0, 260)) : 'No source summary supplied.'}</p></div><a class="gold-button source-link" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL SOURCE</a>`;
    if (!$('#view-radar').classList.contains('active')) navigate('radar');
  }
  function openNewsEvidence(id) { selectRadarEvidence(id); }

  function renderCommandMarketChart() {
    const instruments = getInstruments();
    const days = Number($('#commandChartRange')?.value || 90);
    const wti = instruments.wti, brent = instruments.brent;
    const datasets = [];
    if (wti?.status === 'ok') datasets.push({ name:'WTI', data:lastDays(wti.series, days), color:'#f0a73a' });
    if (brent?.status === 'ok') datasets.push({ name:'Brent', data:lastDays(brent.series, days), color:'#35d6c2' });
    drawLineChart($('#commandMarketChart'), datasets, { valueFormatter:v => `$${fmtNumber(v,0)}` });
    $('#commandMarketEmpty').classList.toggle('hidden', datasets.length > 0);
    const spread = instruments.brent_wti_spread;
    $('#spreadLegend').textContent = spread?.status === 'ok' ? `LATEST SPREAD $${fmtNumber(spread.value,2)}` : 'SPREAD —';
  }

  function lastDays(series = [], days = 90) {
    const cutoff = Date.now() - days * 86400000;
    return series.filter(r => new Date(`${r.date}T00:00:00Z`).getTime() >= cutoff);
  }

  function drawLineChart(canvas, datasets, options = {}) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width || canvas.parentElement?.clientWidth || 600));
    const cssHeight = Number(canvas.getAttribute('height')) || 260;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = cssHeight * ratio;
    canvas.style.height = `${cssHeight}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.clearRect(0,0,width,cssHeight);
    const pad = { l:48, r:18, t:18, b:30 };
    const w = width - pad.l - pad.r, h = cssHeight - pad.t - pad.b;
    const all = datasets.flatMap(d => d.data || []).filter(p => Number.isFinite(Number(p.value)));
    if (!all.length) return;
    const values = all.map(p => Number(p.value));
    let min = Math.min(...values), max = Math.max(...values);
    if (min === max) { min -= 1; max += 1; }
    const buffer = (max - min) * .08;
    min -= buffer; max += buffer;
    const dates = all.map(p => new Date(`${p.date}T00:00:00Z`).getTime());
    const minX = Math.min(...dates), maxX = Math.max(...dates);
    ctx.font = '9px SFMono-Regular, Consolas, monospace';
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120,155,170,.12)';
    ctx.fillStyle = '#5d747e';
    for (let i=0;i<=4;i++) {
      const y = pad.t + h * i/4;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(width-pad.r,y); ctx.stroke();
      const val = max - (max-min)*i/4;
      ctx.fillText(options.valueFormatter ? options.valueFormatter(val) : fmtNumber(val,1), 3, y+3);
    }
    for (let i=0;i<=4;i++) {
      const x = pad.l + w*i/4;
      ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,cssHeight-pad.b); ctx.stroke();
      const dateValue = new Date(minX + (maxX-minX)*i/4);
      ctx.fillText(dateValue.toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'}), Math.max(pad.l, x-18), cssHeight-9);
    }
    datasets.forEach(ds => {
      const data = (ds.data || []).filter(p => Number.isFinite(Number(p.value)));
      if (!data.length) return;
      ctx.beginPath();
      data.forEach((p,i) => {
        const px = pad.l + ((new Date(`${p.date}T00:00:00Z`).getTime()-minX)/(maxX-minX || 1))*w;
        const py = pad.t + (1-(Number(p.value)-min)/(max-min))*h;
        i ? ctx.lineTo(px,py) : ctx.moveTo(px,py);
      });
      ctx.strokeStyle = ds.color || '#f0a73a';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      const last = data.at(-1);
      const lx = pad.l + ((new Date(`${last.date}T00:00:00Z`).getTime()-minX)/(maxX-minX || 1))*w;
      const ly = pad.t + (1-(Number(last.value)-min)/(max-min))*h;
      ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);ctx.fillStyle=ds.color||'#f0a73a';ctx.fill();
    });
  }

  function renderMarkets() {
    const instruments = getInstruments();
    const grid = $('#marketCardGrid');
    const available = INSTRUMENT_ORDER.map(k => instruments[k]).filter(Boolean);
    grid.innerHTML = available.map(i => `<div class="market-card ${state.selectedMarket === i.key ? 'selected':''}" data-market="${i.key}"><header><span>${escapeHTML(i.short)}</span><em>${i.stale ? 'STALE' : i.status === 'ok' ? 'DELAYED' : 'OFFLINE'}</em></header><strong>${i.status === 'ok' ? `${i.unit.startsWith('$') ? '$':''}${fmtNumber(i.value,i.decimals ?? 2)}` : '—'}</strong><footer><span class="change ${changeClass(i.change_1)}">${fmtChange(i.change_1)}</span><span>${shortDate(i.as_of)}</span></footer></div>`).join('') || '<div class="empty-state compact">No market instruments available.</div>';
    $$('.market-card', grid).forEach(card => card.addEventListener('click', () => { state.selectedMarket = card.dataset.market; renderMarkets(); }));

    const select = $('#marketInstrumentSelect');
    select.innerHTML = available.map(i => `<option value="${i.key}">${escapeHTML(i.label)}</option>`).join('');
    select.value = state.selectedMarket in instruments ? state.selectedMarket : (available[0]?.key || '');
    state.selectedMarket = select.value || state.selectedMarket;
    const chosen = instruments[state.selectedMarket];
    $('#selectedMarketTitle').textContent = chosen?.label || 'Selected instrument';
    const range = Number($('#marketRange')?.value || 365);
    const data = chosen?.status === 'ok' ? lastDays(chosen.series, range) : [];
    drawLineChart($('#marketDetailChart'), data.length ? [{name:chosen.short,data,color:'#f0a73a'}] : [], { valueFormatter:v => `${chosen?.unit?.startsWith('$') ? '$':''}${fmtNumber(v, chosen?.decimals > 2 ? 2 : 1)}` });
    $('#marketDetailEmpty').classList.toggle('hidden', data.length > 0);
    $('#marketStats').innerHTML = chosen ? [
      ['LATEST', chosen.status === 'ok' ? fmtNumber(chosen.value,chosen.decimals ?? 2) : '—'],
      ['1 OBS',fmtChange(chosen.change_1)],['5 OBS',fmtChange(chosen.change_5)],['20 OBS',fmtChange(chosen.change_20)],['60D Z',chosen.zscore_60 != null ? fmtNumber(chosen.zscore_60,2) : '—']
    ].map(([l,v]) => `<div><span>${l}</span><strong>${v}</strong></div>`).join('') : '';

    const tbody = $('#movementMatrix tbody');
    tbody.innerHTML = available.map(i => `<tr><td><strong>${escapeHTML(i.short)}</strong><br><span class="headline-sub">${escapeHTML(i.label)}</span></td><td class="mono change ${changeClass(i.change_1)}">${fmtChange(i.change_1)}</td><td class="mono change ${changeClass(i.change_5)}">${fmtChange(i.change_5)}</td><td class="mono change ${changeClass(i.change_20)}">${fmtChange(i.change_20)}</td><td class="mono">${i.zscore_60 != null ? fmtNumber(i.zscore_60,2) : '—'}</td><td class="mono">${shortDate(i.as_of)}</td></tr>`).join('');
    populateAlertInstruments();
  }

  function renderFundamentals() {
    const indicators = getFundamentals();
    const keys = Object.keys(indicators);
    if (!(state.selectedFundamental in indicators)) state.selectedFundamental = keys[0] || 'crude_stocks';
    const grid = $('#fundamentalGrid');
    grid.innerHTML = keys.map(k => {
      const i = indicators[k];
      const change = i.display_change;
      const signalUp = i.bullish_when_down ? change < 0 : change > 0;
      return `<div class="fundamental-card ${state.selectedFundamental === k ? 'selected':''}" data-fundamental="${k}"><span>${escapeHTML(i.short)}</span><strong>${i.status === 'ok' ? `${fmtNumber(i.display_value,i.decimals ?? 1)} ${escapeHTML(i.display_unit || '')}` : '—'}</strong><em class="change ${change == null ? 'flat' : signalUp ? 'up':'down'}">${change == null ? '—' : `${change > 0 ? '+' : ''}${fmtNumber(change,i.decimals ?? 1)} ${escapeHTML(i.display_unit || '')}`}</em><div class="percentile-track"><i style="width:${clamp(i.percentile_5y || 0,0,100)}%"></i></div><footer><span>${i.percentile_5y != null ? `${fmtNumber(i.percentile_5y,0)}TH %ILE` : 'NO RANGE'}</span><span>${shortDate(i.as_of)}</span></footer></div>`;
    }).join('') || '<div class="empty-state compact">No weekly fundamental series available. The terminal will not substitute fake values.</div>';
    $$('.fundamental-card', grid).forEach(card => card.addEventListener('click', () => { state.selectedFundamental = card.dataset.fundamental; renderFundamentals(); }));
    const select = $('#fundamentalSelect');
    select.innerHTML = keys.map(k => `<option value="${k}">${escapeHTML(indicators[k].label)}</option>`).join('');
    select.value = state.selectedFundamental;
    const chosen = indicators[state.selectedFundamental];
    $('#fundamentalChartTitle').textContent = chosen?.label || 'Weekly fundamental';
    const data = chosen?.status === 'ok' ? lastDays(chosen.series, 365*5).map(r => ({date:r.date,value:r.value/(chosen.display_divisor || 1)})) : [];
    drawLineChart($('#fundamentalChart'), data.length ? [{name:chosen.short,data,color:'#f0a73a'}] : [], { valueFormatter:v => fmtNumber(v,1) });
    $('#fundamentalChartEmpty').classList.toggle('hidden', data.length > 0);
    $('#fundamentalFootnote').textContent = chosen ? `Source: ${chosen.source_label || 'EIA via FRED'} · ${chosen.display_unit || chosen.unit} · latest observation ${shortDate(chosen.as_of)}${chosen.stale ? ' · STALE' : ''}.` : 'Source unavailable.';
    renderInventoryRead();
  }

  function renderInventoryRead() {
    const crude = getFundamentals().crude_stocks;
    const box = $('#inventoryRead');
    if (!crude || crude.status !== 'ok') { box.innerHTML = '<div class="empty-state compact">Commercial crude inventory series unavailable.</div>'; $('#inventoryAsOf').textContent='AS OF —'; return; }
    const change = crude.display_change;
    const direction = change < 0 ? 'draw' : change > 0 ? 'build' : 'unchanged';
    const pressure = change < -3 ? 'Strong upward pressure' : change < 0 ? 'Mild upward pressure' : change > 3 ? 'Strong downward pressure' : change > 0 ? 'Mild downward pressure' : 'Neutral';
    box.innerHTML = `<div class="inventory-signal"><strong>${change > 0 ? '+' : ''}${fmtNumber(change,1)}</strong><div><strong>${cap(direction)} · ${pressure}</strong><p>Week-over-week change in U.S. commercial crude inventories excluding the SPR.</p></div></div><div class="inventory-signal"><strong>${crude.percentile_5y != null ? fmtNumber(crude.percentile_5y,0) : '—'}</strong><div><strong>Five-year percentile</strong><p>Current stock level relative to the available trailing five-year observation set.</p></div></div>`;
    $('#inventoryAsOf').textContent = `AS OF ${shortDate(crude.as_of)}`;
  }

  function populateCategorySelects() {
    const categories = [...new Set(getNewsItems().map(n => n.category).filter(Boolean))].sort();
    ['radarCategoryFilter','newsCategory'].forEach(id => {
      const select = $(`#${id}`); if (!select) return;
      const current = select.value || 'all';
      const first = id === 'radarCategoryFilter' ? 'ALL CATEGORIES' : 'ALL';
      select.innerHTML = `<option value="all">${first}</option>${categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('')}`;
      if ([...select.options].some(o => o.value === current)) select.value = current;
    });
  }

  function renderNewsRelated() {
    renderBanners(); renderCommandRadar(); renderFullRadar(); renderPriorityFeed(); renderBriefList(); renderNews(); renderDashboard(); updateSidebarStatus();
  }

  function filteredNewsItems() {
    const query = ($('#newsSearch')?.value || '').trim().toLowerCase();
    const category = $('#newsCategory')?.value || 'all';
    const direction = $('#newsDirection')?.value || 'all';
    const minImpact = Number($('#newsImpact')?.value || 0);
    const items = getNewsItems().filter(n => {
      const text = `${n.title} ${n.publisher} ${n.category} ${n.location?.name || ''}`.toLowerCase();
      return (!query || text.includes(query)) && (category === 'all' || n.category === category) && (direction === 'all' || n.direction === direction) && n.impact >= minImpact;
    });
    if (state.newsSort === 'time') return items.sort((a,b) => new Date(b.published_at)-new Date(a.published_at));
    return items.sort(rankNews);
  }

  function renderNews() {
    populateCategorySelects();
    const items = filteredNewsItems();
    $('#newsImpactOutput').textContent = $('#newsImpact')?.value || '0';
    $('#newsResultCount').textContent = `${items.length} RESULTS`;
    const total = getNewsItems();
    const counts = {
      total: total.length,
      high: total.filter(n => n.impact >= 70).length,
      bull: total.filter(n => n.direction === 'bullish').length,
      bear: total.filter(n => n.direction === 'bearish').length,
      official: total.filter(n => n.source_kind === 'Official RSS').length,
      multi: total.filter(n => n.corroboration_count > 1).length
    };
    $('#newsSummaryStrip').innerHTML = [
      ['SCANNED',counts.total],['HIGH IMPACT',counts.high],['UPWARD',counts.bull],['DOWNWARD',counts.bear],['OFFICIAL RSS',counts.official],['CORROBORATED',counts.multi]
    ].map(([l,v]) => `<div class="summary-chip"><span>${l}</span><strong>${v}</strong></div>`).join('');
    const tbody = $('#newsTable tbody');
    tbody.innerHTML = items.map(n => `<tr data-news-id="${n.id}"><td class="mono">${timeAgo(n.published_at)}<br><span class="headline-sub">${shortDate(n.published_at)}</span></td><td><span class="impact-number ${n.impact>=70?'high':''}">${n.impact}</span></td><td><span class="direction-pill ${n.direction}">${n.direction === 'bullish' ? 'UP' : n.direction === 'bearish' ? 'DOWN' : 'MIXED'}</span></td><td class="headline-cell"><a class="headline-link" href="${escapeHTML(n.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(n.title)}</a><div class="headline-sub">${escapeHTML(n.publisher)} · ${escapeHTML(n.source_kind)} · TIER ${n.source_tier}</div></td><td>${escapeHTML(n.category)}</td><td>${escapeHTML(n.location?.name || 'Global')}<div class="headline-sub">${Math.round((n.location?.confidence || 0)*100)}% inferred</div></td><td class="mono">${n.confidence}%</td><td class="mono">${n.corroboration_count} SRC</td></tr>`).join('') || '<tr><td colspan="8"><div class="empty-state compact">No intelligence items match the active filters.</div></td></tr>';
    $$('tr[data-news-id]', tbody).forEach(row => row.addEventListener('dblclick', () => openNewsEvidence(row.dataset.newsId)));
  }

  function scenarioValues() {
    return {
      supply: Number($('#supplySlider').value),
      opec: Number($('#opecSlider').value),
      inventory: Number($('#inventorySlider').value),
      refinery: Number($('#refinerySlider').value),
      dollar: Number($('#dollarSlider').value),
      risk: Number($('#riskSlider').value)
    };
  }

  const SCENARIO_PRESETS = {
    custom:{supply:0,opec:0,inventory:0,refinery:0,dollar:0,risk:0},
    hormuz:{supply:4.0,opec:0,inventory:-6,refinery:4,dollar:1.5,risk:95},
    opec:{supply:0,opec:-1.5,inventory:-2,refinery:0,dollar:0,risk:30},
    inventory:{supply:0,opec:0,inventory:-12,refinery:0,dollar:0,risk:15},
    refinery:{supply:0,opec:0,inventory:2,refinery:12,dollar:0,risk:25},
    hurricane:{supply:1.8,opec:0,inventory:-5,refinery:8,dollar:0,risk:70},
    dollar:{supply:0,opec:0,inventory:0,refinery:0,dollar:-5,risk:10}
  };

  function applyScenarioPreset(name) {
    const p = SCENARIO_PRESETS[name] || SCENARIO_PRESETS.custom;
    Object.entries(p).forEach(([k,v]) => $(`#${k}Slider`).value = v);
    updateScenario();
  }

  function updateScenario() {
    const v = scenarioValues();
    $('#supplyOut').textContent = `${v.supply.toFixed(1)} MMbbl/d`;
    $('#opecOut').textContent = `${v.opec.toFixed(1)} MMbbl/d`;
    $('#inventoryOut').textContent = `${v.inventory.toFixed(1)} MMbbl`;
    $('#refineryOut').textContent = `${v.refinery.toFixed(0)}%`;
    $('#dollarOut').textContent = `${v.dollar.toFixed(1)}%`;
    $('#riskOut').textContent = `${v.risk.toFixed(0)} / 100`;
    const contributions = [
      ['Supply disruption', v.supply * 12],
      ['OPEC output change', -v.opec * 14],
      ['Inventory surprise', -v.inventory * 2.2],
      ['Refinery outage', v.refinery * 1.8],
      ['Dollar move', -v.dollar * 3.2],
      ['Geopolitical risk', v.risk * .34]
    ];
    const raw = clamp(contributions.reduce((s,[,x]) => s+x,0), -100,100);
    const score = Math.round(raw);
    const dial = clamp((score + 100)/200*360,0,360);
    $('#scenarioGauge').style.background = `conic-gradient(${score>=0?'#f0a73a':'#35d6c2'} ${dial}deg,#172831 ${dial}deg)`;
    $('#scenarioScore').textContent = score > 0 ? `+${score}` : String(score);
    const label = score >= 65 ? 'Severe upward pressure' : score >= 30 ? 'Material upward pressure' : score > 8 ? 'Mild upward pressure' : score <= -65 ? 'Severe downward pressure' : score <= -30 ? 'Material downward pressure' : score < -8 ? 'Mild downward pressure' : 'Neutral / balanced';
    $('#scenarioLabel').textContent = label;
    const top = [...contributions].sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))[0];
    $('#scenarioNarrative').textContent = Math.abs(raw) < 8 ? 'Assumptions roughly offset one another.' : `${top[0]} is the dominant modeled driver. The result is directional sensitivity, not a price forecast.`;
    $('#caseGrid').innerHTML = [
      ['BEST CASE',clamp(score + 18,-100,100),'Assumes faster normalization and weaker transmission.'],
      ['BASE CASE',score,'Uses the current operator assumptions.'],
      ['WORST CASE',clamp(score - 18,-100,100),'Assumes persistence, substitution, and demand offsets.']
    ].map(([l,s,p]) => `<div class="case-card"><span>${l}</span><strong>${s>0?'+':''}${s}</strong><p>${p}</p></div>`).join('');
    $('#dependencyList').innerHTML = contributions.filter(([,x])=>Math.abs(x)>.1).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).map(([l,x])=>`<div class="dependency"><span>${l}</span><strong class="change ${x>=0?'up':'down'}">${x>0?'+':''}${x.toFixed(1)}</strong></div>`).join('') || '<div class="empty-state compact">No active scenario shocks.</div>';
    return { values:v, score, label, contributions };
  }

  function renderScenarios() {
    const box = $('#savedScenarios');
    if (!state.scenarios.length) { box.innerHTML = '<div class="empty-state compact">No scenarios saved.</div>'; return; }
    box.innerHTML = [...state.scenarios].reverse().map(s => `<div class="saved-scenario"><div><h4>${escapeHTML(s.name || s.label)}</h4><p>${escapeHTML(s.note || s.label)} · score ${s.score>0?'+':''}${s.score}</p><time>${new Date(s.created_at).toLocaleString()}</time></div><button data-scenario-delete="${s.id}" title="Delete">×</button></div>`).join('');
    $$('[data-scenario-delete]', box).forEach(b => b.addEventListener('click', () => { state.scenarios = state.scenarios.filter(s => s.id !== b.dataset.scenarioDelete); saveJSON('meridian.scenarios',state.scenarios); renderScenarios(); }));
  }

  function renderPredictions() {
    const items = state.predictions.filter(p => state.predictionFilter === 'all' || (state.predictionFilter === 'open' ? p.outcome == null : p.outcome != null));
    const box = $('#predictionList');
    if (!items.length) box.innerHTML = '<div class="empty-state compact">No predictions recorded in this view.</div>';
    else box.innerHTML = [...items].reverse().map(p => `<div class="prediction-item"><div class="prediction-top"><h4>${escapeHTML(p.text)}</h4><div class="probability-badge">${p.probability}%</div></div><div class="prediction-meta"><span>${p.outcome == null ? 'OPEN' : p.outcome ? 'RESOLVED YES' : 'RESOLVED NO'}</span><span>DUE ${shortDate(p.resolve_date)}</span><span>CREATED ${shortDate(p.created_at)}</span>${p.brier != null ? `<span>BRIER ${p.brier.toFixed(3)}</span>`:''}</div>${p.thesis ? `<p class="prediction-thesis">${escapeHTML(p.thesis)}</p>`:''}<div class="prediction-actions">${p.outcome == null ? `<button class="yes" data-resolve-pred="${p.id}" data-outcome="1">RESOLVE YES</button><button class="no" data-resolve-pred="${p.id}" data-outcome="0">RESOLVE NO</button>`:''}<button data-delete-pred="${p.id}">DELETE</button></div></div>`).join('');
    $$('[data-resolve-pred]', box).forEach(b => b.addEventListener('click', () => resolvePrediction(b.dataset.resolvePred, Number(b.dataset.outcome))));
    $$('[data-delete-pred]', box).forEach(b => b.addEventListener('click', () => { state.predictions = state.predictions.filter(p => p.id !== b.dataset.deletePred); saveJSON('meridian.predictions',state.predictions); renderPredictions(); }));
    const resolved = state.predictions.filter(p => p.outcome != null);
    const open = state.predictions.length - resolved.length;
    const brier = resolved.length ? resolved.reduce((s,p)=>s + ((p.probability/100)-p.outcome)**2,0)/resolved.length : null;
    const accuracy = resolved.length ? resolved.filter(p => ((p.probability>=50)?1:0) === p.outcome).length/resolved.length*100 : null;
    $('#predOpen').textContent = open;
    $('#predResolved').textContent = resolved.length;
    $('#predBrier').textContent = brier == null ? '—' : brier.toFixed(3);
    $('#predAccuracy').textContent = accuracy == null ? '—' : `${accuracy.toFixed(0)}%`;
    drawCalibrationChart(resolved);
  }

  function resolvePrediction(id, outcome) {
    const p = state.predictions.find(x => x.id === id); if (!p) return;
    p.outcome = outcome; p.resolved_at = new Date().toISOString(); p.brier = ((p.probability/100)-outcome)**2;
    saveJSON('meridian.predictions',state.predictions); renderPredictions(); toast('Prediction resolved', `Brier contribution: ${p.brier.toFixed(3)}`, 'success');
  }

  function drawCalibrationChart(resolved) {
    const canvas = $('#calibrationChart');
    const rect = canvas.getBoundingClientRect(); const width = Math.max(300, rect.width || 600), height = 230, ratio=window.devicePixelRatio||1;
    canvas.width=width*ratio;canvas.height=height*ratio;canvas.style.height=`${height}px`;const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.clearRect(0,0,width,height);
    const pad={l:38,r:15,t:18,b:30},w=width-pad.l-pad.r,h=height-pad.t-pad.b;
    ctx.strokeStyle='rgba(120,155,170,.14)';ctx.fillStyle='#5d747e';ctx.font='9px monospace';
    for(let i=0;i<=4;i++){const y=pad.t+h*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(width-pad.r,y);ctx.stroke();ctx.fillText(`${100-i*25}%`,3,y+3)}
    const bins=[{min:0,max:20},{min:20,max:40},{min:40,max:60},{min:60,max:80},{min:80,max:101}];
    bins.forEach((bin,i)=>{const rows=resolved.filter(p=>p.probability>=bin.min&&p.probability<bin.max);const actual=rows.length?rows.reduce((s,p)=>s+p.outcome,0)/rows.length:null;const x=pad.l+w*(i+.5)/bins.length;ctx.fillStyle='rgba(240,167,58,.45)';if(actual!=null)ctx.fillRect(x-18,pad.t+h*(1-actual),36,h*actual);ctx.fillStyle='#5d747e';ctx.fillText(`${bin.min}-${bin.max===101?100:bin.max}`,x-14,height-10);if(actual!=null){ctx.fillStyle='#ffd27c';ctx.fillText(`${Math.round(actual*100)}%`,x-11,pad.t+h*(1-actual)-5)}});
    ctx.setLineDash([4,4]);ctx.strokeStyle='#35d6c2';ctx.beginPath();ctx.moveTo(pad.l,pad.t+h);ctx.lineTo(width-pad.r,pad.t);ctx.stroke();ctx.setLineDash([]);
  }

  function populateAlertInstruments() {
    const select = $('#alertInstrument'); if (!select) return;
    const current = select.value;
    const options = INSTRUMENT_ORDER.map(k=>getInstruments()[k]).filter(i=>i?.status==='ok');
    select.innerHTML=options.map(i=>`<option value="${i.key}">${escapeHTML(i.label)}</option>`).join('');
    if(options.some(i=>i.key===current))select.value=current;
  }

  function renderAlerts() {
    populateAlertInstruments();
    $('#alertBadge').textContent = String(state.alertHistory.filter(h=>!h.acknowledged).length);
    const rules = $('#alertRuleList');
    rules.innerHTML = state.alerts.length ? state.alerts.map(r=>`<div class="alert-rule"><div><h4>${escapeHTML(r.name)}</h4><p>${alertRuleDescription(r)}</p><span>${r.active?'ACTIVE':'PAUSED'} · CREATED ${shortDate(r.created_at)}</span></div><div class="alert-rule-actions"><button data-toggle-alert="${r.id}" title="Pause/resume">${r.active?'Ⅱ':'▶'}</button><button data-delete-alert="${r.id}" title="Delete">×</button></div></div>`).join('') : '<div class="empty-state compact">No active alert rules.</div>';
    $$('[data-toggle-alert]',rules).forEach(b=>b.addEventListener('click',()=>{const r=state.alerts.find(x=>x.id===b.dataset.toggleAlert);r.active=!r.active;saveJSON('meridian.alerts',state.alerts);renderAlerts()}));
    $$('[data-delete-alert]',rules).forEach(b=>b.addEventListener('click',()=>{state.alerts=state.alerts.filter(x=>x.id!==b.dataset.deleteAlert);saveJSON('meridian.alerts',state.alerts);renderAlerts()}));
    const hist=$('#alertHistory');
    hist.innerHTML=state.alertHistory.length?[...state.alertHistory].reverse().map(h=>`<div class="alert-history-item alert-triggered"><div><h4>${escapeHTML(h.name)}</h4><p>${escapeHTML(h.message)}</p><time>${new Date(h.triggered_at).toLocaleString()}</time></div><button class="text-button" data-ack-alert="${h.id}">${h.acknowledged?'ACK':'ACKNOWLEDGE'}</button></div>`).join(''):'<div class="empty-state compact">No alerts triggered.</div>';
    $$('[data-ack-alert]',hist).forEach(b=>b.addEventListener('click',()=>{const h=state.alertHistory.find(x=>x.id===b.dataset.ackAlert);h.acknowledged=true;saveJSON('meridian.alertHistory',state.alertHistory);renderAlerts()}));
  }

  function alertRuleDescription(r){
    const inst=getInstruments()[r.instrument];
    if(r.type==='price_above')return `${inst?.short||r.instrument} above ${r.value}`;
    if(r.type==='price_below')return `${inst?.short||r.instrument} below ${r.value}`;
    if(r.type==='impact')return `Any news impact at or above ${r.value}`;
    if(r.type==='keyword')return `Headline contains “${r.value}”`;
    if(r.type==='region')return `Event region contains “${r.value}”`;
    return 'Any data-source failure';
  }

  function evaluateAlerts(){
    if(!state.snapshot||!state.alerts.length)return;
    const now=new Date().toISOString();let newCount=0;
    state.alerts.filter(r=>r.active).forEach(r=>{
      let hit=null,key='';
      const inst=getInstruments()[r.instrument];
      if(r.type==='price_above'&&inst?.status==='ok'&&inst.value>Number(r.value)){hit=`${inst.short} is ${fmtNumber(inst.value,inst.decimals||2)}, above ${r.value}.`;key=`${inst.as_of}:${inst.value}`}
      if(r.type==='price_below'&&inst?.status==='ok'&&inst.value<Number(r.value)){hit=`${inst.short} is ${fmtNumber(inst.value,inst.decimals||2)}, below ${r.value}.`;key=`${inst.as_of}:${inst.value}`}
      if(r.type==='impact'){const n=[...getNewsItems()].sort(rankNews).find(n=>n.impact>=Number(r.value));if(n){hit=`Impact ${n.impact}: ${n.title}`;key=n.id}}
      if(r.type==='keyword'){const q=String(r.value).toLowerCase();const n=getNewsItems().find(n=>n.title.toLowerCase().includes(q));if(n){hit=`Keyword “${r.value}” matched: ${n.title}`;key=n.id}}
      if(r.type==='region'){const q=String(r.value).toLowerCase();const n=getNewsItems().find(n=>(n.location?.name||'').toLowerCase().includes(q));if(n){hit=`Region ${n.location.name}: ${n.title}`;key=n.id}}
      if(r.type==='source_failure'){const failed=Object.entries(state.health?.sources||{}).find(([,v])=>v.status==='error');if(failed){hit=`${failed[0]} failed: ${failed[1].detail}`;key=`${failed[0]}:${failed[1].checked_at}`}}
      if(hit&&r.last_trigger_key!==key){r.last_trigger_key=key;r.last_trigger_at=now;const event={id:uid(),rule_id:r.id,name:r.name,message:hit,triggered_at:now,acknowledged:false};state.alertHistory.push(event);newCount++;notifyAlert(event)}
    });
    if(newCount){saveJSON('meridian.alerts',state.alerts);saveJSON('meridian.alertHistory',state.alertHistory);renderAlerts();$('#alertEvalTime').textContent=`EVALUATED ${timeAgo(now)}`}
  }

  function notifyAlert(event){
    toast(event.name,event.message,'warning',7000);
    if(state.settings.sound)playTone();
    if('Notification'in window&&Notification.permission==='granted')new Notification(`Meridian Oil Radar: ${event.name}`,{body:event.message});
  }
  function playTone(){try{const C=window.AudioContext||window.webkitAudioContext;const ctx=new C();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=720;gain.gain.setValueAtTime(.08,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.35);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.35)}catch{}}

  function renderSettings(){
    const health=state.health?.sources||{};const rows=Object.entries(health).sort((a,b)=>a[0].localeCompare(b[0]));
    $('#providerList').innerHTML=rows.length?rows.map(([name,h])=>`<div class="provider-row"><i class="${h.status}"></i><div><strong>${escapeHTML(name)}</strong><p>${escapeHTML(h.detail||'')}</p></div><time>${h.checked_at?timeAgo(h.checked_at):'—'}</time></div>`).join(''):'<div class="empty-state compact">No provider checks have run.</div>';
    $('#healthAsOf').textContent=`AS OF ${state.health?.generated_at?timeAgo(state.health.generated_at):'—'}`;
    const caps=state.config?.capabilities||{};
    const names={live_news:'Live news scanning',public_delayed_market_data:'Public delayed market data',exchange_grade_realtime:'Exchange-grade real-time futures',consensus_inventory_surprise:'Licensed consensus surprise',trade_execution:'Trade execution'};
    $('#capabilityList').innerHTML=Object.entries(names).map(([k,l])=>`<div class="capability-row"><span>${l}</span><strong class="${caps[k]?'on':'off'}">${caps[k]?'ACTIVE':'NOT CONNECTED'}</strong></div>`).join('');
    renderWeights();
  }

  function renderWeights(){
    $('#weightList').innerHTML=Object.keys(DEFAULT_WEIGHTS).map(k=>`<div class="weight-row"><span>${WEIGHT_LABELS[k]}</span><input type="range" min="0" max="60" step="1" value="${Number(state.weights[k]??DEFAULT_WEIGHTS[k])}" data-weight="${k}"><output>${Number(state.weights[k]??DEFAULT_WEIGHTS[k])}%</output></div>`).join('');
    $$('[data-weight]').forEach(input=>input.addEventListener('input',()=>{state.weights[input.dataset.weight]=Number(input.value);input.nextElementSibling.textContent=`${input.value}%`;saveJSON('meridian.weights',state.weights);updateWeightTotal();renderDashboard()}));
    updateWeightTotal();
  }
  function updateWeightTotal(){const total=Object.keys(DEFAULT_WEIGHTS).reduce((s,k)=>s+Number(state.weights[k]||0),0);$('#weightTotal').textContent=`${total}%`;$('#weightTotal').parentElement.classList.toggle('invalid',total!==100)}

  function updateSidebarStatus(){
    const healthy=state.snapshot?.source_summary?.healthy??Object.values(state.health?.sources||{}).filter(x=>x.status==='ok').length;
    const total=state.snapshot?.source_summary?.total??Object.keys(state.health?.sources||{}).length;
    const failed=state.snapshot?.source_summary?.failed??0;
    $('#sourceHealthMini').textContent=`${healthy} / ${total}`;
    $('#healthDot').className=`status-dot ${failed?'warn':healthy?'ok':''}`;
    $('#lastScanMini').textContent=state.lastFullScan?timeAgo(state.lastFullScan.toISOString()):'—';
  }

  function exportCSV(filename, rows){
    if(!rows.length){toast('Nothing to export','No rows are currently available.','warning');return}
    const headers=[...new Set(rows.flatMap(r=>Object.keys(r)))];
    const esc=v=>`"${String(v??'').replace(/"/g,'""')}"`;
    const csv=[headers.map(esc).join(','),...rows.map(r=>headers.map(h=>esc(typeof r[h]==='object'?JSON.stringify(r[h]):r[h])).join(','))].join('\n');
    downloadBlob(filename,csv,'text/csv;charset=utf-8');
  }
  function downloadBlob(filename,content,type='application/json'){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function stamp(){return new Date().toISOString().replace(/[:.]/g,'-')}

  function openCommandPalette(){
    $('#commandModal').classList.remove('hidden');$('#commandInput').value='';state.commandIndex=0;renderCommandResults('');setTimeout(()=>$('#commandInput').focus(),50)
  }
  function closeCommandPalette(){$('#commandModal').classList.add('hidden')}
  const COMMANDS=[
    {icon:'◎',title:'Open Live Radar',desc:'Geospatial event intelligence',run:()=>navigate('radar')},
    {icon:'⌁',title:'Open Markets',desc:'Delayed public market indicators',run:()=>navigate('markets')},
    {icon:'▥',title:'Open Fundamentals',desc:'EIA weekly supply balance',run:()=>navigate('fundamentals')},
    {icon:'≋',title:'Open News Intelligence',desc:'Sortable evidence table',run:()=>navigate('news')},
    {icon:'◇',title:'Open Decision Lab',desc:'Rule-based scenario analysis',run:()=>navigate('decision')},
    {icon:'△',title:'Create Alert',desc:'Open alert rule builder',run:()=>navigate('alerts')},
    {icon:'↻',title:'Run Full Scan',desc:'Refresh all data sources',run:()=>refreshAll()},
    {icon:'⚙',title:'Inspect Source Health',desc:'Provider diagnostics and provenance',run:()=>navigate('settings')}
  ];
  function renderCommandResults(query){
    const q=query.trim().toLowerCase();
    let items=COMMANDS.filter(c=>!q||`${c.title} ${c.desc}`.toLowerCase().includes(q));
    if(q.startsWith('news '))items=[{icon:'≋',title:`Scan news for “${query.slice(5).trim()}”`,desc:'Run a targeted external GDELT scan',run:()=>{navigate('news');rescanNews($('#newsTimespan').value,query.slice(5).trim())}}];
    const instrument=Object.values(getInstruments()).find(i=>q.includes((i.short||'').toLowerCase())||q.includes((i.label||'').toLowerCase()));
    if(instrument)items.unshift({icon:'⌁',title:`Show ${instrument.label}`,desc:`Open the ${instrument.short} market series`,run:()=>{state.selectedMarket=instrument.key;navigate('markets');renderMarkets()}});
    if(q.includes('high')&&q.includes('shipping'))items.unshift({icon:'◎',title:'High-impact shipping events',desc:'Filter radar to shipping/chokepoints with impact 70+',run:()=>{navigate('radar');$('#radarImpactFilter').value='70';$('#radarCategoryFilter').value='Shipping & chokepoints';renderFullRadar()}});
    if(!items.length)items=[{icon:'⌕',title:'No direct command match',desc:'Try “news Iran”, “show WTI”, “open radar”, or “create alert”.',run:()=>{}}];
    state.commandItems=items;state.commandIndex=clamp(state.commandIndex,0,items.length-1);
    $('#commandResults').innerHTML=items.map((c,i)=>`<div class="command-result ${i===state.commandIndex?'active':''}" data-command-index="${i}"><span>${c.icon}</span><div><strong>${escapeHTML(c.title)}</strong><p>${escapeHTML(c.desc)}</p></div><kbd>ENTER</kbd></div>`).join('');
    $$('[data-command-index]').forEach(el=>el.addEventListener('click',()=>runCommand(Number(el.dataset.commandIndex))));
  }
  function runCommand(i=state.commandIndex){const cmd=state.commandItems[i];if(cmd){closeCommandPalette();cmd.run()}}

  function installEventHandlers(){
    $('#refreshAll').addEventListener('click',()=>refreshAll({clearServerCache:true}));
    $('#commandTrigger').addEventListener('click',openCommandPalette);
    $('#commandModal').addEventListener('click',e=>{if(e.target===$('#commandModal'))closeCommandPalette()});
    $('#commandInput').addEventListener('input',e=>{state.commandIndex=0;renderCommandResults(e.target.value)});
    $('#commandInput').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();state.commandIndex=clamp(state.commandIndex+1,0,state.commandItems.length-1);renderCommandResults(e.target.value)}else if(e.key==='ArrowUp'){e.preventDefault();state.commandIndex=clamp(state.commandIndex-1,0,state.commandItems.length-1);renderCommandResults(e.target.value)}else if(e.key==='Enter'){e.preventDefault();runCommand()}else if(e.key==='Escape')closeCommandPalette()});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommandPalette()}else if(e.key==='Escape')closeCommandPalette()});
    $('#commandChartRange').addEventListener('change',renderCommandMarketChart);
    $('#marketRange').addEventListener('change',renderMarkets);
    $('#marketInstrumentSelect').addEventListener('change',e=>{state.selectedMarket=e.target.value;renderMarkets()});
    $('#fundamentalSelect').addEventListener('change',e=>{state.selectedFundamental=e.target.value;renderFundamentals()});
    $('#fundamentalsRefresh').addEventListener('click',()=>refreshAll({clearServerCache:true}));
    ['radarImpactFilter','radarDirectionFilter','radarCategoryFilter','radarConfidenceFilter'].forEach(id=>$(`#${id}`).addEventListener('change',renderFullRadar));
    $('#radarTimeFilter').addEventListener('change',e=>rescanNews(e.target.value));
    $('#radarClearFilters').addEventListener('click',()=>{$('#radarImpactFilter').value='0';$('#radarDirectionFilter').value='all';$('#radarCategoryFilter').value='all';$('#radarConfidenceFilter').value='0';renderFullRadar()});
    $('#radarRescan').addEventListener('click',()=>rescanNews($('#radarTimeFilter').value));
    $('#radarFullscreen').addEventListener('click',()=>{const el=$('#fullRadarWrap');if(document.fullscreenElement)document.exitFullscreen();else el.requestFullscreen?.()});
    $('#newsSearch').addEventListener('input',debounce(renderNews,120));
    ['newsCategory','newsDirection'].forEach(id=>$(`#${id}`).addEventListener('change',renderNews));
    $('#newsImpact').addEventListener('input',renderNews);
    $('#newsTimespan').addEventListener('change',e=>rescanNews(e.target.value));
    $('#newsRescan').addEventListener('click',()=>rescanNews($('#newsTimespan').value));
    $('#saveNewsFilter').addEventListener('click',()=>{const f={q:$('#newsSearch').value,category:$('#newsCategory').value,direction:$('#newsDirection').value,impact:$('#newsImpact').value,timespan:$('#newsTimespan').value};localStorage.setItem('meridian.savedNewsFilter',JSON.stringify(f));toast('Filter saved','Stored in this browser profile.','success')});
    $$('[data-sort-news]').forEach(b=>b.addEventListener('click',()=>{state.newsSort=state.newsSort==='impact'?'time':'impact';b.textContent=`SORT: ${state.newsSort.toUpperCase()}`;renderNews()}));
    $('#scenarioPreset').addEventListener('change',e=>applyScenarioPreset(e.target.value));
    ['supply','opec','inventory','refinery','dollar','risk'].forEach(k=>$(`#${k}Slider`).addEventListener('input',updateScenario));
    $('#resetScenario').addEventListener('click',()=>{applyScenarioPreset('custom');$('#scenarioPreset').value='custom';$('#scenarioNote').value=''});
    $('#saveScenario').addEventListener('click',()=>{const s=updateScenario();const preset=$('#scenarioPreset').selectedOptions[0].textContent;state.scenarios.push({id:uid(),name:preset,label:s.label,score:s.score,values:s.values,note:$('#scenarioNote').value,created_at:new Date().toISOString()});saveJSON('meridian.scenarios',state.scenarios);renderScenarios();toast('Scenario saved',`${s.label}: ${s.score>0?'+':''}${s.score}`,'success')});
    $('#clearScenarios').addEventListener('click',()=>{state.scenarios=[];saveJSON('meridian.scenarios',[]);renderScenarios()});
    $('#predictionProbability').addEventListener('input',e=>$('#predictionProbabilityOut').textContent=`${e.target.value}%`);
    $('#predictionForm').addEventListener('submit',e=>{e.preventDefault();state.predictions.push({id:uid(),text:$('#predictionText').value.trim(),probability:Number($('#predictionProbability').value),resolve_date:$('#predictionDate').value,thesis:$('#predictionThesis').value.trim(),created_at:new Date().toISOString(),outcome:null});saveJSON('meridian.predictions',state.predictions);e.target.reset();$('#predictionProbability').value=60;$('#predictionProbabilityOut').textContent='60%';renderPredictions();toast('Prediction recorded','The call is now in the calibration ledger.','success')});
    $$('[data-pred-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-pred-filter]').forEach(x=>x.classList.toggle('active',x===b));state.predictionFilter=b.dataset.predFilter;renderPredictions()}));
    $('#alertType').addEventListener('change',updateAlertForm);
    $('#alertForm').addEventListener('submit',e=>{e.preventDefault();const type=$('#alertType').value;state.alerts.push({id:uid(),type,instrument:$('#alertInstrument').value,value:$('#alertValue').value.trim(),name:$('#alertName').value.trim(),active:true,created_at:new Date().toISOString(),last_trigger_key:null});saveJSON('meridian.alerts',state.alerts);e.target.reset();updateAlertForm();renderAlerts();evaluateAlerts();toast('Alert activated','The rule will evaluate on each refresh.','success')});
    $('#clearAlertHistory').addEventListener('click',()=>{state.alertHistory=[];saveJSON('meridian.alertHistory',[]);renderAlerts()});
    $('#requestNotifications').addEventListener('click',async()=>{if(!('Notification'in window)){toast('Not supported','This browser does not support notifications.','warning');return}const p=await Notification.requestPermission();toast('Notification permission',p,p==='granted'?'success':'warning')});
    $('#clearCache').addEventListener('click',async()=>{await fetchJSON(API.clearCache,{method:'POST'}).catch(()=>null);toast('Server cache cleared','Run a source test to retrieve fresh data.','success')});
    $('#settingsRescan').addEventListener('click',()=>refreshAll({clearServerCache:true}));
    $('#resetWeights').addEventListener('click',()=>{state.weights={...DEFAULT_WEIGHTS};saveJSON('meridian.weights',state.weights);renderSettings();renderDashboard();toast('Weights restored','Default composite weights are active.','success')});
    $('#autoRefreshToggle').addEventListener('change',e=>{state.settings.autoRefresh=e.target.checked;saveJSON('meridian.settings',state.settings);configureAutoRefresh()});
    $('#soundToggle').addEventListener('change',e=>{state.settings.sound=e.target.checked;saveJSON('meridian.settings',state.settings)});
    $('#compactToggle').addEventListener('change',e=>{state.settings.compact=e.target.checked;saveJSON('meridian.settings',state.settings);applySettings()});
    $('#resetLocalData').addEventListener('click',()=>{['meridian.weights','meridian.alerts','meridian.alertHistory','meridian.predictions','meridian.scenarios','meridian.settings','meridian.savedNewsFilter'].forEach(k=>localStorage.removeItem(k));location.reload()});
    $$('[data-action]').forEach(b=>b.addEventListener('click',()=>handleExport(b.dataset.action)));
    window.addEventListener('resize',debounce(()=>{renderCommandMarketChart();renderMarkets();renderFundamentals();renderPredictions()},250));
    const tomorrow=new Date(Date.now()+30*86400000).toISOString().slice(0,10);$('#predictionDate').value=tomorrow;
    updateAlertForm();
    const savedFilter=loadSavedNewsFilter();if(savedFilter){$('#newsSearch').value=savedFilter.q||'';$('#newsDirection').value=savedFilter.direction||'all';$('#newsImpact').value=savedFilter.impact||0;$('#newsTimespan').value=savedFilter.timespan||'24h'}
  }

  function loadSavedNewsFilter(){try{return JSON.parse(localStorage.getItem('meridian.savedNewsFilter'))}catch{return null}}
  function updateAlertForm(){const type=$('#alertType').value;const price=type.startsWith('price_');$('#alertInstrumentWrap').classList.toggle('hidden',!price);$('#alertValueLabel').textContent=type==='keyword'?'KEYWORD':type==='region'?'REGION':type==='source_failure'?'VALUE (IGNORED)':'THRESHOLD';$('#alertValue').required=type!=='source_failure';$('#alertValue').disabled=type==='source_failure';if(type==='source_failure')$('#alertValue').value='any'}

  function handleExport(action){
    if(action==='export-snapshot')downloadBlob(`meridian-oil-snapshot-${stamp()}.json`,JSON.stringify(state.snapshot,null,2));
    if(action==='export-market'){const rows=Object.values(getInstruments()).flatMap(i=>(i.series||[]).map(r=>({instrument:i.key,label:i.label,date:r.date,value:r.value,unit:i.unit,source:i.source_label})));exportCSV(`meridian-market-${stamp()}.csv`,rows)}
    if(action==='export-fundamentals'){const rows=Object.values(getFundamentals()).flatMap(i=>(i.series||[]).map(r=>({indicator:i.key,label:i.label,date:r.date,value:r.value,unit:i.unit,source:i.source_label})));exportCSV(`meridian-fundamentals-${stamp()}.csv`,rows)}
    if(action==='export-news')exportCSV(`meridian-news-${stamp()}.csv`,filteredNewsItems().map(n=>({published_at:n.published_at,impact:n.impact,direction:n.direction,confidence:n.confidence,category:n.category,region:n.location?.name,publisher:n.publisher,title:n.title,url:n.url,corroboration_count:n.corroboration_count})));
    if(action==='export-predictions')downloadBlob(`meridian-predictions-${stamp()}.json`,JSON.stringify(state.predictions,null,2));
  }

  initialize();
})();
