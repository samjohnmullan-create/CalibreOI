import {session,supabaseClient} from './cloud.js?v=5';

let workspacePromise=null;
const num=value=>Number(value)||0;
const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));

export async function structuredWorkspaceId(){
  if(workspacePromise)return workspacePromise;
  workspacePromise=(async()=>{
    const s=await session();
    if(!s?.user||s.localOnly)return '';
    const {data,error}=await supabaseClient().from('workspace_members').select('workspace_id').eq('user_id',s.user.id).limit(1).maybeSingle();
    if(error)throw error;
    return data?.workspace_id||'';
  })();
  try{return await workspacePromise;}catch(err){workspacePromise=null;throw err;}
}

const legacyStatus=value=>({
  queued:'Planned',ready:'Planned',on_bench:'In progress',waiting:'Waiting',qc:'In progress',complete:'Complete',cancelled:'Cancelled'
}[String(value||'').toLowerCase()]||'Planned');

function costBucket(rows=[]){
  const out={purchasePrice:0,buyerPremium:0,postage:0,partsCost:0,consumables:0,externalService:0,marketplaceFees:0,shippingToBuyer:0,repairCost:0,preparationCost:0,otherCost:0};
  for(const row of rows){
    const amount=num(row.amount),key=String(row.category||'');
    if(key==='purchase')out.purchasePrice+=amount;
    else if(key==='buyer_premium')out.buyerPremium+=amount;
    else if(key==='postage')out.postage+=amount;
    else if(key==='part')out.partsCost+=amount;
    else if(key==='consumable')out.consumables+=amount;
    else if(key==='external_service')out.externalService+=amount;
    else if(key==='marketplace_fee')out.marketplaceFees+=amount;
    else if(key==='buyer_postage')out.shippingToBuyer+=amount;
    else if(key==='repair')out.repairCost+=amount;
    else if(key==='preparation')out.preparationCost+=amount;
    else out.otherCost+=amount;
  }
  return out;
}

function latestByItem(rows=[]){
  const out=new Map();
  for(const row of rows){
    const prev=out.get(row.item_id),stamp=Date.parse(row.valued_at||row.created_at||'')||0,prevStamp=Date.parse(prev?.valued_at||prev?.created_at||'')||0;
    if(!prev||stamp>=prevStamp)out.set(row.item_id,row);
  }
  return out;
}

function mergeById(existing=[],incoming=[]){
  const map=new Map(existing.map(row=>[String(row?.id||''),row]));
  for(const row of incoming)map.set(String(row.id),row);
  return [...map.values()];
}

