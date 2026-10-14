import {loadState,saveState} from './store.js?v=26';

const params=new URLSearchParams(location.search),itemId=params.get('id')||'';
const $=id=>document.getElementById(id);
const saleFields=['targetSale','minSale','actualSale','saleChannel','listedAt','soldAt'];
let timer=null,saving=false;

async function mutateCurrent(mutator,message='Saved'){
  if(!itemId||saving)return;
  saving=true;
  try{
    const state=await loadState();
    state.items=Array.isArray(state.items)?state.items:[];
    const item=state.items.find(row=>String(row.id)===String(itemId));
    if(!item)return;
    state.currentItemId=item.id;
    item.commercial=item.commercial&&typeof item.commercial==='object'?item.commercial:{};
    await mutator(item,state);
    item.updatedAt=new Date().toISOString();
    await saveState(state);
    const msg=$('msg');if(msg)msg.textContent=message;
  }catch(error){
    console.warn('Item commerce save failed',error);
    const msg=$('msg');if(msg)msg.textContent='Sale update could not be saved.';
  }finally{saving=false;}
}
function captureSale(item){
  for(const id of saleFields){
    const el=$(id);if(el)item.commercial[id]=el.value;
  }
}
function scheduleSaleSave(){
  clearTimeout(timer);
  const msg=$('msg');if(msg)msg.textContent='Saving sale…';
  timer=setTimeout(()=>mutateCurrent(item=>captureSale(item),'Sale saved'),350);
}

if(itemId){
  mutateCurrent(()=>{},'').catch(()=>{});
  for(const id of saleFields){
    const el=$(id);if(!el)continue;
    el.addEventListener('input',scheduleSaleSave);
    el.addEventListener('change',scheduleSaleSave);
  }
  const salePanel=$('panel-sale');
  if(salePanel&&!$('markItemSold')){
    const actions=document.createElement('div');actions.className='item-actions';actions.style.marginTop='12px';
    actions.innerHTML='<button class="btn" id="markItemSold" type="button">Mark sold</button><span class="muted small" id="soldActionMsg"></span>';
    salePanel.querySelector('.card')?.appendChild(actions);
    const button=$('markItemSold'),note=$('soldActionMsg');
    button.onclick=async()=>{
      const actual=Number($('actualSale')?.value||0);
      if(!(actual>0)){note.textContent='Enter the actual sale price first.';return;}
      button.disabled=true;button.textContent='Marking sold…';note.textContent='';
      try{
        if($('soldAt')&&!$('soldAt').value)$('soldAt').value=new Date().toISOString().slice(0,10);
        await mutateCurrent((item)=>{
          captureSale(item);
          item.status='Sold';
          if(!item.commercial.soldAt)item.commercial.soldAt=new Date().toISOString().slice(0,10);
        },'Marked sold');
        if($('status'))$('status').value='Sold';
        note.textContent='Sold and saved.';
      }finally{button.disabled=false;button.textContent='Mark sold';}
    };
  }
}
