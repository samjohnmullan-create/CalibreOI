import * as store from "./store-workbench-queue.js?v=2";
export * from "./store-workbench-queue.js?v=2";

if (typeof window !== "undefined" && /(?:^|\/)passport\.html$/.test(location.pathname)) {
  queueMicrotask(() => import("./passport-media.js?v=4").catch(err => console.warn("Passport media manager failed", err)));
}

if (typeof window !== "undefined" && /(?:^|\/)workbench\.html$/.test(location.pathname)) {
  document.addEventListener("click", async event => {
    const card=event.target.closest?.(".hub-card");
    if(!card)return;
    const action=event.target.closest?.("[data-act]")?.dataset?.act||"";
    if(action && action!=="open")return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try{
      const state=await store.loadState();
      const id=card.dataset.id||"";
      if(!state.jobs?.some(j=>j.id===id))throw new Error("Job not found");
      state.currentId=id;
      await store.saveState(state);
      location.href=`service.html?id=${encodeURIComponent(id)}`;
    }catch(err){console.error("Could not open selected job",err);}
  },true);
}

if (typeof window !== "undefined" && /(?:^|\/)summary\.html$/.test(location.pathname)) {
  const addServiceButton=()=>{
    const bar=document.querySelector(".footer-actions");
    if(!bar||document.getElementById("continueService"))return;
    const a=document.createElement("a");
    a.id="continueService";a.className="btn";a.href="service.html";a.textContent="Continue service";
    bar.prepend(a);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addServiceButton,{once:true});else addServiceButton();
}
