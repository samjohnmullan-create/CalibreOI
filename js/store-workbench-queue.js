import * as base from './store-local-fast.js?v=2';
import {currentWork} from './work-model.js';
export * from './store-local-fast.js?v=2';

export function current(state){return currentWork(state)||base.current(state);}
export async function loadState(){const state=await base.loadState();if(!state)return {items:[],workRecords:[]};state.items=Array.isArray(state.items)?state.items:[];state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];return state;}
// Canonical Work is authoritative.
export async function saveState(state){state.items=Array.isArray(state.items)?state.items:[];state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];return base.saveState(state);}
export async function importInboxItems(items){return base.importInboxItems(items);}
