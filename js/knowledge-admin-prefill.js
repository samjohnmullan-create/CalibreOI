function setValue(id,value){const el=document.getElementById(id);if(!el||value==null)return false;el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}));return true;}
function applyPrefill(){
  const params=new URLSearchParams(location.search);
  if(params.get('draft')!=='1')return true;
  const kind=document.getElementById('kind'),action=document.getElementById('action'),title=document.getElementById('title'),confidence=document.getElementById('confidence'),notes=document.getElementById('researchNotes');
  if(!kind||!action||!title||!confidence||!notes)return false;
  if(params.get('kind')){kind.value=params.get('kind');kind.dispatchEvent(new Event('change',{bubbles:true}));}
  if(params.get('action')){action.value=params.get('action');action.dispatchEvent(new Event('change',{bubbles:true}));}
  if(params.get('targetId'))setValue('targetId',params.get('targetId'));
  if(params.get('confidence'))confidence.value=params.get('confidence');
  if(params.get('title'))title.value=params.get('title');
  if(params.get('notes'))notes.value=params.get('notes');
  let missing=0;
  for(const [key,value] of params.entries()){
    if(!key.startsWith('field.'))continue;
    const field=key.slice(6),el=document.querySelector(`#dynamicFields [data-key="${CSS.escape(field)}"]`);
    if(!el){missing++;continue;}
    if(el.type==='checkbox')el.checked=/^(1|true|yes)$/i.test(value);else el.value=value;
  }
  if(missing)return false;
  const flash=document.getElementById('flash');if(flash&&!flash.textContent){flash.textContent='Prefilled from workshop evidence. Review before saving or applying.';flash.className='flash good';}
  return true;
}
let attempts=0;const timer=setInterval(()=>{attempts++;if(applyPrefill()||attempts>25)clearInterval(timer);},80);
