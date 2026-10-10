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
  const runs=timingRuns(job).filter(Boolean),latest=latestRun(job),m=job.benchMeasurements||{};
  if(latest){
    const rate=rateOf(latest),beat=beatOf(latest),stability=stabilityOf(latest);
    if(rate!=null&&abs(rate)>15)out.push({id:'rate_out',label:`Rate ${rate>0?'+':''}${Math.round(rate)} s/day`,kind:'timing',weight:12,detail:'Rate is outside the general ±15 s/day workshop target.'});
    if(beat!=null&&beat>1)out.push({id:'beat_error',label:`Beat error ${beat.toFixed(2)} ms`,kind:'timing',weight:14,detail:'Beat error above 1.0 ms deserves mechanical attention before rate regulation.'});
    else if(beat!=null&&beat>0.6)out.push({id:'beat_error',label:`Beat error ${beat.toFixed(2)} ms`,kind:'timing',weight:8,detail:'Beat error is above the preferred general workshop target.'});
    if(stability!=null&&stability<60)out.push({id:'timing_unstable',label:`Timing confidence ${Math.round(stability)}%`,kind:'timing',weight:10,detail:'Low timing confidence or stability reduces trust in the reading and may indicate inconsistent running.'});
  }
  let structuredSpread=num(m.positionalSpreadSecDay);
  if(structuredSpread!=null&&structuredSpread>25)out.push({id:'positional_variation',label:`Positional spread ${Math.round(structuredSpread)} s/day`,kind:'bench',weight:12,detail:'Recorded positional spread is large enough to justify balance, hairspring, pivot/jewel or poise investigation.'});
  else if(runs.length>=2){const byPos=runs.map(r=>({position:positionOf(r),rate:rateOf(r)})).filter(x=>x.position&&x.rate!=null);if(byPos.length>=2){const rates=byPos.map(x=>x.rate),spread=Math.max(...rates)-Math.min(...rates);if(spread>25)out.push({id:'positional_variation',label:`Positional spread ${Math.round(spread)} s/day`,kind:'timing',weight:12,detail:'Large rate difference between positions suggests balance, hairspring, pivot/jewel or poise investigation.'});}}
  if(m.balanceSideShakeAssessment==='excessive')out.push({id:'balance_staff',label:`Excessive balance side shake${num(m.balanceSideShakeMm)!=null?` · ${Number(m.balanceSideShakeMm)} mm`:''}`,kind:'bench',weight:16,detail:'Measured side shake marked excessive supports a staff, pivot or balance-jewel hypothesis.'});
  if(m.balanceEndshakeAssessment==='excessive')out.push({id:'balance_staff',label:`Excessive balance endshake${num(m.balanceEndshakeMm)!=null?` · ${Number(m.balanceEndshakeMm)} mm`:''}`,kind:'bench',weight:12,detail:'Measured balance endshake marked excessive should be checked against pivots, jewels and bridge seating.'});
  if(m.trainEndshakeAssessment==='excessive')out.push({id:'endshake_fault',label:`Excessive train endshake${num(m.trainEndshakeMm)!=null?` · ${Number(m.trainEndshakeMm)} mm`:''}`,kind:'bench',weight:10,detail:'Train endshake marked excessive supports a train wear or bridge/jewel seating investigation.'});
  const reserve=num(m.powerReserveHours),expected=num(m.expectedPowerReserveHours);if(reserve!=null&&expected!=null&&expected>0&&reserve<expected*.75)out.push({id:'poor_power_reserve',label:`Power reserve ${reserve} h vs ${expected} h expected`,kind:'bench',weight:14,detail:'Measured reserve is materially below the expected reserve for this watch.'});
  const blob=stageNotes(job).join(' ').toLowerCase();
  if(m.balanceSideShakeAssessment!=='excessive'&&/wobbl|side\s*shake|side-shake/.test(blob))out.push({id:'balance_staff',label:'Wobble / side-shake recorded',kind:'bench',weight:10,detail:'Recorded wobble or side shake strengthens a staff, pivot or jewel hypothesis.'});
  if(m.balanceEndshakeAssessment!=='excessive'&&/end\s*shake|end-shake/.test(blob))out.push({id:'balance_staff',label:'Endshake noted',kind:'bench',weight:6,detail:'Endshake evidence should be checked against staff pivots, jewels and bridge seating.'});
  if(reserve==null&&/power\s*reserve|reserve/.test(blob)){const match=blob.match(/(?:power\s*reserve|reserve)[^0-9]{0,12}(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);if(match&&Number(match[1])<24)out.push({id:'poor_power_reserve',label:`Power reserve ${match[1]} h`,kind:'bench',weight:8,detail:'Short measured reserve supports a power-source, barrel, train-friction or escapement-efficiency investigation.'});}
  return out;
}

export function measurementBoostForFault(fault={},job={}){const signals=measurementSignals(job),matched=signals.filter(s=>s.id===fault.id);return {boost:Math.min(20,matched.reduce((n,s)=>n+(Number(s.weight)||0),0)),signals:matched};}
