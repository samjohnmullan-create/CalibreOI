const n=v=>Number(v)||0;
const raw=v=>v==null?"":String(v).trim();
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const money=v=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v)||0);

const CHANNELS=[
  {id:"facebook",label:"Facebook Marketplace",channel:"Facebook Marketplace",hint:"Short, conversational and easy to scan."},
  {id:"ebay",label:"eBay",channel:"eBay",hint:"Structured detail, condition and workshop evidence."},
  {id:"site",label:"Calibre & Co. website",channel:"Calibre & Co. website",hint:"Full story, provenance, service history and Watch Passport."}
];

function baseDirect(job){
  const b=job?.business||{};
  return n(b.purchasePrice)+n(b.buyerPremium)+n(b.postage)+n(b.strapCost)+n(b.batteryCost)+n(b.partsCost)+n(b.consumables)+n(b.externalService)+n(b.otherCost);
}
function ensure(job){
  job.sale=job.sale||{};
  const target=n(job.business?.targetSale);
  const s=job.sale.channelStrategy||(job.sale.channelStrategy={});
  CHANNELS.forEach(c=>{
    const x=s[c.id]||(s[c.id]={});
    if(x.ask==null||x.ask==="")x.ask=target?String(target):"";
    if(x.negotiation==null)x.negotiation="0";
    if(x.feePercent==null)x.feePercent="0";
    if(x.shipping==null)x.shipping="0";
  });
  return s;
}
function economics(job,id){
  const s=ensure(job)[id]||{},ask=n(s.ask),neg=n(s.negotiation),feePct=n(s.feePercent),shipping=n(s.shipping);
  const accepted=ask*(1-Math.max(0,neg)/100);
  const fees=accepted*(Math.max(0,feePct)/100);
  const net=accepted-fees-shipping;
  const cost=baseDirect(job);
  const profit=net-cost;
  const roi=cost?profit/cost:0;
  return {ask,neg,feePct,shipping,accepted,fees,net,cost,profit,roi};
}
function finalTiming(job){
  const runs=(job?.timingRuns||[]).filter(r=>Number.isFinite(Number(r?.rateSecondsPerDay??r?.rate)));
  const finals=runs.filter(r=>/^(after service|regulation test|final test)$/i.test(raw(r?.phase)));
  const r=finals.length?finals[finals.length-1]:(runs.length?runs[runs.length-1]:null);
  if(!r)return"";
  const rate=Number(r.rateSecondsPerDay??r.rate),pos=raw(r.position),phase=raw(r.phase);
  return `${rate>=0?"+":""}${rate.toFixed(1)} s/day${pos?` (${pos})`:""}${phase?` · ${phase}`:""}`;
}
function common(job){
  const p=job?.passport||{},condition=raw(job?.stages?.[0]?.condition||job?.condition),repair=raw(job?.repairPerformed),diagnosis=raw(job?.diagnosis),timing=finalTiming(job);
  const name=[p.maker,p.model].filter(Boolean).join(" ")||job?.watchName||"Vintage watch";
  const title=[p.year,p.maker,p.model,p.calibre?`Cal. ${p.calibre}`:""].filter(Boolean).join(" ").replace(/\s+/g," ").trim()||job?.watchName||"Vintage Watch";
  const specs=[];
  if(p.calibre)specs.push(`Calibre: ${p.calibre}`);
  if(p.jewels)specs.push(`Jewels: ${p.jewels}`);
  if(p.caseMaterial||p.caseStyle)specs.push(`Case: ${[p.caseMaterial,p.caseStyle].filter(Boolean).join(", ")}`);
  if(p.width)specs.push(`Case width: ${p.width} mm`); else if(p.diameter)specs.push(`Case diameter: ${p.diameter} mm`);
  if(p.lugWidth)specs.push(`Lug width: ${p.lugWidth} mm`);
  if(p.complications)specs.push(`Functions: ${p.complications}`);
  const history=raw(p.history||p.researchHistory||p.notes);
  return {p,name,title,condition,repair,diagnosis,timing,specs,history};
}
function listing(job,id){
  const c=common(job),e=economics(job,id),price=e.ask?money(e.ask):"";
  if(id==="facebook"){
    const bits=[c.name];
    if(c.condition)bits.push(c.condition);
    if(c.repair)bits.push(`Workshop work: ${c.repair}`); else if(c.diagnosis)bits.push(`Workshop assessment: ${c.diagnosis}`);
    if(c.timing)bits.push(`Final timing: ${c.timing}`);
    if(c.specs.length)bits.push(c.specs.slice(0,4).join(" · "));
    if(price)bits.push(`Asking ${price}.`);
    bits.push("Happy to provide more photos or recorded workshop details to a genuine buyer.");
    return {title:[c.p.maker,c.p.model,c.p.year].filter(Boolean).join(" ")||c.title,full:bits.join("\n\n"),short:[c.name,c.condition,price].filter(Boolean).join(" · ")};
  }
  if(id==="ebay"){
    const sections=[`DESCRIPTION\n${c.name}${c.p.year?` · ${c.p.year}`:""}.`,c.specs.length?`DETAILS\n${c.specs.map(x=>`• ${x}`).join("\n")}`:"",c.condition?`CONDITION\n${c.condition}.`:"",c.repair||c.diagnosis?`WORKSHOP RECORD\n${c.repair||c.diagnosis}`:"",c.timing?`FINAL TIMING\n${c.timing}`:"",c.history?`RESEARCH / HISTORY\n${c.history}`:"","Please review the photographs and recorded details carefully. Vintage-watch identification may include probable or estimated information where specifically noted."];
    return {title:c.title,full:sections.filter(Boolean).join("\n\n"),short:[c.name,c.condition,c.timing].filter(Boolean).join(" · ")};
  }
  const paras=[`${c.name}${c.p.year?` · ${c.p.year}`:""}`,c.history,c.condition?`Condition: ${c.condition}.`:"",c.specs.length?c.specs.join(" · "):"",c.repair?`Workshop record: ${c.repair}`:(c.diagnosis?`Workshop assessment: ${c.diagnosis}`:""),c.timing?`Final recorded timing: ${c.timing}.`:"","This watch is accompanied by its Calibre & Co. workshop record and Watch Passport, preserving the identification, work completed and sale documentation in one place."];
  return {title:c.title,full:paras.filter(Boolean).join("\n\n"),short:[c.name,c.condition,c.timing].filter(Boolean).join(" · ")};
}

