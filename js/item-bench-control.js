import { loadState, saveState, blankJob } from './store.js?v=26';
import { ensureSpecialistJob, linkedJob } from './watch-item-bridge.js?v=3';

const params=new URLSearchParams(location.search);
const itemId=params.get('id')||'';
const actions=document.querySelector('.item-actions');
if(!actions||!itemId)throw new Error('Item bench control unavailable.');

let state=await loadState();
state.items=Array.isArray(state.items)?state.items:[];
state.jobs=Array.isArray(state.jobs)?state.jobs:[];
let item=state.items.find(x=>String(x.id)===String(itemId));
if(!item||!['watch','clock'].includes(item.type))throw new Error('Workbench control only applies to watches and clocks.');

const button=document.createElement('button');
button.type='button';
button.className='btn secondary';
button.id='benchToggle';
const saveButton=actions.querySelector('#save');
if(saveButton)saveButton.insertAdjacentElement('afterend',button);else actions.prepend(button);

function jobFor(){return linkedJob(state,item)||(state.jobs||[]).find(j=>String(j.itemId||'')===String(item.id));}
function onBench(){const job=jobFor();return !!job&&job.workbenchHidden!==true&&String(job.status||'')==='On bench';}
function paint(){const active=onBench();button.textContent=active?'Remove from bench':'Add to bench';button.classList.toggle('secondary',active);button.title=active?'Move this item back to the queue without deleting its job or history.':'Make this item active on the Workbench.';}

button.addEventListener('click',async()=>{
  button.disabled=true;
  try{
    state=await loadState();state.items=Array.isArray(state.items)?state.items:[];state.jobs=Array.isArray(state.jobs)?state.jobs:[];
    item=state.items.find(x=>String(x.id)===String(itemId));if(!item)return;
    let job=jobFor();
    const active=!!job&&job.workbenchHidden!==true&&String(job.status||'')==='On bench';
    if(active){
      job.workbenchHidden=true;
      if(item.status==='On bench')item.status='Acquired';
    }else{
      if(!job)job=ensureSpecialistJob(state,item,blankJob);
      if(!job)return;
      job.workbenchHidden=false;
      job.status='On bench';
      item.status='On bench';
      state.currentId=job.id;
    }
    const now=new Date().toISOString();job.updatedAt=now;item.updatedAt=now;
    await saveState(state);
    const status=document.getElementById('status');if(status)status.value=item.status;
    const msg=document.getElementById('msg');if(msg)msg.textContent=active?'Removed from Workbench.':'Added to Workbench.';
    paint();
  }catch(err){console.warn('Workbench toggle failed',err);const msg=document.getElementById('msg');if(msg)msg.textContent=err?.message||'Could not update Workbench.';}
  finally{button.disabled=false;}
});

paint();
