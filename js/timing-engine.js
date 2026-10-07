export const STANDARDS = [14400, 18000, 19800, 21600, 25200, 28800, 36000];

function median(values){
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function mad(values, centre = median(values)){
  return median(values.map(v => Math.abs(v - centre)));
}
function clamp01(n){ return Math.max(0, Math.min(1, n)); }
function intervalSet(beats){
  const out = [];
  for (let i = 1; i < beats.length; i++){
    const gap = (beats[i].t - beats[i - 1].t) * 1000;
    if (gap > 65 && gap < 950) out.push(gap);
  }
  return out;
}
function scoreBph(intervals, bph){
  const nominal = 3600000 / bph;
  const residuals = [];
  const normalised = [];
  let direct = 0;
  for (const gap of intervals){
    const multiple = Math.round(gap / nominal);
    if (multiple < 1 || multiple > 4) continue;
    const expected = nominal * multiple;
    const rel = Math.abs(gap - expected) / expected;
    if (rel <= 0.12){
      residuals.push(rel);
      normalised.push(gap / multiple);
      if (multiple === 1) direct++;
    }
  }
  if (normalised.length < 4) return null;
  const residual = median(residuals);
  const coverage = normalised.length / Math.max(intervals.length, 1);
  const directRatio = direct / normalised.length;
  const score = residual * 2.5 + (1 - coverage) * 0.55 + (1 - directRatio) * 0.06;
  return { bph, nominal, residual, coverage, directRatio, score, normalised };
}
function bestStandard(intervals){
  const scored = STANDARDS.map(bph => scoreBph(intervals, bph)).filter(Boolean).sort((a,b) => a.score - b.score);
  if (!scored.length) return null;
  const best = scored[0], second = scored[1];
  const separation = second ? second.score - best.score : 1;
  return { ...best, separation };
}
function robustUsed(intervals, bph){
  const nominal = 3600000 / bph;
  const rows = [];
  intervals.forEach((gap, index) => {
    const multiple = Math.round(gap / nominal);
    if (multiple < 1 || multiple > 4) return;
    const normalised = gap / multiple;
    const rel = Math.abs(normalised - nominal) / nominal;
    if (rel <= 0.12) rows.push({ gap, normalised, multiple, index });
  });
  if (rows.length < 4) return [];
  const centre = median(rows.map(r => r.normalised));
  const deviation = mad(rows.map(r => r.normalised), centre);
  const floor = nominal * 0.0025;
  const limit = Math.max(floor, deviation * 3.5);
  return rows.filter(r => Math.abs(r.normalised - centre) <= limit);
}

// Rate is derived from audio-clock intervals, not screen timing.
// Missing detections are tolerated by recognising 2x–4x multiples of the nominal beat interval.
export function analyse(beats, lockedBph){
  const intervals = intervalSet(beats);
  if (intervals.length < 4) return { ready:false, stage: beats.length ? "Detecting ticks..." : "Listening..." };

  const recent = intervals.slice(-36);
  let bph = Number(lockedBph) || 0;
  let lockQuality = 1;
  if (!bph){
    const best = bestStandard(recent);
    if (!best || best.coverage < 0.55 || best.residual > 0.05){
      return { ready:false, stage:"Determining beat rate...", beats:beats.length, intervals:intervals.length };
    }
    bph = best.bph;
    lockQuality = clamp01((best.coverage * 0.72) + Math.min(0.28, Math.max(0, best.separation) * 4));
  }

  const nominal = 3600000 / bph;
  const usedRows = robustUsed(recent, bph);
  if (usedRows.length < 5) return { ready:false, stage:"Stabilising...", bph, beats:beats.length };

  const normalised = usedRows.map(r => r.normalised);
  const measured = median(normalised);
  const rate = (nominal / measured - 1) * 86400;
  const absoluteDeviations = normalised.map(v => Math.abs(v - measured));
  const spread = median(absoluteDeviations);
  const jitter = spread / nominal;
  const directRows = usedRows.filter(r => r.multiple === 1);
  const missedRatio = 1 - (directRows.length / usedRows.length);

  let stability = "Poor signal";
  if (jitter < 0.004) stability = "Excellent";
  else if (jitter < 0.010) stability = "Good";
  else if (jitter < 0.022) stability = "Fair";
  else if (jitter < 0.045) stability = "Unstable";

  const sampleScore = clamp01((usedRows.length - 4) / 16);
  const jitterScore = clamp01(1 - jitter / 0.05);
  const continuityScore = clamp01(1 - missedRatio * 0.8);
  const confidence = clamp01(sampleScore * 0.30 + jitterScore * 0.42 + continuityScore * 0.18 + lockQuality * 0.10);

  // Beat error is only surfaced when enough consecutive single-beat intervals exist.
  // This avoids presenting a plausible-looking number after missed beats or noisy lock-on.
  const directIntervals = directRows.map(r => ({ value:r.normalised, index:r.index }));
  const odd = [], even = [];
  directIntervals.forEach(r => {
    if (r.index % 2 === 0) even.push(r.value); else odd.push(r.value);
  });
  const beatError = odd.length >= 3 && even.length >= 3 ? Math.abs(median(odd) - median(even)) : null;

  const reliable = usedRows.length >= 10 && confidence >= 0.60;
  let status = "poor";
  if (!reliable) status = "poor";
  else if (Math.abs(rate) <= 15 && jitter < 0.022) status = "good";
  else if (Math.abs(rate) <= 30) status = "attention";
  else status = "adjust";

  return {
    ready: usedRows.length >= 7,
    stage: usedRows.length < 10 ? "Timing..." : "Timing",
    rateSecondsPerDay: rate,
    bph,
    beatErrorMs: reliable ? beatError : null,
    beatErrorTrusted: reliable && beatError != null,
    stability: stability.toLowerCase(),
    stabilityLabel: stability,
    confidence,
    status,
    beats: beats.length,
    samples: usedRows.length,
    directSamples: directRows.length,
    missedBeatRatio: missedRatio,
    jitterMs: spread,
    nominalIntervalMs: nominal,
    measuredIntervalMs: measured,
    measuredAt: new Date().toISOString()
  };
}

export function advice(result){
  if (!result || !result.ready) return "Keep the watch still and allow the reading to settle.";
  if (result.status === "poor"){
    if ((result.missedBeatRatio || 0) > 0.35) return "Signal is intermittent. Improve contact with the microphone and avoid touching the bench.";
    return "Reading is not reliable yet. Keep the watch still and wait for confidence to rise.";
  }
  if (result.stabilityLabel === "Unstable" || result.stabilityLabel === "Poor signal") return "Timing is unstable. Check the signal and movement before regulating.";
  const rate = result.rateSecondsPerDay;
  if (Math.abs(rate) <= 15) return "Rate is within the general vintage guide. Compare another position before deciding on adjustment.";
  if (rate > 15) return "Running fast. Confirm the result in another position before making a small regulator move toward SLOW.";
  return "Running slow. Confirm the result in another position before making a small regulator move toward FAST.";
}
