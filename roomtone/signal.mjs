import { clamp, mad, median, robustSigma } from './physics.mjs';

export function nextPowerOfTwo(value) {
  let power = 1;
  while (power < value) power <<= 1;
  return power;
}

export function rms(samples, start = 0, end = samples.length) {
  const safeStart = Math.max(0, Math.floor(start));
  const safeEnd = Math.min(samples.length, Math.floor(end));
  if (safeEnd <= safeStart) return 0;
  let sum = 0;
  for (let i = safeStart; i < safeEnd; i += 1) {
    const value = samples[i];
    sum += value * value;
  }
  return Math.sqrt(sum / (safeEnd - safeStart));
}

export function channelStatistics(left, right, start = 0, end = Math.min(left.length, right.length)) {
  const safeStart = Math.max(0, Math.floor(start));
  const safeEnd = Math.min(left.length, right.length, Math.floor(end));
  const count = safeEnd - safeStart;
  if (count <= 2) {
    return { correlation: 1, differenceRatio: 0, balanceDb: 0, leftRms: 0, rightRms: 0 };
  }

  let sumL = 0;
  let sumR = 0;
  for (let i = safeStart; i < safeEnd; i += 1) {
    sumL += left[i];
    sumR += right[i];
  }
  const meanL = sumL / count;
  const meanR = sumR / count;

  let covariance = 0;
  let varianceL = 0;
  let varianceR = 0;
  let differenceEnergy = 0;
  for (let i = safeStart; i < safeEnd; i += 1) {
    const l = left[i] - meanL;
    const r = right[i] - meanR;
    covariance += l * r;
    varianceL += l * l;
    varianceR += r * r;
    const difference = l - r;
    differenceEnergy += difference * difference;
  }

  const leftRms = Math.sqrt(varianceL / count);
  const rightRms = Math.sqrt(varianceR / count);
  const referenceRms = Math.max(1e-9, (leftRms + rightRms) / 2);
  const differenceRms = Math.sqrt(differenceEnergy / count);
  const correlation = covariance / Math.max(1e-12, Math.sqrt(varianceL * varianceR));
  const balanceDb = 20 * Math.log10(Math.max(1e-9, leftRms) / Math.max(1e-9, rightRms));

  return {
    correlation: clamp(correlation, -1, 1),
    differenceRatio: differenceRms / referenceRms,
    balanceDb,
    leftRms,
    rightRms,
  };
}

export function lowpassProductAndDecimate(left, right, sampleRate, startIndex, endIndex, targetRate = 1000) {
  const start = Math.max(0, Math.floor(startIndex));
  const end = Math.min(left.length, right.length, Math.floor(endIndex));
  const factor = Math.max(1, Math.round(sampleRate / targetRate));
  const outputRate = sampleRate / factor;
  const cutoffHz = Math.min(190, outputRate * 0.38);
  const alpha = 1 - Math.exp((-2 * Math.PI * cutoffHz) / sampleRate);

  let stage1 = 0;
  let stage2 = 0;
  let stage3 = 0;
  let stage4 = 0;
  const output = new Float64Array(Math.max(0, Math.ceil((end - start) / factor)));
  let outputIndex = 0;
  let phase = 0;

  for (let i = start; i < end; i += 1) {
    const product = left[i] * right[i];
    stage1 += alpha * (product - stage1);
    stage2 += alpha * (stage1 - stage2);
    stage3 += alpha * (stage2 - stage3);
    stage4 += alpha * (stage3 - stage4);

    if (phase === 0) {
      output[outputIndex] = stage4;
      outputIndex += 1;
    }
    phase = (phase + 1) % factor;
  }

  return {
    samples: output.subarray(0, outputIndex),
    sampleRate: outputRate,
    decimationFactor: factor,
  };
}

