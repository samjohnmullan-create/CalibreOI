import { loadState, current } from "./store.js?v=25";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function currentFile(){
  return (location.pathname.split("/").pop() || "").split("?")[0];
}
if (currentFile() !== "workbench.html") throw new Error("Workbench layout loaded outside Workbench");

function confirmedFaults(job){
  return (job?.diagnosticFaults || []).filter(f => f && f.status === "confirmed");
}

function recommendedDecision(job){
  const confirmed = confirmedFaults(job);
  if (!confirmed.length) return { value:"", reason:"" };

  const external = new Set(["Case","Casing","Hands","Crystal","Crown","Stem","Movement security","External"]);
  const movement = new Set(["Power","Winding","Keyless works","Barrel","Mainspring","Train","Escapement","Balance","Hairspring","Timing","Automatic winding","Jewels","Pivots","Lubrication","Quartz"]);
  const externalCount = confirmed.filter(f => external.has(f.category)).length;
  const movementCount = confirmed.filter(f => movement.has(f.category)).length;

  if (movementCount > 0) {
    return {
      value:"Full service",
      reason:`${movementCount} confirmed movement fault${movementCount === 1 ? "" : "s"} found during diagnosis.`
    };
  }
  if (externalCount > 0 && externalCount === confirmed.length) {
    return {
      value:"Case, hands or crystal",
      reason:"The confirmed faults are limited to external, casing or hand-work issues."
    };
  }
  return { value:"", reason:"" };
}

function ensureStyles(){
  if (document.getElementById("workbench-layout-style")) return;
  const s = document.createElement("style");
  s.id = "workbench-layout-style";
  s.textContent = `
    .workflow-footer{margin-top:22px;padding-top:18px;border-top:1px solid var(--line);display:grid;gap:14px}
    .workflow-footer h3{margin:0 0 4px}
    .decision-card{border:1px solid var(--line);background:var(--surface-2);border-radius:9px;padding:14px}
    .decision-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
    .decision-rec{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--brass);color:var(--brass-soft);border-radius:999px;padding:4px 8px;font-size:.68rem;font-weight:800;letter-spacing:.03em}
    .decision-rec[hidden]{display:none}
    .decision-reason{margin:8px 0 0;color:var(--muted);font-size:.76rem;line-height:1.35}
    .stage-finish{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border:1px solid var(--line);border-radius:9px;padding:14px}
    .stage-finish-copy strong{display:block}.stage-finish-copy span{display:block;color:var(--muted);font-size:.75rem;margin-top:2px}
    .stage-finish .checkline{font-size:.86rem}
    @media(max-width:640px){.stage-finish{align-items:flex-start;flex-direction:column}.decision-head{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(s);
}

function findJobPathBlock(){
  return [...document.querySelectorAll(".section-block")].find(el => el.querySelector("#jobTypes"));
}

async function applyLayout(){
  ensureStyles();
  const decision = $("decision");
  const decisionNote = $("decisionNote");
  const complete = $("stageComplete");
  const footerActions = document.querySelector(".footer-actions");
  const jobPath = findJobPathBlock();
  if (!decision || !complete || !footerActions || !jobPath) return false;

  if (!$("workflowFooter")) {
    const wrap = document.createElement("div");
    wrap.id = "workflowFooter";
    wrap.className = "workflow-footer";
    wrap.innerHTML = `
      <div class="decision-card" id="decisionCard">
        <div class="decision-head"><div><h3>Service decision</h3><div class="muted small">Choose this after the checks and diagnosis above.</div></div><span class="decision-rec" id="decisionRec" hidden>Recommended</span></div>
        <div id="decisionMount"></div>
        <p class="decision-reason" id="decisionReason"></p>
      </div>
      <div class="stage-finish">
        <div class="stage-finish-copy"><strong>Finish this stage</strong><span>Mark complete when the checks, diagnosis and notes for this stage are finished.</span></div>
        <div id="completeMount"></div>
      </div>`;
    footerActions.parentNode.insertBefore(wrap, footerActions);
  }

  const decisionMount = $("decisionMount");
  const completeMount = $("completeMount");
  const decisionLabel = decision.closest("label");
  const completeLabel = complete.closest("label");
  if (decisionLabel && decisionLabel.parentNode !== decisionMount) decisionMount.appendChild(decisionLabel);
  if (decisionNote && decisionNote.parentNode !== decisionMount) decisionMount.appendChild(decisionNote);
  if (completeLabel && completeLabel.parentNode !== completeMount) completeMount.appendChild(completeLabel);

  const heading = jobPath.querySelector("h3");
  if (heading) heading.textContent = "Watch / job type";

  try {
    const state = await loadState();
    const job = current(state);
    const rec = recommendedDecision(job);
    const badge = $("decisionRec");
    const reason = $("decisionReason");
    [...decision.options].forEach(o => {
      if (o.dataset.baseLabel) o.textContent = o.dataset.baseLabel;
      else o.dataset.baseLabel = o.textContent;
    });
    if (rec.value) {
      badge.hidden = false;
      const opt = [...decision.options].find(o => o.value === rec.value || o.textContent === rec.value);
      if (opt) {
        if (!opt.dataset.baseLabel) opt.dataset.baseLabel = opt.textContent;
        opt.textContent = `${opt.dataset.baseLabel} — Recommended`;
      }
      reason.textContent = rec.reason;
    } else {
      badge.hidden = true;
      reason.textContent = "No recommendation yet — complete the diagnostic checks first.";
    }
  } catch (err) {
    console.warn("Workbench recommendation", err);
  }
  return true;
}

let busy = false;
async function refresh(){
  if (busy) return;
  busy = true;
  try { await applyLayout(); }
  finally { busy = false; }
}

function start(){
  refresh();
  const root = document.querySelector("section.card");
  if (!root) return setTimeout(start, 120);
  const obs = new MutationObserver(() => setTimeout(refresh, 40));
  obs.observe(root, { childList:true, subtree:true });
  document.addEventListener("click", e => {
    if (e.target.closest("#steps button,.diag-btn,.diag-remove,.type,.stage-btn")) setTimeout(refresh, 180);
  });
  document.addEventListener("change", e => {
    if (e.target.id === "decision" || e.target.id === "stageComplete") setTimeout(refresh, 80);
  });
}
start();
