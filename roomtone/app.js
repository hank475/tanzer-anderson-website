import {
  DEFAULT_HUMIDITY,
  DEVICE_PROFILES,
  cToF,
  clamp,
  comfortLabel,
  echoPathDifferenceM,
  effectiveEchoPathFromCalibrationM,
  estimateEchoTemperatureUncertaintyC,
  fToC,
  formatTemperature,
  qualityLabel,
  speedFromEchoDifferentialMps,
  temperatureFromEchoDifferentialC,
} from './physics.mjs';
import { analyzeEchoCapture, buildEchoPulseTrainSamples } from './signal.mjs';

const STORAGE = Object.freeze({
  settings: 'roomtone.settings.v2',
  calibration: 'roomtone.calibration.v2',
  history: 'roomtone.history.v2',
  diagnostics: 'roomtone.diagnostics.v2',
});

const DISTANCE_PRESETS = Object.freeze({
  recommended: {
    near: 24,
    far: 48,
    unit: 'in',
    placementSigmaM: 0.0025,
    hint: 'Use a tape measure and mark both positions on a stable surface. Point the phone’s bottom edge straight at the wall.',
  },
  paper: {
    near: 22,
    far: 44,
    unit: 'in',
    placementSigmaM: 0.0035,
    hint: 'Two and four US Letter-paper lengths make the marks. Align sheets carefully on a stable surface.',
  },
  compact: {
    near: 12,
    far: 24,
    unit: 'in',
    placementSigmaM: 0.0045,
    hint: 'For limited space. Echoes are closer together, so the app will report a wider uncertainty range.',
  },
});

const DEFAULT_SETTINGS = Object.freeze({
  unit: 'F',
  referenceUnit: 'F',
  deviceProfile: 'iphone-large',
  mode: 'fast',
  humidity: DEFAULT_HUMIDITY,
  distancePreset: 'recommended',
  distanceUnit: 'in',
  nearDistance: 24,
  farDistance: 48,
  installDismissed: false,
});

const AUDIO = Object.freeze({
  preferredSampleRate: 48000,
  preRollS: 0.72,
  tailS: 0.55,
  fastPasses: 3,
  bestPasses: 7,
});

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map((node) => [node.id, node]));
let settings = { ...DEFAULT_SETTINGS, ...readJson(STORAGE.settings, {}) };
let calibration = readJson(STORAGE.calibration, null);
let history = readJson(STORAGE.history, []);
let lastDiagnostics = readJson(STORAGE.diagnostics, null);
let latestResult = Array.isArray(history) ? history[0] || null : null;
let activeAbortController = null;
let deferredInstallPrompt = null;
let toastTimer = null;
let pendingSession = null;
let pendingStage = 'near';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeStored(key) {
  try { localStorage.removeItem(key); } catch { /* local storage may be restricted */ }
}

function saveSettings() { writeJson(STORAGE.settings, settings); }

