const text=value=>value==null?'':String(value);
export function itemIntegrityReport(state={}){
  const items=Array.isArray(state.items)?state.items:[],work=Array.isArray(state.workRecords)?state.workRecords:[];
  const itemIds=new Set(items.map(item=>text(item?.id)).filter(Boolean));
  const duplicateItemIds=[...items.reduce((map,item)=>{const key=text(item?.id);if(key)map.set(key,(map.get(key)||0)+1);return map;},new Map()).entries()].filter(([,count])=>count>1).map(([id])=>id);
  const duplicateWorkIds=[...work.reduce((map,record)=>{const key=text(record?.id);if(key)map.set(key,(map.get(key)||0)+1);return map;},new Map()).entries()].filter(([,count])=>count>1).map(([id])=>id);
  const orphanWork=work.filter(record=>!record?.itemId||!itemIds.has(text(record.itemId))).map(record=>text(record?.id)).filter(Boolean);
  return {items:items.length,work:work.length,duplicateItemIds,duplicateWorkIds,orphanWork,healthy:duplicateItemIds.length===0&&duplicateWorkIds.length===0&&orphanWork.length===0};
}