function fftInPlace(real, imaginary) {
  const n = real.length;
  let j = 0;
  for (let i = 1; i < n; i += 1) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imaginary[i], imaginary[j]] = [imaginary[j], imaginary[i]];
    }
  }

  for (let length = 2; length <= n; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    const wLengthReal = Math.cos(angle);
    const wLengthImaginary = Math.sin(angle);
    for (let i = 0; i < n; i += length) {
      let wReal = 1;
      let wImaginary = 0;
      const half = length >> 1;
      for (let k = 0; k < half; k += 1) {
        const evenIndex = i + k;
        const oddIndex = evenIndex + half;
        const oddReal = (real[oddIndex] * wReal) - (imaginary[oddIndex] * wImaginary);
        const oddImaginary = (real[oddIndex] * wImaginary) + (imaginary[oddIndex] * wReal);
        const evenReal = real[evenIndex];
        const evenImaginary = imaginary[evenIndex];

        real[evenIndex] = evenReal + oddReal;
        imaginary[evenIndex] = evenImaginary + oddImaginary;
        real[oddIndex] = evenReal - oddReal;
        imaginary[oddIndex] = evenImaginary - oddImaginary;

        const nextWReal = (wReal * wLengthReal) - (wImaginary * wLengthImaginary);
        wImaginary = (wReal * wLengthImaginary) + (wImaginary * wLengthReal);
        wReal = nextWReal;
      }
    }
  }
}

export function estimateToneFrequency(samples, sampleRate, minHz = 25, maxHz = 140) {
  if (!samples || samples.length < 128) {
    return { frequencyHz: NaN, prominence: 0, peakMagnitude: 0, floorMagnitude: 0, resolutionHz: NaN };
  }

  const nfft = nextPowerOfTwo(samples.length);
  const real = new Float64Array(nfft);
  const imaginary = new Float64Array(nfft);

  let mean = 0;
  for (let i = 0; i < samples.length; i += 1) mean += samples[i];
  mean /= samples.length;

  for (let i = 0; i < samples.length; i += 1) {
    const window = 0.5 - (0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, samples.length - 1)));
    real[i] = (samples[i] - mean) * window;
  }

  fftInPlace(real, imaginary);

  const resolutionHz = sampleRate / nfft;
  const startBin = Math.max(2, Math.ceil(minHz / resolutionHz));
  const endBin = Math.min((nfft >> 1) - 2, Math.floor(maxHz / resolutionHz));
  if (endBin <= startBin) {
    return { frequencyHz: NaN, prominence: 0, peakMagnitude: 0, floorMagnitude: 0, resolutionHz };
  }

  const magnitudes = new Float64Array(endBin - startBin + 1);
  let peakBin = startBin;
  let peakMagnitude = -Infinity;
  for (let bin = startBin; bin <= endBin; bin += 1) {
    const magnitude = Math.hypot(real[bin], imaginary[bin]);
    magnitudes[bin - startBin] = magnitude;
    if (magnitude > peakMagnitude) {
      peakMagnitude = magnitude;
      peakBin = bin;
    }
  }

  const floorValues = [];
  for (let bin = startBin; bin <= endBin; bin += 1) {
    if (Math.abs(bin - peakBin) > 4) floorValues.push(magnitudes[bin - startBin]);
  }
  const floorMagnitude = Math.max(1e-12, median(floorValues));

  const previous = Math.max(1e-12, Math.hypot(real[peakBin - 1], imaginary[peakBin - 1]));
  const current = Math.max(1e-12, Math.hypot(real[peakBin], imaginary[peakBin]));
  const next = Math.max(1e-12, Math.hypot(real[peakBin + 1], imaginary[peakBin + 1]));
  const logPrevious = Math.log(previous);
  const logCurrent = Math.log(current);
  const logNext = Math.log(next);
  const denominator = logPrevious - (2 * logCurrent) + logNext;
  const offset = Math.abs(denominator) > 1e-12
    ? clamp(0.5 * (logPrevious - logNext) / denominator, -0.5, 0.5)
    : 0;

  return {
    frequencyHz: (peakBin + offset) * resolutionHz,
    prominence: current / floorMagnitude,
    peakMagnitude: current,
    floorMagnitude,
    resolutionHz,
  };
}

