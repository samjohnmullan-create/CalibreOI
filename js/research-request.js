import { session, supabaseClient } from "./cloud.js?v=4";
import { loadState, saveState, current, escapeHtml } from "./store.js?v=26";
import { fetchPrivateMedia } from "./media.js?v=1";

const raw=v=>v==null?"":String(v).trim();
const now=()=>new Date().toISOString();
const esc=escapeHtml;
const RESEARCH_MEDIA_BUCKET="calibre-research-media";
const RESEARCH_MEDIA_TTL_SECONDS=12*60*60;
const RESEARCH_MEDIA_PROXY="https://jdeqnboljrgrpnvkfthx.supabase.co/functions/v1/research-media";
const PHOTO_SLOT_LABELS={
  intake:"Intake / as received",dial:"Dial straight-on",caseback:"Caseback exterior",insidecase:"Inside caseback",movement:"Movement full view",movementserial:"Movement serial",caseserial:"Case serial / reference",hallmarks:"Hallmarks / stamps",crown:"Crown",strapmarks:"Bracelet / strap markings",identityother:"Other identifying mark",
  damage:"Damage / fault",predismantle:"Before dismantling",dismantled:"Movement dismantled",progress:"Repair progress",reassembly:"Reassembly",finalmovement:"Final movement",finished:"Finished watch",
  hero:"Hero / front",salesleft:"Front ¾ left",salesright:"Front ¾ right",crownside:"Side — crown",oppositeside:"Side — opposite",salescaseback:"Caseback",wristscale:"Wrist / scale shot",dialclose:"Dial close-up",salesmovement:"Movement",claspstrap:"Clasp / buckle / strap",flaws:"Flaws / condition disclosure",accessories:"Packaging / accessories"
};

