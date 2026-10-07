import { loadState,saveState,PHOTO_SLOTS } from "./store.js?v=26";
import { privateMediaThumbnailObjectUrl } from "./media.js?v=3";

const $=id=>document.getElementById(id);
const sourceKey=(job,kind,key,index,stageIndex=-1)=>[job.id,kind,key,stageIndex,index].join(":");

function collect(job){
  const out=[];
  for(const [slot,label] of PHOTO_SLOTS){
    const arr=Array.isArray(job?.photos?.[slot])?job.photos[slot]:[];
    arr.forEach((src,i)=>{if(typeof src==="string"&&src.startsWith("data:"))out.push({kind:"slot",slot,label,index:i,key:sourceKey(job,"slot",slot,i),src});});
  }
  (job?.passport?.photos||[]).forEach((src,i)=>{if(typeof src==="string"&&src.startsWith("data:"))out.push({kind:"passport",slot:"photo",label:"Passport",index:i,key:sourceKey(job,"passport","photo",i),src});});
  if(typeof job?.passport?.invoicePhoto==="string"&&job.passport.invoicePhoto.startsWith("data:"))out.push({kind:"invoice",slot:"invoice",label:"Invoice",index:0,key:sourceKey(job,"passport","invoice",0),src:job.passport.invoicePhoto});
  (job?.stages||[]).forEach((stage,si)=>(stage?.photos||[]).forEach((src,i)=>{if(typeof src==="string"&&src.startsWith("data:"))out.push({kind:"stage",slot:stage.name||"stage",label:stage.name||"Workshop",index:i,stageIndex:si,key:sourceKey(job,"stage",stage.name||"stage",i,si),src});}));
  return out;
}
function assetFor(job,key){return (job.mediaAssets||[]).find(a=>a?.legacySourceKey===key&&a?.storageKey&&!a?.deletedAt)||null;}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

const host=$("migrateBtn")?.closest(".panel");
if(host){
  const panel=document.createElement("section");
  panel.className="panel";
  panel.innerHTML=`<h3>Migration audit & clean-up</h3><p>Checks that every remaining embedded legacy photo has a matching private archive record. Verification also loads each archived thumbnail from private storage before clean-up is allowed.</p><div class="facts"><div class="fact"><span>Legacy remaining</span><strong id="auditLegacy">—</strong></div><div class="fact"><span>Matched archive</span><strong id="auditMatched">—</strong></div><div class="fact"><span>Needs attention</span><strong id="auditMissing">—</strong></div><div class="fact"><span>Verified files</span><strong id="auditVerified">—</strong></div></div><div class="actions"><button class="btn secondary" id="auditBtn" type="button">Verify private archive</button><button class="btn secondary" id="cleanLegacyBtn" type="button" disabled>Clean migrated legacy photos</button></div><div class="progress" aria-hidden="true"><i id="auditBar"></i></div><div id="auditStatus" class="status"></div><div id="auditList" class="migration-list"></div><p class="note"><strong>Safe clean-up only:</strong> Calibre removes an embedded photo only when its exact migration key has a live archive record and that private file has just been verified. Anything unmatched is left untouched.</p>`;
  host.insertAdjacentElement("afterend",panel);

  let state=await loadState(),verification=null;
  function snapshot(){
    const rows=[];
    for(const job of (state.jobs||[]))for(const item of collect(job)){const asset=assetFor(job,item.key);rows.push({job,item,asset});}
    return rows;
  }
  function renderBase(){
    const rows=snapshot(),matched=rows.filter(r=>r.asset).length,missing=rows.length-matched;
    $("auditLegacy").textContent=rows.length;$("auditMatched").textContent=matched;$("auditMissing").textContent=missing;$("auditVerified").textContent=verification?verification.ok:"—";
    $("cleanLegacyBtn").disabled=!(verification&&verification.failed===0&&verification.unmatched===0&&verification.ok===rows.length&&rows.length>0);
    if(!rows.length)$("auditStatus").textContent="No embedded legacy photos remain. The database is already clean.";
    else if(missing)$("auditStatus").textContent=`${missing} legacy photo${missing===1?"":"s"} still need a matching private archive record.`;
    else if(!verification)$("auditStatus").textContent=`All ${rows.length} legacy photo${rows.length===1?" has":"s have"} matching archive metadata. Run verification before clean-up.`;
  }
  $("auditBtn").onclick=async()=>{
    state=await loadState();verification=null;renderBase();const rows=snapshot();$("auditList").innerHTML="";
    if(!rows.length)return;
    let ok=0,failed=0,unmatched=0;
    $("auditBtn").disabled=true;$("cleanLegacyBtn").disabled=true;
    for(let i=0;i<rows.length;i++){
      const {job,item,asset}=rows[i];$("auditBar").style.width=`${Math.round(i/rows.length*100)}%`;$("auditStatus").textContent=`Verifying ${i+1} of ${rows.length}…`;
      let status="Verified";
      if(!asset){unmatched++;status="No archive match";}else{
        try{const url=await privateMediaThumbnailObjectUrl(asset);URL.revokeObjectURL(url);ok++;}
        catch(e){failed++;status="File unavailable";}
      }
      const row=document.createElement("div");row.className="migration-row";row.innerHTML=`<span>${esc(job.watchName||job.jobId||"Watch")} · ${esc(item.label)}</span><span>${esc(status)}</span>`;$("auditList").appendChild(row);
    }
    $("auditBar").style.width="100%";verification={ok,failed,unmatched};$("auditBtn").disabled=false;renderBase();
    $("auditStatus").textContent=failed||unmatched?`Verification finished: ${ok} verified, ${unmatched} unmatched, ${failed} unavailable. Nothing has been removed.`:`Verification passed: all ${ok} legacy photos have live private archive copies. Clean-up is now available.`;
  };

  function cleanJob(job,verifiedKeys){
    for(const [slot] of PHOTO_SLOTS){const arr=Array.isArray(job?.photos?.[slot])?job.photos[slot]:[];job.photos[slot]=arr.filter((src,i)=>!verifiedKeys.has(sourceKey(job,"slot",slot,i)));}
    if(job.passport){const arr=Array.isArray(job.passport.photos)?job.passport.photos:[];job.passport.photos=arr.filter((src,i)=>!verifiedKeys.has(sourceKey(job,"passport","photo",i)));if(verifiedKeys.has(sourceKey(job,"passport","invoice",0)))job.passport.invoicePhoto="";}
    (job.stages||[]).forEach((stage,si)=>{const arr=Array.isArray(stage?.photos)?stage.photos:[];stage.photos=arr.filter((src,i)=>!verifiedKeys.has(sourceKey(job,"stage",stage.name||"stage",i,si)));});
  }
  $("cleanLegacyBtn").onclick=async()=>{
    if(!(verification&&verification.failed===0&&verification.unmatched===0))return;
    const rows=snapshot();if(!rows.length)return;
    if(!confirm(`Remove ${rows.length} verified embedded legacy photo${rows.length===1?"":"s"} from the Calibre database?\n\nThe private archive copies will remain. Make sure you have already downloaded a full backup.`))return;
    const keysByJob=new Map();for(const r of rows){if(!r.asset)continue;if(!keysByJob.has(r.job.id))keysByJob.set(r.job.id,new Set());keysByJob.get(r.job.id).add(r.item.key);}
    for(const job of (state.jobs||[])){const keys=keysByJob.get(job.id);if(keys)cleanJob(job,keys);}
    await saveState(state);$("auditStatus").textContent="Legacy embedded photos cleaned. Reloading the lighter database…";setTimeout(()=>location.reload(),700);
  };
  renderBase();
}