export async function overlayStructuredWorkbenchState(baseState={}){
  const workspaceId=await structuredWorkspaceId();
  if(!workspaceId)return baseState;
  const sb=supabaseClient();
  const [itemsQ,identityQ,workQ,stepsQ,needsQ,costsQ,valuesQ,sessionsQ]=await Promise.all([
    sb.from('items').select('id,item_number,type,purpose,status,title,acquired_at,notes,archived_at,created_at,updated_at').eq('workspace_id',workspaceId).is('archived_at',null),
    sb.from('item_identity').select('*').eq('workspace_id',workspaceId),
    sb.from('work_records').select('*').eq('workspace_id',workspaceId),
    sb.from('work_checklist_steps').select('id,work_id,item_id,label,description,sequence,required,status,notes,blocked_reason,started_at,completed_at').eq('workspace_id',workspaceId).order('sequence',{ascending:true}),
    sb.from('work_part_needs').select('id,work_record_id,item_id,part_type,description,status').eq('workspace_id',workspaceId),
    sb.from('cost_entries').select('item_id,category,amount,currency,incurred_at').eq('workspace_id',workspaceId),
    sb.from('valuations').select('item_id,low_value,expected_value,high_value,target_value,minimum_value,confidence,basis,valued_at,created_at').eq('workspace_id',workspaceId),
    sb.from('work_sessions').select('id,work_id,item_id,started_at,ended_at,note').eq('workspace_id',workspaceId)
  ]);
  for(const q of [itemsQ,identityQ,workQ,stepsQ,needsQ,costsQ,valuesQ,sessionsQ])if(q.error)throw q.error;

  const identities=new Map((identityQ.data||[]).map(row=>[row.item_id,row]));
  const costs=new Map();for(const row of costsQ.data||[]){const arr=costs.get(row.item_id)||[];arr.push(row);costs.set(row.item_id,arr);}
  const latestValue=latestByItem(valuesQ.data||[]);
  const structuredItems=(itemsQ.data||[]).map(row=>{
    const identity=identities.get(row.id)||{},valuation=latestValue.get(row.id)||{},commercial=costBucket(costs.get(row.id)||[]);
    commercial.acquiredAt=row.acquired_at||row.created_at||'';
    commercial.targetSale=num(valuation.target_value)||num(valuation.expected_value)||0;
    return {id:row.id,itemNumber:row.item_number,title:row.title||[identity.maker,identity.model].filter(Boolean).join(' ')||`Item ${row.item_number||''}`,type:row.type,purpose:row.purpose,status:row.status,notes:row.notes||'',createdAt:row.created_at,updatedAt:row.updated_at,identity:{maker:identity.maker||'',model:identity.model||'',reference:identity.reference||'',serial:identity.serial||'',year:identity.year_from||'',era:identity.era||'',country:identity.country||'',materials:identity.materials||'',notes:identity.notes||''},commercial,watch:{passport:{},passportPhotos:{}},sale:{},_structured:true};
  });

  const stepsByWork=new Map();for(const row of stepsQ.data||[]){const arr=stepsByWork.get(row.work_id)||[];arr.push(row);stepsByWork.set(row.work_id,arr);}
  const needsByWork=new Map();for(const row of needsQ.data||[]){if(['fitted','cancelled','not_needed'].includes(String(row.status||'').toLowerCase()))continue;const arr=needsByWork.get(row.work_record_id)||[];arr.push(row);needsByWork.set(row.work_record_id,arr);}
  const sessionsByWork=new Map();for(const row of sessionsQ.data||[]){const arr=sessionsByWork.get(row.work_id)||[];arr.push(row);sessionsByWork.set(row.work_id,arr);}
  const structuredWork=(workQ.data||[]).map(row=>{
    const rawSteps=stepsByWork.get(row.id)||[],needs=needsByWork.get(row.id)||[],status=legacyStatus(row.status);
    const stages=rawSteps.map(step=>({id:step.id,title:step.label||step.description||'Step',name:step.label||step.description||'Step',complete:String(step.status||'').toLowerCase()==='done',completedAt:step.completed_at||'',status:step.status,blockedReason:step.blocked_reason||''}));
    let stageIndex=Math.max(0,stages.findIndex(stage=>!stage.complete));if(stageIndex<0)stageIndex=Math.max(0,stages.length-1);
    const blocker=row.blocker||row.waiting_reason||(needs.length?`Needs ${needs.map(n=>n.part_type||n.description||'part').join(', ')}`:'');
    return {id:row.id,itemId:row.item_id,title:row.title||'Work',type:row.type,status,workbenchHidden:String(row.status||'').toLowerCase()==='queued',priority:num(row.priority)>0,nextAction:row.next_action||'',blocker,diagnosis:row.diagnosis||'',repairPerformed:row.repair_performed||'',notes:row.notes||'',openedAt:row.opened_at||row.created_at||'',startedAt:row.started_at||'',completedAt:row.completed_at||'',createdAt:row.created_at||'',updatedAt:row.updated_at||'',stages,stageIndex,partIds:needs.map(n=>n.id),benchSessions:sessionsByWork.get(row.id)||[],_structured:true,_structuredStatus:row.status};
  });

  const state=clone(baseState||{});state.items=mergeById(Array.isArray(state.items)?state.items:[],structuredItems);state.work=mergeById(Array.isArray(state.work)?state.work:[],structuredWork);state._structured={...(state._structured||{}),workspaceId,loadedAt:new Date().toISOString()};return state;
}

export async function mutateStructuredWork(workId,action){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  const sb=supabaseClient();
  const {data:row,error:readError}=await sb.from('work_records').select('id,status,priority,blocker,waiting_reason').eq('workspace_id',workspaceId).eq('id',workId).maybeSingle();
  if(readError)throw readError;if(!row)throw new Error('Work record not found');
  const patch={updated_at:new Date().toISOString()};
  if(action==='priority')patch.priority=num(row.priority)>0?0:1;
  else if(action==='bench')patch.status=String(row.status)==='queued'?'on_bench':'queued';
  else if(action==='wait'){patch.status='waiting';patch.waiting_reason=row.waiting_reason||'parts';patch.blocker=row.blocker||'Waiting on parts';}
  else throw new Error(`Unsupported structured Work action: ${action}`);
  const {error}=await sb.from('work_records').update(patch).eq('workspace_id',workspaceId).eq('id',workId);if(error)throw error;return true;
}

export async function archiveStructuredEntity(entityType,entityId,reason=''){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  const {data,error}=await supabaseClient().rpc('archive_inventory_entity',{p_workspace_id:workspaceId,p_entity_type:entityType,p_entity_id:entityId,p_reason:reason||''});if(error)throw error;return data;
}
export async function restoreStructuredEntity(entityType,entityId){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  const {data,error}=await supabaseClient().rpc('restore_inventory_entity',{p_workspace_id:workspaceId,p_entity_type:entityType,p_entity_id:entityId});if(error)throw error;return data;
}
export async function startStructuredBenchSession(workId){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  const {data,error}=await supabaseClient().rpc('start_work_session',{p_workspace_id:workspaceId,p_work_id:workId});if(error)throw error;return Array.isArray(data)?data[0]:data;
}
export async function finishStructuredBenchSession(sessionId,note=''){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  const {data,error}=await supabaseClient().rpc('finish_work_session',{p_workspace_id:workspaceId,p_session_id:sessionId,p_note:note||''});if(error)throw error;return Array.isArray(data)?data[0]:data;
}
