export function checklistValue(current,next){
  return current===next?'':next;
}

export function stepObject(raw,index=0){
  return typeof raw==='string'?{id:String(index),text:raw}:raw||{id:String(index),text:''};
}

export function findChecklistStep(defs=[],text=''){
  const target=String(text||'').trim();
  for(let i=0;i<defs.length;i++){
    const step=stepObject(defs[i],i);
    if(String(step.text||'').trim()===target)return {step,index:i};
  }
  return null;
}
