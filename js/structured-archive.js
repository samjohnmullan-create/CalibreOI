import {supabaseClient} from './cloud.js?v=5';
import {structuredWorkspaceId,archiveStructuredEntity,restoreStructuredEntity} from './structured-cloud.js?v=4';

const labelFor=(type,row)=>{
  if(type==='item')return row.title||`Item ${row.item_number||''}`;
  if(type==='part')return row.description||row.part_type||row.reference||'Part';
  if(type==='tool')return row.name||row.description||row.model||'Tool';
  if(type==='consumable')return row.name||row.description||'Consumable';
  return 'Record';
};

export async function loadStructuredArchiveInventory(){
  const workspaceId=await structuredWorkspaceId();
  if(!workspaceId)throw new Error('Structured workspace unavailable');
  const sb=supabaseClient();
  const [itemsQ,partsQ,toolsQ,consumablesQ,workQ]=await Promise.all([
    sb.from('items').select('id,item_number,title,type,purpose,status,archived_at,archive_reason,updated_at').eq('workspace_id',workspaceId).order('updated_at',{ascending:false}),
    sb.from('parts').select('id,part_type,manufacturer,reference,description,condition,quantity,archived_at,archive_reason,updated_at').eq('workspace_id',workspaceId).order('updated_at',{ascending:false}),
    sb.from('tools').select('*').eq('workspace_id',workspaceId).order('updated_at',{ascending:false}),
    sb.from('consumables').select('*').eq('workspace_id',workspaceId).order('updated_at',{ascending:false}),
    sb.from('work_records').select('id,item_id,title,status').eq('workspace_id',workspaceId)
  ]);
  for(const q of [itemsQ,partsQ,toolsQ,consumablesQ,workQ])if(q.error)throw q.error;
  const activeWorkByItem=new Map();
  for(const work of workQ.data||[]){if(['complete','cancelled'].includes(String(work.status||'').toLowerCase()))continue;const list=activeWorkByItem.get(work.item_id)||[];list.push(work);activeWorkByItem.set(work.item_id,list);}
  const wrap=(type,rows)=>rows.map(row=>({type,row,label:labelFor(type,row),archived:!!row.archived_at,activeWork:type==='item'?(activeWorkByItem.get(row.id)||[]):[]}));
  const records=[...wrap('item',itemsQ.data||[]),...wrap('part',partsQ.data||[]),...wrap('tool',toolsQ.data||[]),...wrap('consumable',consumablesQ.data||[])];
  return {workspaceId,records,active:records.filter(r=>!r.archived),archived:records.filter(r=>r.archived)};
}

export async function archiveRecord(type,id,reason=''){return archiveStructuredEntity(type,id,reason);}
export async function restoreRecord(type,id){return restoreStructuredEntity(type,id);}
