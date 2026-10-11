const STORAGE_KEY='calibre-device-mode';
const allowed=new Set(['auto','workstation','touch','capture']);
const page=(location.pathname.split('/').pop()||'index.html').split('?')[0];
const html=document.documentElement;
const coarse=()=>matchMedia?.('(pointer: coarse)').matches||false;
const fine=()=>matchMedia?.('(pointer: fine)').matches||false;
const hover=()=>matchMedia?.('(hover: hover)').matches||false;
function saved(){try{const v=localStorage.getItem(STORAGE_KEY)||'auto';return allowed.has(v)?v:'auto';}catch{return 'auto';}}
export function detectDeviceMode(){
  if(page==='capture.html')return 'capture';
  const width=Math.max(window.innerWidth||0,html.clientWidth||0),height=Math.max(window.innerHeight||0,html.clientHeight||0);
  if(width>=900&&(fine()||hover()))return 'workstation';
  if(coarse()||width<900)return 'touch';
  return width>=900&&height>=600?'workstation':'touch';
}
export function currentDeviceMode(){const override=saved();return override==='auto'?detectDeviceMode():override;}
export function setDeviceMode(mode='auto'){const value=allowed.has(mode)?mode:'auto';try{localStorage.setItem(STORAGE_KEY,value);}catch{}applyDeviceMode();window.dispatchEvent(new CustomEvent('calibre:device-mode',{detail:deviceState()}));return value;}
export function deviceState(){return {preference:saved(),mode:currentDeviceMode(),page,width:window.innerWidth||0,height:window.innerHeight||0,coarse:coarse(),fine:fine(),hover:hover()};}
export function applyDeviceMode(){const state=deviceState();html.dataset.deviceMode=state.mode;html.dataset.devicePreference=state.preference;html.classList.toggle('calibre-touch',state.mode==='touch'||state.mode==='capture');html.classList.toggle('calibre-workstation',state.mode==='workstation');html.classList.toggle('calibre-capture',state.mode==='capture');return state;}
function mountControl(){const bar=document.querySelector('.brandbar');if(!bar||bar.querySelector('[data-device-control]'))return;const wrap=document.createElement('label');wrap.className='device-mode-control';wrap.dataset.deviceControl='1';wrap.title='Device experience';wrap.innerHTML='<span class="device-mode-label">View</span><select aria-label="Device experience"><option value="auto">Auto</option><option value="workstation">Workstation</option><option value="touch">Touch</option><option value="capture">Capture</option></select>';const select=wrap.querySelector('select');select.value=saved();select.onchange=()=>setDeviceMode(select.value);bar.appendChild(wrap);}
let resizeTimer=0;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(saved()==='auto')applyDeviceMode();},120);},{passive:true});
applyDeviceMode();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountControl,{once:true});else mountControl();
window.CalibreDevice={get:deviceState,set:setDeviceMode,apply:applyDeviceMode};