function sliceWindow(samples, center, length) {
  const safeLength = Math.min(samples.length, Math.max(128, Math.floor(length)));
  let start = Math.floor(center - (safeLength / 2));
  start = clamp(start, 0, Math.max(0, samples.length - safeLength));
  return samples.subarray(start, start + safeLength);
}

export function analyzeStereoBeat({
  left,
  right,
  sampleRate,
  chirpStartS,
  chirpDurationS,
  passCount = 3,
  minBeatHz = 25,
  maxBeatHz = 140,
}) {
  const length = Math.min(left?.length || 0, right?.length || 0);
  if (!length || !Number.isFinite(sampleRate) || sampleRate < 8000) {
    return { valid: false, code: 'insufficient_audio', message: 'The microphone did not return enough usable audio.' };
  }

  const chirpStart = Math.floor(chirpStartS * sampleRate);
  const chirpEnd = Math.min(length, Math.floor((chirpStartS + chirpDurationS) * sampleRate));
  const centralStart = Math.min(chirpEnd, chirpStart + Math.floor(0.25 * sampleRate));
  const centralEnd = Math.max(centralStart, chirpEnd - Math.floor(0.25 * sampleRate));
  const noiseEnd = Math.max(0, chirpStart - Math.floor(0.08 * sampleRate));
  const noiseStart = Math.max(0, noiseEnd - Math.floor(0.35 * sampleRate));

  const leftNoise = rms(left, noiseStart, noiseEnd);
  const rightNoise = rms(right, noiseStart, noiseEnd);
  const noiseRms = Math.sqrt(((leftNoise ** 2) + (rightNoise ** 2)) / 2);
  const leftSignal = rms(left, centralStart, centralEnd);
  const rightSignal = rms(right, centralStart, centralEnd);
  const signalRms = Math.sqrt(((leftSignal ** 2) + (rightSignal ** 2)) / 2);
  const snrDb = 20 * Math.log10(Math.max(1e-9, signalRms) / Math.max(1e-9, noiseRms));

  let clipped = 0;
  let sampleCounter = 0;
  for (let i = centralStart; i < centralEnd; i += 4) {
    if (Math.abs(left[i]) >= 0.985 || Math.abs(right[i]) >= 0.985) clipped += 1;
    sampleCounter += 1;
  }
  const clippingFraction = sampleCounter ? clipped / sampleCounter : 0;
  const stereo = channelStatistics(left, right, centralStart, centralEnd);

  if (signalRms < 0.0025 || snrDb < 4) {
    return {
      valid: false,
      code: 'chirp_not_heard',
      message: 'The microphone could not hear the sweep clearly. Raise media volume, uncover the speaker and try again.',
      diagnostics: { snrDb, signalRms, noiseRms, clippingFraction, ...stereo },
    };
  }

  if (clippingFraction > 0.08) {
    return {
      valid: false,
      code: 'clipping',
      message: 'The signal clipped. Lower media volume slightly and repeat the measurement.',
      diagnostics: { snrDb, signalRms, noiseRms, clippingFraction, ...stereo },
    };
  }

  if (stereo.differenceRatio < 0.012 || Math.abs(stereo.correlation) > 0.99985) {
    return {
      valid: false,
      code: 'duplicate_channels',
      message: 'This browser returned one microphone duplicated into two channels. Independent microphone channels are required for a real acoustic temperature reading.',
      diagnostics: { snrDb, signalRms, noiseRms, clippingFraction, ...stereo },
    };
  }

  const decimated = lowpassProductAndDecimate(
    left,
    right,
    sampleRate,
    centralStart,
    centralEnd,
    1000,
  );

  if (decimated.samples.length < 512) {
    return {
      valid: false,
      code: 'insufficient_analysis_window',
      message: 'The captured sweep was too short to analyze reliably.',
      diagnostics: { snrDb, signalRms, noiseRms, clippingFraction, ...stereo },
    };
  }

  const windowLength = Math.min(
    decimated.samples.length,
    Math.max(512, Math.round(decimated.sampleRate * 1.55)),
  );
  const usableSpan = Math.max(0, decimated.samples.length - windowLength);
  const estimates = [];
  const count = Math.max(1, Math.floor(passCount));
  for (let index = 0; index < count; index += 1) {
    const ratio = count === 1 ? 0.5 : index / (count - 1);
    const center = (windowLength / 2) + (usableSpan * ratio);
    const window = sliceWindow(decimated.samples, center, windowLength);
    const estimate = estimateToneFrequency(window, decimated.sampleRate, minBeatHz, maxBeatHz);
    estimates.push({ ...estimate, index: index + 1 });
  }

  const viable = estimates.filter((item) => Number.isFinite(item.frequencyHz) && item.prominence >= 1.7);
  if (viable.length < Math.max(2, Math.ceil(count * 0.5))) {
    return {
      valid: false,
      code: 'weak_beat',
      message: 'The two-microphone beat was too weak or inconsistent. Move away from fans and hard echoes, then keep the phone still.',
      diagnostics: {
        snrDb,
        signalRms,
        noiseRms,
        clippingFraction,
        ...stereo,
        estimates,
      },
    };
  }

  const initialMedian = median(viable.map((item) => item.frequencyHz));
  const initialMad = mad(viable.map((item) => item.frequencyHz), initialMedian);
  const tolerance = Math.max(1.4, (Number.isFinite(initialMad) ? initialMad : 0) * 3.5);
  const accepted = viable.filter((item) => Math.abs(item.frequencyHz - initialMedian) <= tolerance);

  if (accepted.length < Math.max(2, Math.ceil(count * 0.5))) {
    return {
      valid: false,
      code: 'inconsistent_beat',
      message: 'Repeated sweeps did not agree closely enough for a defensible reading.',
      diagnostics: {
        snrDb,
        signalRms,
        noiseRms,
        clippingFraction,
        ...stereo,
        estimates,
        toleranceHz: tolerance,
      },
    };
  }

  const frequencies = accepted.map((item) => item.frequencyHz);
  const beatHz = median(frequencies);
  const beatSigmaHz = Math.max(0.08, robustSigma(frequencies) || 0);
  const prominence = median(accepted.map((item) => item.prominence));
  const acceptedRatio = accepted.length / count;

  const snrScore = clamp((snrDb - 5) / 23, 0, 1);
  const prominenceScore = clamp((prominence - 1.7) / 8.5, 0, 1);
  const consistencyScore = clamp(1 - (beatSigmaHz / 2.1), 0, 1);
  const independenceScore = clamp((stereo.differenceRatio - 0.01) / 0.35, 0, 1);
  const clippingScore = clamp(1 - (clippingFraction / 0.05), 0, 1);
  const balanceScore = clamp(1 - (Math.abs(stereo.balanceDb) / 18), 0, 1);

  const qualityScore = Math.round(100 * (
    (0.24 * snrScore) +
    (0.24 * prominenceScore) +
    (0.22 * consistencyScore) +
    (0.12 * independenceScore) +
    (0.08 * clippingScore) +
    (0.05 * balanceScore) +
    (0.05 * acceptedRatio)
  ));

  return {
    valid: true,
    beatHz,
    beatSigmaHz,
    qualityScore,
    acceptedPasses: accepted.length,
    totalPasses: count,
    diagnostics: {
      snrDb,
      signalRms,
      noiseRms,
      clippingFraction,
      correlation: stereo.correlation,
      differenceRatio: stereo.differenceRatio,
      balanceDb: stereo.balanceDb,
      prominence,
      outputSampleRate: decimated.sampleRate,
      estimates,
      acceptedFrequencies: frequencies,
    },
  };
}

