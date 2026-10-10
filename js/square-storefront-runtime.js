import { loadState, current } from './store.js?v=26';
import { session, supabaseClient } from './cloud.js?v=4';
import { safeCheckoutUrl } from './storefront-commerce.js?v=1';

const $=id=>document.getElementById(id);
let mounted=false;

function styles(){
  if(document.getElementById('squareStorefrontStyle'))return;
  const s=document.createElement('style');
  s.id='squareStorefrontStyle';
  s.textContent=`.square-storefront{margin:12px 0 4px;padding:12px;border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:9px;background:var(--surface-2)}.square-storefront h4{margin:2px 0 4px}.square-storefront .square-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end}.square-storefront .square-status{font-size:.64rem;color:var(--muted);margin-top:6px}@media(max-width:640px){.square-storefront .square-row{grid-template-columns:1fr}.square-storefront .btn{width:100%}}`;
  document.head.appendChild(s);
}

async function loadPublishedRow(job,userId){
  const client=supabaseClient();
  const {data,error}=await client.from('calibre_public_watches').select('status,public_data').eq('owner_id',userId).eq('watch_id',job.id).maybeSingle();
  if(error)throw error;
  return data||null;
}

async function saveLink(job,userId){
  const input=$('squareCheckoutUrl'),status=$('squareCheckoutStatus');
  const raw=String(input?.value||'').trim(),safe=safeCheckoutUrl(raw);
  if(raw&&!safe){status.textContent='Use a full https:// Square Payment Link.';return;}
  status.textContent='Saving…';
  const client=supabaseClient(),row=await loadPublishedRow(job,userId);
  if(!row){status.textContent='Publish the item first, then add its Square checkout link.';return;}
  const publicData={...(row.public_data||{})};
  publicData.schemaVersion=Math.max(Number(publicData.schemaVersion)||0,3);
  publicData.checkout=safe?{provider:'square',url:safe}:null;
  const {error}=await client.from('calibre_public_watches').update({public_data:publicData,updated_at:new Date().toISOString()}).eq('owner_id',userId).eq('watch_id',job.id);
  if(error)throw error;
  input.value=safe;
  status.textContent=safe?(row.status==='for_sale'?'Square Buy now is live on the public page.':'Saved. Set visibility to For sale when you want Buy now shown.'):'Square checkout removed.';
}

async function mount(){
  if(mounted)return;
  const card=$('publicPublishCard');
  if(!card)return false;
  const [state,s]=await Promise.all([loadState(),session()]),job=current(state);
  if(!job||!s?.user)return false;
  styles();
  const row=await loadPublishedRow(job,s.user.id),checkout=row?.public_data?.checkout;
  const box=document.createElement('section');
  box.className='square-storefront';
  box.id='squareStorefront';
  box.innerHTML=`<div class="kicker">CHECKOUT</div><h4>Square Buy now</h4><p class="muted small" style="margin:.2rem 0 .55rem">Paste the Square Payment Link for this item. Calibre only stores the public checkout URL — card details and payment processing stay with Square.</p><div class="square-row"><label>Square Payment Link<input id="squareCheckoutUrl" type="url" inputmode="url" placeholder="https://square.link/…" value="${String(checkout?.provider==='square'?checkout.url:'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></label><button id="saveSquareCheckout" type="button" class="btn secondary">Save checkout</button></div><div id="squareCheckoutStatus" class="square-status">${checkout?.url?'Checkout link loaded.':'No Square checkout linked yet.'}</div>`;
  const photos=card.querySelector('.pub-photo-grid');
  if(photos)photos.insertAdjacentElement('beforebegin',box);else card.appendChild(box);
  $('saveSquareCheckout').addEventListener('click',()=>saveLink(job,s.user.id).catch(err=>{console.error('Square checkout save failed',err);$('squareCheckoutStatus').textContent=`Could not save checkout: ${err?.message||err}`;}));
  mounted=true;
  return true;
}

let tries=0;
function start(){
  mount().then(ok=>{if(ok)return;if(++tries<30)setTimeout(start,200);}).catch(err=>{console.warn('Square storefront controls unavailable',err);if(++tries<30)setTimeout(start,300);});
}
start();
