export const DEFAULT_HUMIDITY = 50;

export const DEVICE_PROFILES = Object.freeze({
  'iphone-large': {
    id: 'iphone-large',
    name: 'Large iPhone',
    detail: 'Pro Max / Plus size',
    effectiveDistanceM: 0.150,
    distanceSigmaM: 0.0022,
    speakerMicSeparationM: 0.020,
    separationSigmaM: 0.012,
  },
  'iphone-standard': {
    id: 'iphone-standard',
    name: 'Standard iPhone',
    detail: '6.1-inch class',
    effectiveDistanceM: 0.137,
    distanceSigmaM: 0.0022,
    speakerMicSeparationM: 0.020,
    separationSigmaM: 0.012,
  },
  'android-large': {
    id: 'android-large',
    name: 'Large Android phone',
    detail: '6.6-inch class or larger',
    effectiveDistanceM: 0.148,
    distanceSigmaM: 0.0035,
    speakerMicSeparationM: 0.025,
    separationSigmaM: 0.018,
  },
  'other-phone': {
    id: 'other-phone',
    name: 'Other phone',
    detail: 'Conservative generic profile',
    effectiveDistanceM: 0.140,
    distanceSigmaM: 0.006,
    speakerMicSeparationM: 0.035,
    separationSigmaM: 0.035,
  },
});

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function median(values) {
  if (!Array.isArray(values) || values.length === 0) return NaN;
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return NaN;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function mad(values, center = median(values)) {
  if (!Number.isFinite(center)) return NaN;
  return median(values.filter(Number.isFinite).map((value) => Math.abs(value - center)));
}

export function robustSigma(values) {
  const deviation = mad(values);
  return Number.isFinite(deviation) ? 1.4826 * deviation : NaN;
}

/**
 * Approximate speed of sound in humid room air, valid for ordinary indoor conditions.
 * Temperature is °C and relativeHumidity is 0–100 percent.
 */
export function speedOfSoundMps(temperatureC, relativeHumidity = DEFAULT_HUMIDITY) {
  const rh = clamp(Number(relativeHumidity) || 0, 0, 100);
  return 331.3 + (0.606 * Number(temperatureC)) + (0.0124 * rh);
}

export function temperatureFromSpeedC(speedMps, relativeHumidity = DEFAULT_HUMIDITY) {
  const rh = clamp(Number(relativeHumidity) || 0, 0, 100);
  return (Number(speedMps) - 331.3 - (0.0124 * rh)) / 0.606;
}

export function beatFrequencyHz({
  effectiveDistanceM,
  bandwidthHz,
  halfSweepDurationS,
  temperatureC,
  relativeHumidity = DEFAULT_HUMIDITY,
}) {
  const speed = speedOfSoundMps(temperatureC, relativeHumidity);
  return (effectiveDistanceM * bandwidthHz) / (speed * halfSweepDurationS);
}

export function speedFromBeatMps({
  beatHz,
  effectiveDistanceM,
  bandwidthHz,
  halfSweepDurationS,
}) {
  if (![beatHz, effectiveDistanceM, bandwidthHz, halfSweepDurationS].every((value) => Number.isFinite(Number(value)))) {
    return NaN;
  }
  if (beatHz <= 0 || effectiveDistanceM <= 0 || bandwidthHz <= 0 || halfSweepDurationS <= 0) {
    return NaN;
  }
  return (effectiveDistanceM * bandwidthHz) / (beatHz * halfSweepDurationS);
}

export function temperatureFromBeatC({
  beatHz,
  effectiveDistanceM,
  bandwidthHz,
  halfSweepDurationS,
  relativeHumidity = DEFAULT_HUMIDITY,
}) {
  const speed = speedFromBeatMps({ beatHz, effectiveDistanceM, bandwidthHz, halfSweepDurationS });
  return temperatureFromSpeedC(speed, relativeHumidity);
}

export function effectiveDistanceFromCalibrationM({
  beatHz,
  bandwidthHz,
  halfSweepDurationS,
  referenceTemperatureC,
  relativeHumidity = DEFAULT_HUMIDITY,
}) {
  const speed = speedOfSoundMps(referenceTemperatureC, relativeHumidity);
  if (![beatHz, bandwidthHz, halfSweepDurationS, speed].every(Number.isFinite)) return NaN;
  if (beatHz <= 0 || bandwidthHz <= 0 || halfSweepDurationS <= 0) return NaN;
  return (speed * beatHz * halfSweepDurationS) / bandwidthHz;
}

export function cToF(celsius) {
  return (Number(celsius) * 9 / 5) + 32;
}

export function fToC(fahrenheit) {
  return (Number(fahrenheit) - 32) * 5 / 9;
}

export function formatTemperature(celsius, unit = 'F', digits = 1) {
  const value = unit === 'C' ? Number(celsius) : cToF(celsius);
  return Number.isFinite(value) ? `${value.toFixed(digits)}°${unit}` : '—';
}

export function estimateTemperatureUncertaintyC({
  beatHz,
  beatSigmaHz,
  effectiveDistanceM,
  distanceSigmaM,
  bandwidthHz,
  halfSweepDurationS,
  relativeHumidity = DEFAULT_HUMIDITY,
  calibrated = false,
  qualityScore = 50,
}) {
  const baseTemp = temperatureFromBeatC({
    beatHz,
    effectiveDistanceM,
    bandwidthHz,
    halfSweepDurationS,
    relativeHumidity,
  });

  if (!Number.isFinite(baseTemp)) return NaN;

  const safeBeatSigma = Math.max(Number(beatSigmaHz) || 0, calibrated ? 0.10 : 0.18);
  const safeDistanceSigma = Math.max(Number(distanceSigmaM) || 0, calibrated ? 0.00035 : 0.0015);

  const tempAtLowerBeat = temperatureFromBeatC({
    beatHz: beatHz + safeBeatSigma,
    effectiveDistanceM,
    bandwidthHz,
    halfSweepDurationS,
    relativeHumidity,
  });
  const tempAtUpperBeat = temperatureFromBeatC({
    beatHz: Math.max(0.01, beatHz - safeBeatSigma),
    effectiveDistanceM,
    bandwidthHz,
    halfSweepDurationS,
    relativeHumidity,
  });
  const frequencyComponent = Math.max(
    Math.abs(baseTemp - tempAtLowerBeat),
    Math.abs(baseTemp - tempAtUpperBeat),
  );

  const tempAtLowerDistance = temperatureFromBeatC({
    beatHz,
    effectiveDistanceM: Math.max(0.01, effectiveDistanceM - safeDistanceSigma),
    bandwidthHz,
    halfSweepDurationS,
    relativeHumidity,
  });
  const tempAtUpperDistance = temperatureFromBeatC({
    beatHz,
    effectiveDistanceM: effectiveDistanceM + safeDistanceSigma,
    bandwidthHz,
    halfSweepDurationS,
    relativeHumidity,
  });
  const geometryComponent = Math.max(
    Math.abs(baseTemp - tempAtLowerDistance),
    Math.abs(baseTemp - tempAtUpperDistance),
  );

  const humidityComponent = 0.45;
  const browserAudioFloor = calibrated ? 0.9 : 1.8;
  const qualityPenalty = ((100 - clamp(qualityScore, 0, 100)) / 100) * (calibrated ? 2.0 : 4.0);

  return Math.sqrt(
    (frequencyComponent ** 2) +
    (geometryComponent ** 2) +
    (humidityComponent ** 2) +
    (browserAudioFloor ** 2) +
    (qualityPenalty ** 2)
  );
}

export function qualityLabel(score) {
  const safeScore = clamp(Number(score) || 0, 0, 100);
  if (safeScore >= 86) return 'Excellent';
  if (safeScore >= 72) return 'Good';
  if (safeScore >= 56) return 'Fair';
  return 'Poor';
}

export function comfortLabel(temperatureC) {
  if (!Number.isFinite(temperatureC)) return '';
  if (temperatureC < 16) return 'Cool';
  if (temperatureC < 20) return 'Slightly cool';
  if (temperatureC <= 24) return 'Comfortable';
  if (temperatureC <= 27) return 'Warm';
  return 'Hot';
}

/**
 * Difference between the reflected speaker-to-wall-to-microphone path at two
 * phone positions. The direct speaker-to-microphone path cancels when the two
 * echo delays are subtracted.
 */
export function echoPathDifferenceM({
  nearDistanceM,
  farDistanceM,
  speakerMicSeparationM = 0.02,
}) {
  const near = Number(nearDistanceM);
  const far = Number(farDistanceM);
  const separation = Math.max(0, Number(speakerMicSeparationM) || 0);
  if (![near, far].every(Number.isFinite) || near <= 0 || far <= near) return NaN;
  const reflectedPath = (distance) => Math.sqrt(((2 * distance) ** 2) + (separation ** 2));
  return reflectedPath(far) - reflectedPath(near);
}

export function speedFromEchoDifferentialMps({
  nearEchoDelaySamples,
  farEchoDelaySamples,
  sampleRate,
  pathDifferenceM,
}) {
  const sampleDifference = Number(farEchoDelaySamples) - Number(nearEchoDelaySamples);
  if (![sampleDifference, sampleRate, pathDifferenceM].every(Number.isFinite)) return NaN;
  if (sampleDifference <= 0 || sampleRate <= 0 || pathDifferenceM <= 0) return NaN;
  return Number(pathDifferenceM) * Number(sampleRate) / sampleDifference;
}

export function temperatureFromEchoDifferentialC({
  nearEchoDelaySamples,
  farEchoDelaySamples,
  sampleRate,
  pathDifferenceM,
  relativeHumidity = DEFAULT_HUMIDITY,
}) {
  const speed = speedFromEchoDifferentialMps({
    nearEchoDelaySamples,
    farEchoDelaySamples,
    sampleRate,
    pathDifferenceM,
  });
  return temperatureFromSpeedC(speed, relativeHumidity);
}

export function effectiveEchoPathFromCalibrationM({
  nearEchoDelaySamples,
  farEchoDelaySamples,
  sampleRate,
  referenceTemperatureC,
  relativeHumidity = DEFAULT_HUMIDITY,
}) {
  const sampleDifference = Number(farEchoDelaySamples) - Number(nearEchoDelaySamples);
  const speed = speedOfSoundMps(referenceTemperatureC, relativeHumidity);
  if (![sampleDifference, sampleRate, speed].every(Number.isFinite)) return NaN;
  if (sampleDifference <= 0 || sampleRate <= 0) return NaN;
  return speed * sampleDifference / sampleRate;
}

export function estimateEchoTemperatureUncertaintyC({
  nearEchoDelaySamples,
  farEchoDelaySamples,
  nearDelaySigmaSamples = 0.08,
  farDelaySigmaSamples = 0.08,
  sampleRate,
  pathDifferenceM,
  pathSigmaM = 0.004,
  relativeHumidity = DEFAULT_HUMIDITY,
  calibrated = false,
  qualityScore = 50,
}) {
  const base = temperatureFromEchoDifferentialC({
    nearEchoDelaySamples,
    farEchoDelaySamples,
    sampleRate,
    pathDifferenceM,
    relativeHumidity,
  });
  if (!Number.isFinite(base)) return NaN;

  const differenceSamples = Number(farEchoDelaySamples) - Number(nearEchoDelaySamples);
  const delaySigma = Math.max(
    calibrated ? 0.045 : 0.07,
    Math.hypot(Number(nearDelaySigmaSamples) || 0, Number(farDelaySigmaSamples) || 0),
  );
  const lowerDifference = Math.max(0.01, differenceSamples - delaySigma);
  const upperDifference = differenceSamples + delaySigma;
  const tempLowerDifference = temperatureFromSpeedC(pathDifferenceM * sampleRate / upperDifference, relativeHumidity);
  const tempUpperDifference = temperatureFromSpeedC(pathDifferenceM * sampleRate / lowerDifference, relativeHumidity);
  const timingComponent = Math.max(
    Math.abs(base - tempLowerDifference),
    Math.abs(base - tempUpperDifference),
  );

  const safePathSigma = Math.max(calibrated ? 0.0008 : 0.002, Number(pathSigmaM) || 0);
  const tempLowerPath = temperatureFromSpeedC(Math.max(0.001, pathDifferenceM - safePathSigma) * sampleRate / differenceSamples, relativeHumidity);
  const tempUpperPath = temperatureFromSpeedC((pathDifferenceM + safePathSigma) * sampleRate / differenceSamples, relativeHumidity);
  const distanceComponent = Math.max(
    Math.abs(base - tempLowerPath),
    Math.abs(base - tempUpperPath),
  );

  const humidityComponent = 0.45;
  const browserFloor = calibrated ? 0.75 : 1.35;
  const qualityPenalty = ((100 - clamp(qualityScore, 0, 100)) / 100) * (calibrated ? 2.0 : 3.8);
  return Math.sqrt(
    (timingComponent ** 2) +
    (distanceComponent ** 2) +
    (humidityComponent ** 2) +
    (browserFloor ** 2) +
    (qualityPenalty ** 2)
  );
}
