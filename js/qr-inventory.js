const text=value=>value==null?'':String(value).trim();
const ENTITY_TYPES=new Set(['item','work','part','tray','tool']);
const VERSION='1';

function encode(value){return encodeURIComponent(text(value));}
function decode(value){try{return decodeURIComponent(value||'');}catch{return String(value||'');}}

export function qrEntityCode(type,id){
  const entity=ENTITY_TYPES.has(type)?type:'item';
  const key=text(id);
  if(!key)throw new Error('QR inventory records require an ID.');
  return `CAL:${VERSION}:${entity}:${key}`;
}

export function parseQrEntityCode(raw=''){
  const value=text(raw);
  const match=/^CAL:(\d+):(item|work|part|tray|tool):(.+)$/i.exec(value);
  if(!match)return null;
  return {version:match[1],type:match[2].toLowerCase(),id:match[3]};
}

export function qrRouteForEntity(type,id){
  const entity=ENTITY_TYPES.has(type)?type:'item',key=text(id);
  if(!key)return '';
  if(entity==='item')return `item.html?id=${encode(key)}&from=qr`;
  if(entity==='work')return `work.html?id=${encode(key)}&from=qr`;
  if(entity==='part')return `suppliers.html?part=${encode(key)}&from=qr`;
  if(entity==='tray')return `inventory.html?tray=${encode(key)}&from=qr`;
  if(entity==='tool')return `tools.html?id=${encode(key)}&from=qr`;
  return '';
}

export function qrPayloadForEntity(type,id,{origin=''}={}){
  const route=qrRouteForEntity(type,id);
  if(!route)return '';
  const base=text(origin).replace(/\/+$/,'');
  return base?`${base}/${route}`:route;
}

export function resolveQrPayload(raw,{origin=''}={}){
  const value=text(raw);
  const code=parseQrEntityCode(value);
  if(code)return {...code,route:qrRouteForEntity(code.type,code.id),source:'code'};
  try{
    const url=new URL(value,origin||'https://calibre.local/');
    const page=url.pathname.split('/').pop()||'';
    const fromQr=url.searchParams.get('from')==='qr';
    if(page==='item.html'&&url.searchParams.get('id'))return {version:VERSION,type:'item',id:decode(url.searchParams.get('id')),route:`item.html?id=${encode(url.searchParams.get('id'))}&from=qr`,source:fromQr?'url':'link'};
    if(page==='work.html'&&url.searchParams.get('id'))return {version:VERSION,type:'work',id:decode(url.searchParams.get('id')),route:`work.html?id=${encode(url.searchParams.get('id'))}&from=qr`,source:fromQr?'url':'link'};
  }catch{}
  return null;
}

export function itemQrIdentity(item={}){
  const id=text(item.id);
  return id?{code:qrEntityCode('item',id),route:qrRouteForEntity('item',id)}:null;
}
