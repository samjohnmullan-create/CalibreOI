export function suggestBph(job){
  const p = job.passport || {};
  const text = [job.watchName, p.maker, p.model, p.calibre, p.year, p.escapement, p.movementType, p.notes, p.history].filter(Boolean).join(" ");
  const named = text.match(/\b(14400|16200|18000|19800|21600|25200|28800|36000)\b/);
  if (named) return { bph: named[1], why: "written on the job" };
  if (/cylinder/i.test(text)) return { bph: "16200", why: "cylinder escapement" };
  const year = parseInt(String(p.year || "").replace(/\D/g, "").slice(0, 4), 10);
  if (year && year < 1880) return { bph: "16200", why: "pre-1880" };
  if (/wrist/i.test(text)) return { bph: "21600", why: "wristwatch" };
  return { bph: "18000", why: "pocket lever" };
}
