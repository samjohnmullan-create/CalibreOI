const ROLES=[
  ["front","Front / dial"],
  ["movement","Movement"],
  ["caseback","Caseback"],
  ["side","Side / crown"],
  ["scale","Scale / wrist"],
  ["detail","Detail"]
];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const raw=v=>v==null?"":String(v).trim();
const title=s=>String(s||"").replace(/[-_]/g," ").replace(/\b\w/g,c=>c.toUpperCase());

function candidates(job){
  const out=[];
  Object.entries(job?.photos||{}).forEach(([group,arr])=>{
    if(!Array.isArray(arr))return;
    arr.forEach((src,i)=>{if(src)out.push({key:`photo:${group}:${i}`,src,label:title(group)||"Photo"});});
  });
  (job?.stages||[]).forEach((stage,si)=>{
    (Array.isArray(stage?.photos)?stage.photos:[]).forEach((src,pi)=>{if(src)out.push({key:`stage:${si}:${pi}`,src,label:stage?.name||`Stage ${si+1}`});});
  });
  return out;
}
function ensurePack(job){
  job.sale=job.sale||{};
  const p=job.sale.photoPack||(job.sale.photoPack={hero:"",selected:[],roles:{}});
  if(!Array.isArray(p.selected))p.selected=[];
  if(!p.roles||typeof p.roles!=="object")p.roles={};
  return p;
}
function finalTiming(job){
  const runs=(job?.timingRuns||[]).filter(r=>Number.isFinite(Number(r?.rateSecondsPerDay??r?.rate)));
  const final=runs.filter(r=>/^(after service|regulation test|final test)$/i.test(raw(r?.phase)));
  return final.length?final[final.length-1]:(runs.length?runs[runs.length-1]:null);
}
export function makeListingPackSnapshot(job){
  const p=job?.passport||{},b=job?.business||{},pack=ensurePack(job),timing=finalTiming(job);
  return {
    at:new Date().toISOString(),
    identity:{watchName:job?.watchName||"",maker:p.maker||"",model:p.model||"",year:p.year||"",calibre:p.calibre||"",jewels:p.jewels||"",movementMaker:p.movementMaker||"",caseMaterial:p.caseMaterial||"",caseStyle:p.caseStyle||"",serial:p.serial||p.caseNumber||"",width:p.width||"",diameter:p.diameter||"",thickness:p.thickness||"",lugWidth:p.lugWidth||""},
    condition:job?.stages?.[0]?.condition||job?.condition||"",
    diagnosis:job?.diagnosis||"",
    repairPerformed:job?.repairPerformed||"",
    timing:timing?{rateSecondsPerDay:timing.rateSecondsPerDay??timing.rate??"",beatError:timing.beatError??"",position:timing.position||"",phase:timing.phase||"",at:timing.at||timing.createdAt||""}:null,
    targetSale:b.targetSale||"",
    minimumSale:b.minSale||"",
    photos:{hero:pack.hero||"",selected:[...pack.selected],roles:{...pack.roles}}
  };
}

export function listingPackStatus(job){
  const list=candidates(job),valid=new Set(list.map(x=>x.key)),pack=ensurePack(job);
  pack.selected=pack.selected.filter(k=>valid.has(k));
  if(pack.hero&&!valid.has(pack.hero))pack.hero="";
  Object.keys(pack.roles).forEach(r=>{if(!valid.has(pack.roles[r]))delete pack.roles[r];});
  const selected=pack.selected.length,hero=!!pack.hero,front=!!pack.roles.front;
  const complete=hero&&selected>=3;
  return {complete,hero,selected,total:list.length,front,pack,list,recommendedMissing:[!front?"front/dial":null,!pack.roles.movement?"movement":null,!pack.roles.caseback?"caseback":null].filter(Boolean)};
}

