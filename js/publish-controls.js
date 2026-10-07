import { loadState,current } from "./store.js?v=26";
import { session,supabaseClient } from "./cloud.js?v=4";

const $=id=>document.getElementById(id);
const slugify=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);
const raw=v=>v==null?"":String(v).trim();
const bool=id=>!!$(id)?.checked;

function safeTiming(job){
  const runs=(job.timingRuns||[]).filter(r=>Number.isFinite(Number(r?.rateSecondsPerDay??r?.rate)));
  if(!runs.length)return null;
  const r=runs[runs.length-1],n=Number(r.rateSecondsPerDay??r.rate);
  return {rateSecondsPerDay:Number(n.toFixed(1)),position:raw(r.position)};
}
function selectedFacts(job){
  const p=job.passport||{},out={};
  if(bool("pubMaker")&&raw(p.maker))out.maker=raw(p.maker);
  if(bool("pubModel")&&raw(p.model))out.model=raw(p.model);
  if(bool("pubYear")&&raw(p.year))out.year=raw(p.year);
  if(bool("pubCalibre")&&raw(p.calibre))out.calibre=raw(p.calibre);
  if(bool("pubJewels")&&raw(p.jewels))out.jewels=raw(p.jewels);
  if(bool("pubCase")){if(raw(p.caseMaterial))out.caseMaterial=raw(p.caseMaterial);if(raw(p.caseStyle))out.caseStyle=raw(p.caseStyle);}
  if(bool("pubDimensions")){if(raw(p.width))out.width=raw(p.width);if(raw(p.length))out.length=raw(p.length);if(raw(p.thickness))out.thickness=raw(p.thickness);}
  if(bool("pubTiming")){const t=safeTiming(job);if(t)out.timing=t;}
  if(bool("pubService")){const service=raw(job.repairPerformed||job.serviceNotes||job.diagnosis);if(service)out.serviceSummary=service;}
  return out;
}
function defaults(job){
  const p=job.passport||{};
  return {
    status:"private",
    slug:slugify([p.maker,p.model,job.jobId].filter(Boolean).join("-"))||slugify(job.watchName)||slugify(job.id),
    title:raw(job.watchName)||[p.maker,p.model].filter(Boolean).join(" ")||"Vintage watch",
    description:raw(job.sale?.shortText||job.sale?.listingText||""),
    price:raw(job.business?.targetSale||""),
    show:{maker:true,model:true,year:true,calibre:true,jewels:true,case:true,dimensions:true,timing:true,service:true}
  };
}

const aside=document.querySelector(".sales-layout aside");
if(aside&&!document.getElementById("publicPublishCard")){
  const card=document.createElement("section");
  card.className="card";
  card.id="publicPublishCard";
  card.innerHTML=`<h3>Public catalogue</h3><p class="muted small">Publish only the details you choose. Private workshop notes, costs and supplier data are never copied into the public record.</p>
  <label>Visibility<select id="pubStatus"><option value="private">Private</option><option value="catalogue">Catalogue</option><option value="for_sale">For sale</option><option value="sold">Sold archive</option></select></label>
  <label>Public title<input id="pubTitle"></label>
  <label>Public URL slug<input id="pubSlug" autocomplete="off"></label>
  <label>Public price<input id="pubPrice" inputmode="decimal" placeholder="Leave blank to hide"></label>
  <label>Public description<textarea id="pubDescription" rows="5"></textarea></label>
  <div class="kicker" style="margin-top:10px">PUBLIC FACTS</div>
  <div class="grid2" style="margin-top:6px">
    <label><input id="pubMaker" type="checkbox"> Maker</label><label><input id="pubModel" type="checkbox"> Model</label>
    <label><input id="pubYear" type="checkbox"> Year</label><label><input id="pubCalibre" type="checkbox"> Calibre</label>
    <label><input id="pubJewels" type="checkbox"> Jewels</label><label><input id="pubCase" type="checkbox"> Case</label>
    <label><input id="pubDimensions" type="checkbox"> Dimensions</label><label><input id="pubTiming" type="checkbox"> Timing</label>
    <label><input id="pubService" type="checkbox"> Service summary</label>
  </div>
  <div class="actionbar"><button class="btn" id="publishWatch" type="button">Save public record</button></div>
  <p id="publishMsg" class="muted small"></p>
  <p class="muted small" id="publicUrlHint"></p>`;
  aside.prepend(card);

  const state=await loadState(),job=current(state),s=await session();
  if(!job||!s?.user){$("publishMsg").textContent="Open a watch and sign in to use publishing.";$("publishWatch").disabled=true;}
  else{
    const d=defaults(job),client=supabaseClient();
    const {data,error}=await client.from("calibre_public_watches").select("status,slug,title,public_data,published_at").eq("owner_id",s.user.id).eq("watch_id",job.id).maybeSingle();
    const row=!error&&data?data:null,pub=row?.public_data||{},show=pub.show||d.show;
    $("pubStatus").value=row?.status||d.status;$("pubSlug").value=row?.slug||d.slug;$("pubTitle").value=row?.title||d.title;$("pubPrice").value=pub.price??d.price;$("pubDescription").value=pub.description??d.description;
    for(const [id,key] of [["pubMaker","maker"],["pubModel","model"],["pubYear","year"],["pubCalibre","calibre"],["pubJewels","jewels"],["pubCase","case"],["pubDimensions","dimensions"],["pubTiming","timing"],["pubService","service"]])$(id).checked=show[key]!==false;
    const refreshHint=()=>{const slug=slugify($("pubSlug").value);$("publicUrlHint").textContent=slug?`Planned public URL: calibreco.com.au/watch/${slug}`:"Add a slug for the public URL.";};
    $("pubSlug").addEventListener("input",refreshHint);refreshHint();
    $("publishWatch").onclick=async()=>{
      const status=$("pubStatus").value,slug=slugify($("pubSlug").value),title=raw($("pubTitle").value);
      if(!slug||!title){$("publishMsg").textContent="Add a public title and URL slug first.";return;}
      $("publishWatch").disabled=true;$("publishMsg").textContent="Saving public record…";
      const show={maker:bool("pubMaker"),model:bool("pubModel"),year:bool("pubYear"),calibre:bool("pubCalibre"),jewels:bool("pubJewels"),case:bool("pubCase"),dimensions:bool("pubDimensions"),timing:bool("pubTiming"),service:bool("pubService")};
      const public_data={schemaVersion:1,description:raw($("pubDescription").value),price:raw($("pubPrice").value),currency:"AUD",availability:status,facts:selectedFacts(job),show};
      const now=new Date().toISOString(),payload={owner_id:s.user.id,watch_id:job.id,slug,status,title,public_data,updated_at:now,published_at:status==="private"?null:(row?.published_at||now)};
      const {error:saveError}=await client.from("calibre_public_watches").upsert(payload,{onConflict:"owner_id,watch_id"});
      if(saveError){$("publishMsg").textContent=saveError.code==="23505"?"That public URL slug is already in use. Choose another.":`Publish save failed: ${saveError.message}`;$("publishWatch").disabled=false;return;}
      $("pubSlug").value=slug;refreshHint();$("publishMsg").textContent=status==="private"?"Saved as private. Nothing is publicly visible.":"Public catalogue record saved.";$("publishWatch").disabled=false;
    };
  }
}