export function buildTriangleChirpSamples({
  sampleRate,
  durationS,
  minFrequencyHz,
  maxFrequencyHz,
  halfSweepDurationS,
  amplitude = 0.38,
}) {
  const length = Math.max(1, Math.round(sampleRate * durationS));
  const samples = new Float32Array(length);
  let phase = 0;
  const fadeSamples = Math.max(1, Math.round(sampleRate * 0.035));

  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const cyclePosition = (time / halfSweepDurationS) % 2;
    const fraction = cyclePosition <= 1 ? cyclePosition : 2 - cyclePosition;
    const frequency = minFrequencyHz + ((maxFrequencyHz - minFrequencyHz) * fraction);
    phase += (2 * Math.PI * frequency) / sampleRate;

    let envelope = 1;
    if (index < fadeSamples) envelope = 0.5 - (0.5 * Math.cos(Math.PI * index / fadeSamples));
    if (index >= length - fadeSamples) {
      const remaining = length - 1 - index;
      envelope = Math.min(envelope, 0.5 - (0.5 * Math.cos(Math.PI * remaining / fadeSamples)));
    }
    samples[index] = Math.sin(phase) * amplitude * envelope;
  }
  return samples;
}

export function buildEchoPulseTrainSamples({
  sampleRate,
  passCount = 5,
  minimumFrequencyHz = 2600,
  maximumFrequencyHz = 17800,
  chirpDurationS = 0.014,
  gapDurationS = 0.34,
  leadDurationS = 0.06,
  tailDurationS = 0.12,
  amplitude = 0.42,
}) {
  const chirpLength = Math.max(64, Math.round(chirpDurationS * sampleRate));
  const template = new Float32Array(chirpLength);
  const bandwidth = maximumFrequencyHz - minimumFrequencyHz;
  const slope = bandwidth / chirpDurationS;
  for (let index = 0; index < chirpLength; index += 1) {
    const time = index / sampleRate;
    const phase = (2 * Math.PI * minimumFrequencyHz * time) + (Math.PI * slope * time * time);
    const envelope = Math.sin(Math.PI * index / Math.max(1, chirpLength - 1)) ** 2;
    template[index] = Math.sin(phase) * envelope * amplitude;
  }

  const periodS = chirpDurationS + gapDurationS;
  const pulseStartsS = Array.from({ length: Math.max(1, passCount) }, (_, index) => leadDurationS + (index * periodS));
  const durationS = pulseStartsS[pulseStartsS.length - 1] + chirpDurationS + tailDurationS;
  const samples = new Float32Array(Math.ceil(durationS * sampleRate));
  for (const startS of pulseStartsS) {
    const start = Math.round(startS * sampleRate);
    samples.set(template.subarray(0, Math.min(template.length, samples.length - start)), start);
  }

  return {
    samples,
    template,
    pulseStartsS,
    durationS,
    chirpDurationS,
    gapDurationS,
    minimumFrequencyHz,
    maximumFrequencyHz,
  };
}

