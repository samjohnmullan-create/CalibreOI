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

function inStock(job){
  return job.status === "spares" || job.status === "complete" || job.status === "sold";
}

function watchText(job){
  const p = job.passport || {};
  return [job.watchName, p.maker, p.model, p.calibre, p.serial, p.caseNumber, p.reference].filter(Boolean).join(" ");
}

export function stockSuggestions(jobs, query){
  const typed = String(query || "").split(/[^a-z0-9]+/i).map(compact).filter(Boolean);
  const single = typed.length === 1 && typed[0].length === 1 ? typed[0] : "";
  const terms = single ? typed : typed.filter(t => t.length >= 2);
  if (!terms.length) return [];
  const q = compact(query);
  const out = [];
  for (const job of jobs || []) {
    if (!inStock(job)) continue;
    const p = job.passport || {};
    const bits = watchText(job);
    const detail = [p.maker, p.calibre && ("cal. " + p.calibre), p.serial && ("serial " + p.serial)].filter(Boolean).join(" · ");
    let named = false;
    (job.sparesParts || []).forEach(part => {
      if (!part.keep) return;
      const name = compact(part.name);
      const hit = single
        ? name.startsWith(single)
        : terms.every(t => compact(part.name + " " + bits).includes(t)) && terms.some(t => name.includes(t));
      if (!hit) return;
      named = true;
      out.push({ job, kind:"part", title: part.name, detail: [job.watchName, detail].filter(Boolean).join(" · ") });
    });
    const watchHit = single
      ? compact(job.watchName).startsWith(single) || compact(p.maker).startsWith(single) || compact(p.serial).startsWith(single)
      : terms.every(t => compact(bits).includes(t));
    if (!named && watchHit) {
      out.push({ job, kind:"watch", title: job.watchName || "Untitled watch", detail: detail || whereJob(job) });
    }
  }
  out.sort((a, b) => {
    const ap = compact(a.title).startsWith(q) ? 0 : 1;
    const bp = compact(b.title).startsWith(q) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    if (a.kind !== b.kind) return a.kind === "part" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
  return out.slice(0, 8);
}

export function whereJob(job){
  if (job.status === "spares") return "Spares";
  if (job.status === "complete" || job.status === "sold") return "Stock";
  return "On the bench";
}

function addRow(el, title, detail, badge, open){
  const a = document.createElement("a");
  a.className = "job-card";
  a.href = "#";
  const left = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  const sub = document.createElement("div");
  sub.className = "muted small";
  sub.textContent = detail;
  left.append(strong, sub);
  const right = document.createElement("div");
  const mark = document.createElement("span");
  mark.className = "badge";
  mark.textContent = badge;
  right.appendChild(mark);
  a.append(left, right);
  a.addEventListener("click", async (e) => {
    e.preventDefault();
    await open();
  });
  el.appendChild(a);
}

export function fillResults(el, jobs, query, open){
  const typed = String(query || "").split(/[^a-z0-9]+/i).map(compact).filter(Boolean);
  const suggestions = stockSuggestions(jobs, query);
  const bench = searchTerms(query).length ? searchJobs(jobs, query).filter(r => !inStock(r.job)) : [];
  el.replaceChildren();
  if (!typed.length) return suggestions;
  if (!suggestions.length) {
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = "Nothing in stock matches.";
    el.appendChild(p);
  } else {
    const label = document.createElement("p");
    label.className = "muted small";
    label.textContent = "In stock";
    el.appendChild(label);
    suggestions.forEach(s => addRow(el, s.title, s.detail, s.kind === "part" ? "In stock" : whereJob(s.job), () => open(s.job)));
  }
  if (bench.length) {
    const label = document.createElement("p");
    label.className = "muted small";
    label.textContent = "On the bench";
    el.appendChild(label);
    bench.forEach(({ job, hits }) => addRow(
      el,
      job.watchName || "Untitled watch",
      hits.map(h => h.label + ": " + clip(h.value)).join(" · "),
      "On the bench",
      () => open(job)
    ));
  }
  return suggestions;
}
