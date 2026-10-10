import { loadState, saveState } from './store.js?v=26';
import { donorPartStorage, storageLocationForAsset, storeDonorPart, consumeStoredDonorPart } from './donor-workshop.js?v=1';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let busy=false;
function ownerFromRow(row){const raw=String(row?.dataset?.donorRow||'');return raw.startsWith('item:')?{donorItemId:raw.slice(5),donorJobId:''}:{donorItemId:'',donorJobId:raw};}
function selectedPart(row){const sel=row.querySelector('[data-donor-part]');return sel?{id:sel.value,name:sel.options[sel.selectedIndex]?.textContent||''}:{id:'',name:''};}
function donorCalibre(row){const line=row.querySelector('.pi-head .muted.small')?.textContent||'';const m=/cal\.\s*([^·]+)/i.exec(line);return m?m[1].trim():'';}
async function decorate(){
  if(busy)return;busy=true;
  try{
    const state=await loadState(),trays=(state.workshopAssets||[]).filter(a=>a?.type==='tray'&&a.status!=='Archived');
    for(const row of document.querySelectorAll('[data-donor-row]')){
      row.querySelector('.donor-storage')?.remove();
      const owner=ownerFromRow(row),part=selectedPart(row);if(!part.id)continue;
      const stored=donorPartStorage(state,{...owner,partId:part.id}),where=storageLocationForAsset(state,stored);
      const wrap=document.createElement('div');wrap.className='donor-storage';
      wrap.innerHTML=`<div class="muted small">Storage: <strong>${esc(where||'Not assigned')}</strong>${stored?.quantity!=null?` · Qty ${Number(stored.quantity)||0}`:''}</div><div class="donor-storage-actions"><select class="donor-tray"><option value="">No tray / use location only</option>${trays.map(t=>`<option value="${esc(t.id)}" ${stored?.trayId===t.id?'selected':''}>${esc(t.name)}${t.location?' · '+esc(t.location):''}</option>`).join('')}</select><input class="donor-location" placeholder="Loose location" value="${esc(stored?.location||'')}"><button type="button" class="btn secondary donor-store">Store selected part</button>${stored?`<a class="btn secondary" href="workshop-assets.html?id=${encodeURIComponent(stored.id)}">Open storage ID</a>`:''}</div>`;
      wrap.querySelector('.donor-store').onclick=async()=>{const trayId=wrap.querySelector('.donor-tray').value,location=wrap.querySelector('.donor-location').value;const latest=await loadState();storeDonorPart(latest,{...owner,partId:part.id,partName:part.name,calibre:donorCalibre(row),trayId,location,quantity:stored?.quantity||1});await saveState(latest);await decorate();};
      row.appendChild(wrap);
    }
  }finally{busy=false;}
}

document.addEventListener('change',e=>{if(e.target?.matches?.('[data-donor-part]'))setTimeout(decorate,0);},true);
document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-fit-action="used"][data-source-type="donor"]');if(!b)return;const row=b.closest('[data-donor-row]'),part=selectedPart(row),owner=ownerFromRow(row);setTimeout(async()=>{const state=await loadState();const asset=consumeStoredDonorPart(state,{...owner,partId:part.id});if(asset)await saveState(state);},250);},true);
const observer=new MutationObserver(()=>{if(document.querySelector('[data-donor-row]'))decorate();});observer.observe(document.body,{childList:true,subtree:true});
const style=document.createElement('style');style.textContent='.donor-storage{margin-top:8px;padding:8px;border:1px dashed var(--line);border-radius:8px;background:var(--surface-2)}.donor-storage-actions{display:grid;grid-template-columns:minmax(130px,1fr) minmax(120px,1fr) auto auto;gap:5px;margin-top:6px}@media(max-width:700px){.donor-storage-actions{grid-template-columns:1fr}}';document.head.appendChild(style);
setTimeout(decorate,500);