export function mountListingPack({job,save}){
  if(!job)return;
  const main=document.querySelector(".sales-layout main");
  if(!main||document.getElementById("listingPack"))return;
  const host=document.createElement("section");
  host.id="listingPack";host.className="card listing-pack";
  main.insertBefore(host,main.firstChild);

  const style=document.createElement("style");
  style.textContent=`.listing-pack{padding:12px}.lp-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.lp-head h3{margin:0}.lp-summary{font-size:.66rem;color:var(--muted);margin-top:3px}.lp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;margin-top:10px}.lp-photo{position:relative;border:1px solid var(--line);border-radius:9px;overflow:hidden;background:var(--surface-2)}.lp-photo img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}.lp-photo.selected{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}.lp-photo.hero:after{content:"HERO";position:absolute;top:6px;left:6px;padding:3px 5px;border-radius:5px;background:rgba(0,0,0,.72);color:#fff;font-size:.54rem;font-weight:900;letter-spacing:.05em}.lp-photo-meta{padding:6px}.lp-photo-meta small{display:block;color:var(--muted);font-size:.57rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lp-actions{display:flex;gap:4px;margin-top:5px}.lp-actions button{flex:1;min-height:28px;padding:4px;border:1px solid var(--line);border-radius:5px;background:var(--surface);color:var(--ink);font-size:.58rem;font-weight:800}.lp-roles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}.lp-roles label{font-size:.62rem}.lp-roles select{min-width:0}.lp-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid var(--line)}@media(max-width:700px){.lp-roles{grid-template-columns:1fr 1fr}.lp-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}`;
  document.head.appendChild(style);

  function optionList(list,current){return `<option value="">Not assigned</option>`+list.map((x,i)=>`<option value="${esc(x.key)}"${x.key===current?" selected":""}>${esc(`${i+1}. ${x.label}`)}</option>`).join("");}
  async function persist(msg){await save?.();const note=host.querySelector("[data-lp-note]");if(note)note.textContent=msg||"Saved";}
  function paint(){
    const s=listingPackStatus(job),p=s.pack;
    host.innerHTML=`<div class="lp-head"><div><div class="kicker">LISTING PACK</div><h3>Sale photos & handoff</h3><div class="lp-summary">${s.selected} selected · ${s.total} available · ${s.hero?"hero chosen":"choose a hero"}</div></div><span class="badge">${s.complete?"Photo set ready":"Needs photos"}</span></div>${s.list.length?`<div class="lp-grid">${s.list.map(x=>`<div class="lp-photo${p.selected.includes(x.key)?" selected":""}${p.hero===x.key?" hero":""}" data-key="${esc(x.key)}"><img src="${x.src}" alt=""><div class="lp-photo-meta"><small>${esc(x.label)}</small><div class="lp-actions"><button type="button" data-lp-select="${esc(x.key)}">${p.selected.includes(x.key)?"Remove":"Select"}</button><button type="button" data-lp-hero="${esc(x.key)}">Hero</button></div></div></div>`).join("")}</div>`:`<p class="muted small">No photos are recorded yet. Add workshop or Identity photos first.</p>`}<div class="lp-roles">${ROLES.map(([id,label])=>`<label>${esc(label)}<select data-lp-role="${id}">${optionList(s.list,p.roles[id]||"")}</select></label>`).join("")}</div><div class="lp-foot"><div><strong style="font-size:.7rem">Recommended</strong><div class="muted small">${s.recommendedMissing.length?`Still useful: ${esc(s.recommendedMissing.join(" · "))}`:"Core views assigned"}</div><div class="muted small" data-lp-note>${job.sale?.listingPackSnapshot?.at?`Snapshot saved ${new Date(job.sale.listingPackSnapshot.at).toLocaleString("en-AU")}`:"No listing snapshot yet"}</div></div><button type="button" class="btn secondary" id="saveListingPack">Save listing snapshot</button></div>`;
    host.querySelectorAll("[data-lp-select]").forEach(btn=>btn.onclick=async()=>{const key=btn.dataset.lpSelect,pack=ensurePack(job),i=pack.selected.indexOf(key);if(i>=0)pack.selected.splice(i,1);else pack.selected.push(key);if(pack.hero===key&&!pack.selected.includes(key))pack.hero="";await persist("Photo selection saved");paint();});
    host.querySelectorAll("[data-lp-hero]").forEach(btn=>btn.onclick=async()=>{const key=btn.dataset.lpHero,pack=ensurePack(job);pack.hero=key;if(!pack.selected.includes(key))pack.selected.unshift(key);await persist("Hero photo saved");paint();});
    host.querySelectorAll("[data-lp-role]").forEach(sel=>sel.onchange=async()=>{const pack=ensurePack(job),role=sel.dataset.lpRole;if(sel.value){pack.roles[role]=sel.value;if(!pack.selected.includes(sel.value))pack.selected.push(sel.value);}else delete pack.roles[role];await persist("Photo role saved");paint();});
    host.querySelector("#saveListingPack")?.addEventListener("click",async()=>{job.sale=job.sale||{};job.sale.listingPackSnapshot=makeListingPackSnapshot(job);await persist("Listing snapshot saved");paint();});
  }
  paint();
}
