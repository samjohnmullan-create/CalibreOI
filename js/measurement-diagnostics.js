const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null;};
const text=v=>String(v??'').trim();
const abs=v=>Math.abs(Number(v)||0);

function timingRuns(job={}){return Array.isArray(job.timingRuns)?job.timingRuns:[];}
function stageNotes(job={}){return (job.stages||[]).map(s=>[s.name,s.measure,s.notes].filter(Boolean).join(' · ')).filter(Boolean);}
function latestRun(job={}){const runs=timingRuns(job);return runs[runs.length-1]||null;}
function rateOf(run={}){return num(run.rate??run.rateSecDay??run.secondsPerDay??run.sPerDay);}
function beatOf(run={}){return num(run.beatError??run.beat_error??run.beatMs??run.beat);}
function stabilityOf(run={}){return num(run.stability??run.stabilityScore??run.confidence);}
function positionOf(run={}){return text(run.position||run.pos);}

export function measurementSignals(job={}){
  const out=[];
  const runs=timingRuns(job).filter(Boolean),latest=latestRun(job);
  if(latest){
    const rate=rateOf(latest),beat=beatOf(latest),stability=stabilityOf(latest);
    if(rate!=null&&abs(rate)>15)out.push({id:'rate_out',label:`Rate ${rate>0?'+':''}${Math.round(rate)} s/day`,kind:'timing',weight:12,detail:'Rate is outside the general ±15 s/day workshop target.'});
    if(beat!=null&&beat>1)out.push({id:'beat_error',label:`Beat error ${beat.toFixed(2)} ms`,kind:'timing',weight:14,detail:'Beat error above 1.0 ms deserves mechanical attention before rate regulation.'});
    else if(beat!=null&&beat>0.6)out.push({id:'beat_error',label:`Beat error ${beat.toFixed(2)} ms`,kind:'timing',weight:8,detail:'Beat error is above the preferred general workshop target.'});
    if(stability!=null&&stability<60)out.push({id:'timing_unstable',label:`Timing confidence ${Math.round(stability)}%`,kind:'timing',weight:10,detail:'Low timing confidence or stability reduces trust in the reading and may indicate inconsistent running.'});
  }
  if(runs.length>=2){
    const byPos=runs.map(r=>({position:positionOf(r),rate:rateOf(r)})).filter(x=>x.position&&x.rate!=null);
    if(byPos.length>=2){const rates=byPos.map(x=>x.rate),spread=Math.max(...rates)-Math.min(...rates);if(spread>25)out.push({id:'positional_variation',label:`Positional spread ${Math.round(spread)} s/day`,kind:'timing',weight:12,detail:'Large rate difference between positions suggests balance, hairspring, pivot/jewel or poise investigation.'});}
  }
  const blob=stageNotes(job).join(' ').toLowerCase();
  if(/wobbl|side\s*shake|side-shake/.test(blob))out.push({id:'balance_staff',label:'Wobble / side-shake recorded',kind:'bench',weight:14,detail:'Recorded wobble or side shake strengthens a staff, pivot or jewel hypothesis.'});
  if(/end\s*shake|end-shake/.test(blob))out.push({id:'balance_staff',label:'Endshake noted',kind:'bench',weight:8,detail:'Endshake evidence should be checked against staff pivots, jewels and bridge seating.'});
  if(/power\s*reserve|reserve/.test(blob)){const m=blob.match(/(?:power\s*reserve|reserve)[^0-9]{0,12}(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);if(m&&Number(m[1])<24)out.push({id:'poor_power_reserve',label:`Power reserve ${m[1]} h`,kind:'bench',weight:12,detail:'Short measured reserve supports a power-source, barrel, train-friction or escapement-efficiency investigation.'});}
  return out;
}

export function measurementBoostForFault(fault={},job={}){
  const signals=measurementSignals(job),matched=signals.filter(s=>s.id===fault.id);return {boost:Math.min(20,matched.reduce((n,s)=>n+(Number(s.weight)||0),0)),signals:matched};
}
