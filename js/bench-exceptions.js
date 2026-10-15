const terminalStep=status=>['done','na','not_applicable'].includes(String(status||'').toLowerCase());
const qcLike=step=>/\b(qc|quality|final check|final inspection)\b/i.test([step?.section,step?.label,step?.description].filter(Boolean).join(' '));
const confidenceScore=run=>{const n=Number(run?.confidence_score);if(Number.isFinite(n))return n;return ({confirmed:1,strong:.9,probable:.75,possible:.55,unknown:0}[String(run?.confidence||'').toLowerCase()]??0);};
const byNewest=(a,b)=>(Date.parse(b?.recorded_at||b?.created_at||'')||0)-(Date.parse(a?.recorded_at||a?.created_at||'')||0);
const rate=run=>Number(run?.rate_seconds_per_day);
const beat=run=>run?.beat_error_ms==null?null:Number(run.beat_error_ms);
const usable=run=>Number.isFinite(rate(run))&&confidenceScore(run)>=.6;
const fmtRate=value=>`${Number(value)>=0?'+':''}${Number(value).toFixed(1)} s/day`;

export function timingRegression(runs=[]){
  const ordered=[...runs].sort(byNewest),before=ordered.find(r=>String(r.phase)==='before_service'&&usable(r)),after=ordered.find(r=>['after_service','final_test'].includes(String(r.phase))&&usable(r));
  if(!before||!after)return null;
  const rateDelta=Math.abs(rate(after))-Math.abs(rate(before)),beforeBeat=beat(before),afterBeat=beat(after),beatDelta=beforeBeat!=null&&afterBeat!=null?afterBeat-beforeBeat:null;
  if(rateDelta<10&&(beatDelta==null||beatDelta<.4))return null;
  const reasons=[];
  if(rateDelta>=10)reasons.push(`rate moved from ${fmtRate(rate(before))} to ${fmtRate(rate(after))}`);
  if(beatDelta!=null&&beatDelta>=.4)reasons.push(`beat error increased from ${beforeBeat.toFixed(2)} ms to ${afterBeat.toFixed(2)} ms`);
  return {before,after,rateDelta,beatDelta,detail:reasons.join('; ')};
}

export function deriveBenchExceptions(detail={}){
  const work=detail.work||{},steps=Array.isArray(detail.steps)?detail.steps:[],partNeeds=Array.isArray(detail.partNeeds)?detail.partNeeds:[],qc=Array.isArray(detail.qcChecks)?detail.qcChecks:[],timing=Array.isArray(detail.timing)?detail.timing:[];
  const out=[];
  if(work.blocker)out.push({code:'work-blocker',severity:'critical',icon:'⚠',title:'Work is blocked',detail:String(work.blocker),action:'problem'});
  const blocked=steps.filter(step=>String(step.status||'').toLowerCase()==='blocked');
  if(blocked.length)out.push({code:'blocked-step',severity:'critical',icon:'⚠',title:`${blocked.length} checklist step${blocked.length===1?' is':'s are'} blocked`,detail:blocked.slice(0,2).map(s=>s.label||s.description||'Step').join(' · '),action:'workflow'});
  if(partNeeds.length){const reserved=partNeeds.filter(n=>String(n.status||'').toLowerCase()==='reserved').length;out.push({code:'part-needed',severity:'warning',icon:'🔧',title:`${partNeeds.length} unresolved Part Need${partNeeds.length===1?'':'s'}`,detail:reserved?`${reserved} reserved · review stock/donor fit before continuing.`:'Open Parts / Donor Finder to source or reserve a candidate.',action:'parts'});}
  const failedQc=qc.filter(row=>String(row.status||'').toLowerCase()==='failed');
  if(failedQc.length)out.push({code:'qc-failed',severity:'critical',icon:'⚠',title:`Final QC has ${failedQc.length} failed check${failedQc.length===1?'':'s'}`,detail:failedQc.slice(0,2).map(x=>x.label||x.check_key||'QC check').join(' · '),action:'qc'});
  const regression=timingRegression(timing);
  if(regression)out.push({code:'timing-regression',severity:'warning',icon:'⏱',title:'Timing is worse than the pre-service baseline',detail:regression.detail,action:'timing'});

  const qcStep=steps.find(qcLike),requiredBeforeQc=qcStep?steps.filter(step=>step.required&&Number(step.sequence||0)<Number(qcStep.sequence||0)):steps.filter(step=>step.required&&!qcLike(step));
  const prepComplete=requiredBeforeQc.every(terminalStep),clear=!work.blocker&&!partNeeds.length&&!failedQc.length;
  const finalRun=timing.find(run=>String(run.phase)==='final_test'&&usable(run));
  const watchLike=['watch','clock'].includes(String(detail.item?.type||'').toLowerCase());
  const atQc=String(work.status||'').toLowerCase()==='qc'||(qcStep&&prepComplete&&!terminalStep(qcStep));
  if(watchLike&&atQc&&!finalRun)out.push({code:'final-timing-missing',severity:'warning',icon:'⏱',title:'Final timing run is still missing',detail:'Save a reliable Final test timing run before closing QC.',action:'timing'});
  if(qcStep&&prepComplete&&clear&&!terminalStep(qcStep))out.push({code:'ready-final-qc',severity:'success',icon:'✅',title:'Ready for Final QC',detail:'Required pre-QC work is complete and there are no unresolved blockers or Part Needs.',action:'workflow'});
  const requiredQc=qc.filter(row=>row.required),qcPassed=requiredQc.length>0&&requiredQc.every(row=>['passed','na'].includes(String(row.status||'').toLowerCase())),allRequired=steps.filter(step=>step.required).every(terminalStep);
  if(allRequired&&clear&&qcPassed)out.push({code:'ready-complete',severity:'success',icon:'✅',title:'Ready to complete Work',detail:'Required workflow and QC checks are satisfied.',action:'workflow'});
  return out;
}

export function exceptionRank(severity=''){
  return ({critical:0,warning:1,success:2,info:3}[severity]??4);
}
