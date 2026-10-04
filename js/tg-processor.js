class TickProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.noise = 0.0015;
    this.last = 0;
    this.sens = 2.0;
    this.blocks = 0;
    this.port.onmessage = (e) => { if (e.data && e.data.sens) this.sens = e.data.sens; };
  }
  process(inputs){
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    let pk = 0, sum = 0;
    for (let i = 0; i < ch.length; i++){
      const a = ch[i] < 0 ? -ch[i] : ch[i];
      sum += a * a;
      if (a > pk) pk = a;
    }
    const rms = Math.sqrt(sum / ch.length);
    this.noise = this.noise * 0.985 + rms * 0.015;
    const th = Math.max(0.003, this.noise * this.sens);
    this.blocks++;
    if (this.blocks % 4 === 0) this.port.postMessage({ kind:"level", rms, pk, noise:this.noise });
    if (pk > th && currentTime - this.last > 0.085){
      this.last = currentTime;
      this.port.postMessage({ kind:"beat", t: currentTime, pk });
    }
    return true;
  }
}
registerProcessor("calibre-tick", TickProcessor);
