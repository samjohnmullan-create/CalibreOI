import * as base from './store-local-fast.js?v=3';
import {currentWork} from './work-model.js?v=2';
export * from './store-local-fast.js?v=3';

export function current(state){return currentWork(state)||base.current(state);}
export async function loadState(){const state=await base.loadState();if(!state)return {items:[],work:[]};state.items=Array.isArray(state.items)?state.items:[];state.work=Array.isArray(state.work)?state.work:[];return state;}
// Canonical Work is authoritative.
export async function saveState(state){state.items=Array.isArray(state.items)?state.items:[];state.work=Array.isArray(state.work)?state.work:[];return base.saveState(state);}
export async function importInboxItems(items){return base.importInboxItems(items);}
