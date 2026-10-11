import * as base from "./store-local-fast.js?v=1";
import { currentWork } from "./work-model.js";

export * from "./store-local-fast.js?v=1";

function pageName(){if(typeof location==='undefined')return '';return (location.pathname.split('/').pop()||'index.html').split('?')[0];}

// Specialist tools that have already crossed over can ask for the canonical Work
// through the long-standing current() API while older compatibility pages retire.
export function current(state){
  if(pageName()==='timegrapher.html'){
    const work=currentWork(state);
    if(work){
      const item=(state.items||[]).find(candidate=>String(candidate.id)===String(work.itemId));
      if(item&&!Object.prototype.hasOwnProperty.call(work,'watchName'))Object.defineProperty(work,'watchName',{value:item.title||item.identity?.title||'Timegrapher',configurable:true,enumerable:false});
      return work;
    }
  }
  return base.current(state);
}

// Legacy card helpers are import/export compatibility only. They are intentionally
// absent from load/save reconciliation and cannot create or alter Item/Work records.
export function blankJob(partial={}){return base.blankJob({status:'Purchased',...partial});}
export function importCard(raw={}){return base.importCard({...raw,status:raw.status||'Purchased'});}
export function coverPhoto(job){return base.coverPhoto?base.coverPhoto(job):'';}

export async function loadState(){
  const state=await base.loadState();
  if(!state)return {items:[],workRecords:[],jobs:[]};
  state.items=Array.isArray(state.items)?state.items:[];
  state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];
  // Temporary transport compatibility for the old cloud-core serializer only.
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];
  return state;
}

// Canonical Work is authoritative. Never derive or mirror Work from legacy Jobs here.
export async function saveState(state){
  state.items=Array.isArray(state.items)?state.items:[];
  state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];
  // TODO remove when store-cloud-core no longer validates the old transport bucket.
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];
  return base.saveState(state);
}

export async function importInboxItems(items){return base.importInboxItems(items);}
