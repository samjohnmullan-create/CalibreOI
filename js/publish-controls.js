const $=id=>document.getElementById(id);
const slugify=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);
const raw=v=>v==null?"":String(v).trim();
const bool=id=>!!$(id)?.checked;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const PUBLIC_BUCKET="calibre-public-media";
const publicPreviewUrl=slug=>`${location.origin}/public-site/watch.html?slug=${encodeURIComponent(slug)}`;
const canonicalPublicUrl=slug=>`https://calibreco.com.au/watch/${encodeURIComponent(slug)}`;

function installStyles(){
  if(document.getElementById("publishControlsStyles"))return;
  const style=document.createElement("style");
  style.id="publishControlsStyles";
  style.textContent=`
  #publicPublishCard{margin-bottom:12px}
  .pub-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:7px}
  .pub-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2);font-size:.78rem;font-weight:700;color:var(--ink);cursor:pointer}
  .pub-toggle input{position:absolute;opacity:0;pointer-events:none}
  .pub-switch{width:34px;height:20px;border-radius:999px;background:var(--line);position:relative;flex:0 0 auto;transition:.15s ease}
  .pub-switch:after{content:"";position:absolute;width:14px;height:14px;left:3px;top:3px;border-radius:50%;background:var(--surface);box-shadow:0 1px 3px rgba(0,0,0,.18);transition:.15s ease}
  .pub-toggle input:checked+.pub-switch{background:var(--accent)}
  .pub-toggle input:checked+.pub-switch:after{transform:translateX(14px)}
  .pub-photo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px}
  .pub-photo{position:relative;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--surface-2);min-width:0}
  .pub-photo img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:var(--surface-2)}
  .pub-photo-meta{padding:7px;font-size:.66rem;color:var(--muted);line-height:1.3;min-height:48px}
  .pub-photo-meta strong{display:block;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.68rem}
  .pub-photo-controls{display:flex;gap:5px;padding:0 7px 7px}
  .pub-photo-controls label{margin:0;display:flex;align-items:center;gap:4px;font-size:.65rem;color:var(--muted)}
  .pub-photo-controls input{width:16px!important;height:16px!important;margin:0!important;accent-color:var(--accent)}
  .pub-photo.unavailable img{opacity:.35}
  .pub-tools{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
  .pub-tools[hidden]{display:none}
  .pub-qr-wrap{margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);display:flex;gap:14px;align-items:center;flex-wrap:wrap}
  .pub-qr-wrap[hidden]{display:none}
  #pubQrCanvas{background:#fff;padding:8px;border-radius:8px;width:180px;height:180px}
  .pub-qr-copy{min-width:0;flex:1}.pub-qr-copy strong{display:block;margin-bottom:4px}.pub-qr-copy code{display:block;overflow-wrap:anywhere;font-size:.68rem;color:var(--muted)}
  @media(max-width:760px){.pub-fields{grid-template-columns:1fr 1fr}.pub-photo-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media(max-width:520px){.pub-fields{grid-template-columns:1fr}.pub-photo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pub-tools .btn{flex:1 1 auto}#pubQrCanvas{width:150px;height:150px}}
  `;
  document.head.appendChild(style);
}

function toggle(id,label){return `<label class="pub-toggle"><span>${label}</span><input id="${id}" type="checkbox"><span class="pub-switch" aria-hidden="true"></span></label>`;}

