export const SPARE_PARTS = [
  { id:"movement", name:"Movement", rule:"Same calibre only, unless you have already tried this movement and written that it fits. The name on the dial is the seller, not the maker of the parts." },
  { id:"mainspring", name:"Mainspring", rule:"Height, strength and length, and the end: hole, tongue or T. A white-alloy spring is not a blued spring. Another maker is fine if those four agree." },
  { id:"barrel", name:"Barrel", rule:"Same calibre, or the same inside diameter, arbor and cover snap. Measure the barrel. Do not go by the brand." },
  { id:"balance", name:"Balance", rule:"Same calibre. A balance from another maker brings a different staff, spring and roller." },
  { id:"staff", name:"Staff", rule:"Same calibre, or you have measured both pivots, the balance seat, the collet and the length. Jewel count does not pick a staff." },
  { id:"pallet", name:"Pallet fork", rule:"Same calibre. Matching jewel counts do not mean the stone span matches." },
  { id:"escape", name:"Escape wheel", rule:"Same calibre. Tooth count and pinion leaves have to be that wheel, not a similar one." },
  { id:"train", name:"Train", rule:"Same calibre. The wheels and pinions are a set. One wheel the right size is not the train." },
  { id:"stem", name:"Stem", rule:"Thread and length. Two Swiss makers of the same size sometimes share a stem. Try the thread in the pendant. Do not assume it." },
  { id:"crown", name:"Crown", rule:"Pendant-tube thread, and the hole the stem sits in. The case decides this, not the name on the dial." },
  { id:"hands", name:"Hands", rule:"Hour, minute and second hole sizes. The style can differ. The brand cannot tell you the holes." },
  { id:"bow", name:"Bow", rule:"Wire thickness and the inside width at the pendant. Any maker, if the wire fits the hole." },
  { id:"crystal", name:"Crystal", rule:"Diameter in millimetres, and whether it is a tension-ring crystal. The watch name does not matter." },
  { id:"case", name:"Case", rule:"The pillar plate has to sit in the case well, and the stem has to meet the pendant. A close size is only a candidate." },
  { id:"dial", name:"Dial", rule:"Dial diameter and foot positions. Feet almost never match across makers. Leave it unticked unless you know the feet fit." }
];

export function ensureSpares(job){
  const prev = new Map((Array.isArray(job.sparesParts) ? job.sparesParts : []).map(p => [p.id, p]));
  job.sparesParts = SPARE_PARTS.map(p => ({
    id: p.id,
    name: p.name,
    keep: prev.has(p.id) ? !!prev.get(p.id).keep : p.id !== "dial"
  }));
  if (typeof job.fitsNote !== "string") job.fitsNote = "";
  return job;
}

function fold(s){
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]+/g, " ").trim();
}
function plate(s){
  const n = parseFloat(String(s || "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function calibre(job){
  return fold(job.passport && job.passport.calibre).replace(/\s/g, "");
}

export function judgeDonor(need, donor, part){
  const kept = (donor.sparesParts || []).find(p => p.id === part.id);
  const have = kept ? !!kept.keep : part.id !== "dial";
  const sameCal = calibre(need) && calibre(need) === calibre(donor);
  const note = fold(donor.fitsNote);
  const tokens = [need.watchName, need.passport && need.passport.maker, need.passport && need.passport.model, need.passport && need.passport.calibre]
    .map(fold).filter(t => t.length > 2);
  const wrote = tokens.some(t => note.includes(t));
  const a = plate(need.passport && need.passport.movementMm);
  const b = plate(donor.passport && donor.passport.movementMm);
  const close = a && b && Math.abs(a - b) <= 0.5;
  let kind = "skip";
  let why = "";
  if (!have){
    kind = "gone";
    why = "Ticked off. Not in the drawer.";
  } else if (wrote){
    kind = "use";
    why = "You wrote that this donor fits the open watch.";
  } else if (sameCal && a && b && Math.abs(a - b) > 0.5){
    kind = "measure";
    why = "Calibre matches, but the pillar-plate sizes do not. Check which figure is wrong before you rob it.";
  } else if (sameCal){
    kind = "use";
    why = "Same calibre. This part is worth trying.";
  } else if (close){
    kind = "measure";
    why = "Different maker, pillar plate within 0.5 mm. " + part.rule;
  } else if (!a || !b){
    kind = "size";
    why = "No pillar-plate size, so another maker is not offered.";
  }
  return { donor, kind, why, have };
}

export function matchPart(need, donors, partId){
  const part = SPARE_PARTS.find(p => p.id === partId) || SPARE_PARTS[0];
  const rows = (donors || [])
    .filter(d => d && d.id !== need.id && d.status === "spares")
    .map(d => judgeDonor(need, d, part));
  return { part, rows };
}
