export const CAPTURE_ROLES=[
  ['movement','Movement','movement'],['dial','Dial','identity'],['caseback','Caseback','identity'],['hallmark','Hallmark','identity'],['serial','Serial / marking','identity'],['fault','Fault / damage','workshop'],['part','Part','workshop'],['progress','Progress','workshop'],['finished','Finished','sale'],['listing','Listing','sale']
];
export function captureRoleConfig(role='movement'){return CAPTURE_ROLES.find(([key])=>key===role)||CAPTURE_ROLES[0];}
export function captureTargets(state={},allItemsFn){
  const items=typeof allItemsFn==='function'?allItemsFn(state):[];
  const works=Array.isArray(state.work)?state.work:[];
  return items.map(item=>({
    id:String(item.id||''),
    title:item.title||item.identity?.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(' ')||'Untitled item',
    type:item.type||'other',
    works:works.filter(work=>String(work.itemId)===String(item.id)&&!['Complete','Cancelled'].includes(work.status)).map(work=>({id:String(work.id),title:work.title||'Work',status:work.status||'Planned'}))
  }));
}
export function captureAttachment({state,itemId='',workId='',asset}={}){
  if(!state||!asset)return false;
  const item=Array.isArray(state.items)?state.items.find(candidate=>String(candidate.id)===String(itemId)):null;
  if(!item)return false;
  item.mediaAssets=Array.isArray(item.mediaAssets)?item.mediaAssets:[];
  const next={...asset,itemId:String(itemId),workId:String(workId||asset.workId||'')};
  const index=item.mediaAssets.findIndex(existing=>String(existing?.id||'')===String(next.id||''));
  if(index>=0)item.mediaAssets[index]=next;else item.mediaAssets.push(next);
  item.updatedAt=new Date().toISOString();
  return true;
}
