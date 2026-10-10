import { itemQrIdentity, qrPayloadForEntity } from './qr-inventory.js?v=1';

const params=new URLSearchParams(location.search),itemId=params.get('id')||'';
if(itemId){
  const mount=()=>{
    const actions=document.querySelector('.item-actions');
    if(!actions||document.getElementById('itemQrButton'))return;
    const button=document.createElement('button');
    button.id='itemQrButton';button.type='button';button.className='btn secondary';button.textContent='QR / label';
    actions.insertBefore(button,actions.querySelector('.danger-link'));
    button.onclick=()=>{
      const identity=itemQrIdentity({id:itemId});
      if(!identity)return;
      const absolute=qrPayloadForEntity('item',itemId,{origin:location.origin+location.pathname.replace(/[^/]*$/,'').replace(/\/$/,'')});
      let modal=document.getElementById('itemQrPanel');
      if(!modal){
        modal=document.createElement('section');modal.id='itemQrPanel';modal.className='card';modal.style.cssText='position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,420px);max-height:80vh;overflow:auto;box-shadow:0 18px 60px rgba(0,0,0,.28)';
        document.body.appendChild(modal);
      }
      modal.innerHTML=`<div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="kicker">QR INVENTORY</div><h3 style="margin:3px 0">Item label</h3></div><button class="btn secondary" id="closeItemQr" type="button">Close</button></div><p class="muted small">This code is tied to the permanent Item ID, not the current job.</p><label>Calibre code<input id="itemQrCode" readonly value="${identity.code.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></label><label>Scan target<input id="itemQrUrl" readonly value="${absolute.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></label><div class="row"><button class="btn" id="copyItemQr" type="button">Copy scan target</button><a class="btn secondary" href="qr-scan.html">Open scanner</a></div><p id="itemQrMsg" class="muted small"></p>`;
      modal.querySelector('#closeItemQr').onclick=()=>modal.remove();
      modal.querySelector('#copyItemQr').onclick=async()=>{try{await navigator.clipboard.writeText(absolute);modal.querySelector('#itemQrMsg').textContent='Copied.';}catch{modal.querySelector('#itemQrUrl').select();document.execCommand?.('copy');modal.querySelector('#itemQrMsg').textContent='Copied.';}};
    };
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
}
