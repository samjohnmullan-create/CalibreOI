import * as enhanced from "./store-enhanced.js?v=2";
import { prepareQueuedMediaForSave, acknowledgeQueuedMedia } from "./media-queue-reconcile.js?v=1";

export * from "./store-enhanced.js?v=2";

// Canonical saves persist Item, Work, Commerce and Media exactly as authored.
// Legacy Job reconciliation is import tooling only and must never run implicitly.
export async function loadState(){return enhanced.loadState();}
export async function saveState(state){
  const queuedMediaIds=await prepareQueuedMediaForSave(state);
  const result=await enhanced.saveState(state);
  await acknowledgeQueuedMedia(queuedMediaIds);
  return result;
}

if(typeof window!=="undefined"){
  window.addEventListener("online",()=>{
    enhanced.loadState().then(state=>saveState(state)).catch(err=>console.warn("Queued media could not resume after reconnect",err));
  });
}
