export const STANDARDS = [14400, 18000, 19800, 21600, 25200, 28800, 36000];

function median(values){
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function nearest(n){
  return STANDARDS.reduce((best, rate) => Math.abs(rate - n) < Math.abs(best - n) ? rate : best, STANDARDS[0]);
}

// Rate is derived from the audio-clock interval, not the screen.
// seconds/day = (nominalInterval / measuredInterval - 1) * 86400
export function analyse(beats, lockedBph){
  const intervals = [];
  for (let i = 1; i < beats.length; i++){
    const gap = (beats[i].t - beats[i - 1].t) * 1000;
    if (gap > 80 && gap < 700) intervals.push(gap);
  }
  if (intervals.length < 4) return { ready:false, stage: beats.length ? "Detecting ticks..." : "Listening..." };
  const recent = intervals.slice(-24);
  const med = median(recent);
  const raw = 3600000 / med;
  const guess = nearest(raw);
  const close = Math.abs(raw - guess) / guess < 0.08;
  const bph = lockedBph || (close ? guess : 0);
  if (!bph) return { ready:false, stage:"Determining beat rate...", beats:beats.length, intervals:intervals.length };
  const nominal = 3600000 / bph;
  const used = recent.filter(gap => Math.abs(gap - nominal) / nominal < 0.12);
  if (used.length < 4) return { ready:false, stage:"Stabilising...", bph, beats:beats.length };
  const mean = used.reduce((sum, gap) => sum + gap, 0) / used.length;
  const rate = (nominal / mean - 1) * 86400;
  const spread = used.reduce((sum, gap) => sum + Math.abs(gap - mean), 0) / used.length;
  const jitter = spread / nominal;
  let stability = "Poor signal";
  if (jitter < 0.008) stability = "Excellent";
  else if (jitter < 0.018) stability = "Good";
  else if (jitter < 0.035) stability = "Fair";
  else if (jitter < 0.06) stability = "Unstable";
  const confidence = Math.max(0, Math.min(1, 1 - jitter * 8));
  const odd = used.filter((_, i) => i % 2 === 0);
  const even = used.filter((_, i) => i % 2 === 1);
  const beatError = odd.length && even.length ? Math.abs(median(odd) - median(even)) : null;
  const reliable = used.length >= 12 && confidence >= 0.55;
  let status = "poor";
  if (!reliable) status = "poor";
  else if (Math.abs(rate) <= 15 && jitter < 0.035) status = "good";
  else if (Math.abs(rate) <= 30) status = "attention";
  else status = "adjust";
  return {
    ready: used.length >= 8,
    stage: used.length < 12 ? "Timing..." : "Timing",
    rateSecondsPerDay: rate,
    bph,
    beatErrorMs: reliable ? beatError : null,
    stability: stability.toLowerCase(),
    stabilityLabel: stability,
    confidence,
    status,
    beats: beats.length,
    samples: used.length,
    jitterMs: spread,
    measuredAt: new Date().toISOString()
  };
}

export function advice(result){
  if (!result || !result.ready || result.status === "poor") return "Not enough data. Keep the watch on the capsule.";
  if (result.stabilityLabel === "Unstable" || result.stabilityLabel === "Poor signal") return "Timing is unstable. Check the movement before regulating.";
  const rate = result.rateSecondsPerDay;
  if (Math.abs(rate) <= 15) return rate >= 0 ? "Running slightly fast. No adjustment necessary." : "Running slightly slow. No adjustment necessary.";
  if (rate > 15) return "Running fast. A small regulator move toward SLOW may be required.";
  return "Running slow. A small regulator move toward FAST may be required.";
}
