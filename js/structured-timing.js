import {supabaseClient} from './cloud.js?v=5';
import {structuredWorkspaceId} from './structured-cloud.js?v=4';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const num=v=>Number(v);
const finite=v=>Number.isFinite(num(v));

export function timingConfidenceLabel(score){
  const n=Number(score)||0;
  if(n>=0.85)return 'strong';
  if(n>=0.70)return 'probable';
  if(n>=0.60)return 'possible';
  return 'unknown';
}

export function timingStabilityScore(result={}){
  const jitter=Number(result.jitterMs),nominal=Number(result.nominalIntervalMs);
  if(!Number.isFinite(jitter)||!Number.isFinite(nominal)||nominal<=0)return null;
  return Math.round(clamp((1-(jitter/nominal)/0.05)*100,0,100));
}

export function timingPositionKey(value=''){
  const key=String(value||'').trim().toLowerCase().replace(/\s+/g,'_');
  const allowed=new Set(['dial_up','dial_down','crown_up','crown_down','crown_left','crown_right','other']);
  return allowed.has(key)?key:'other';
}

export function timingPhaseKey(value=''){
  const key=String(value||'').trim().toLowerCase().replace(/\s+/g,'_');
  const map={before_service:'before_service',during_service:'during_service',after_service:'after_service',regulation_test:'regulation_test',final_test:'final_test',other:'other'};
  return map[key]||'during_service';
}

export async function loadStructuredTimingContext(workId){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  const sb=supabaseClient();
  const {data:work,error:workError}=await sb.from('work_records').select('*').eq('workspace_id',workspaceId).eq('id',workId).maybeSingle();
  if(workError)throw workError;if(!work)throw new Error('Work record not found');
  const [itemQ,identityQ,passportQ,stepsQ,runsQ]=await Promise.all([
    sb.from('items').select('*').eq('workspace_id',workspaceId).eq('id',work.item_id).maybeSingle(),
    sb.from('item_identity').select('*').eq('workspace_id',workspaceId).eq('item_id',work.item_id).maybeSingle(),
    sb.from('passports').select('*').eq('workspace_id',workspaceId).eq('item_id',work.item_id).maybeSingle(),
    sb.from('work_checklist_steps').select('id,label,description,sequence,status,completed_at').eq('workspace_id',workspaceId).eq('work_id',workId).order('sequence',{ascending:true}),
    sb.from('timing_runs').select('*').eq('workspace_id',workspaceId).eq('work_id',workId).order('recorded_at',{ascending:false}).limit(30)
  ]);
  for(const q of [itemQ,identityQ,passportQ,stepsQ,runsQ])if(q.error)throw q.error;
  const steps=stepsQ.data||[];
  let idx=steps.findIndex(step=>!['done','skipped','not_applicable'].includes(String(step.status||'').toLowerCase()));
  if(idx<0&&steps.length)idx=steps.length-1;
  return {workspaceId,work,item:itemQ.data||{},identity:identityQ.data||{},passport:passportQ.data||{},steps,currentStep:idx>=0?steps[idx]:null,runs:runsQ.data||[]};
}

export async function saveStructuredTimingRun({context,result,position,phase,liftAngle,durationSeconds,device,sampleRate,notes=''}){
  if(!context?.workspaceId||!context?.work?.id||!context?.item?.id)throw new Error('Timing context is incomplete.');
  if(!result?.ready||!finite(result.rateSecondsPerDay)||!finite(result.bph))throw new Error('Wait for a stable timing result before saving.');
  if(Number(result.samples||0)<10||Number(result.confidence||0)<0.60)throw new Error('This sample is not reliable enough to save yet.');
  const payload={
    workspace_id:context.workspaceId,
    item_id:context.item.id,
    work_id:context.work.id,
    bph:Math.round(Number(result.bph)),
    rate_seconds_per_day:Number(result.rateSecondsPerDay),
    beat_error_ms:result.beatErrorMs==null?null:Number(result.beatErrorMs),
    amplitude_deg:null,
    lift_angle_deg:finite(liftAngle)?Number(liftAngle):null,
    position:timingPositionKey(position),
    phase:timingPhaseKey(phase),
    duration_seconds:finite(durationSeconds)?Number(durationSeconds):null,
    stability_score:timingStabilityScore(result),
    confidence:timingConfidenceLabel(result.confidence),
    confidence_score:Number(result.confidence)||0,
    sample_count:Number(result.samples)||0,
    jitter_ms:finite(result.jitterMs)?Number(result.jitterMs):null,
    sample_rate_hz:finite(sampleRate)?Math.round(Number(sampleRate)):null,
    checklist_step_id:context.currentStep?.id||null,
    device:String(device||''),
    notes:String(notes||''),
    recorded_at:new Date().toISOString()
  };
  const {data,error}=await supabaseClient().from('timing_runs').insert(payload).select().single();
  if(error)throw error;return data;
}

export function summarizeStructuredTiming(runs=[]){
  const usable=(Array.isArray(runs)?runs:[]).filter(r=>Number.isFinite(Number(r.rate_seconds_per_day))).sort((a,b)=>Date.parse(b.recorded_at||0)-Date.parse(a.recorded_at||0));
  const byPosition=new Map();for(const run of usable){if(!byPosition.has(run.position))byPosition.set(run.position,run);}
  const positions=[...byPosition.values()];
  const rates=positions.map(r=>Number(r.rate_seconds_per_day)).filter(Number.isFinite);
  const spread=rates.length>=2?Math.max(...rates)-Math.min(...rates):null;
  const latest=usable[0]||null,previous=usable[1]||null;
  return {latest,previous,positions,spread,rateDelta:latest&&previous?Number(latest.rate_seconds_per_day)-Number(previous.rate_seconds_per_day):null};
}
