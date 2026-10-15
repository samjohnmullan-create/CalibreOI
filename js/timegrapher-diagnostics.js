const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=v=>Number.isFinite(Number(v));
const median=values=>{const rows=values.filter(finite).map(Number).sort((a,b)=>a-b);if(!rows.length)return null;const m=Math.floor(rows.length/2);return rows.length%2?rows[m]:(rows[m-1]+rows[m])/2;};

export function timingLockState(result={}){
  const stage=String(result?.stage||'').toLowerCase();
  const samples=Number(result?.samples||0),confidence=Number(result?.confidence||0);
  if(stage.includes('idle')||stage.includes('stopped'))return {key:'idle',label:'IDLE',progress:0,detail:'Microphone is not running.'};
  if(result?.ready&&samples>=10&&confidence>=0.60)return {key:'locked',label:'LOCKED',progress:100,detail:`${Math.round(confidence*100)}% confidence · ${samples} samples`};
  if(stage.includes('stabil'))return {key:'stabilising',label:'STABILISING',progress:clamp(48+samples*2,48,78),detail:'Beat rate found; waiting for a cleaner interval set.'};
  if(stage.includes('beat rate')||stage.includes('determin'))return {key:'bph',label:'FINDING BPH',progress:36,detail:'Comparing detected intervals with standard beat rates.'};
  if(stage.includes('timing'))return {key:'timing',label:'TIMING',progress:clamp(55+samples*3,55,92),detail:'Collecting stable intervals.'};
  if(stage.includes('detect'))return {key:'detecting',label:'DETECTING',progress:22,detail:'Ticks are arriving; building an interval history.'};
  return {key:'listening',label:'LISTENING',progress:8,detail:'Waiting for usable tick events.'};
}

export function diagnoseTimingSignal(level={},result={},running=true){
  if(!running)return {key:'idle',label:'Not listening',detail:'Start the microphone to inspect signal quality.',action:''};
  if(level?.clipping)return {key:'clipping',label:'Clipping',detail:'Input is saturating. Reduce gain or contact pressure.',action:'Lower gain'};
  if(level?.handling)return {key:'handling',label:'Handling noise',detail:'Broad vibration is masking the tick. Stop touching the watch/bench and improve stable contact.',action:'Keep still'};
  const strength=Number(level?.strength||0),crest=Number(level?.crest||0),missed=Number(result?.missedBeatRatio||0);
  if(strength<1.4)return {key:'weak',label:'Very weak',detail:'Tick energy is below the detector threshold.',action:'Increase gain / improve contact'};
  if(strength<2.3)return {key:'fair',label:'Weak',detail:'Ticks are marginal. Improve contact or raise gain one step.',action:'Improve contact'};
  if(crest<1.8)return {key:'broad',label:'Poor definition',detail:'Signal is present but not sharply defined enough to isolate ticks.',action:'Reposition microphone'};
  if(missed>0.35)return {key:'intermittent',label:'Intermittent',detail:'Many expected beat events are being missed despite a usable input level.',action:'Reposition / raise gain'};
  if(strength>=8)return {key:'strong',label:'Strong',detail:'Clear tick impulses with comfortable detector headroom.',action:''};
  if(strength>=4)return {key:'good',label:'Good',detail:'Signal should be suitable for timing once the interval lock settles.',action:''};
  return {key:'usable',label:'Usable',detail:'Signal is workable but could be cleaner.',action:'Hold steady'};
}

export function calibrationSummary(levels=[],beatCount=0,durationSeconds=8){
  const rows=Array.isArray(levels)?levels:[];
  const strengths=rows.map(r=>r?.strength),crests=rows.map(r=>r?.crest),clipRatio=rows.length?rows.filter(r=>r?.clipping).length/rows.length:0,handlingRatio=rows.length?rows.filter(r=>r?.handling).length/rows.length:0;
  const strength=median(strengths),crest=median(crests),beatsPerSecond=durationSeconds>0?beatCount/durationSeconds:0;
  let gain='normal',grade='good',message='Signal looks suitable. Keep the current contact and gain.';
  if(clipRatio>0.04||handlingRatio>0.25||(strength!=null&&strength>11)){gain='low';grade='adjust';message=clipRatio>0.04?'Input clipped during calibration. Lower the gain and retest.':'Signal is dominated by handling/contact vibration. Stabilise the setup and retest.';}
  else if(strength==null||strength<1.8||beatsPerSecond<1){gain='high';grade='weak';message='Too few clean tick events were detected. Improve contact and try High gain.';}
  else if(strength<3){gain='high';grade='fair';message='Signal is usable but marginal. High gain may produce a more reliable lock.';}
  else if(strength>8){gain='low';grade='strong';message='Signal is strong. Low gain should leave more headroom and reduce false triggers.';}
  return {grade,recommendedGain:gain,medianStrength:strength,medianCrest:crest,clipRatio,handlingRatio,beatCount,beatsPerSecond,message};
}

export function beatTracePoints(beats=[],bph=0,limit=100){
  const rows=(Array.isArray(beats)?beats:[]).slice(-Math.max(2,limit));
  const rate=Number(bph)||0;if(rate<=0||rows.length<2)return [];
  const nominal=3600/rate;let phase=0;const out=[];
  for(let i=1;i<rows.length;i++){
    const gap=Number(rows[i].t)-Number(rows[i-1].t);if(!finite(gap)||gap<=0)continue;
    const multiple=clamp(Math.round(gap/nominal),1,4),normalised=gap/multiple,residualMs=(normalised-nominal)*1000;
    phase=clamp(phase+residualMs,-40,40);
    out.push({index:i,residualMs,phaseMs:phase,multiple,strength:Number(rows[i].strength)||0});
  }
  return out;
}
