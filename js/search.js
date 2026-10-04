function compact(s){
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

export function searchTerms(query){
  return String(query || "").split(/[^a-z0-9]+/i).map(compact).filter(t => t.length >= 2);
}

function fields(job){
  const p = job.passport || {};
  const rows = [
    ["Brand", p.maker],
    ["Name", job.watchName],
    ["Model", p.model],
    ["Calibre", p.calibre],
    ["Serial", p.serial],
    ["Case no.", p.caseNumber],
    ["Case ref.", p.reference],
    ["Job", job.jobId],
    ["Jewels", p.jewels],
    ["Movement", p.movementType],
    ["Plate", p.movementMm],
    ["Escapement", p.escapement],
    ["Year", p.year],
    ["Case", p.caseMaterial],
    ["Notes", p.notes],
    ["History", p.history],
    ["Write-off", job.writeOff],
    ["Also fits", job.fitsNote],
    ["Decision", job.decision]
  ];
  (job.sparesParts || []).forEach(part => {
    rows.push([part.keep ? "Part" : "Part gone", part.name]);
  });
  (job.stages || []).forEach(s => {
    if (s.parts) rows.push(["Part", s.parts]);
    if (s.measure) rows.push(["Measure", s.measure]);
    if (s.notes) rows.push(["Note", s.notes]);
    if (s.condition) rows.push(["Condition", s.condition]);
  });
  return rows.filter(([, v]) => String(v || "").trim());
}

export function searchJobs(jobs, query){
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const out = [];
  for (const job of jobs || []) {
    const all = fields(job);
    const hay = all.map(([, v]) => compact(v)).join(" ");
    if (!terms.every(t => hay.includes(t))) continue;
    const hits = [];
    for (const [label, value] of all) {
      const text = compact(value);
      if (terms.some(t => text.includes(t))) hits.push({ label, value: String(value).replace(/\s+/g, " ").trim() });
      if (hits.length === 3) break;
    }
    out.push({ job, hits });
  }
  return out;
}

function clip(s){
  return s.length > 72 ? s.slice(0, 69) + "…" : s;
}

export function whereJob(job){
  if (job.status === "spares") return "Spares";
  if (job.status === "complete" || job.status === "sold") return "Stock";
  return "On the bench";
}

export function fillResults(el, jobs, query, open){
  const terms = searchTerms(query);
  const rows = searchJobs(jobs, query);
  el.replaceChildren();
  if (!terms.length) return rows;
  if (!rows.length) {
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = "Nothing on this phone matches.";
    el.appendChild(p);
    return rows;
  }
  rows.forEach(({ job, hits }) => {
    const a = document.createElement("a");
    a.className = "job-card";
    a.href = "#";
    const left = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = job.watchName || "Untitled watch";
    const sub = document.createElement("div");
    sub.className = "muted small";
    sub.textContent = hits.map(h => h.label + ": " + clip(h.value)).join(" · ");
    left.append(strong, sub);
    const right = document.createElement("div");
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = whereJob(job);
    right.appendChild(badge);
    a.append(left, right);
    a.addEventListener("click", async (e) => {
      e.preventDefault();
      await open(job);
    });
    el.appendChild(a);
  });
  return rows;
}
