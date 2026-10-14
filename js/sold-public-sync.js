import {loadState} from './store.js?v=26';
import {session,supabaseClient} from './cloud.js?v=4';
import {resolveSaleContext} from './sale-workspace.js?v=1';

const params=new URLSearchParams(location.search);
let syncing=false;

export async function syncSoldPublicRecord(){
  if(syncing)return false;
  syncing=true;
  try{
    const [state,s]=await Promise.all([loadState(),session()]);
    const {item}=resolveSaleContext(state,{itemId:params.get('item')||params.get('id')||'',workId:params.get('work')||''});
    if(!item||item.status!=='Sold'||!s?.user)return false;
    const client=supabaseClient();
    const {data,error}=await client.from('calibre_public_watches').select('status,public_data').eq('owner_id',s.user.id).eq('watch_id',item.id).maybeSingle();
    if(error)throw error;
    if(!data)return false;
    const publicData={...(data.public_data||{}),availability:'sold',checkout:null,itemId:item.id};
    publicData.schemaVersion=Math.max(Number(publicData.schemaVersion)||0,4);
    const result=await client.from('calibre_public_watches').update({status:'sold',public_data:publicData,updated_at:new Date().toISOString()}).eq('owner_id',s.user.id).eq('watch_id',item.id);
    if(result.error)throw result.error;
    const status=document.getElementById('squareCheckoutStatus');if(status)status.textContent='Item sold · checkout closed';
    const input=document.getElementById('squareCheckoutUrl');if(input){input.value='';input.disabled=true;}
    const button=document.getElementById('saveSquareCheckout');if(button)button.disabled=true;
    return true;
  }finally{syncing=false;}
}

const requestSync=()=>syncSoldPublicRecord().catch(error=>console.warn('Sold public sync failed',error));
document.addEventListener('calibre:sale-updated',requestSync);
window.addEventListener('calibre:sale-updated',requestSync);
setTimeout(()=>syncSoldPublicRecord().catch(()=>{}),300);
