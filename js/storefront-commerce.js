const text=v=>String(v??'').trim();

export function safeCheckoutUrl(value){
  const raw=text(value);
  if(!raw)return '';
  try{
    const url=new URL(raw);
    return url.protocol==='https:'?url.toString():'';
  }catch{return '';}
}

export function normaliseCheckout(raw={}){
  const provider=text(raw?.provider).toLowerCase();
  const url=safeCheckoutUrl(raw?.url);
  if(provider!=='square'||!url)return null;
  return {provider:'square',url};
}

export function squareCheckoutForPublication(status,url){
  if(status!=='for_sale')return null;
  const safe=safeCheckoutUrl(url);
  return safe?{provider:'square',url:safe}:null;
}

export function checkoutReady(publicData={},status=''){
  return status==='for_sale'&&!!normaliseCheckout(publicData?.checkout);
}
