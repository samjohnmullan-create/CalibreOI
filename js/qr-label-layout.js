const text=value=>value==null?'':String(value).trim();
export function shortItemId(id=''){const s=text(id);if(!s)return '';return s.length<=12?s:`…${s.slice(-11)}`;}
export function labelTitle(item={}){return text(item.title||item.identity?.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(' ')||'Untitled item');}
export function labelLocation(item={}){return text(item.storageLocation||item.location||item.storage?.location||'');}
export function labelRecord(item={}){return {id:text(item.id),shortId:shortItemId(item.id),title:labelTitle(item),location:labelLocation(item),type:text(item.type||'item')};}
export function labelSheetItems(items=[]){return (Array.isArray(items)?items:[]).filter(item=>item?.id).map(labelRecord);}
