const STORAGE_KEY='calibre-device-mode';
const allowed=new Set(['auto','workstation','touch','capture']);
const hasBrowser=typeof window!=='undefined'&&typeof document!=='undefined';
const page=hasBrowser?(window.location.pathname.split('/').pop()||'index.html').split('?')[0]:'index.html';
const html=hasBrowser?document.documentElement:null;
if(hasBrowser&&!document.querySelector('link[data-calibre-device-css]')){const link=document.createElement('link');link.rel='stylesheet';link.href='css/device-experience.css?v=1';link.dataset.calibreDeviceCss='1';document.head.appendChild(link);}
const media=q=>hasBrowser&&typeof window.matchMedia==='function'&&window.matchMedia(q).matches;
const coarse=()=>media('(pointer: coarse)');
const fine=()=>media('(pointer: fine)');
const hover=()=>media('(hover: hover)');
function saved(){if(!hasBrowser)return 'auto';try{const v=localStorage.getItem(STORAGE_KEY)||'auto';return allowed.has(v)?v:'auto';}catch{return 'auto';}}
export function detectDeviceMode(){
  if(!hasBrowser)return 'workstation';
  if(page==='capture.html')return 'capture';
  const width=Math.max(window.innerWidth||0,html?.clientWidth||0),height=Math.max(window.innerHeight||0,html?.clientHeight||0);
  if(width>=900&&(fine()||hover()))return 'workstation';
  if(coarse()||width<900)return 'touch';
  return width>=900&&height>=600?'workstation':'touch';
}
export function currentDeviceMode(){const override=saved();return override==='auto'?detectDeviceMode():override;}
export function setDeviceMode(mode='auto'){const value=allowed.has(mode)?mode:'auto';if(hasBrowser){try{localStorage.setItem(STORAGE_KEY,value);}catch{}applyDeviceMode();window.dispatchEvent(new CustomEvent('calibre:device-mode',{detail:deviceState()}));}return value;}
export function deviceState(){return {preference:saved(),mode:currentDeviceMode(),page,width:hasBrowser?window.innerWidth||0:0,height:hasBrowser?window.innerHeight||0:0,coarse:coarse(),fine:fine(),hover:hover()};}
export function applyDeviceMode(){const state=deviceState();if(!hasBrowser||!html)return state;html.dataset.deviceMode=state.mode;html.dataset.devicePreference=state.preference;html.classList.toggle('calibre-touch',state.mode==='touch'||state.mode==='capture');html.classList.toggle('calibre-workstation',state.mode==='workstation');html.classList.toggle('calibre-capture',state.mode==='capture');return state;}
function mountControl(){if(!hasBrowser)return;const bar=document.querySelector('.brandbar');if(!bar||bar.querySelector('[data-device-control]'))return;const wrap=document.createElement('label');wrap.className='device-mode-control';wrap.dataset.deviceControl='1';wrap.title='Device experience';wrap.innerHTML='<span class="device-mode-label">View</span><select aria-label="Device experience"><option value="auto">Auto</option><option value="workstation">Workstation</option><option value="touch">Touch</option><option value="capture">Capture</option></select>';const select=wrap.querySelector('select');select.value=saved();select.onchange=()=>setDeviceMode(select.value);bar.appendChild(wrap);}
if(hasBrowser){let resizeTimer=0;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(saved()==='auto')applyDeviceMode();},120);},{passive:true});applyDeviceMode();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountControl,{once:true});else mountControl();window.CalibreDevice={get:deviceState,set:setDeviceMode,apply:applyDeviceMode};}