function renderCard(){
  installStyles();
  const layout=document.querySelector(".sales-layout");
  if(!layout)return null;
  let card=document.getElementById("publicPublishCard");
  if(card)return card;
  card=document.createElement("section");
  card.className="card";
  card.id="publicPublishCard";
  card.innerHTML=`<h3>Public catalogue</h3><p class="muted small">Publish only the details and photographs you choose. Private workshop notes, costs and supplier data are never copied into the public record.</p>
  <div class="grid2"><label>Visibility<select id="pubStatus"><option value="private">Private</option><option value="catalogue">Catalogue</option><option value="for_sale">For sale</option><option value="sold">Sold archive</option></select></label><label>Public price<input id="pubPrice" inputmode="decimal" placeholder="Leave blank to hide"></label></div>
  <label>Public title<input id="pubTitle"></label>
  <label>Public URL slug<input id="pubSlug" autocomplete="off"></label>
  <label>Public description<textarea id="pubDescription" rows="5"></textarea></label>
  <div class="kicker" style="margin-top:12px">PUBLIC FACTS</div>
  <div class="pub-fields">
    ${toggle("pubMaker","Maker")}${toggle("pubModel","Model")}${toggle("pubYear","Year")}${toggle("pubCalibre","Calibre")}${toggle("pubJewels","Jewels")}${toggle("pubCase","Case")}${toggle("pubDimensions","Dimensions")}${toggle("pubTiming","Timing")}${toggle("pubService","Service summary")}
  </div>
  <div class="kicker" style="margin-top:14px">PUBLIC PHOTOS</div>
  <p class="muted small" style="margin:.35rem 0">Choose the photographs that can leave the private archive. Pick one selected photo as the catalogue cover.</p>
  <div id="pubPhotoGrid" class="pub-photo-grid"><p class="muted small">Loading archive photos…</p></div>
  <div class="actionbar"><button class="btn" id="publishWatch" type="button" disabled>Save public record</button></div>
  <div id="pubTools" class="pub-tools" hidden>
    <button class="btn secondary" id="openPublicPage" type="button">Open public preview</button>
    <button class="btn secondary" id="copyPublicLink" type="button">Copy public link</button>
    <button class="btn secondary" id="showPublicQr" type="button">QR code</button>
  </div>
  <div id="pubQrWrap" class="pub-qr-wrap" hidden><canvas id="pubQrCanvas" width="180" height="180"></canvas><div class="pub-qr-copy"><strong>Watch Passport QR</strong><code id="pubQrUrl"></code><p class="muted small" style="margin:.45rem 0 0">This currently opens the live public preview. When calibreco.com.au is connected, we can switch the QR to the permanent catalogue URL.</p></div></div>
  <p id="publishMsg" class="muted small">Loading publishing controls…</p>
  <p class="muted small" id="publicUrlHint"></p>`;
  layout.insertAdjacentElement("beforebegin",card);
  return card;
}

function extensionFor(asset,blob){
  const name=raw(asset?.originalName),m=name.match(/\.([a-z0-9]{2,5})$/i);
  if(m)return m[1].toLowerCase();
  const type=raw(asset?.mimeType||blob?.type).toLowerCase();
  if(type.includes("png"))return "png";
  if(type.includes("webp"))return "webp";
  return "jpg";
}

async function renderQr(url){
  const canvas=$("pubQrCanvas");
  if(!canvas)return;
  const QR=await import("https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm");
  await QR.toCanvas(canvas,url,{width:180,margin:1,errorCorrectionLevel:"M",color:{dark:"#151815",light:"#ffffff"}});
}

