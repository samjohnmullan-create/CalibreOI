const nowIso=at=>{
  const d=at?new Date(at):new Date();
  if(Number.isNaN(d.getTime()))throw new Error('Invalid lifecycle timestamp');
  return d.toISOString();
};
const day=iso=>iso.slice(0,10);
const activeWork=work=>work&&!['Complete','Cancelled'].includes(work.status);
const same=(a,b)=>String(a??'')===String(b??'');

export function cancelWork(state,workId,{reason='Work cancelled',at}={}){
  if(!state||typeof state!=='object')throw new Error('Calibre state is required');
  state.items=Array.isArray(state.items)?state.items:[];
  state.work=Array.isArray(state.work)?state.work:[];
  const work=state.work.find(row=>same(row?.id,workId));
  if(!work)throw new Error('Work record not found');
  const iso=nowIso(at);
  if(work.status!=='Complete'){
    work.status='Cancelled';
    work.completedAt=work.completedAt||day(iso);
    work.blocker='';
    work.nextAction='';
    if(reason&&!work.outcome)work.outcome=reason;
    work.updatedAt=iso;
  }
  if(same(state.currentWorkId,work.id))state.currentWorkId='';

  const item=state.items.find(row=>same(row?.id,work.itemId))||null;
  if(item){
    const otherActive=state.work.some(row=>!same(row?.id,work.id)&&same(row?.itemId,item.id)&&activeWork(row));
    if(!otherActive&&['On bench','Awaiting parts'].includes(item.status))item.status='Preparing';
    item.updatedAt=iso;
  }
  return {item,work};
}

export function writeOffItemToDonor(state,itemId,{reason='Item moved to donor/spares',at}={}){
  if(!state||typeof state!=='object')throw new Error('Calibre state is required');
  state.items=Array.isArray(state.items)?state.items:[];
  state.work=Array.isArray(state.work)?state.work:[];
  const item=state.items.find(row=>same(row?.id,itemId));
  if(!item)throw new Error('Item record not found');
  const iso=nowIso(at);

  item.purpose='donor';
  // Donor intelligence intentionally ignores Archived Items. Retained means the
  // physical object is still owned and available as a donor/spares resource.
  item.status='Retained';
  item.tags=[...new Set([...(Array.isArray(item.tags)?item.tags:[]),'donor'])];
  item.commercial=item.commercial&&typeof item.commercial==='object'?item.commercial:{};
  item.commercial.saleChannel='Not listed';
  item.commercial.listedAt='';
  item.updatedAt=iso;

  const closedWork=[];
  for(const work of state.work){
    if(!same(work?.itemId,item.id)||!activeWork(work))continue;
    work.status='Cancelled';
    work.completedAt=work.completedAt||day(iso);
    work.blocker='';
    work.nextAction='';
    if(reason&&!work.outcome)work.outcome=reason;
    work.updatedAt=iso;
    closedWork.push(work.id);
  }
  if(closedWork.some(id=>same(id,state.currentWorkId)))state.currentWorkId='';
  state.currentItemId=item.id;
  return {item,closedWork};
}
