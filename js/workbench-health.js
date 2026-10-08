const PLACEHOLDER="Reading diagnostic state";
const $=s=>document.querySelector(s);
let retrying=false;

function diagnosticsReady(){
  const root=$("#faults");
  if(!root)return false;
  const text=(root.textContent||"").trim();
  return !!text && !text.includes(PLACEHOLDER) && /Faults to investigate/.test(text);
}

function showTakingLonger(){
  const root=$("#faults");
  if(!root||diagnosticsReady())return;
  const p=root.querySelector("p");
  if(p)p.textContent="Diagnostics are taking longer than expected. Retrying…";
}

function showFailure(message){
  const root=$("#faults");
  if(!root||diagnosticsReady())return;
  root.innerHTML=`<h3>Faults to investigate</h3><div class="wb-runtime-card"><strong>Diagnostics did not initialise.</strong><p class="muted small">${String(message||"The diagnostic runtime did not finish loading.")}</p><button type="button" class="btn secondary" id="retryDiagnostics">Retry diagnostics</button></div>`;
  root.querySelector("#retryDiagnostics")?.addEventListener("click",()=>retry(true));
}

async function retry(manual=false){
  if(retrying||diagnosticsReady())return;
  retrying=true;
  try{
    showTakingLonger();
    const suffix=manual?`retry=${Date.now()}`:"v=5";
    await import(`./workbench-runtime-core.js?${suffix}`);
    await new Promise(r=>setTimeout(r,650));
    if(!diagnosticsReady())showFailure("Calibre retried the diagnostic engine, but it still did not report ready.");
  }catch(err){
    console.error("Calibre diagnostic retry failed",err);
    showFailure(err?.message||"Diagnostic runtime load failed.");
  }finally{
    retrying=false;
  }
}

setTimeout(()=>{
  if(!diagnosticsReady())retry(false);
},2200);
