export const CAPTURE_ROLES=[
  ['movement','Movement','movement'],
  ['dial','Dial','identity'],
  ['caseback','Caseback','identity'],
  ['hallmark','Hallmark','identity'],
  ['serial','Serial / marking','identity'],
  ['fault','Fault / damage','workshop'],
  ['part','Part','workshop'],
  ['progress','Progress','workshop'],
  ['finished','Finished','sale'],
  ['listing','Listing','sale']
];

export function captureRoleConfig(role='movement'){
  return CAPTURE_ROLES.find(([key])=>key===role)||CAPTURE_ROLES[0];
}

export function captureTargets(state={},allItemsFn){
  const items=typeof allItemsFn==='function'?allItemsFn(state):[];
  const works=Array.isArray(state.workRecords)?state.workRecords:[];
  return items.map(item=>({
    id:String(item.id||''),
    title:item.title||item.identity?.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(' ')||'Untitled item',
    type:item.type||'other',
    legacyJobId:item.legacyJobId||'',
    works:works.filter(work=>String(work.itemId)===String(item.id)&&!['Complete','Cancelled'].includes(work.status)).map(work=>({id:String(work.id),title:work.title||'Work',status:work.status||'Planned'}))
  }));
}

export function captureAttachment({state,itemId='',workId='',asset,allItemsFn}={}){
  if(!state||!asset)return false;
  const explicit=Array.isArray(state.items)?state.items.find(item=>String(item.id)===String(itemId)):null;
  if(explicit){
    explicit.mediaAssets=Array.isArray(explicit.mediaAssets)?explicit.mediaAssets:[];
    const next={...asset,itemId:String(itemId),workId:String(workId||asset.workId||'')};
    const index=explicit.mediaAssets.findIndex(existing=>String(existing?.id||'')===String(next.id||''));
    if(index>=0)explicit.mediaAssets[index]=next;else explicit.mediaAssets.push(next);
    explicit.updatedAt=new Date().toISOString();
    return true;
  }
  const items=typeof allItemsFn==='function'?allItemsFn(state):[];
  const derived=items.find(item=>String(item.id)===String(itemId));
  const legacyId=derived?.legacyJobId||asset.legacyJobId||'';
  const job=(state.jobs||[]).find(job=>String(job.id)===String(legacyId));
  if(job){
    job.mediaAssets=Array.isArray(job.mediaAssets)?job.mediaAssets:[];
    const next={...asset,itemId:String(itemId),legacyJobId:String(job.id),workId:String(workId||asset.workId||'')};
    const index=job.mediaAssets.findIndex(existing=>String(existing?.id||'')===String(next.id||''));
    if(index>=0)job.mediaAssets[index]=next;else job.mediaAssets.push(next);
    job.updatedAt=new Date().toISOString();
    return true;
  }
  return false;
}
