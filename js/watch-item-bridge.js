const SPECIALIST_TYPES=new Set(["watch","clock"]);
const SPECIALIST_PAGES=new Set(["service.html","passport.html","timegrapher.html","business.html","sales.html","summary.html","suppliers.html","documents.html"]);
const ITEM_TO_JOB_STATUS={Incoming:"Purchased",Acquired:"Purchased",Researching:"Awaiting inspection",Preparing:"Ready for photos","On bench":"On bench","Awaiting parts":"Awaiting parts","Ready to list":"Ready to list",Listed:"Listed",Sold:"Sold",Retained:"Spares"};
const JOB_TO_ITEM_STATUS={Purchased:"Acquired","Awaiting inspection":"Researching","On bench":"On bench","Awaiting parts":"Awaiting parts","Ready for photos":"Preparing","Ready to list":"Ready to list",Listed:"Listed",Sold:"Sold",Spares:"Retained"};
const COMMERCIAL_KEYS=["purchasePrice","buyerPremium","postage","partsCost","consumables","externalService","marketplaceFees","shippingToBuyer","otherCost","labourMinutes","labourRate","targetSale","minSale","actualSale"];
const clone=v=>v==null?v:structuredClone(v);
const present=v=>v!==undefined&&v!==null&&String(v).trim()!=="";
const mergeMedia=(a=[],b=[])=>{const map=new Map();for(const x of [...a,...b]){if(!x||typeof x!=="object")continue;const k=String(x.id||x.storageKey||x.checksum||Math.random());map.set(k,{...(map.get(k)||{}),...clone(x)});}return [...map.values()];};

export function isSpecialistItem(item){return SPECIALIST_TYPES.has(item?.type);}
export function isSpecialistPage(page=""){return SPECIALIST_PAGES.has(page);}
export function pageName(){return typeof location==="undefined"?"":(location.pathname.split("/").pop()||"index.html").split("?")[0];}
function ensureWatch(item){item.watch=item.watch&&typeof item.watch==="object"?item.watch:{};item.watch.passport=item.watch.passport&&typeof item.watch.passport==="object"?item.watch.passport:{};item.watch.timingHistory=Array.isArray(item.watch.timingHistory)?item.watch.timingHistory:[];item.watch.serviceHistory=Array.isArray(item.watch.serviceHistory)?item.watch.serviceHistory:[];item.watch.movement=item.watch.movement&&typeof item.watch.movement==="object"?item.watch.movement:{};return item.watch;}
function ensureCommercial(item){item.commercial=item.commercial&&typeof item.commercial==="object"?item.commercial:{};return item.commercial;}
function applyIf(target,key,value){if(present(value))target[key]=value;}

export function syncJobFromItem(job,item){
 if(!job||!isSpecialistItem(item))return job;
 const watch=ensureWatch(item),identity=item.identity||{},c=ensureCommercial(item);
 job.itemId=String(item.id||job.itemId||"");job.specialistItem=true;job.itemSyncAt=item.updatedAt||new Date().toISOString();
 job.watchName=item.title||identity.title||job.watchName||"Untitled watch";
 job.jobType=item.type==="clock"?"clock":(job.jobType&&job.jobType!=="clock"?job.jobType:"manual");
 job.passport={...(job.passport||{}),...(clone(watch.passport)||{})};
 applyIf(job.passport,"maker",identity.maker);applyIf(job.passport,"model",identity.model);applyIf(job.passport,"country",identity.country);applyIf(job.passport,"year",identity.year);applyIf(job.passport,"serial",identity.serial);applyIf(job.passport,"reference",identity.reference);applyIf(job.passport,"caseMaterial",identity.materials);applyIf(job.passport,"hallmarks",identity.marks);applyIf(job.passport,"notes",identity.notes);
 job.business=job.business&&typeof job.business==="object"?job.business:{};COMMERCIAL_KEYS.forEach(k=>{if(c[k]!==undefined&&c[k]!==null&&c[k]!=="")job.business[k]=String(c[k]);});
 if(c.saleChannel&&c.saleChannel!=="Not listed")job.channel=c.saleChannel;
 job.sale=job.sale&&typeof job.sale==="object"?job.sale:{};if(c.listedAt)job.sale.listedDate=c.listedAt;if(c.soldAt)job.soldAt=c.soldAt;
 if(item.status!=="Archived"&&ITEM_TO_JOB_STATUS[item.status])job.status=ITEM_TO_JOB_STATUS[item.status];
 if(Array.isArray(watch.timingHistory)&&watch.timingHistory.length&&(!Array.isArray(job.timingRuns)||job.timingRuns.length===0))job.timingRuns=clone(watch.timingHistory);
 job.mediaAssets=mergeMedia(job.mediaAssets,item.mediaAssets);watch.specialistJobId=job.id;
 return job;
}