function templateEnergy(template) {
  let energy = 0;
  for (let index = 0; index < template.length; index += 1) energy += template[index] * template[index];
  return Math.max(1e-12, energy);
}

function correlationScores(recording, template, startIndex, endIndex) {
  const start = Math.max(0, Math.floor(startIndex));
  const end = Math.min(recording.length - template.length - 1, Math.ceil(endIndex));
  if (end <= start) return { start, scores: new Float64Array(0) };
  const scores = new Float64Array(end - start + 1);
  const referenceEnergy = templateEnergy(template);

  for (let offset = start; offset <= end; offset += 1) {
    let dot = 0;
    let signalEnergy = 0;
    for (let index = 0; index < template.length; index += 1) {
      const sample = recording[offset + index];
      dot += sample * template[index];
      signalEnergy += sample * sample;
    }
    scores[offset - start] = Math.abs(dot) / Math.sqrt(Math.max(1e-12, signalEnergy * referenceEnergy));
  }
  return { start, scores };
}

function refinedPeakFromScores(series, preferEarliestAboveRatio = null) {
  const { start, scores } = series;
  if (!scores.length) return { index: NaN, score: 0, contrast: 0, floor: 0 };
  let maxLocal = 0;
  let maxScore = -Infinity;
  for (let index = 0; index < scores.length; index += 1) {
    if (scores[index] > maxScore) {
      maxScore = scores[index];
      maxLocal = index;
    }
  }

  if (Number.isFinite(preferEarliestAboveRatio)) {
    const threshold = maxScore * preferEarliestAboveRatio;
    for (let index = 1; index < scores.length - 1; index += 1) {
      if (scores[index] >= threshold && scores[index] >= scores[index - 1] && scores[index] >= scores[index + 1]) {
        maxLocal = index;
        maxScore = scores[index];
        break;
      }
    }
  }

  const previous = scores[Math.max(0, maxLocal - 1)] || maxScore;
  const next = scores[Math.min(scores.length - 1, maxLocal + 1)] || maxScore;
  const denominator = previous - (2 * maxScore) + next;
  const fraction = Math.abs(denominator) > 1e-12
    ? clamp(0.5 * (previous - next) / denominator, -0.5, 0.5)
    : 0;
  const floorValues = [];
  for (let index = 0; index < scores.length; index += 1) {
    if (Math.abs(index - maxLocal) > 7) floorValues.push(scores[index]);
  }
  const floor = Math.max(1e-9, median(floorValues));
  return {
    index: start + maxLocal + fraction,
    integerIndex: start + maxLocal,
    score: maxScore,
    contrast: maxScore / floor,
    floor,
  };
}

