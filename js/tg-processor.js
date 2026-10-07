class TickProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.noise = 0.0015;
    this.last = -Infinity;
    this.sens = 2.0;
    this.blocks = 0;
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (Number.isFinite(Number(d.sens))) this.sens = Number(d.sens);
    };
  }

  process(inputs){
    const ch = inputs[0] && inputs[0][0];
    if (!ch || !ch.length) return true;

    let pk = 0, peakIndex = 0, sum = 0, clipped = 0;
    for (let i = 0; i < ch.length; i++){
      const a = Math.abs(ch[i]);
      sum += a * a;
      if (a > pk){ pk = a; peakIndex = i; }
      if (a >= 0.98) clipped++;
    }

    const rms = Math.sqrt(sum / ch.length);
    this.noise = this.noise * 0.985 + rms * 0.015;
    const threshold = Math.max(0.003, this.noise * this.sens);
    const peakTime = (currentFrame + peakIndex) / sampleRate;

    this.blocks++;
    if (this.blocks % 4 === 0){
      this.port.postMessage({
        kind: "level",
        rms,
        pk,
        noise: this.noise,
        threshold,
        clipping: clipped > 0,
        clippedSamples: clipped,
        sampleRate
      });
    }

    if (pk > threshold && peakTime - this.last > 0.085){
      this.last = peakTime;
      this.port.postMessage({
        kind: "beat",
        t: peakTime,
        pk,
        threshold,
        sampleRate
      });
    }
    return true;
  }
}

registerProcessor("calibre-tick", TickProcessor);