const card=renderCard();
if(!card){
  console.warn("Calibre public catalogue controls: Sale layout not found.");
}else{
  try{
    const [{loadState,current},{session,supabaseClient},{privateMediaThumbnailObjectUrl,fetchPrivateMedia}]=await Promise.all([
      import("./store.js?v=26"),
      import("./cloud.js?v=4"),
      import("./media.js?v=3")
    ]);

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

    const state=await loadState(),job=current(state),s=await session();
    if(!job||!s?.user){
      $("publishMsg").textContent="Open a watch and sign in to use publishing.";
    }else{
      const d=defaults(job),client=supabaseClient();
      const {data,error}=await client.from("calibre_public_watches").select("status,slug,title,public_data,published_at").eq("owner_id",s.user.id).eq("watch_id",job.id).maybeSingle();
      let row=!error&&data?data:null,pub=row?.public_data||{},show=pub.show||d.show;
      let publishedImages=Array.isArray(pub.images)?pub.images:[];
      $("pubStatus").value=row?.status||d.status;
      $("pubSlug").value=row?.slug||d.slug;
      $("pubTitle").value=row?.title||d.title;
      $("pubPrice").value=pub.price??d.price;
      $("pubDescription").value=pub.description??d.description;
      for(const [id,key] of [["pubMaker","maker"],["pubModel","model"],["pubYear","year"],["pubCalibre","calibre"],["pubJewels","jewels"],["pubCase","case"],["pubDimensions","dimensions"],["pubTiming","timing"],["pubService","service"]])$(id).checked=show[key]!==false;
      const refreshHint=()=>{const slug=slugify($("pubSlug").value);$("publicUrlHint").textContent=slug?`Planned permanent URL: ${canonicalPublicUrl(slug)}`:"Add a slug for the public URL.";};
      const refreshPublicTools=()=>{const status=$("pubStatus").value,slug=slugify($("pubSlug").value),published=status!=="private"&&!!slug;$("pubTools").hidden=!published;if(!published)$("pubQrWrap").hidden=true;return slug;};
      $("pubSlug").addEventListener("input",()=>{refreshHint();refreshPublicTools();});
      $("pubStatus").addEventListener("change",refreshPublicTools);
      refreshHint();refreshPublicTools();

      $("openPublicPage").onclick=()=>{const slug=refreshPublicTools();if(slug)window.open(publicPreviewUrl(slug),"_blank","noopener");};
      $("copyPublicLink").onclick=async()=>{const slug=refreshPublicTools();if(!slug)return;try{await navigator.clipboard.writeText(publicPreviewUrl(slug));$("publishMsg").textContent="Public preview link copied.";}catch{$("publishMsg").textContent="Could not copy the public link.";}};
      $("showPublicQr").onclick=async()=>{const slug=refreshPublicTools();if(!slug)return;const wrap=$("pubQrWrap"),url=publicPreviewUrl(slug);wrap.hidden=false;$("pubQrUrl").textContent=url;$("publishMsg").textContent="Generating QR code…";try{await renderQr(url);$("publishMsg").textContent="QR code ready.";}catch(err){console.error("QR generation failed",err);$("publishMsg").textContent="Could not generate the QR code.";}};

      const liveAssets=(job.mediaAssets||[]).filter(a=>!a?.deletedAt&&a?.storageKey&&String(a?.mimeType||"").startsWith("image/"));
      const grid=$("pubPhotoGrid");
      if(!liveAssets.length){
        grid.innerHTML='<p class="muted small">No archived photographs are available for this watch yet.</p>';
      }else{
        grid.innerHTML=liveAssets.map(a=>{const old=publishedImages.find(x=>x?.sourceId===a.id),checked=!!old,cover=old?.role==="cover";return `<article class="pub-photo" data-media-id="${esc(a.id)}"><div class="pub-photo-img" data-thumb-for="${esc(a.id)}"></div><div class="pub-photo-meta"><strong>${esc(a.caption||a.originalName||a.category||"Photo")}</strong>${esc(a.category||"")}</div><div class="pub-photo-controls"><label><input class="pub-photo-select" type="checkbox" value="${esc(a.id)}" ${checked?"checked":""}> Public</label><label><input class="pub-photo-cover" type="radio" name="pubCover" value="${esc(a.id)}" ${cover?"checked":""} ${checked?"":"disabled"}> Cover</label></div></article>`;}).join("");
        grid.querySelectorAll(".pub-photo-select").forEach(cb=>cb.addEventListener("change",()=>{const photoCard=cb.closest(".pub-photo"),radio=photoCard.querySelector(".pub-photo-cover");radio.disabled=!cb.checked;if(!cb.checked&&radio.checked)radio.checked=false;if(cb.checked&&!grid.querySelector(".pub-photo-cover:checked"))radio.checked=true;}));
        for(const asset of liveAssets){
          const host=grid.querySelector(`[data-thumb-for="${CSS.escape(asset.id)}"]`);
          if(!host)continue;
          try{const url=await privateMediaThumbnailObjectUrl(asset);host.innerHTML=`<img src="${url}" alt="">`;}
          catch{host.innerHTML='<div style="aspect-ratio:1/1;display:grid;place-items:center;color:var(--muted);font-size:.65rem">Preview unavailable</div>';host.closest(".pub-photo")?.classList.add("unavailable");}
        }
      }

      $("publishWatch").disabled=false;
      $("publishMsg").textContent=row?"Public record loaded.":"Ready to publish.";
      $("publishWatch").onclick=async()=>{
        const status=$("pubStatus").value,slug=slugify($("pubSlug").value),title=raw($("pubTitle").value);
        if(!slug||!title){$("publishMsg").textContent="Add a public title and URL slug first.";return;}
        $("publishWatch").disabled=true;$("publishMsg").textContent="Preparing public record…";
        try{
          const show={maker:bool("pubMaker"),model:bool("pubModel"),year:bool("pubYear"),calibre:bool("pubCalibre"),jewels:bool("pubJewels"),case:bool("pubCase"),dimensions:bool("pubDimensions"),timing:bool("pubTiming"),service:bool("pubService")};
          const chosen=[...document.querySelectorAll(".pub-photo-select:checked")].map(x=>x.value);
          const coverId=document.querySelector(".pub-photo-cover:checked")?.value||chosen[0]||"";
          let nextImages=[];
          if(status!=="private"){
            for(let i=0;i<chosen.length;i++){
              const sourceId=chosen[i],asset=liveAssets.find(a=>a.id===sourceId);
              if(!asset)continue;
              const existing=publishedImages.find(x=>x?.sourceId===sourceId&&x?.path&&x?.url);
              if(existing){nextImages.push({...existing,role:sourceId===coverId?"cover":"gallery",order:i,caption:raw(asset.caption)});continue;}
              $("publishMsg").textContent=`Publishing photo ${i+1} of ${chosen.length}…`;
              const blob=await fetchPrivateMedia(asset),ext=extensionFor(asset,blob),path=`${s.user.id}/${job.id}/${crypto.randomUUID()}.${ext}`;
              const {error:uploadError}=await client.storage.from(PUBLIC_BUCKET).upload(path,blob,{contentType:asset.mimeType||blob.type||"image/jpeg",upsert:false,cacheControl:"3600"});
              if(uploadError)throw uploadError;
              const {data:urlData}=client.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
              nextImages.push({sourceId,path,url:urlData.publicUrl,role:sourceId===coverId?"cover":"gallery",order:i,caption:raw(asset.caption),mimeType:raw(asset.mimeType)});
            }
          }
          const keep=new Set(nextImages.map(x=>x.path));
          const removePaths=publishedImages.map(x=>x?.path).filter(Boolean).filter(path=>!keep.has(path));
          if(removePaths.length){const {error:removeError}=await client.storage.from(PUBLIC_BUCKET).remove(removePaths);if(removeError)console.warn("Could not remove old public media",removeError);}
          const public_data={schemaVersion:2,description:raw($("pubDescription").value),price:raw($("pubPrice").value),currency:"AUD",availability:status,facts:selectedFacts(job),show,images:nextImages};
          const now=new Date().toISOString(),payload={owner_id:s.user.id,watch_id:job.id,slug,status,title,public_data,updated_at:now,published_at:status==="private"?null:(row?.published_at||now)};
          const {error:saveError}=await client.from("calibre_public_watches").upsert(payload,{onConflict:"owner_id,watch_id"});
          if(saveError)throw saveError;
          publishedImages=nextImages;row={...(row||{}),...payload};
          $("pubSlug").value=slug;refreshHint();refreshPublicTools();
          $("publishMsg").textContent=status==="private"?"Saved as private. Public photos were removed.":`Public catalogue record saved${nextImages.length?` with ${nextImages.length} photo${nextImages.length===1?"":"s"}`:""}.`;
        }catch(err){
          console.error("Public publish failed",err);
          $("publishMsg").textContent=err?.code==="23505"?"That public URL slug is already in use. Choose another.":`Publish failed: ${err?.message||"Unknown error"}`;
        }finally{$("publishWatch").disabled=false;}
      };
    }
  }catch(err){
    console.error("Calibre public catalogue controls failed",err);
    $("publishMsg").textContent="Publishing controls loaded, but data connection failed. Reopen the Sale page and try again.";
  }
}