export function analyzeEchoCapture({
  mono,
  sampleRate,
  captureOriginToTrainStartS,
  pulseTrain,
  wallDistanceM,
  passCount = pulseTrain?.pulseStartsS?.length || 3,
}) {
  if (!mono?.length || !Number.isFinite(sampleRate) || sampleRate < 16000) {
    return { valid: false, code: 'insufficient_audio', message: 'The microphone did not return enough audio for echo analysis.' };
  }
  if (!pulseTrain?.template?.length || !pulseTrain?.pulseStartsS?.length) {
    return { valid: false, code: 'missing_reference', message: 'The emitted reference pulse was unavailable for analysis.' };
  }
  if (!Number.isFinite(wallDistanceM) || wallDistanceM < 0.2 || wallDistanceM > 4) {
    return { valid: false, code: 'distance_out_of_range', message: 'The wall distance must be between 20 cm and 4 m.' };
  }

  const template = pulseTrain.template;
  const trainStartSamples = captureOriginToTrainStartS * sampleRate;
  const firstNominal = trainStartSamples + (pulseTrain.pulseStartsS[0] * sampleRate);
  const broadSearch = correlationScores(
    mono,
    template,
    firstNominal - (0.025 * sampleRate),
    firstNominal + (0.30 * sampleRate),
  );
  const firstDirect = refinedPeakFromScores(broadSearch, 0.55);
  if (!Number.isFinite(firstDirect.index) || firstDirect.score < 0.10 || firstDirect.contrast < 1.3) {
    return {
      valid: false,
      code: 'direct_pulse_missing',
      message: 'The microphone could not resolve the phone’s direct reference pulse. Raise media volume and uncover the bottom edge.',
      diagnostics: { directScore: firstDirect.score, directContrast: firstDirect.contrast },
    };
  }

  const expectedEchoSamples = (2 * wallDistanceM / 343) * sampleRate;
  const minEchoOffset = Math.max(Math.round(0.67 * expectedEchoSamples), Math.round(0.0007 * sampleRate));
  const maxEchoOffset = Math.round(1.22 * expectedEchoSamples);
  const estimates = [];
  let clippedSamples = 0;
  let inspectedSamples = 0;

  const availablePasses = Math.min(passCount, pulseTrain.pulseStartsS.length);
  for (let passIndex = 0; passIndex < availablePasses; passIndex += 1) {
    const relativePulseSamples = (pulseTrain.pulseStartsS[passIndex] - pulseTrain.pulseStartsS[0]) * sampleRate;
    const expectedDirect = firstDirect.index + relativePulseSamples;
    const directSeries = correlationScores(
      mono,
      template,
      expectedDirect - (0.010 * sampleRate),
      expectedDirect + (0.010 * sampleRate),
    );
    const direct = refinedPeakFromScores(directSeries, 0.68);
    if (!Number.isFinite(direct.index) || direct.score < 0.085) continue;

    const echoSeries = correlationScores(
      mono,
      template,
      direct.index + minEchoOffset,
      direct.index + maxEchoOffset,
    );
    const echo = refinedPeakFromScores(echoSeries, null);
    if (!Number.isFinite(echo.index) || echo.score < 0.025 || echo.contrast < 1.10) continue;

    const echoDelaySamples = echo.index - direct.index;
    if (echoDelaySamples <= minEchoOffset * 0.95 || echoDelaySamples >= maxEchoOffset * 1.05) continue;

    const inspectStart = Math.max(0, Math.floor(direct.index));
    const inspectEnd = Math.min(mono.length, Math.ceil(echo.index + template.length));
    for (let index = inspectStart; index < inspectEnd; index += 8) {
      if (Math.abs(mono[index]) >= 0.985) clippedSamples += 1;
      inspectedSamples += 1;
    }

    estimates.push({
      pass: passIndex + 1,
      echoDelaySamples,
      directScore: direct.score,
      directContrast: direct.contrast,
      echoScore: echo.score,
      echoContrast: echo.contrast,
    });
  }

  if (estimates.length < Math.max(2, Math.ceil(availablePasses * 0.5))) {
    return {
      valid: false,
      code: 'wall_echo_missing',
      message: 'The wall reflection was not strong and repeatable enough. Use a large bare wall, point the phone’s bottom edge straight at it, and try again.',
      diagnostics: {
        firstDirectScore: firstDirect.score,
        firstDirectContrast: firstDirect.contrast,
        expectedEchoSamples,
        estimates,
      },
    };
  }

  const initialMedian = median(estimates.map((item) => item.echoDelaySamples));
  const initialSigma = robustSigma(estimates.map((item) => item.echoDelaySamples)) || 0;
  const tolerance = Math.max(0.85, initialSigma * 3.5);
  const accepted = estimates.filter((item) => Math.abs(item.echoDelaySamples - initialMedian) <= tolerance);
  if (accepted.length < Math.max(2, Math.ceil(availablePasses * 0.5))) {
    return {
      valid: false,
      code: 'echo_inconsistent',
      message: 'The reflected pulse moved too much between passes. Place the phone on a stable surface rather than holding it.',
      diagnostics: { estimates, toleranceSamples: tolerance },
    };
  }

  const delays = accepted.map((item) => item.echoDelaySamples);
  const echoDelaySamples = median(delays);
  const echoDelaySigmaSamples = Math.max(0.035, robustSigma(delays) || 0);
  const directScore = median(accepted.map((item) => item.directScore));
  const echoScore = median(accepted.map((item) => item.echoScore));
  const echoContrast = median(accepted.map((item) => item.echoContrast));
  const clippingFraction = inspectedSamples ? clippedSamples / inspectedSamples : 0;

  const consistencyScore = clamp(1 - (echoDelaySigmaSamples / 0.85), 0, 1);
  const directScoreQuality = clamp((directScore - 0.08) / 0.55, 0, 1);
  const echoScoreQuality = clamp((echoScore - 0.02) / 0.24, 0, 1);
  const contrastQuality = clamp((echoContrast - 1.05) / 3.2, 0, 1);
  const passQuality = accepted.length / availablePasses;
  const clippingQuality = clamp(1 - (clippingFraction / 0.035), 0, 1);
  const qualityScore = Math.round(100 * (
    (0.30 * consistencyScore) +
    (0.18 * directScoreQuality) +
    (0.22 * echoScoreQuality) +
    (0.12 * contrastQuality) +
    (0.12 * passQuality) +
    (0.06 * clippingQuality)
  ));

  return {
    valid: true,
    echoDelaySamples,
    echoDelaySigmaSamples,
    qualityScore,
    acceptedPasses: accepted.length,
    totalPasses: availablePasses,
    diagnostics: {
      sampleRate,
      wallDistanceM,
      firstDirectScore: firstDirect.score,
      directScore,
      echoScore,
      echoContrast,
      expectedEchoSamples,
      echoDelaySamples,
      echoDelaySigmaSamples,
      clippingFraction,
      estimates,
      acceptedDelays: delays,
    },
  };
}
