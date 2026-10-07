class TickProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.hfNoise = 0.0010;
    this.rawNoise = 0.0015;
    this.last = -Infinity;
    this.sens = 2.0;
    this.blocks = 0;
    this.prev = 0;
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (Number.isFinite(Number(d.sens))) this.sens = Number(d.sens);
    };
  }

  process(inputs){
    const ch = inputs[0] && inputs[0][0];
    if (!ch || !ch.length) return true;

    let pk = 0, peakIndex = 0, sum = 0, clipped = 0;
    let diffPk = 0, diffPeakIndex = 0, diffSum = 0;
    let prev = this.prev;

    for (let i = 0; i < ch.length; i++){
      const v = ch[i];
      const a = Math.abs(v);
      const diff = Math.abs(v - prev);
      prev = v;
      sum += a * a;
      diffSum += diff * diff;
      if (a > pk){ pk = a; peakIndex = i; }
      if (diff > diffPk){ diffPk = diff; diffPeakIndex = i; }
      if (a >= 0.98) clipped++;
    }
    this.prev = prev;

    const rms = Math.sqrt(sum / ch.length);
    const diffRms = Math.sqrt(diffSum / ch.length);
    const threshold = Math.max(0.0018, this.hfNoise * this.sens);
    const rawThreshold = Math.max(0.003, this.rawNoise * 5.5);
    const crest = diffPk / Math.max(diffRms, 0.000001);
    const strength = diffPk / Math.max(threshold, 0.000001);
    const broadHandling = rms > rawThreshold && crest < 3.0;
    const clipping = clipped > 0;
    const candidate = diffPk > threshold && crest > 1.8 && !broadHandling && !clipping;

    // Learn the ambient floor mainly from non-event blocks so loud ticks/knocks
    // do not immediately raise the threshold and hide subsequent beats.
    if (!candidate && !clipping){
      const hfAlpha = diffRms < this.hfNoise ? 0.05 : 0.008;
      const rawAlpha = rms < this.rawNoise ? 0.04 : 0.006;
      this.hfNoise = this.hfNoise * (1 - hfAlpha) + diffRms * hfAlpha;
      this.rawNoise = this.rawNoise * (1 - rawAlpha) + rms * rawAlpha;
    } else {
      this.hfNoise = this.hfNoise * 0.999 + diffRms * 0.001;
      this.rawNoise = this.rawNoise * 0.999 + rms * 0.001;
    }

    const peakTime = (currentFrame + diffPeakIndex) / sampleRate;
    this.blocks++;

    if (this.blocks % 4 === 0){
      this.port.postMessage({
        kind: "level",
        rms,
        pk,
        noise: this.rawNoise,
        hfNoise: this.hfNoise,
        threshold,
        diffRms,
        diffPk,
        crest,
        strength,
        handling: broadHandling,
        clipping,
        clippedSamples: clipped,
        sampleRate
      });
    }

    // 70 ms remains safely below the shortest supported 36,000 BPH beat interval
    // while suppressing multiple peaks from the same acoustic event.
    if (candidate && peakTime - this.last > 0.070){
      this.last = peakTime;
      this.port.postMessage({
        kind: "beat",
        t: peakTime,
        pk,
        diffPk,
        crest,
        strength,
        threshold,
        sampleRate
      });
    }
    return true;
  }
}

registerProcessor("calibre-tick", TickProcessor);