export function mountChannelStrategy({job,save}){
  if(!job||document.getElementById("channelStrategy"))return;
  const main=document.querySelector(".sales-layout main");if(!main)return;
  ensure(job);
  const channelSelect=document.getElementById("channel");
  if(channelSelect){
    Array.from(channelSelect.options).filter(o=>o.value==="Auction").forEach(o=>o.remove());
    if(!Array.from(channelSelect.options).some(o=>o.value==="Calibre & Co. website")){
      const o=document.createElement("option");o.textContent=o.value="Calibre & Co. website";channelSelect.appendChild(o);
    }
  }
  const host=document.createElement("section");host.id="channelStrategy";host.className="card channel-strategy";main.insertBefore(host,main.firstChild);
  const style=document.createElement("style");style.textContent=`.channel-strategy{padding:12px}.cs-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.cs-head h3{margin:0}.cs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.cs-card{padding:10px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2)}.cs-card.best{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}.cs-card h4{margin:0;font-size:.78rem}.cs-card p{margin:3px 0 8px;font-size:.62rem;color:var(--muted);line-height:1.35}.cs-fields{display:grid;grid-template-columns:1fr 1fr;gap:6px}.cs-fields label{font-size:.59rem}.cs-fields input{min-width:0}.cs-results{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:8px 0}.cs-results div{padding:6px;border-radius:6px;background:var(--surface)}.cs-results span{display:block;font-size:.54rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.cs-results strong{display:block;margin-top:2px;font-size:.72rem}.cs-use{width:100%;min-height:34px}.cs-note{margin-top:8px;font-size:.61rem;color:var(--muted)}@media(max-width:900px){.cs-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
  let timer=0;
  const bestId=()=>CHANNELS.map(c=>({id:c.id,...economics(job,c.id)})).filter(x=>x.ask>0).sort((a,b)=>b.profit-a.profit)[0]?.id||"";
  function render(){
    const best=bestId(),strategy=ensure(job);
    host.innerHTML=`<div class="cs-head"><div><div class="kicker">CHANNEL STRATEGY</div><h3>Where should this watch sell?</h3><p class="muted small" style="margin:3px 0 0">Compare expected net return using your own fee and negotiation assumptions.</p></div><span class="badge">${best?`${CHANNELS.find(c=>c.id===best)?.label} leads`:"Add prices"}</span></div><div class="cs-grid">${CHANNELS.map(c=>{const x=strategy[c.id],e=economics(job,c.id);return `<div class="cs-card${best===c.id?" best":""}" data-cs-card="${c.id}"><h4>${esc(c.label)}</h4><p>${esc(c.hint)}</p><div class="cs-fields"><label>Asking price<input data-cs="ask" data-id="${c.id}" type="number" step="0.01" value="${esc(x.ask)}"></label><label>Expected negotiation %<input data-cs="negotiation" data-id="${c.id}" type="number" step="0.1" value="${esc(x.negotiation)}"></label><label>Fee %<input data-cs="feePercent" data-id="${c.id}" type="number" step="0.1" value="${esc(x.feePercent)}"></label><label>Shipping cost<input data-cs="shipping" data-id="${c.id}" type="number" step="0.01" value="${esc(x.shipping)}"></label></div><div class="cs-results"><div><span>Expected accepted</span><strong data-cs-out="accepted">${money(e.accepted)}</strong></div><div><span>Net proceeds</span><strong data-cs-out="net">${money(e.net)}</strong></div><div><span>Projected profit</span><strong data-cs-out="profit">${money(e.profit)}</strong></div><div><span>ROI</span><strong data-cs-out="roi">${Math.round(e.roi*100)}%</strong></div></div><button class="btn${best===c.id?"":" secondary"} cs-use" type="button" data-cs-use="${c.id}">Use ${esc(c.label)}</button></div>`;}).join("")}</div><div class="cs-note">Fee % is intentionally user-entered rather than hard-coded. Channel fees can vary; Calibre will only calculate from the assumptions you save.</div>`;
    bind();
  }
  function refreshCard(id){
    const card=host.querySelector(`[data-cs-card="${id}"]`),e=economics(job,id);if(!card)return;
    const vals={accepted:money(e.accepted),net:money(e.net),profit:money(e.profit),roi:`${Math.round(e.roi*100)}%`};Object.entries(vals).forEach(([k,v])=>{const el=card.querySelector(`[data-cs-out="${k}"]`);if(el)el.textContent=v;});
    const best=bestId();host.querySelectorAll(".cs-card").forEach(x=>x.classList.toggle("best",x.dataset.csCard===best));
    const badge=host.querySelector(".cs-head .badge");if(badge)badge.textContent=best?`${CHANNELS.find(c=>c.id===best)?.label} leads`:"Add prices";
  }
  function queueSave(){clearTimeout(timer);timer=setTimeout(()=>save?.(),350);}
  function bind(){
    host.querySelectorAll("[data-cs]").forEach(input=>input.addEventListener("input",()=>{const id=input.dataset.id,key=input.dataset.cs;ensure(job)[id][key]=input.value;refreshCard(id);queueSave();}));
    host.querySelectorAll("[data-cs-use]").forEach(btn=>btn.addEventListener("click",async()=>{
      const id=btn.dataset.csUse,c=CHANNELS.find(x=>x.id===id),g=listing(job,id),e=economics(job,id);
      job.channel=c.channel;job.business=job.business||{};job.business.marketplaceFees=String(Math.round(e.fees*100)/100);job.business.shippingToBuyer=String(Math.round(e.shipping*100)/100);
      job.sale=job.sale||{};job.sale.selectedChannel=id;job.sale.channelListings=job.sale.channelListings||{};job.sale.channelListings[id]={...g,generatedAt:new Date().toISOString(),economics:e};
      const title=document.getElementById("listingTitle"),full=document.getElementById("listingText"),short=document.getElementById("shortText"),fees=document.getElementById("marketplaceFees"),ship=document.getElementById("shippingToBuyer");
      if(title)title.value=g.title;if(full)full.value=g.full;if(short)short.value=g.short;if(channelSelect)channelSelect.value=c.channel;if(fees)fees.value=job.business.marketplaceFees;if(ship)ship.value=job.business.shippingToBuyer;
      await save?.();
      [title,full,short,channelSelect,fees,ship].filter(Boolean).forEach(el=>{el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));});
      const msg=document.getElementById("saveState");if(msg)msg.textContent=`${c.label} listing generated and costs synced`;render();
    }));
  }
  render();
}