function activeMedia(job){return (job?.mediaAssets||[]).filter(a=>a&&!a.deletedAt&&a.storageKey);}
function mediaRefs(job){
  return activeMedia(job).map(a=>({
    id:raw(a.id),category:raw(a.category),storageKey:raw(a.storageKey),originalName:raw(a.originalName),
    mimeType:raw(a.mimeType),caption:raw(a.caption),evidenceNote:raw(a.evidenceNote),createdAt:raw(a.createdAt),
    stageId:raw(a.stageId),previewSlot:raw(a.previewSlot),visibility:a.visibility==="public"?"public":"private",isCover:!!a.isCover
  })).filter(a=>a.id||a.storageKey);
}
function archivedPreviewCount(job,slot){
  const label=PHOTO_SLOT_LABELS[slot]||slot;
  return activeMedia(job).filter(a=>{
    const previewSlot=raw(a.previewSlot),stageId=raw(a.stageId);
    return previewSlot===slot||stageId===slot||stageId===label;
  }).length;
}
function legacyPhotoSummary(job){
  const out=[];
  for(const [slot,items] of Object.entries(job?.photos||{})){
    const count=Array.isArray(items)?items.length:0;
    if(!count)continue;
    // Guided Passport uploads keep a compressed display preview in job.photos while
    // the original is archived in Supabase Storage. Those previews are not legacy
    // migration debt and must not be reported as such.
    const legacy=Math.max(0,count-archivedPreviewCount(job,slot));
    if(legacy)out.push({slot,count:legacy});
  }
  const passportCount=Array.isArray(job?.passport?.photos)?job.passport.photos.length:0;
  if(passportCount)out.push({slot:"passport",count:passportCount});
  return out;
}
function passportForResearch(passport={}){
  const copy=structuredClone(passport||{});
  delete copy.photos;
  delete copy.invoicePhoto;
  return copy;
}
function mediaExtension(asset={},blob){
  const name=raw(asset.originalName),m=name.match(/\.(jpe?g|png|webp|heic|heif)$/i);
  if(m)return `.${m[1].toLowerCase()==="jpeg"?"jpg":m[1].toLowerCase()}`;
  const type=raw(asset.mimeType||blob?.type).toLowerCase();
  if(type.includes("png"))return ".png";
  if(type.includes("webp"))return ".webp";
  if(type.includes("heic"))return ".heic";
  if(type.includes("heif"))return ".heif";
  return ".jpg";
}
function safePart(v){return raw(v).replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"")||"asset";}
async function temporaryResearchMedia(job,userId,requestId){
  const assets=activeMedia(job);
  if(!assets.length)return [];
  const client=supabaseClient(),bucket=client.storage.from(RESEARCH_MEDIA_BUCKET);
  const expiresAt=new Date(Date.now()+RESEARCH_MEDIA_TTL_SECONDS*1000).toISOString();
  await client.from("calibre_research_media_grants").delete().eq("request_id",requestId);
  return Promise.all(assets.map(async asset=>{
    const blob=await fetchPrivateMedia(asset);
    const key=safePart(asset.id||asset.storageKey.split("/").pop());
    const path=`${userId}/${requestId}/${key}${mediaExtension(asset,blob)}`;
    const mimeType=asset.mimeType||blob.type||"image/jpeg";
    const upload=await bucket.upload(path,blob,{contentType:mimeType,upsert:true,cacheControl:"3600"});
    if(upload.error)throw upload.error;
    const signed=await bucket.createSignedUrl(path,RESEARCH_MEDIA_TTL_SECONDS);
    if(signed.error||!signed.data?.signedUrl)throw signed.error||new Error("Could not create temporary photo link.");
    const grant=await client.from("calibre_research_media_grants").insert({
      owner_id:userId,request_id:requestId,object_path:path,mime_type:mimeType,expires_at:expiresAt,signed_url:signed.data.signedUrl
    }).select("token").single();
    if(grant.error||!grant.data?.token)throw grant.error||new Error("Could not create research media grant.");
    return {
      id:raw(asset.id),category:raw(asset.category),originalName:raw(asset.originalName),mimeType:raw(asset.mimeType),
      caption:raw(asset.caption),evidenceNote:raw(asset.evidenceNote),createdAt:raw(asset.createdAt),isCover:!!asset.isCover,
      temporaryUrl:`${RESEARCH_MEDIA_PROXY}?token=${encodeURIComponent(grant.data.token)}`,
      temporaryExpiresAt:expiresAt,temporaryTransport:"grant-proxy"
    };
  }));
}
export function researchRequestSnapshot(job){
  const p=job?.passport||{},b=job?.business||{};
  return {
    version:3,
    requestedAt:now(),
    watch:{id:job?.id||"",jobId:job?.jobId||"",pushId:job?.pushId||"",watchName:job?.watchName||"",status:job?.status||"",jobType:job?.jobType||"",stage:Number(job?.stage)||0},
    purchase:{source:job?.purchaseSource?.source||p.seller||"",orderId:job?.purchaseSource?.orderId||p.invoiceNumber||"",sourceRef:job?.purchaseSource?.sourceRef||"",purchasePrice:b.purchasePrice||"",postage:b.postage||"",acquiredAt:job?.acquiredAt||""},
    passport:passportForResearch(p),
    business:{purchasePrice:b.purchasePrice||"",postage:b.postage||"",partsCost:b.partsCost||"",targetSale:b.targetSale||"",minSale:b.minSale||""},
    diagnosis:job?.diagnosis||"",
    repairPerformed:job?.repairPerformed||"",
    faults:structuredClone(job?.faults||[]),
    diagnosticFaults:structuredClone(job?.diagnosticFaults||[]),
    parts:structuredClone(job?.parts||[]),
    researchBrief:structuredClone(job?.researchBrief||{}),
    notes:job?.notes||"",
    media:mediaRefs(job),
    mediaAccess:{status:"references-only",expiresAt:"",count:0,ttlHours:12},
    legacyPhotos:legacyPhotoSummary(job),
    requestedWork:[
      "Identify maker, model, approximate era/year and movement/calibre where evidence supports it",
      "Inspect the supplied watch photographs as primary visual evidence",
      "Research manufacturer and model history using credible sources",
      "Assess likely faults and bench checks without inventing measurements",
      "Identify plausible parts leads and compatibility cautions",
      "Estimate conservative resale range and target sale in AUD",
      "Populate Passport, research brief, diagnostics and business valuation fields",
      "Return the enriched record as a calibrejob update for this same watch"
    ],
    privacyNote:"Research photos use random, expiring grant-proxy URLs. They do not expose the private Calibre archive path or raw storage link."
  };
}

async function syncResearchStatus(job,state){
  const s=await session();
  if(!s?.user||s.localOnly||!job?.id)return job?.researchRequest||{};
  const {data,error}=await supabaseClient().from("calibre_research_requests")
    .select("id,status,created_at,updated_at,request_data")
    .eq("owner_id",s.user.id).eq("watch_id",String(job.id))
    .order("created_at",{ascending:false}).limit(1);
  if(error)throw error;
  const latest=data?.[0];
  if(!latest)return job?.researchRequest||{};
  const current=job.researchRequest||{},access=latest.request_data?.mediaAccess||{};
  const next={
    ...current,
    id:latest.id,
    status:latest.status||current.status||"",
    requestedAt:current.requestedAt||latest.created_at||"",
    updatedAt:latest.updated_at||"",
    photoLinks:Number(access.count)||current.photoLinks||0,
    photoLinksExpireAt:access.expiresAt||current.photoLinksExpireAt||""
  };
  if(next.status==="completed")next.completedAt=latest.updated_at||now();
  if(JSON.stringify(current)!==JSON.stringify(next)){
    job.researchRequest=next;
    await saveState(state);
  }
  return next;
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

  let mediaError="";
  try{
    const temp=await temporaryResearchMedia(job,s.user.id,requestId);
    if(temp.length){
      snapshot.media=temp;
      snapshot.mediaAccess={status:"temporary-grant-proxy",count:temp.length,ttlHours:12,expiresAt:temp[0].temporaryExpiresAt};
    }else snapshot.mediaAccess={status:"no-photos",count:0,ttlHours:12,expiresAt:""};
  }catch(err){
    mediaError=err?.message||"Temporary photo sharing failed.";
    snapshot.mediaAccess={status:"failed",count:0,ttlHours:12,expiresAt:"",error:mediaError};
  }
  const saved=await supabaseClient().from("calibre_research_requests").update({request_data:snapshot,updated_at:now()}).eq("id",requestId);
  if(saved.error)throw saved.error;

  job.researchRequest={id:requestId,status:"pending",requestedAt:snapshot.requestedAt,photoRefs:mediaRefs(job).length,photoLinks:snapshot.mediaAccess.count||0,photoLinksExpireAt:snapshot.mediaAccess.expiresAt||"",mediaAccessStatus:snapshot.mediaAccess.status};
  if(state)await saveState(state);
  return {id:requestId,snapshot,mediaError};
}

