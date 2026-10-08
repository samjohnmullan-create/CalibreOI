import { session, supabaseClient } from "./cloud.js?v=4";
import { loadState, saveState, current, escapeHtml } from "./store.js?v=26";

const raw=v=>v==null?"":String(v).trim();
const now=()=>new Date().toISOString();
const esc=escapeHtml;

function mediaRefs(job){
  return (job?.mediaAssets||[]).filter(a=>a&&!a.deletedAt).map(a=>({
    id:raw(a.id),category:raw(a.category),storageKey:raw(a.storageKey),originalName:raw(a.originalName),
    mimeType:raw(a.mimeType),caption:raw(a.caption),evidenceNote:raw(a.evidenceNote),createdAt:raw(a.createdAt),
    visibility:a.visibility==="public"?"public":"private",isCover:!!a.isCover
  })).filter(a=>a.id||a.storageKey);
}
function legacyPhotoSummary(job){
  const out=[];
  for(const [slot,items] of Object.entries(job?.photos||{})){
    const count=Array.isArray(items)?items.length:0;if(count)out.push({slot,count});
  }
  const passportCount=Array.isArray(job?.passport?.photos)?job.passport.photos.length:0;
  if(passportCount)out.push({slot:"passport",count:passportCount});
  return out;
}
export function researchRequestSnapshot(job){
  const p=job?.passport||{},b=job?.business||{};
  return {
    version:1,
    requestedAt:now(),
    watch:{id:job?.id||"",jobId:job?.jobId||"",pushId:job?.pushId||"",watchName:job?.watchName||"",status:job?.status||"",jobType:job?.jobType||"",stage:Number(job?.stage)||0},
    purchase:{source:job?.purchaseSource?.source||p.seller||"",orderId:job?.purchaseSource?.orderId||p.invoiceNumber||"",sourceRef:job?.purchaseSource?.sourceRef||"",purchasePrice:b.purchasePrice||"",postage:b.postage||"",acquiredAt:job?.acquiredAt||""},
    passport:structuredClone(p),
    business:{purchasePrice:b.purchasePrice||"",postage:b.postage||"",partsCost:b.partsCost||"",targetSale:b.targetSale||"",minSale:b.minSale||""},
    diagnosis:job?.diagnosis||"",
    repairPerformed:job?.repairPerformed||"",
    faults:structuredClone(job?.faults||[]),
    diagnosticFaults:structuredClone(job?.diagnosticFaults||[]),
    parts:structuredClone(job?.parts||[]),
    researchBrief:structuredClone(job?.researchBrief||{}),
    notes:job?.notes||"",
    media:mediaRefs(job),
    legacyPhotos:legacyPhotoSummary(job),
    requestedWork:[
      "Identify maker, model, approximate era/year and movement/calibre where evidence supports it",
      "Research manufacturer and model history using credible sources",
      "Assess likely faults and bench checks without inventing measurements",
      "Identify plausible parts leads and compatibility cautions",
      "Estimate conservative resale range and target sale in AUD",
      "Populate Passport, research brief, diagnostics and business valuation fields",
      "Return the enriched record as a calibrejob update for this same watch"
    ],
    privacyNote:"Photo records may reference private Calibre media. Do not expose or republish private media URLs."
  };
}

export async function submitResearchRequest(job,state){
  if(!job)throw new Error("No watch is open.");
  const s=await session();
  if(!s?.user||s.localOnly)throw new Error("Sign in to Calibre Cloud to send a research request.");
  const snapshot=researchRequestSnapshot(job);
  const existing=await supabaseClient().from("calibre_research_requests")
    .select("id,status,created_at")
    .eq("owner_id",s.user.id).eq("watch_id",String(job.id)).eq("status","pending")
    .order("created_at",{ascending:false}).limit(1);
  if(existing.error)throw existing.error;
  let requestId="";
  if(existing.data?.[0]?.id){
    requestId=existing.data[0].id;
    const {error}=await supabaseClient().from("calibre_research_requests").update({request_data:snapshot,updated_at:now()}).eq("id",requestId);
    if(error)throw error;
  }else{
    const {data,error}=await supabaseClient().from("calibre_research_requests").insert({owner_id:s.user.id,watch_id:String(job.id),job_id:String(job.jobId||""),status:"pending",request_data:snapshot,updated_at:now()}).select("id").single();
    if(error)throw error;requestId=data.id;
  }
  job.researchRequest={id:requestId,status:"pending",requestedAt:snapshot.requestedAt,photoRefs:snapshot.media.length};
  if(state)await saveState(state);
  return {id:requestId,snapshot};
}

export async function mountResearchRequestCard(){
  if(document.getElementById("researchRequestCard"))return;
  const sheet=document.getElementById("sheet"),actions=document.querySelector(".footer-actions");
  if(!sheet||!actions)return;
  const state=await loadState(),job=current(state);if(!job)return;
  const card=document.createElement("section");card.id="researchRequestCard";card.className="card no-print";
  sheet.insertAdjacentElement("beforebegin",card);
  function paint(message=""){
    const r=job.researchRequest||{},photos=mediaRefs(job).length,legacy=legacyPhotoSummary(job).reduce((n,x)=>n+x.count,0),pending=r.status==="pending";
    card.innerHTML=`<div class="row" style="justify-content:space-between;align-items:start"><div><div class="kicker">RESEARCH HANDOFF</div><h3 style="margin:.2rem 0">Send this watch for research</h3><p class="muted small" style="margin:.2rem 0">Packages the current job, purchase details, Passport, faults and photo references so the same watch can be researched and returned to Calibre.</p></div><span class="badge">${pending?"Pending":"Ready"}</span></div><div class="grid2" style="margin-top:9px"><div><span class="muted small">Archived media</span><strong style="display:block">${photos} file${photos===1?"":"s"}</strong></div><div><span class="muted small">Legacy photos</span><strong style="display:block">${legacy}</strong></div></div><div class="row" style="margin-top:10px"><button id="sendResearchRequest" class="btn" type="button">${pending?"Refresh research request":"Request research"}</button><span id="researchRequestMsg" class="muted small">${esc(message|| (pending?`Pending · ${r.requestedAt?new Date(r.requestedAt).toLocaleString():"sent"}`:""))}</span></div>`;
    card.querySelector("#sendResearchRequest").onclick=async()=>{
      const btn=card.querySelector("#sendResearchRequest"),msg=card.querySelector("#researchRequestMsg");btn.disabled=true;msg.textContent="Sending…";
      try{const result=await submitResearchRequest(job,state);paint(`Request ${result.id.slice(0,8)} sent. In ChatGPT, say “research the latest Calibre request”.`);}catch(err){btn.disabled=false;msg.textContent=err?.message||"Could not send request.";}
    };
  }
  paint();
  if(new URLSearchParams(location.search).get("research")==="1")card.scrollIntoView({behavior:"smooth",block:"start"});
}

if((location.pathname.split("/").pop()||"").split("?")[0]==="summary.html")mountResearchRequestCard().catch(err=>console.warn("Calibre research request unavailable",err));
