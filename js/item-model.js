export const ITEM_TYPES = [
  ["watch", "Watch"],
  ["clock", "Clock"],
  ["jewellery", "Jewellery"],
  ["accessory", "Accessory"],
  ["collectible", "Collectible"],
  ["other", "Other"]
];

export const ITEM_PURPOSES = [
  ["resale", "Resale"],
  ["personal", "Personal / Collection"],
  ["customer", "Customer"],
  ["donor", "Donor / Spares"],
  ["reference", "Reference"]
];

export const ITEM_STATUSES = [
  "Incoming",
  "Acquired",
  "Researching",
  "Preparing",
  "On bench",
  "Awaiting parts",
  "Ready to list",
  "Listed",
  "Sold",
  "Retained",
  "Archived"
];

export const WORK_TYPES = [
  ["service", "Service"],
  ["repair", "Repair"],
  ["inspection", "Inspection"],
  ["cleaning", "Cleaning / preparation"],
  ["restoration", "Restoration"],
  ["photography", "Photography preparation"],
  ["listing", "Listing preparation"]
];

export const WORK_STATUSES = ["Planned","In progress","Waiting","Complete","Cancelled"];

const now = () => new Date().toISOString();
const id = prefix => `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const text = value => value == null ? "" : String(value);

export function isWatchLike(item) {
  return ["watch", "clock"].includes(item?.type);
}

export function isResaleItem(item) {
  return (item?.purpose || "resale") === "resale";
}

export function blankCommercial(partial = {}) {
  return {
    purchasePrice: "", buyerPremium: "", postage: "", preparationCost: "", repairCost: "", partsCost: "", consumables: "", externalService: "", marketplaceFees: "", shippingToBuyer: "", otherCost: "", labourMinutes: "", labourRate: "", targetSale: "", minSale: "", actualSale: "", source: "", saleChannel: "Not listed", acquiredAt: "", listedAt: "", soldAt: "", ...partial
  };
}

export function blankIdentity(partial = {}) {
  return { maker: "", model: "", title: "", country: "", era: "", year: "", materials: "", marks: "", reference: "", serial: "", dimensions: "", weight: "", notes: "", ...partial };
}

export function blankPreparation(partial = {}) {
  return { cleaning: "", restoration: "", repairs: "", photography: "", listingPrep: "", finalCondition: "", ...partial };
}

export function blankWatchExtension(partial = {}) {
  return { passport: {}, timingHistory: [], serviceHistory: [], movement: {}, publicPassport: { published: false, publicId: "", publishedAt: "" }, ...partial };
}

export function blankWork(partial = {}) {
  const createdAt = partial.createdAt || now();
  const type = WORK_TYPES.some(([key]) => key === partial.type) ? partial.type : "inspection";
  return {
    id: partial.id || id("work"), itemId: text(partial.itemId), number: text(partial.number), type,
    title: partial.title || WORK_TYPES.find(([key])=>key===type)?.[1] || "Work",
    status: WORK_STATUSES.includes(partial.status) ? partial.status : "Planned",
    openedAt: partial.openedAt || createdAt.slice(0,10), completedAt: partial.completedAt || "",
    notes: partial.notes || "", findings: partial.findings || "", workPerformed: partial.workPerformed || "", outcome: partial.outcome || "",
    materials: partial.materials || "", labourMinutes: partial.labourMinutes ?? "", cost: partial.cost ?? "",
    photos: Array.isArray(partial.photos) ? partial.photos : [], tags: Array.isArray(partial.tags) ? partial.tags : [],
    createdAt, updatedAt: partial.updatedAt || createdAt, legacy: !!partial.legacy
  };
}

export function normaliseWork(raw = {}) {
  const work = blankWork(raw);
  work.photos = Array.isArray(raw.photos) ? raw.photos : [];
  work.tags = Array.isArray(raw.tags) ? raw.tags : [];
  return work;
}

export function worksForItem(state = {}, itemId = "") {
  return (Array.isArray(state.workRecords) ? state.workRecords : []).map(normaliseWork).filter(w => String(w.itemId) === String(itemId));
}

export function blankItem(partial = {}) {
  const createdAt = partial.createdAt || now();
  const type = ITEM_TYPES.some(([key]) => key === partial.type) ? partial.type : "other";
  const oldDonorStatus = partial.status === "Donor / spares";
  const requestedPurpose = oldDonorStatus ? "donor" : partial.purpose;
  const purpose = ITEM_PURPOSES.some(([key]) => key === requestedPurpose) ? requestedPurpose : "resale";
  const requestedStatus = oldDonorStatus ? "Retained" : partial.status;
  const item = {
    id: partial.id || id("item"), type, purpose, title: partial.title || "Untitled item",
    status: ITEM_STATUSES.includes(requestedStatus) ? requestedStatus : "Acquired",
    identity: blankIdentity(partial.identity), condition: partial.condition || "",
    research: Array.isArray(partial.research) ? partial.research : [], preparation: blankPreparation(partial.preparation),
    mediaAssets: Array.isArray(partial.mediaAssets) ? partial.mediaAssets : [], commercial: blankCommercial(partial.commercial),
    sale: partial.sale && typeof partial.sale === "object" ? partial.sale : {}, workIds: Array.isArray(partial.workIds) ? partial.workIds : [],
    tags: Array.isArray(partial.tags) ? partial.tags : [], notes: partial.notes || "", legacyJobId: partial.legacyJobId || "",
    createdAt, updatedAt: partial.updatedAt || createdAt
  };
  if (isWatchLike(item)) item.watch = blankWatchExtension(partial.watch);
  return item;
}

export function normaliseItem(raw = {}) {
  const item = blankItem(raw);
  item.identity = blankIdentity(raw.identity); item.commercial = blankCommercial(raw.commercial); item.preparation = blankPreparation(raw.preparation);
  item.research = Array.isArray(raw.research) ? raw.research : []; item.mediaAssets = Array.isArray(raw.mediaAssets) ? raw.mediaAssets : [];
  item.workIds = Array.isArray(raw.workIds) ? raw.workIds : []; item.tags = Array.isArray(raw.tags) ? raw.tags : [];
  if (isWatchLike(item)) item.watch = blankWatchExtension(raw.watch); else delete item.watch;
  return item;
}

function legacyType(job = {}) { return job.jobType === "clock" ? "clock" : "watch"; }
function legacyStatus(job = {}) {
  const map = { Purchased:"Acquired", "Awaiting inspection":"Researching", "On bench":"On bench", "Awaiting parts":"Awaiting parts", "Ready for photos":"Preparing", "Ready to list":"Ready to list", Listed:"Listed", Sold:"Sold", Spares:"Retained" };
  return map[job.status] || "Acquired";
}
function legacyPurpose(job = {}) { return job.status === "Spares" ? "donor" : "resale"; }

export function legacyJobToItem(job = {}) {
  const p=job.passport||{}, b=job.business||{}, type=legacyType(job);
  return blankItem({
    id:job.itemId||`item-${job.id||id("legacy")}`, type, purpose:legacyPurpose(job),
    title:job.watchName||[p.maker,p.model].filter(Boolean).join(" ")||"Untitled watch", status:legacyStatus(job),
    identity:{maker:p.maker||"",model:p.model||"",title:job.watchName||"",country:p.country||"",era:"",year:p.year||"",materials:p.caseMaterial||"",marks:[p.hallmarks,p.engravings].filter(Boolean).join(" · "),reference:p.reference||p.caseNumber||"",serial:p.serial||"",dimensions:[p.width,p.height,p.thickness].filter(Boolean).join(" × "),notes:p.notes||""},
    condition:job.condition||job.stages?.[0]?.condition||"", mediaAssets:Array.isArray(job.mediaAssets)?job.mediaAssets:[],
    commercial:{purchasePrice:b.purchasePrice||"",buyerPremium:b.buyerPremium||"",postage:b.postage||"",preparationCost:[b.strapCost,b.batteryCost].filter(Boolean).join(" + "),repairCost:b.externalService||"",partsCost:b.partsCost||"",consumables:b.consumables||"",externalService:b.externalService||"",marketplaceFees:b.marketplaceFees||"",shippingToBuyer:b.shippingToBuyer||"",otherCost:b.otherCost||"",labourMinutes:b.labourMinutes||"",labourRate:b.labourRate||"",targetSale:b.targetSale||"",minSale:b.minSale||"",actualSale:b.actualSale||"",source:p.auctionHouse||p.seller||"",saleChannel:job.channel||"Not listed",acquiredAt:job.acquiredAt||"",listedAt:job.sale?.listedDate||"",soldAt:job.soldAt||""},
    sale:job.sale||{}, workIds:job.id?[job.id]:[], notes:job.notes||"", legacyJobId:job.id||"", createdAt:job.createdAt, updatedAt:job.updatedAt,
    watch:{passport:p,timingHistory:Array.isArray(job.timingRuns)?job.timingRuns:[],serviceHistory:job.id?[{jobId:job.id,jobNumber:job.jobId||"",status:job.status||""}]:[],movement:{maker:p.movementMaker||"",calibre:p.calibre||"",calibreFamily:p.calibreFamily||"",jewels:p.jewels||"",beatRate:p.beatRate||"",movementType:p.movementType||"",movementMm:p.movementMm||"",escapement:p.escapement||""}}
  });
}

export function legacyJobToWork(job = {}, itemId = "") {
  return normaliseWork({
    id:job.id||id("work"), itemId:itemId||job.itemId||`item-${job.id||id("legacy")}`, number:job.jobId||"",
    type:job.decision==="Regulate only"?"service":job.jobType==="inspect"?"inspection":"service",
    title:job.jobId?`Service ${job.jobId}`:"Watch service", status:job.status==="Sold"?"Complete":job.status||"In progress",
    findings:job.diagnosis||"", workPerformed:job.repairPerformed||"", notes:job.decision||"",
    labourMinutes:job.business?.labourMinutes||"", cost:job.business?.partsCost||"", openedAt:(job.createdAt||"").slice(0,10),
    completedAt:job.status==="Sold"||job.status==="Ready to list"?(job.updatedAt||"").slice(0,10):"", createdAt:job.createdAt, updatedAt:job.updatedAt, legacy:true
  });
}

export function allItems(state = {}) {
  const explicit=(Array.isArray(state.items)?state.items:[]).map(normaliseItem), byLegacyJob=new Set(explicit.map(item=>item.legacyJobId).filter(Boolean)), explicitIds=new Set(explicit.map(item=>String(item.id)));
  const derived=(Array.isArray(state.jobs)?state.jobs:[]).filter(job=>!byLegacyJob.has(job.id)&&!(job.itemId&&explicitIds.has(String(job.itemId)))).map(legacyJobToItem);
  const list=[...explicit,...derived];
  if(typeof location!=="undefined" && /(^|\/)finance\.html$/.test(location.pathname)) return list.filter(isResaleItem);
  return list;
}

export function itemDisplayName(item = {}) { return text(item.title||item.identity?.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(" ")||"Untitled item"); }