export async function mountResearchRequestCard(){
  if(document.getElementById("researchRequestCard"))return;
  const sheet=document.getElementById("sheet"),actions=document.querySelector(".footer-actions");
  if(!sheet||!actions)return;
  const state=await loadState(),job=current(state);if(!job)return;
  try{await syncResearchStatus(job,state);}catch(err){console.warn("Could not reconcile research status",err);}
  const card=document.createElement("section");card.id="researchRequestCard";card.className="card no-print";
  sheet.insertAdjacentElement("beforebegin",card);
  function paint(message=""){
    const r=job.researchRequest||{},photos=mediaRefs(job).length,legacy=legacyPhotoSummary(job).reduce((n,x)=>n+x.count,0),pending=r.status==="pending",completed=r.status==="completed";
    const badge=completed?"Completed":pending?"Pending":"Ready";
    const action=completed?"Request new research":pending?"Refresh research request":"Request research";
    const linkText=r.photoLinks?`${r.photoLinks} temporary link${r.photoLinks===1?"":"s"}${r.photoLinksExpireAt?` · expire ${new Date(r.photoLinksExpireAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`:""}`:photos?"Temporary links not generated yet":"No archived photos";
    const statusText=completed?`Completed${r.completedAt?` · ${new Date(r.completedAt).toLocaleString()}`:""}`:pending?`Pending · ${r.requestedAt?new Date(r.requestedAt).toLocaleString():"sent"}`:"";
    card.innerHTML=`<div class="row" style="justify-content:space-between;align-items:start"><div><div class="kicker">RESEARCH HANDOFF</div><h3 style="margin:.2rem 0">Send this watch for research</h3><p class="muted small" style="margin:.2rem 0">Packages the job plus temporary, token-gated photo access so the actual watch images can be inspected during research.</p></div><span class="badge">${badge}</span></div><div class="grid2" style="margin-top:9px"><div><span class="muted small">Archived media</span><strong style="display:block">${photos} file${photos===1?"":"s"}</strong></div><div><span class="muted small">Research photo access</span><strong style="display:block">${esc(linkText)}</strong></div></div>${legacy?`<p class="muted small" style="margin:.45rem 0 0">${legacy} older photo${legacy===1?"":"s"} still need migration to archived media before temporary sharing.</p>`:""}<div class="row" style="margin-top:10px"><button id="sendResearchRequest" class="btn" type="button">${action}</button><span id="researchRequestMsg" class="muted small">${esc(message||statusText)}</span></div>`;
    card.querySelector("#sendResearchRequest").onclick=async()=>{
      const btn=card.querySelector("#sendResearchRequest"),msg=card.querySelector("#researchRequestMsg");btn.disabled=true;msg.textContent=photos?`Sending and preparing ${photos} temporary photo link${photos===1?"":"s"}…`:"Sending…";
      try{
        const result=await submitResearchRequest(job,state);
        if(result.mediaError)paint(`Request ${result.id.slice(0,8)} sent, but photo access failed: ${result.mediaError}`);
        else paint(`Request ${result.id.slice(0,8)} sent with ${result.snapshot.mediaAccess.count||0} temporary photo link${result.snapshot.mediaAccess.count===1?"":"s"}. In ChatGPT, say “research the latest Calibre request”.`);
      }catch(err){btn.disabled=false;msg.textContent=err?.message||"Could not send request.";}
    };
  }
  paint();
  if(new URLSearchParams(location.search).get("research")==="1")card.scrollIntoView({behavior:"smooth",block:"start"});
}

if((location.pathname.split("/").pop()||"").split("?")[0]==="summary.html")mountResearchRequestCard().catch(err=>console.warn("Calibre research request unavailable",err));
