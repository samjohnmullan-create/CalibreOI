import {supabaseClient} from './cloud.js?v=5';
import {structuredWorkspaceId} from './structured-cloud.js?v=4';

const text=v=>String(v??'').trim();
const lower=v=>text(v).toLowerCase();
const same=(a,b)=>!!text(a)&&!!text(b)&&lower(a)===lower(b);

function scoreLoosePart(part,{need,identity,passport}){
  let score=0;const reasons=[];
  const wanted=[need?.part_type,need?.description].filter(Boolean).join(' ');
  const partText=[part.part_type,part.description,part.reference].filter(Boolean).join(' ');
  if(wanted&&partText&&lower(partText).includes(lower(need?.part_type||wanted))){score+=55;reasons.push('part description matches the need');}
  if(same(part.manufacturer,passport?.movement_maker)||same(part.manufacturer,identity?.maker)){score+=25;reasons.push('manufacturer matches recorded maker');}
  if(part.quantity!=null&&Number(part.quantity)>0){score+=10;reasons.push('in stock');}
  if(lower(part.condition)==='used')reasons.push('used condition');
  return {...part,score,reasons,confidence:score>=75?'strong':score>=45?'possible':'lead'};
}

function scoreDonor(candidate,{itemId,identity,passport}){
  if(candidate.id===itemId)return null;
  const cp=candidate.passport||{},ci=candidate.identity||{};
  let score=0;const reasons=[];
  if(same(passport?.calibre,cp.calibre)){score=95;reasons.push(`exact calibre match: ${passport.calibre}`);}
  else if(same(passport?.calibre_family,cp.calibre_family)){score=75;reasons.push(`same calibre family: ${passport.calibre_family}`);}
  else if(same(passport?.movement_maker,cp.movement_maker)&&text(passport?.movement_maker)){score=55;reasons.push(`same movement maker: ${passport.movement_maker}`);}
  else if(same(identity?.maker,ci.maker)&&text(identity?.maker)){score=30;reasons.push(`same watch maker: ${identity.maker}`);}
  if(candidate.purpose==='donor'){score+=5;reasons.push('already classified as donor');}
  if(!score)return null;
  return {...candidate,score:Math.min(100,score),reasons,confidence:score>=90?'strong':score>=60?'possible':'lead'};
}

export async function loadStructuredPartFinder(workId){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  const sb=supabaseClient();
  const {data:work,error:workError}=await sb.from('work_records').select('*').eq('workspace_id',workspaceId).eq('id',workId).maybeSingle();
  if(workError)throw workError;if(!work)throw new Error('Work record not found');
  const [itemQ,identityQ,passportQ,needsQ,partsQ,itemsQ,identitiesQ,passportsQ]=await Promise.all([
    sb.from('items').select('*').eq('workspace_id',workspaceId).eq('id',work.item_id).maybeSingle(),
    sb.from('item_identity').select('*').eq('workspace_id',workspaceId).eq('item_id',work.item_id).maybeSingle(),
    sb.from('passports').select('*').eq('workspace_id',workspaceId).eq('item_id',work.item_id).maybeSingle(),
    sb.from('work_part_needs').select('*').eq('workspace_id',workspaceId).eq('work_record_id',workId).order('created_at',{ascending:false}),
    sb.from('parts').select('*').eq('workspace_id',workspaceId).is('archived_at',null).gt('quantity',0),
    sb.from('items').select('id,item_number,title,purpose,status,archived_at').eq('workspace_id',workspaceId).is('archived_at',null),
    sb.from('item_identity').select('*').eq('workspace_id',workspaceId),
    sb.from('passports').select('*').eq('workspace_id',workspaceId)
  ]);
  for(const q of [itemQ,identityQ,passportQ,needsQ,partsQ,itemsQ,identitiesQ,passportsQ])if(q.error)throw q.error;
  const item=itemQ.data||{},identity=identityQ.data||{},passport=passportQ.data||{},needs=needsQ.data||[];
  const activeNeed=needs.find(n=>!['fulfilled','cancelled'].includes(lower(n.status)))||null;
  const identities=new Map((identitiesQ.data||[]).map(r=>[r.item_id,r]));
  const passports=new Map((passportsQ.data||[]).map(r=>[r.item_id,r]));
  const donorRows=(itemsQ.data||[]).map(r=>({...r,identity:identities.get(r.id)||{},passport:passports.get(r.id)||{}}));
  const loose=(partsQ.data||[]).map(p=>scoreLoosePart(p,{need:activeNeed,identity,passport})).sort((a,b)=>b.score-a.score);
  const donors=donorRows.map(r=>scoreDonor(r,{itemId:item.id,identity,passport})).filter(Boolean).sort((a,b)=>b.score-a.score);
  return {workspaceId,work,item,identity,passport,needs,activeNeed,looseParts:loose,donorCandidates:donors};
}

export async function createStructuredPartNeed(workId,itemId,{partType,description='',markWaiting=false}={}){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  if(!text(partType))throw new Error('Enter the part you need.');
  const sb=supabaseClient();
  const {data,error}=await sb.from('work_part_needs').insert({workspace_id:workspaceId,work_record_id:workId,item_id:itemId,part_type:text(partType),description:text(description),status:'open'}).select().single();
  if(error)throw error;
  if(markWaiting){const {error:workError}=await sb.from('work_records').update({status:'waiting',waiting_reason:'parts',blocker:`Waiting on ${text(partType)}`,updated_at:new Date().toISOString()}).eq('workspace_id',workspaceId).eq('id',workId);if(workError)throw workError;}
  return data;
}

export async function updateStructuredPartNeed(needId,status){
  const workspaceId=await structuredWorkspaceId();if(!workspaceId)throw new Error('Structured workspace unavailable');
  if(!['open','reserved','fulfilled','cancelled'].includes(status))throw new Error('Invalid Part Need status.');
  const {data,error}=await supabaseClient().from('work_part_needs').update({status,updated_at:new Date().toISOString()}).eq('workspace_id',workspaceId).eq('id',needId).select().single();
  if(error)throw error;return data;
}
