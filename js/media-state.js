import {mediaForItem,mediaForWork} from './media-model.js?v=3';
const text=value=>value==null?'':String(value);
export function itemMedia(state={},itemId=''){const item=(state.items||[]).find(candidate=>text(candidate?.id)===text(itemId));return mediaForItem(item?.mediaAssets||[],itemId);}
export function workMedia(state={},workId=''){const key=text(workId);if(!key)return [];const out=[],seen=new Set();for(const item of (state.items||[])){for(const asset of mediaForWork(item?.mediaAssets||[],key)){const dedupe=asset.id||asset.storageKey;if(dedupe&&seen.has(dedupe))continue;if(dedupe)seen.add(dedupe);out.push(asset);}}return out;}
