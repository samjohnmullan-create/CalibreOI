import { mediaQueueHealth } from './system-health.js?v=2';

function ensureTile(){
  const grid=document.querySelector('.health-grid');
  if(!grid)return null;
  let tile=document.getElementById('healthUploadsTile');
  if(tile)return tile;
  tile=document.createElement('div');
  tile.className='health-tile';
  tile.id='healthUploadsTile';
  tile.innerHTML='<span>Upload queue</span><strong id="healthUploads">Checking…</strong>';
  grid.appendChild(tile);
  return tile;
}

async function paint(){
  if(!ensureTile())return;
  const output=document.getElementById('healthUploads');
  const detail=document.getElementById('healthDetail');
  const health=await mediaQueueHealth();
  if(!output)return;
  if(!health.available){output.textContent='Unavailable';output.className='warn';return;}
  if(!health.total){output.textContent='Clear';output.className='ok';return;}
  output.textContent=health.failed?`${health.total} pending · ${health.failed} failed`:`${health.total} pending`;
  output.className=health.failed?'warn':'';
  if(detail){
    const parts=[];
    if(health.queued)parts.push(`${health.queued} waiting to upload`);
    if(health.uploadedAwaitingSave)parts.push(`${health.uploadedAwaitingSave} uploaded and awaiting record save`);
    if(health.failed)parts.push(`${health.failed} retry failure${health.failed===1?'':'s'}`);
    const queueText=`Media queue: ${parts.join(' · ')}.`;
    if(!detail.dataset.mediaQueueBase)detail.dataset.mediaQueueBase=detail.textContent||'';
    detail.textContent=[detail.dataset.mediaQueueBase,queueText].filter(Boolean).join(' · ');
  }
}

paint().catch(err=>console.warn('Media queue health unavailable',err));
window.addEventListener('online',()=>paint().catch(()=>{}));
window.addEventListener('focus',()=>paint().catch(()=>{}));