function saveDiagnostics(payload) {
  lastDiagnostics = payload;
  writeJson(STORAGE.diagnostics, payload);
  renderDiagnostics();
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function makeAbortError(message = 'Measurement cancelled.') {
  try { return new DOMException(message, 'AbortError'); } catch {
    const error = new Error(message);
    error.name = 'AbortError';
    return error;
  }
}

function isAbortError(error) {
  return error?.name === 'AbortError' || /abort|cancel/i.test(error?.message || '');
}

function escapeText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatAgo(iso) {
  const elapsed = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return formatDateTime(iso);
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} hr${hours === 1 ? '' : 's'} ago` : formatDateTime(iso);
}

function setModalVisible(modal, visible) {
  modal.hidden = !visible;
  const anyOpen = [...document.querySelectorAll('.modal')].some((item) => !item.hidden);
  document.body.classList.toggle('modal-open', anyOpen);
}

function closeAllModals() {
  for (const modal of document.querySelectorAll('.modal')) modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2800);
}

function showMessage({
  icon = '!', good = false, eyebrow = 'Measurement stopped', title = 'No reading was created',
  body = 'RoomTone could not validate the acoustic signal.', details = '',
  primaryLabel = 'Try again', secondaryLabel = 'Close', onPrimary = null, onSecondary = null,
}) {
  closeAllModals();
  els.messageIcon.textContent = icon;
  els.messageIcon.classList.toggle('good', good);
  els.messageEyebrow.textContent = eyebrow;
  els.messageTitle.textContent = title;
  els.messageBody.textContent = body;
  els.messageDetails.textContent = details;
  els.messageDetails.hidden = !details;
  els.messagePrimaryButton.textContent = primaryLabel;
  els.messageSecondaryButton.textContent = secondaryLabel;
  els.messagePrimaryButton.hidden = !primaryLabel;
  els.messageSecondaryButton.hidden = !secondaryLabel;
  els.messagePrimaryButton.onclick = () => {
    setModalVisible(els.messageModal, false);
    if (typeof onPrimary === 'function') onPrimary();
  };
  els.messageSecondaryButton.onclick = () => {
    setModalVisible(els.messageModal, false);
    if (typeof onSecondary === 'function') onSecondary();
  };
  setModalVisible(els.messageModal, true);
}

function showPage(target) {
  for (const page of document.querySelectorAll('.page')) {
    const active = page.dataset.page === target;
    page.hidden = !active;
    page.classList.toggle('active', active);
  }
  for (const button of document.querySelectorAll('.nav-button')) button.classList.toggle('active', button.dataset.target === target);
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function setMode(mode) {
  settings.mode = mode === 'best' ? 'best' : 'fast';
  els.fastModeButton.classList.toggle('active', settings.mode === 'fast');
  els.bestModeButton.classList.toggle('active', settings.mode === 'best');
  saveSettings();
}

function setUnit(unit) {
  settings.unit = unit === 'C' ? 'C' : 'F';
  els.displayUnitF.classList.toggle('active', settings.unit === 'F');
  els.displayUnitC.classList.toggle('active', settings.unit === 'C');
  saveSettings();
  renderLatest();
  renderHistory();
}

function setReferenceUnit(unit) {
  const next = unit === 'C' ? 'C' : 'F';
  if (next === settings.referenceUnit) return;
  const current = Number(els.referenceTemperature.value);
  if (Number.isFinite(current)) els.referenceTemperature.value = (next === 'C' ? fToC(current) : cToF(current)).toFixed(1);
  settings.referenceUnit = next;
  els.referenceUnitF.classList.toggle('active', next === 'F');
  els.referenceUnitC.classList.toggle('active', next === 'C');
  els.referenceTemperature.min = next === 'F' ? '30' : '-1';
  els.referenceTemperature.max = next === 'F' ? '110' : '44';
  saveSettings();
}

function convertDistance(value, from, to) {
  if (from === to) return value;
  return to === 'cm' ? value * 2.54 : value / 2.54;
}

function setDistanceUnit(unit) {
  const next = unit === 'cm' ? 'cm' : 'in';
  if (next !== settings.distanceUnit) {
    const near = Number(els.nearDistance.value);
    const far = Number(els.farDistance.value);
    if (Number.isFinite(near)) els.nearDistance.value = convertDistance(near, settings.distanceUnit, next).toFixed(1);
    if (Number.isFinite(far)) els.farDistance.value = convertDistance(far, settings.distanceUnit, next).toFixed(1);
    settings.nearDistance = Number(els.nearDistance.value);
    settings.farDistance = Number(els.farDistance.value);
    settings.distanceUnit = next;
  }
  els.distanceUnitIn.classList.toggle('active', next === 'in');
  els.distanceUnitCm.classList.toggle('active', next === 'cm');
  const max = next === 'in' ? 160 : 400;
  const minNear = next === 'in' ? 8 : 20;
  els.nearDistance.min = String(minNear);
  els.farDistance.max = String(max);
  saveSettings();
}

function setDistancePreset(presetId) {
  settings.distancePreset = DISTANCE_PRESETS[presetId] ? presetId : 'custom';
  els.distancePreset.value = settings.distancePreset;
  const preset = DISTANCE_PRESETS[settings.distancePreset];
  if (preset) {
    settings.distanceUnit = preset.unit;
    settings.nearDistance = preset.near;
    settings.farDistance = preset.far;
    els.nearDistance.value = String(preset.near);
    els.farDistance.value = String(preset.far);
    els.setupHint.textContent = preset.hint;
  } else {
    els.setupHint.textContent = 'Measure both marks carefully on a stable surface. A larger gap between marks improves acoustic resolution.';
  }
  setDistanceUnit(settings.distanceUnit);
  saveSettings();
}

function markDistanceCustom() {
  settings.distancePreset = 'custom';
  settings.nearDistance = Number(els.nearDistance.value);
  settings.farDistance = Number(els.farDistance.value);
  els.distancePreset.value = 'custom';
  els.setupHint.textContent = 'Measure both marks carefully on a stable surface. A larger gap between marks improves acoustic resolution.';
  saveSettings();
}

function toMeters(value, unit) {
  return unit === 'cm' ? Number(value) / 100 : Number(value) * 0.0254;
}

function formatDistanceM(valueM) {
  return settings.distanceUnit === 'cm' ? `${(valueM * 100).toFixed(1)} cm` : `${(valueM / 0.0254).toFixed(1)} in`;
}

function currentSetup() {
  const nearDistanceM = toMeters(els.nearDistance.value, settings.distanceUnit);
  const farDistanceM = toMeters(els.farDistance.value, settings.distanceUnit);
  if (![nearDistanceM, farDistanceM].every(Number.isFinite)) return { valid: false, message: 'Enter both wall distances.' };
  if (nearDistanceM < 0.20 || farDistanceM > 4 || farDistanceM - nearDistanceM < 0.15) {
    return { valid: false, message: 'Use a near mark at least 20 cm from the wall and a far mark at least 15 cm beyond it.' };
  }
  const profile = DEVICE_PROFILES[settings.deviceProfile] || DEVICE_PROFILES['other-phone'];
  const modeledPathDifferenceM = echoPathDifferenceM({
    nearDistanceM,
    farDistanceM,
    speakerMicSeparationM: profile.speakerMicSeparationM,
  });
  const preset = DISTANCE_PRESETS[settings.distancePreset];
  const placementSigmaM = preset?.placementSigmaM ?? 0.005;
  const upperPath = echoPathDifferenceM({
    nearDistanceM,
    farDistanceM,
    speakerMicSeparationM: profile.speakerMicSeparationM + profile.separationSigmaM,
  });
  const lowerPath = echoPathDifferenceM({
    nearDistanceM,
    farDistanceM,
    speakerMicSeparationM: Math.max(0, profile.speakerMicSeparationM - profile.separationSigmaM),
  });
  const separationComponent = Math.max(Math.abs(upperPath - modeledPathDifferenceM), Math.abs(lowerPath - modeledPathDifferenceM));
  const placementComponent = 2 * Math.hypot(placementSigmaM, placementSigmaM);
  const modeledPathSigmaM = Math.hypot(separationComponent, placementComponent);
  const calibrationApplies = Boolean(
    calibration?.effectivePathDifferenceM &&
    Math.abs(calibration.nearDistanceM - nearDistanceM) < 0.006 &&
    Math.abs(calibration.farDistanceM - farDistanceM) < 0.006,
  );
  return {
    valid: true,
    nearDistanceM,
    farDistanceM,
    modeledPathDifferenceM,
    modeledPathSigmaM,
    placementSigmaM,
    profile,
    calibrationApplies,
    effectivePathDifferenceM: calibrationApplies ? calibration.effectivePathDifferenceM : modeledPathDifferenceM,
    effectivePathSigmaM: calibrationApplies
      ? Math.hypot(calibration.pathSigmaM || 0.0015, placementComponent)
      : modeledPathSigmaM,
  };
}

function renderLatest() {
  if (!latestResult) {
    els.temperatureValue.textContent = '—';
    els.temperatureUnit.textContent = `°${settings.unit}`;
    els.temperatureRange.textContent = 'Run a two-position wall measurement to estimate the air temperature here.';
    els.latestQualityRow.hidden = true;
    els.lastUpdated.textContent = 'No reading yet';
    const setup = currentSetup();
    els.calibrationBadge.textContent = setup.calibrationApplies ? 'Calibrated setup' : 'Measured geometry';
    els.calibrationBadge.className = `badge ${setup.calibrationApplies ? 'good' : 'neutral'}`;
    return;
  }
  const displayTemp = settings.unit === 'C' ? latestResult.temperatureC : cToF(latestResult.temperatureC);
  const displayUncertainty = settings.unit === 'C' ? latestResult.uncertaintyC : latestResult.uncertaintyC * 9 / 5;
  els.temperatureValue.textContent = displayTemp.toFixed(1);
  els.temperatureUnit.textContent = `°${settings.unit}`;
  els.temperatureRange.textContent = `Estimated range ${formatTemperature(latestResult.temperatureC - latestResult.uncertaintyC, settings.unit, 1)}–${formatTemperature(latestResult.temperatureC + latestResult.uncertaintyC, settings.unit, 1)} (±${displayUncertainty.toFixed(1)}°${settings.unit})`;
  els.latestComfort.textContent = comfortLabel(latestResult.temperatureC);
  els.latestQuality.textContent = `${qualityLabel(latestResult.qualityScore)} echoes · ${latestResult.acceptedPasses}/${latestResult.totalPasses} paired passes`;
  els.latestQualityRow.hidden = false;
  els.lastUpdated.textContent = formatAgo(latestResult.createdAt);
  els.calibrationBadge.textContent = latestResult.calibrated ? 'Calibrated setup' : 'Measured geometry';
  els.calibrationBadge.className = `badge ${latestResult.calibrated ? 'good' : 'neutral'}`;
}

function renderHistory() {
  const items = Array.isArray(history) ? history : [];
  els.historyList.innerHTML = items.map((item) => {
    const uncertainty = settings.unit === 'C' ? item.uncertaintyC : item.uncertaintyC * 9 / 5;
    return `<article class="history-item">
      <div class="history-temp">${escapeText(formatTemperature(item.temperatureC, settings.unit, 1))}</div>
      <div class="history-main"><strong>${escapeText(qualityLabel(item.qualityScore))} wall-echo reading</strong><span>±${uncertainty.toFixed(1)}°${settings.unit} · ${item.acceptedPasses}/${item.totalPasses} paired passes · ${item.calibrated ? 'Calibrated' : 'Geometry model'}</span></div>
      <div class="history-meta">${escapeText(formatDateTime(item.createdAt))}</div>
    </article>`;
  }).join('');
  els.historyEmpty.hidden = items.length > 0;
  els.clearHistoryButton.hidden = items.length === 0;
}

function renderCalibration() {
  const setup = currentSetup();
  if (calibration?.effectivePathDifferenceM) {
    const applies = setup.valid && setup.calibrationApplies;
    els.calibrationStatusTitle.textContent = applies ? 'This wall setup is calibrated' : 'A calibration is saved for different marks';
    els.calibrationStatusDetail.textContent = applies
      ? `Saved ${formatDateTime(calibration.createdAt)} for ${formatDistanceM(calibration.nearDistanceM)} and ${formatDistanceM(calibration.farDistanceM)}. It remains only in this browser.`
      : 'Return the near and far marks to the calibrated distances, or capture a new calibration for the current setup.';
    els.calibrationStatusPill.textContent = applies ? 'Applied' : 'Not applied';
    els.calibrationStatusPill.className = `badge ${applies ? 'good' : 'warning'}`;
    els.removeCalibrationButton.hidden = false;
  } else {
    calibration = null;
    els.calibrationStatusTitle.textContent = 'Using the measured wall distances';
    els.calibrationStatusDetail.textContent = 'The two-position method works without a temperature reference. One calibration can reduce systematic echo-path error.';
    els.calibrationStatusPill.textContent = 'Uncalibrated';
    els.calibrationStatusPill.className = 'badge neutral';
    els.removeCalibrationButton.hidden = true;
  }
  renderLatest();
}

function diagnosticRows(payload) {
  if (!payload) return [];
  const d = payload.diagnostics || payload;
  return [
    ['Outcome', payload.valid === false ? (payload.code || 'Rejected') : (payload.status || 'Accepted')],
    ['Stage', d.stage || '—'],
    ['Sample rate', d.sampleRate ? `${Math.round(d.sampleRate)} Hz` : '—'],
    ['Wall distance', Number.isFinite(d.wallDistanceM) ? `${(d.wallDistanceM * 100).toFixed(1)} cm` : '—'],
    ['Echo delay', Number.isFinite(d.echoDelaySamples) ? `${d.echoDelaySamples.toFixed(3)} samples` : '—'],
    ['Echo spread', Number.isFinite(d.echoDelaySigmaSamples) ? `${d.echoDelaySigmaSamples.toFixed(3)} samples` : '—'],
    ['Near delay', Number.isFinite(d.nearEchoDelayMs) ? `${d.nearEchoDelayMs.toFixed(3)} ms` : '—'],
    ['Far delay', Number.isFinite(d.farEchoDelayMs) ? `${d.farEchoDelayMs.toFixed(3)} ms` : '—'],
    ['Differential', Number.isFinite(d.differentialDelayMs) ? `${d.differentialDelayMs.toFixed(3)} ms` : '—'],
    ['Sound speed', Number.isFinite(d.speedMps) ? `${d.speedMps.toFixed(2)} m/s` : '—'],
    ['Direct match', Number.isFinite(d.directScore) ? d.directScore.toFixed(3) : '—'],
    ['Wall match', Number.isFinite(d.echoScore) ? d.echoScore.toFixed(3) : '—'],
    ['Accepted passes', d.acceptedPasses ? `${d.acceptedPasses}/${d.totalPasses}` : '—'],
    ['Clipping', Number.isFinite(d.clippingFraction) ? `${(d.clippingFraction * 100).toFixed(2)}%` : '—'],
  ];
}

function renderDiagnostics() {
  if (!lastDiagnostics) {
    els.diagnosticsContent.textContent = 'No measurement has run on this device.';
    return;
  }
  els.diagnosticsContent.innerHTML = `<dl>${diagnosticRows(lastDiagnostics).map(([key, value]) => `<dt>${escapeText(key)}</dt><dd>${escapeText(value)}</dd>`).join('')}</dl>`;
}

function renderCompatibility(status = null) {
  if (!status) return;
  const kicker = els.compatibilityCard.querySelector('.section-kicker');
  const heading = els.compatibilityCard.querySelector('h2');
  const body = els.compatibilityCard.querySelector('p:not(.section-kicker)');
  if (status.kind === 'success') {
    kicker.textContent = 'Wall echo verified';
    heading.textContent = 'The phone resolved both positions';
    body.textContent = `${status.acceptedPasses}/${status.totalPasses} paired echo passes were accepted. The browser’s unknown audio latency was cancelled by the two-position calculation.`;
    els.diagnosticButton.textContent = 'Measure again';
  } else {
    kicker.textContent = 'Echo not accepted';
    heading.textContent = 'Adjust the setup and repeat';
    body.textContent = status.message || 'Use a harder, larger wall and keep the phone on a stable surface.';
    els.diagnosticButton.textContent = 'Try again';
  }
}

function initializeUi() {
  setMode(settings.mode);
  setUnit(settings.unit);
  els.deviceProfile.value = DEVICE_PROFILES[settings.deviceProfile] ? settings.deviceProfile : 'other-phone';
  settings.deviceProfile = els.deviceProfile.value;
  els.humidityInput.value = String(clamp(Number(settings.humidity) || DEFAULT_HUMIDITY, 0, 100));
  els.humidityOutput.textContent = `${els.humidityInput.value}%`;
  els.referenceUnitF.classList.toggle('active', settings.referenceUnit !== 'C');
  els.referenceUnitC.classList.toggle('active', settings.referenceUnit === 'C');
  if (settings.referenceUnit === 'C') {
    els.referenceTemperature.value = fToC(Number(els.referenceTemperature.value)).toFixed(1);
    els.referenceTemperature.min = '-1';
    els.referenceTemperature.max = '44';
  }
  els.nearDistance.value = String(settings.nearDistance);
  els.farDistance.value = String(settings.farDistance);
  els.distancePreset.value = DISTANCE_PRESETS[settings.distancePreset] ? settings.distancePreset : 'custom';
  setDistanceUnit(settings.distanceUnit);
  const preset = DISTANCE_PRESETS[settings.distancePreset];
  els.setupHint.textContent = preset?.hint || 'Measure both marks carefully on a stable surface. A larger gap between marks improves acoustic resolution.';
  renderLatest();
  renderHistory();
  renderCalibration();
  renderDiagnostics();
  configureInstallUi();
}

function configureInstallUi() {
  if (isStandalone() || settings.installDismissed) {
    els.installBanner.hidden = true;
    return;
  }
  els.installText.textContent = isIos()
    ? 'In Safari, tap Share, then Add to Home Screen.'
    : 'Install the app shell for one-tap access and offline launch.';
  setTimeout(() => { if (!settings.installDismissed && !isStandalone()) els.installBanner.hidden = false; }, 1500);
}

function setProgress(percent, title, detail, phase) {
  const safe = Math.round(clamp(percent, 0, 100));
  els.progressPercent.textContent = String(safe);
  els.progressRing.style.setProperty('--progress', `${safe * 3.6}deg`);
  els.progressTitle.textContent = title;
  els.progressDetail.textContent = detail;
  const phases = ['permission', 'sweep', 'analyze', 'validate'];
  const activeIndex = phases.indexOf(phase);
  phases.forEach((name, index) => {
    const node = els[`phase${name[0].toUpperCase()}${name.slice(1)}`];
    node.classList.toggle('active', index === activeIndex);
    node.classList.toggle('complete', activeIndex > index || safe === 100);
  });
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(makeAbortError());
    const timer = setTimeout(resolve, ms);
    const abort = () => { clearTimeout(timer); reject(makeAbortError()); };
    signal?.addEventListener('abort', abort, { once: true });
  });
}

function concatenateFloat32(chunks) {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(size);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
  return merged;
}

function openPreparation({ action = 'measurement', stage = 'near', reference = null, setup = null, nearCapture = null } = {}) {
  if (activeAbortController) return;
  const resolvedSetup = setup || currentSetup();
  if (!resolvedSetup.valid) {
    showMessage({
      icon: '!', eyebrow: 'Wall marks required', title: 'Fix the two distances before measuring',
      body: resolvedSetup.message, details: 'The far mark must be materially farther from the same wall so RoomTone can cancel audio latency.',
      primaryLabel: 'Return to setup', secondaryLabel: '', onPrimary: () => showPage('measure'),
    });
    return;
  }
  pendingSession = { action, reference, setup: resolvedSetup, nearCapture };
  pendingStage = stage;
  const distanceM = stage === 'near' ? resolvedSetup.nearDistanceM : resolvedSetup.farDistanceM;
  const labels = els.prepModal.querySelectorAll('.checklist label');
  labels[2].querySelector('strong').textContent = `Place the bottom edge at the ${stage} mark — ${formatDistanceM(distanceM)}`;
  labels[2].querySelector('small').textContent = 'Set it on a stable surface, aimed squarely at the same bare wall. Do not hand-hold it.';
  els.prepTitle.textContent = stage === 'near' ? 'Capture the near wall echo' : 'Capture the far wall echo';
  els.beginMeasurementButton.textContent = stage === 'near' ? 'Capture near position' : 'Capture far position';
  setModalVisible(els.prepModal, true);
}

async function captureEchoPosition({ distanceM, mode, signal, onProgress, stage }) {
  if (!window.isSecureContext) return { valid: false, code: 'insecure_context', message: 'Microphone capture requires the secure HTTPS RoomTone link.' };
  if (!navigator.mediaDevices?.getUserMedia) return { valid: false, code: 'unsupported_browser', message: 'Open RoomTone directly in current Safari or Chrome.' };

  let stream = null;
  let microphoneTrack = null;
  let trackEndedHandler = null;
  let context = null;
  let mediaSource = null;
  let processor = null;
  let pulseSource = null;
  let pulseGain = null;
  let wakeLock = null;
  let progressTimer = null;
  let visibilityHandler = null;
  const chunks = [];
  let captureOriginTime = null;
  let trainStartContextTime = null;

  const cleanup = async () => {
    clearInterval(progressTimer);
    if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
    if (microphoneTrack && trackEndedHandler) microphoneTrack.removeEventListener('ended', trackEndedHandler);
    try { pulseSource?.stop(); } catch { /* already ended */ }
    try { pulseSource?.disconnect(); } catch { /* no-op */ }
    try { pulseGain?.disconnect(); } catch { /* no-op */ }
    try { mediaSource?.disconnect(); } catch { /* no-op */ }
    try { processor?.disconnect(); } catch { /* no-op */ }
    if (processor) processor.onaudioprocess = null;
    stream?.getTracks().forEach((track) => track.stop());
    if (context && context.state !== 'closed') { try { await context.close(); } catch { /* no-op */ } }
    if (wakeLock) { try { await wakeLock.release(); } catch { /* no-op */ } }
  };

  try {
    onProgress(6, `Microphone permission · ${stage}`, 'Audio stays on this phone and is discarded after analysis.', 'permission');
    if (navigator.wakeLock?.request) { try { wakeLock = await navigator.wakeLock.request('screen'); } catch { /* optional */ } }
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: { ideal: 1 },
        sampleRate: { ideal: AUDIO.preferredSampleRate },
        echoCancellation: { ideal: false },
        noiseSuppression: { ideal: false },
        autoGainControl: { ideal: false },
      },
      video: false,
    });
    if (signal.aborted) throw makeAbortError();
    microphoneTrack = stream.getAudioTracks()[0];
    if (!microphoneTrack) return { valid: false, code: 'no_microphone', message: 'The browser granted permission but returned no microphone track.' };
    trackEndedHandler = () => activeAbortController?.abort();
    microphoneTrack.addEventListener('ended', trackEndedHandler, { once: true });
    const trackSettings = microphoneTrack.getSettings?.() || {};

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return { valid: false, code: 'no_web_audio', message: 'This browser does not provide the required audio engine.' };
    try { context = new AudioContextClass({ latencyHint: 'interactive', sampleRate: AUDIO.preferredSampleRate }); }
    catch { context = new AudioContextClass({ latencyHint: 'interactive' }); }
    await context.resume();
    if (typeof context.createScriptProcessor !== 'function') return { valid: false, code: 'no_capture_processor', message: 'This browser cannot expose real-time microphone samples to RoomTone.' };

    const sampleRate = context.sampleRate;
    const passCount = mode === 'best' ? AUDIO.bestPasses : AUDIO.fastPasses;
    const maximumFrequencyHz = Math.min(17800, Math.floor(sampleRate * 0.41));
    if (maximumFrequencyHz < 12000) return { valid: false, code: 'sample_rate_low', message: 'The browser audio path has insufficient bandwidth for wall-echo ranging.' };
    const pulseTrain = buildEchoPulseTrainSamples({
      sampleRate,
      passCount,
      minimumFrequencyHz: 2600,
      maximumFrequencyHz,
    });

    mediaSource = context.createMediaStreamSource(stream);
    processor = context.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      const eventTime = Number.isFinite(event.playbackTime) && event.playbackTime > 0 ? event.playbackTime : context.currentTime;
      if (captureOriginTime === null) captureOriginTime = eventTime;
      event.outputBuffer.getChannelData(0).fill(0);
    };
    mediaSource.connect(processor);
    processor.connect(context.destination);

    visibilityHandler = () => { if (document.hidden) activeAbortController?.abort(); };
    document.addEventListener('visibilitychange', visibilityHandler);
    onProgress(18, `Preparing ${stage} capture`, 'Listening briefly before the coded chirps.', 'permission');
    await delay(430, signal);

    const buffer = context.createBuffer(1, pulseTrain.samples.length, sampleRate);
    buffer.copyToChannel(pulseTrain.samples, 0);
    pulseSource = context.createBufferSource();
    pulseSource.buffer = buffer;
    pulseGain = context.createGain();
    pulseGain.gain.value = 1;
    pulseSource.connect(pulseGain).connect(context.destination);
    trainStartContextTime = context.currentTime + AUDIO.preRollS;
    pulseSource.start(trainStartContextTime);
    onProgress(26, `Capturing ${stage} wall echo`, 'Keep the phone completely still until every chirp finishes.', 'sweep');

    const wallStart = performance.now() + (AUDIO.preRollS * 1000);
    progressTimer = setInterval(() => {
      const ratio = clamp((performance.now() - wallStart) / (pulseTrain.durationS * 1000), 0, 1);
      onProgress(26 + (ratio * 46), `Capturing ${stage} wall echo`, `${Math.max(1, Math.ceil((1 - ratio) * pulseTrain.durationS))} seconds remaining…`, 'sweep');
    }, 160);
    await delay((AUDIO.preRollS + pulseTrain.durationS + AUDIO.tailS) * 1000, signal);
    clearInterval(progressTimer);
    onProgress(79, `Analyzing ${stage} echoes`, 'Matching the direct pulse and the wall reflection across repeated passes.', 'analyze');

    const mono = concatenateFloat32(chunks);
    const origin = captureOriginTime ?? (trainStartContextTime - AUDIO.preRollS);
    const captureOriginToTrainStartS = Math.max(0, trainStartContextTime - origin);
    const analysis = analyzeEchoCapture({
      mono,
      sampleRate,
      captureOriginToTrainStartS,
      pulseTrain,
      wallDistanceM: distanceM,
      passCount,
    });
    analysis.sampleRate = sampleRate;
    analysis.stage = stage;
    analysis.diagnostics = {
      ...(analysis.diagnostics || {}),
      stage,
      sampleRate,
      wallDistanceM: distanceM,
      acceptedPasses: analysis.acceptedPasses,
      totalPasses: analysis.totalPasses,
      trackSampleRate: trackSettings.sampleRate ?? 'unknown',
      echoCancellation: trackSettings.echoCancellation ?? 'requested off',
      noiseSuppression: trackSettings.noiseSuppression ?? 'requested off',
      autoGainControl: trackSettings.autoGainControl ?? 'requested off',
      userAgent: navigator.userAgent,
    };
    onProgress(93, `Validating ${stage} capture`, 'Checking echo strength, clipping and pass-to-pass agreement.', 'validate');
    await delay(150, signal);
    return analysis;
  } catch (error) {
    if (isAbortError(error)) throw error;
    const name = error?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return { valid: false, code: 'permission_denied', message: 'Microphone permission is blocked. Allow it in the browser’s site settings and retry.' };
    if (name === 'NotReadableError' || name === 'TrackStartError') return { valid: false, code: 'microphone_busy', message: 'The microphone is busy in another app or call.' };
    if (name === 'NotFoundError') return { valid: false, code: 'no_microphone', message: 'No usable microphone was available.' };
    return { valid: false, code: 'audio_error', message: error?.message || 'The browser audio session ended unexpectedly.' };
  } finally {
    await cleanup();
  }
}

function normalizePair(nearCapture, farCapture) {
  const referenceRate = 48000;
  return {
    sampleRate: referenceRate,
    nearEchoDelaySamples: (nearCapture.echoDelaySamples / nearCapture.sampleRate) * referenceRate,
    farEchoDelaySamples: (farCapture.echoDelaySamples / farCapture.sampleRate) * referenceRate,
    nearDelaySigmaSamples: (nearCapture.echoDelaySigmaSamples / nearCapture.sampleRate) * referenceRate,
    farDelaySigmaSamples: (farCapture.echoDelaySigmaSamples / farCapture.sampleRate) * referenceRate,
  };
}

function createResult(nearCapture, farCapture, setup) {
  const normalized = normalizePair(nearCapture, farCapture);
  const humidity = clamp(Number(settings.humidity) || DEFAULT_HUMIDITY, 0, 100);
  const pathDifferenceM = setup.effectivePathDifferenceM;
  const speedMps = speedFromEchoDifferentialMps({ ...normalized, pathDifferenceM });
  const temperatureC = temperatureFromEchoDifferentialC({ ...normalized, pathDifferenceM, relativeHumidity: humidity });
  if (!Number.isFinite(speedMps) || speedMps < 320 || speedMps > 370 || !Number.isFinite(temperatureC)) {
    return {
      valid: false,
      code: 'implausible_sound_speed',
      message: 'The two echoes produced a physically implausible sound speed. One position was probably mis-marked or a different reflection was selected.',
      diagnostics: pairDiagnostics(nearCapture, farCapture, setup, normalized, speedMps, temperatureC),
    };
  }
  const qualityScore = Math.round(Math.min(nearCapture.qualityScore, farCapture.qualityScore) * 0.7 + ((nearCapture.qualityScore + farCapture.qualityScore) / 2) * 0.3);
  const uncertaintyC = Math.max(
    setup.calibrationApplies ? 0.9 : 1.6,
    estimateEchoTemperatureUncertaintyC({
      ...normalized,
      pathDifferenceM,
      pathSigmaM: setup.effectivePathSigmaM,
      relativeHumidity: humidity,
      calibrated: setup.calibrationApplies,
      qualityScore,
    }),
  );
  return {
    valid: true,
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    temperatureC,
    uncertaintyC,
    speedMps,
    qualityScore,
    acceptedPasses: Math.min(nearCapture.acceptedPasses, farCapture.acceptedPasses),
    totalPasses: Math.min(nearCapture.totalPasses, farCapture.totalPasses),
    calibrated: setup.calibrationApplies,
    nearDistanceM: setup.nearDistanceM,
    farDistanceM: setup.farDistanceM,
    humidity,
    diagnostics: pairDiagnostics(nearCapture, farCapture, setup, normalized, speedMps, temperatureC),
  };
}

function pairDiagnostics(nearCapture, farCapture, setup, normalized, speedMps, temperatureC) {
  const nearMs = (nearCapture.echoDelaySamples / nearCapture.sampleRate) * 1000;
  const farMs = (farCapture.echoDelaySamples / farCapture.sampleRate) * 1000;
  return {
    stage: 'paired result',
    sampleRate: normalized.sampleRate,
    nearEchoDelayMs: nearMs,
    farEchoDelayMs: farMs,
    differentialDelayMs: farMs - nearMs,
    nearEchoDelaySamples: normalized.nearEchoDelaySamples,
    farEchoDelaySamples: normalized.farEchoDelaySamples,
    pathDifferenceM: setup.effectivePathDifferenceM,
    speedMps,
    temperatureC,
    calibrated: setup.calibrationApplies,
    nearAcceptedPasses: nearCapture.acceptedPasses,
    farAcceptedPasses: farCapture.acceptedPasses,
    acceptedPasses: Math.min(nearCapture.acceptedPasses, farCapture.acceptedPasses),
    totalPasses: Math.min(nearCapture.totalPasses, farCapture.totalPasses),
    nearQuality: nearCapture.qualityScore,
    farQuality: farCapture.qualityScore,
  };
}

function createCalibration(nearCapture, farCapture, setup, reference) {
  const normalized = normalizePair(nearCapture, farCapture);
  const effectivePathDifferenceM = effectiveEchoPathFromCalibrationM({
    ...normalized,
    referenceTemperatureC: reference.temperatureC,
    relativeHumidity: reference.humidity,
  });
  const scale = effectivePathDifferenceM / setup.modeledPathDifferenceM;
  if (!Number.isFinite(effectivePathDifferenceM) || scale < 0.82 || scale > 1.18) {
    return { valid: false, code: 'calibration_geometry', message: 'The reference and echo timing imply an implausible correction. No calibration was saved.' };
  }
  const sampleDifference = normalized.farEchoDelaySamples - normalized.nearEchoDelaySamples;
  const timingSigma = Math.hypot(normalized.nearDelaySigmaSamples, normalized.farDelaySigmaSamples);
  const relativeTimingSigma = timingSigma / sampleDifference;
  const pathSigmaM = Math.max(0.0012, effectivePathDifferenceM * Math.hypot(relativeTimingSigma, 0.0020));
  return {
    valid: true,
    effectivePathDifferenceM,
    pathSigmaM,
    scale,
    nearDistanceM: setup.nearDistanceM,
    farDistanceM: setup.farDistanceM,
    referenceTemperatureC: reference.temperatureC,
    humidity: reference.humidity,
    createdAt: new Date().toISOString(),
  };
}

function saveReading(result) {
  latestResult = result;
  history = [result, ...(Array.isArray(history) ? history : [])].slice(0, 60);
  writeJson(STORAGE.history, history);
  renderLatest();
  renderHistory();
}

async function runCaptureStage() {
  const session = pendingSession;
  const stage = pendingStage;
  if (!session?.setup?.valid) return;
  setModalVisible(els.prepModal, false);
  activeAbortController = new AbortController();
  document.body.classList.add('measurement-active');
  setModalVisible(els.progressModal, true);
  setProgress(0, `Preparing ${stage} position`, 'Starting the private audio session…', 'permission');
  try {
    const distanceM = stage === 'near' ? session.setup.nearDistanceM : session.setup.farDistanceM;
    const capture = await captureEchoPosition({
      distanceM,
      mode: settings.mode,
      signal: activeAbortController.signal,
      onProgress: setProgress,
      stage,
    });
    if (!capture.valid) {
      saveDiagnostics({ ...capture, createdAt: new Date().toISOString() });
      renderCompatibility({ kind: 'failed', message: capture.message });
      setModalVisible(els.progressModal, false);
      showMessage({
        icon: '!', eyebrow: `${stage === 'near' ? 'Near' : 'Far'} capture rejected`, title: failureTitle(capture.code),
        body: capture.message, details: failureDetail(capture.code), primaryLabel: 'Try this position again', secondaryLabel: 'Close',
        onPrimary: () => openPreparation({ ...session, stage }),
      });
      return;
    }
    setProgress(100, `${stage === 'near' ? 'Near' : 'Far'} echo accepted`, 'The wall reflection passed every signal check.', 'validate');
    saveDiagnostics({ valid: true, status: `${stage} capture accepted`, createdAt: new Date().toISOString(), diagnostics: capture.diagnostics });
    await delay(180, activeAbortController.signal);
    setModalVisible(els.progressModal, false);

    if (stage === 'near') {
      const nextSession = { ...session, nearCapture: capture };
      showMessage({
        icon: '✓', good: true, eyebrow: 'Near position accepted', title: 'Move the phone to the far mark',
        body: `The ${formatDistanceM(session.setup.nearDistanceM)} echo is locked. Keep the same wall, orientation and volume, then place the bottom edge at ${formatDistanceM(session.setup.farDistanceM)}.`,
        details: 'The final calculation uses only the change between the two echoes, which cancels browser input/output latency.',
        primaryLabel: 'Capture far position', secondaryLabel: 'Cancel measurement',
        onPrimary: () => openPreparation({ ...nextSession, stage: 'far' }),
      });
      return;
    }

    const nearCapture = session.nearCapture;
    if (!nearCapture) throw new Error('The accepted near capture was not available.');
    if (session.action === 'calibration') {
      const nextCalibration = createCalibration(nearCapture, capture, session.setup, session.reference);
      if (!nextCalibration.valid) {
        showMessage({
          icon: '!', eyebrow: 'Calibration not saved', title: 'The correction was not physically credible',
          body: nextCalibration.message, details: 'Recheck the reference temperature and both wall marks, then repeat the two captures.',
          primaryLabel: 'Try calibration again', secondaryLabel: 'Close',
          onPrimary: () => openPreparation({ action: 'calibration', stage: 'near', reference: session.reference, setup: session.setup }),
        });
        return;
      }
      calibration = nextCalibration;
      writeJson(STORAGE.calibration, calibration);
      renderCalibration();
      if (navigator.vibrate) navigator.vibrate([18, 40, 18]);
      showMessage({
        icon: '✓', good: true, eyebrow: 'Calibration saved', title: 'This two-position setup is calibrated',
        body: `RoomTone saved a ${(calibration.scale * 100).toFixed(2)}% effective-path correction for these exact wall marks.`,
        details: 'Keep using the same near and far distances. The correction remains only in this browser.',
        primaryLabel: 'Measure the room', secondaryLabel: 'Close',
        onPrimary: () => openPreparation({ action: 'measurement', stage: 'near', setup: currentSetup() }),
      });
      return;
    }

    const refreshedSetup = currentSetup();
    const result = createResult(nearCapture, capture, refreshedSetup.valid ? refreshedSetup : session.setup);
    if (!result.valid) {
      saveDiagnostics({ ...result, createdAt: new Date().toISOString() });
      renderCompatibility({ kind: 'failed', message: result.message });
      showMessage({
        icon: '!', eyebrow: 'Pair rejected', title: 'The two positions did not describe a credible sound speed',
        body: result.message, details: 'Confirm the marks, use the same wall, and do not rotate the phone between captures.',
        primaryLabel: 'Restart both positions', secondaryLabel: 'Close',
        onPrimary: () => openPreparation({ action: 'measurement', stage: 'near', setup: currentSetup() }),
      });
      return;
    }
    saveReading(result);
    saveDiagnostics({ valid: true, status: 'Paired reading accepted', createdAt: result.createdAt, diagnostics: result.diagnostics });
    renderCompatibility({ kind: 'success', acceptedPasses: result.acceptedPasses, totalPasses: result.totalPasses });
    if (navigator.vibrate) navigator.vibrate([18, 45, 18]);
    const uncertainty = settings.unit === 'C' ? result.uncertaintyC : result.uncertaintyC * 9 / 5;
    showMessage({
      icon: '✓', good: true, eyebrow: 'Measurement accepted', title: formatTemperature(result.temperatureC, settings.unit, 1),
      body: `${qualityLabel(result.qualityScore)} wall-echo quality with ${result.acceptedPasses}/${result.totalPasses} paired passes. Estimated uncertainty is ±${uncertainty.toFixed(1)}°${settings.unit}.`,
      details: result.calibrated ? 'The saved correction for these wall marks was applied.' : 'The result used measured wall geometry. Optional one-point calibration can reduce systematic path error.',
      primaryLabel: 'View reading', secondaryLabel: 'Measure again', onPrimary: () => showPage('measure'),
      onSecondary: () => openPreparation({ action: 'measurement', stage: 'near', setup: currentSetup() }),
    });
  } catch (error) {
    setModalVisible(els.progressModal, false);
    if (isAbortError(error)) showToast('Measurement cancelled.');
    else showMessage({
      icon: '!', eyebrow: 'Audio session interrupted', title: 'The capture stopped unexpectedly',
      body: error?.message || 'RoomTone could not finish the wall-echo capture.',
      details: 'Keep the page in the foreground, close calls or recording apps, and retry.',
      primaryLabel: 'Restart measurement', secondaryLabel: 'Close',
      onPrimary: () => openPreparation({ action: session.action, stage: 'near', reference: session.reference, setup: currentSetup() }),
    });
  } finally {
    activeAbortController = null;
    document.body.classList.remove('measurement-active');
  }
}

function failureTitle(code) {
  return ({
    insecure_context: 'Open the secure RoomTone link', unsupported_browser: 'This browser cannot capture the microphone',
    permission_denied: 'Microphone access is blocked', no_microphone: 'No microphone was available',
    microphone_busy: 'The microphone is already in use', direct_pulse_missing: 'The direct chirp was not resolved',
    wall_echo_missing: 'The wall echo was too weak', echo_inconsistent: 'The phone moved between chirps',
    sample_rate_low: 'The audio path has insufficient bandwidth', distance_out_of_range: 'The wall distance is outside the supported range',
  })[code] || 'The echo did not pass validation';
}

function failureDetail(code) {
  if (code === 'permission_denied') return 'On iPhone, open the page menu or Safari settings and allow microphone access for this site.';
  if (code === 'direct_pulse_missing') return 'Set media volume near 70–80%, remove a case that blocks the bottom edge, and point the bottom speaker/microphone openings at the wall.';
  if (code === 'wall_echo_missing') return 'Use a large bare wall rather than curtains, bedding, an open doorway or an angled surface.';
  if (code === 'echo_inconsistent') return 'Place the phone on a table, shelf or firm bed surface. Do not hold it in your hand.';
  return 'Pause fans, television and music; keep the same orientation; and retry the position.';
}

function calibrationReferenceFromForm() {
  const entered = Number(els.referenceTemperature.value);
  if (!Number.isFinite(entered)) return null;
  const temperatureC = settings.referenceUnit === 'C' ? entered : fToC(entered);
  if (temperatureC < -1 || temperatureC > 44) return null;
  return { temperatureC, humidity: clamp(Number(els.humidityInput.value) || DEFAULT_HUMIDITY, 0, 100) };
}

function bindEvents() {
  for (const button of document.querySelectorAll('.nav-button, .nav-shortcut')) button.addEventListener('click', () => showPage(button.dataset.target));
  els.fastModeButton.addEventListener('click', () => setMode('fast'));
  els.bestModeButton.addEventListener('click', () => setMode('best'));
  els.measureButton.addEventListener('click', () => openPreparation({ action: 'measurement', stage: 'near', setup: currentSetup() }));
  els.diagnosticButton.addEventListener('click', () => openPreparation({ action: 'measurement', stage: 'near', setup: currentSetup() }));
  els.closePrepButton.addEventListener('click', () => setModalVisible(els.prepModal, false));
  els.prepModal.querySelector('.modal-scrim').addEventListener('click', () => setModalVisible(els.prepModal, false));
  els.beginMeasurementButton.addEventListener('click', runCaptureStage);
  els.cancelMeasurementButton.addEventListener('click', () => activeAbortController?.abort());

  els.distancePreset.addEventListener('change', () => setDistancePreset(els.distancePreset.value));
  els.distanceUnitIn.addEventListener('click', () => { setDistanceUnit('in'); markDistanceCustom(); });
  els.distanceUnitCm.addEventListener('click', () => { setDistanceUnit('cm'); markDistanceCustom(); });
  els.nearDistance.addEventListener('input', markDistanceCustom);
  els.farDistance.addEventListener('input', markDistanceCustom);

  els.calibrationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const reference = calibrationReferenceFromForm();
    const setup = currentSetup();
    if (!reference || !setup.valid) {
      showMessage({
        icon: '!', eyebrow: 'Reference or marks need attention', title: 'Complete the calibration inputs',
        body: reference ? setup.message : `Use a reference between ${settings.referenceUnit === 'F' ? '30°F and 110°F' : '-1°C and 44°C'}.`,
        details: 'The reference should be stable and both wall marks should be measured before starting.',
        primaryLabel: 'Return to calibration', secondaryLabel: '', onPrimary: () => showPage('calibrate'),
      });
      return;
    }
    settings.humidity = reference.humidity;
    saveSettings();
    openPreparation({ action: 'calibration', stage: 'near', reference, setup });
  });
  els.removeCalibrationButton.addEventListener('click', () => {
    calibration = null;
    removeStored(STORAGE.calibration);
    renderCalibration();
    showToast('Saved calibration removed.');
  });
  els.referenceUnitF.addEventListener('click', () => setReferenceUnit('F'));
  els.referenceUnitC.addEventListener('click', () => setReferenceUnit('C'));
  els.humidityInput.addEventListener('input', () => {
    els.humidityOutput.textContent = `${els.humidityInput.value}%`;
    settings.humidity = Number(els.humidityInput.value);
    saveSettings();
  });
  els.deviceProfile.addEventListener('change', () => {
    settings.deviceProfile = els.deviceProfile.value;
    saveSettings();
    renderCalibration();
  });
  els.displayUnitF.addEventListener('click', () => setUnit('F'));
  els.displayUnitC.addEventListener('click', () => setUnit('C'));

  els.clearHistoryButton.addEventListener('click', () => showMessage({
    icon: '!', eyebrow: 'Local history', title: 'Delete every saved reading?',
    body: 'This removes accepted readings from this browser. It does not remove the saved calibration.',
    primaryLabel: 'Delete history', secondaryLabel: 'Cancel', onPrimary: () => {
      history = []; latestResult = null; removeStored(STORAGE.history); renderHistory(); renderLatest(); showToast('Reading history deleted.');
    },
  }));

  els.demoButton.addEventListener('click', () => showMessage({
    icon: '≈', good: true, eyebrow: 'Simulated example — not a reading', title: formatTemperature(22.4, settings.unit, 1),
    body: `A completed calibrated result might show ${formatTemperature(21.3, settings.unit, 1)}–${formatTemperature(23.5, settings.unit, 1)} with Good echo quality.`,
    details: 'No microphone was used, no history item was created, and this value does not describe your room.',
    primaryLabel: 'Run a real measurement', secondaryLabel: 'Close',
    onPrimary: () => openPreparation({ action: 'measurement', stage: 'near', setup: currentSetup() }),
  }));

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); deferredInstallPrompt = event;
    if (!settings.installDismissed && !isStandalone()) els.installBanner.hidden = false;
  });
  els.installButton.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      els.installBanner.hidden = true;
      return;
    }
    showMessage({
      icon: '↗', good: true, eyebrow: 'Home Screen access',
      title: isIos() ? 'Add RoomTone from Safari' : 'Install RoomTone from the browser menu',
      body: isIos() ? 'Tap Share in Safari, scroll to Add to Home Screen, then tap Add.' : 'Open the browser menu and choose Install app or Add to Home screen.',
      details: 'Installation is optional. The live link works without it.', primaryLabel: 'Got it', secondaryLabel: '',
    });
  });
  els.dismissInstall.addEventListener('click', () => {
    settings.installDismissed = true; saveSettings(); els.installBanner.hidden = true;
  });
  window.addEventListener('appinstalled', () => { els.installBanner.hidden = true; showToast('RoomTone added to the Home Screen.'); });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try { await navigator.serviceWorker.register('./sw.js', { scope: './' }); } catch { /* online app remains usable */ }
}

bindEvents();
initializeUi();
registerServiceWorker();
