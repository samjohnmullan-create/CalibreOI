import * as cloud from './store-cloud-core.js?v=6';
export * from './store-cloud-core.js?v=6';

function pageName(){if(typeof location==='undefined')return '';return (location.pathname.split('/').pop()||'index.html').split('?')[0];}
export async function loadState(){const state=await cloud.loadState();if(state&&pageName()==='finance.html')Object.defineProperty(state,'__itemScope',{value:'resale',configurable:true,enumerable:false});return state;}
export async function saveState(state){return cloud.saveState(state);}
export async function importInboxItems(items){return cloud.importInboxItems(items);}