export function syncItemFromJob(item,job){
 if(!item||!job||!isSpecialistItem(item))return item;
 const watch=ensureWatch(item),identity=item.identity||(item.identity={}),c=ensureCommercial(item),p=job.passport||{},b=job.business||{};
 item.title=job.watchName||item.title||[p.maker,p.model].filter(Boolean).join(" ")||"Untitled watch";
 applyIf(identity,"maker",p.maker);applyIf(identity,"model",p.model);applyIf(identity,"country",p.country);applyIf(identity,"year",p.year);applyIf(identity,"serial",p.serial);applyIf(identity,"reference",p.reference||p.caseNumber);applyIf(identity,"materials",p.caseMaterial);applyIf(identity,"marks",[p.hallmarks,p.engravings].filter(Boolean).join(" · "));applyIf(identity,"notes",p.notes);
 watch.passport=clone(p);watch.timingHistory=Array.isArray(job.timingRuns)?clone(job.timingRuns):watch.timingHistory;watch.specialistJobId=job.id;
 watch.movement={...(watch.movement||{}),maker:p.movementMaker||watch.movement?.maker||"",calibre:p.calibre||watch.movement?.calibre||"",calibreFamily:p.calibreFamily||watch.movement?.calibreFamily||"",jewels:p.jewels||watch.movement?.jewels||"",beatRate:p.beatRate||watch.movement?.beatRate||"",movementType:p.movementType||watch.movement?.movementType||"",movementMm:p.movementMm||watch.movement?.movementMm||"",escapement:p.escapement||watch.movement?.escapement||""};
 const service={jobId:job.id,jobNumber:job.jobId||"",status:job.status||"",updatedAt:job.updatedAt||new Date().toISOString()};const si=watch.serviceHistory.findIndex(x=>x.jobId===job.id);if(si>=0)watch.serviceHistory[si]={...watch.serviceHistory[si],...service};else watch.serviceHistory.push(service);
 COMMERCIAL_KEYS.forEach(k=>{if(b[k]!==undefined&&b[k]!==null&&b[k]!=="")c[k]=String(b[k]);});if(job.channel)c.saleChannel=job.channel;if(job.sale?.listedDate)c.listedAt=job.sale.listedDate;if(job.soldAt)c.soldAt=job.soldAt;
 if(item.status!=="Archived"&&JOB_TO_ITEM_STATUS[job.status])item.status=JOB_TO_ITEM_STATUS[job.status];if(job.status==="Spares")item.purpose="donor";
 item.mediaAssets=mergeMedia(item.mediaAssets,job.mediaAssets);item.updatedAt=new Date().toISOString();job.itemSyncAt=item.updatedAt;
 return item;
}

export function linkedJob(state,item){if(!state||!item)return null;const jid=item.watch?.specialistJobId;return (state.jobs||[]).find(j=>(jid&&j.id===jid)||(j.itemId&&String(j.itemId)===String(item.id)))||null;}
export function ensureSpecialistJob(state,item,blankJob){if(!state||!Array.isArray(state.jobs)||!isSpecialistItem(item)||typeof blankJob!=="function")return null;let job=linkedJob(state,item);if(!job){const p=item.watch?.passport||{},c=item.commercial||{};job=blankJob({watchName:item.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(" ")||"Untitled watch",jobType:item.type==="clock"?"clock":"manual",status:ITEM_TO_JOB_STATUS[item.status]||"Awaiting inspection",passport:clone(p),business:Object.fromEntries(COMMERCIAL_KEYS.map(k=>[k,c[k]??""]))});job.itemId=String(item.id);job.specialistItem=true;state.jobs.push(job);}syncJobFromItem(job,item);ensureWatch(item).specialistJobId=job.id;state.currentId=job.id;return job;}
export function syncLinkedJobsFromItems(state){if(!state||!Array.isArray(state.items)||!Array.isArray(state.jobs))return state;for(const item of state.items){if(!isSpecialistItem(item))continue;const job=linkedJob(state,item);if(job)syncJobFromItem(job,item);}return state;}
export function syncCurrentJobToItem(state){if(!state||!Array.isArray(state.items)||!Array.isArray(state.jobs))return state;const job=state.jobs.find(j=>j.id===state.currentId);if(!job?.itemId)return state;const item=state.items.find(x=>String(x.id)===String(job.itemId));if(item&&isSpecialistItem(item))syncItemFromJob(item,job);return state;}
export function syncAllLinkedJobsToItems(state){if(!state||!Array.isArray(state.items)||!Array.isArray(state.jobs))return state;for(const job of state.jobs){if(!job?.itemId)continue;const item=state.items.find(x=>String(x.id)===String(job.itemId));if(item&&isSpecialistItem(item))syncItemFromJob(item,job);}return state;}
