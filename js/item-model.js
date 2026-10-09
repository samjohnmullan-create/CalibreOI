export const ITEM_TYPES = [
  ["watch", "Watch"],
  ["clock", "Clock"],
  ["jewellery", "Jewellery"],
  ["accessory", "Accessory"],
  ["collectible", "Collectible"],
  ["other", "Other"]
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
  "Donor / spares",
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

const now = () => new Date().toISOString();
const id = prefix => `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const text = value => value == null ? "" : String(value);

export function isWatchLike(item) {
  return ["watch", "clock"].includes(item?.type);
}

export function blankCommercial(partial = {}) {
  return {
    purchasePrice: "",
    buyerPremium: "",
    postage: "",
    preparationCost: "",
    repairCost: "",
    partsCost: "",
    consumables: "",
    externalService: "",
    marketplaceFees: "",
    shippingToBuyer: "",
    otherCost: "",
    labourMinutes: "",
    labourRate: "",
    targetSale: "",
    minSale: "",
    actualSale: "",
    source: "",
    saleChannel: "Not listed",
    acquiredAt: "",
    listedAt: "",
    soldAt: "",
    ...partial
  };
}

export function blankIdentity(partial = {}) {
  return {
    maker: "",
    model: "",
    title: "",
    country: "",
    era: "",
    year: "",
    materials: "",
    marks: "",
    reference: "",
    serial: "",
    dimensions: "",
    weight: "",
    notes: "",
    ...partial
  };
}

export function blankPreparation(partial = {}) {
  return {
    cleaning: "",
    restoration: "",
    repairs: "",
    photography: "",
    listingPrep: "",
    finalCondition: "",
    ...partial
  };
}

export function blankWatchExtension(partial = {}) {
  return {
    passport: {},
    timingHistory: [],
    serviceHistory: [],
    movement: {},
    publicPassport: {
      published: false,
      publicId: "",
      publishedAt: ""
    },
    ...partial
  };
}

export function blankItem(partial = {}) {
  const createdAt = partial.createdAt || now();
  const type = ITEM_TYPES.some(([key]) => key === partial.type) ? partial.type : "other";
  const item = {
    id: partial.id || id("item"),
    type,
    title: partial.title || "Untitled item",
    status: ITEM_STATUSES.includes(partial.status) ? partial.status : "Acquired",
    identity: blankIdentity(partial.identity),
    condition: partial.condition || "",
    research: Array.isArray(partial.research) ? partial.research : [],
    preparation: blankPreparation(partial.preparation),
    mediaAssets: Array.isArray(partial.mediaAssets) ? partial.mediaAssets : [],
    commercial: blankCommercial(partial.commercial),
    sale: partial.sale && typeof partial.sale === "object" ? partial.sale : {},
    workIds: Array.isArray(partial.workIds) ? partial.workIds : [],
    tags: Array.isArray(partial.tags) ? partial.tags : [],
    notes: partial.notes || "",
    legacyJobId: partial.legacyJobId || "",
    createdAt,
    updatedAt: partial.updatedAt || createdAt
  };
  if (isWatchLike(item)) item.watch = blankWatchExtension(partial.watch);
  return item;
}

export function normaliseItem(raw = {}) {
  const item = blankItem(raw);
  item.identity = blankIdentity(raw.identity);
  item.commercial = blankCommercial(raw.commercial);
  item.preparation = blankPreparation(raw.preparation);
  item.research = Array.isArray(raw.research) ? raw.research : [];
  item.mediaAssets = Array.isArray(raw.mediaAssets) ? raw.mediaAssets : [];
  item.workIds = Array.isArray(raw.workIds) ? raw.workIds : [];
  item.tags = Array.isArray(raw.tags) ? raw.tags : [];
  if (isWatchLike(item)) item.watch = blankWatchExtension(raw.watch);
  else delete item.watch;
  return item;
}

function legacyType(job = {}) {
  if (job.jobType === "clock") return "clock";
  return "watch";
}

function legacyStatus(job = {}) {
  const map = {
    Purchased: "Acquired",
    "Awaiting inspection": "Researching",
    "On bench": "On bench",
    "Awaiting parts": "Awaiting parts",
    "Ready for photos": "Preparing",
    "Ready to list": "Ready to list",
    Listed: "Listed",
    Sold: "Sold",
    Spares: "Donor / spares"
  };
  return map[job.status] || "Acquired";
}

export function legacyJobToItem(job = {}) {
  const p = job.passport || {};
  const b = job.business || {};
  const type = legacyType(job);
  const item = blankItem({
    id: job.itemId || `item-${job.id || id("legacy")}`,
    type,
    title: job.watchName || [p.maker, p.model].filter(Boolean).join(" ") || "Untitled watch",
    status: legacyStatus(job),
    identity: {
      maker: p.maker || "",
      model: p.model || "",
      title: job.watchName || "",
      country: p.country || "",
      era: "",
      year: p.year || "",
      materials: p.caseMaterial || "",
      marks: [p.hallmarks, p.engravings].filter(Boolean).join(" · "),
      reference: p.reference || p.caseNumber || "",
      serial: p.serial || "",
      dimensions: [p.width, p.height, p.thickness].filter(Boolean).join(" × "),
      notes: p.notes || ""
    },
    condition: job.condition || job.stages?.[0]?.condition || "",
    mediaAssets: Array.isArray(job.mediaAssets) ? job.mediaAssets : [],
    commercial: {
      purchasePrice: b.purchasePrice || "",
      buyerPremium: b.buyerPremium || "",
      postage: b.postage || "",
      preparationCost: [b.strapCost, b.batteryCost].filter(Boolean).join(" + "),
      repairCost: b.externalService || "",
      partsCost: b.partsCost || "",
      consumables: b.consumables || "",
      externalService: b.externalService || "",
      marketplaceFees: b.marketplaceFees || "",
      shippingToBuyer: b.shippingToBuyer || "",
      otherCost: b.otherCost || "",
      labourMinutes: b.labourMinutes || "",
      labourRate: b.labourRate || "",
      targetSale: b.targetSale || "",
      minSale: b.minSale || "",
      actualSale: b.actualSale || "",
      source: p.auctionHouse || p.seller || "",
      saleChannel: job.channel || "Not listed",
      acquiredAt: job.acquiredAt || "",
      listedAt: job.sale?.listedDate || "",
      soldAt: job.soldAt || ""
    },
    sale: job.sale || {},
    workIds: job.id ? [job.id] : [],
    notes: job.notes || "",
    legacyJobId: job.id || "",
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    watch: {
      passport: p,
      timingHistory: Array.isArray(job.timingRuns) ? job.timingRuns : [],
      serviceHistory: job.id ? [{ jobId: job.id, jobNumber: job.jobId || "", status: job.status || "" }] : [],
      movement: {
        maker: p.movementMaker || "",
        calibre: p.calibre || "",
        calibreFamily: p.calibreFamily || "",
        jewels: p.jewels || "",
        beatRate: p.beatRate || "",
        movementType: p.movementType || "",
        movementMm: p.movementMm || "",
        escapement: p.escapement || ""
      }
    }
  });
  return item;
}

export function legacyJobToWork(job = {}, itemId = "") {
  return {
    id: job.id || id("work"),
    itemId: itemId || job.itemId || `item-${job.id || id("legacy")}`,
    number: job.jobId || "",
    type: job.decision === "Regulate only" ? "service" : job.jobType === "inspect" ? "inspection" : "service",
    status: job.status || "On bench",
    diagnosis: job.diagnosis || "",
    faults: Array.isArray(job.faults) ? job.faults : [],
    diagnosticFaults: Array.isArray(job.diagnosticFaults) ? job.diagnosticFaults : [],
    stages: Array.isArray(job.stages) ? job.stages : [],
    parts: Array.isArray(job.parts) ? job.parts : [],
    labour: job.labour || {},
    timingRuns: Array.isArray(job.timingRuns) ? job.timingRuns : [],
    repairPerformed: job.repairPerformed || "",
    decision: job.decision || "",
    createdAt: job.createdAt || now(),
    updatedAt: job.updatedAt || job.createdAt || now(),
    legacy: true
  };
}

export function allItems(state = {}) {
  const explicit = (Array.isArray(state.items) ? state.items : []).map(normaliseItem);
  const byLegacyJob = new Set(explicit.map(item => item.legacyJobId).filter(Boolean));
  const derived = (Array.isArray(state.jobs) ? state.jobs : [])
    .filter(job => !byLegacyJob.has(job.id))
    .map(legacyJobToItem);
  return [...explicit, ...derived];
}

export function itemDisplayName(item = {}) {
  return text(item.title || item.identity?.title || [item.identity?.maker, item.identity?.model].filter(Boolean).join(" ") || "Untitled item");
}
