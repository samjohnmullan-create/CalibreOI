const report=(name,error)=>{
  console.error(`Calibre ${name} failed to load`,error);
  const status=document.getElementById("statusText");
  if(status)status.textContent=`${name} failed to load: ${error?.message||error}`;
};

// Stability build: load each Workbench feature once. No startup watchdog,
// no MutationObserver-based stage navigation, and no repeating timers.
import("./workbench-runtime-core.js?v=5")
  .then(()=>{window.calibreDiagnosticsModuleLoaded=true;})
  .catch(err=>report("diagnostics",err));

import("./checklist-fast-runtime.js?v=1").catch(err=>report("fast checklist",err));
import("./research-link.js?v=1").catch(err=>report("research link",err));
import("./research-brief.js?v=4").catch(err=>report("research brief",err));
import("./part-tree-runtime.js?v=3").catch(err=>report("parts tree",err));
import("./repair-timeline-runtime.js?v=1").catch(err=>report("repair timeline",err));
import("./final-qc-runtime.js?v=1").catch(err=>report("final QC",err));
import("./final-sale-handoff.js?v=3").catch(err=>report("sale handoff",err));
import("./stage-strip.js?v=8").catch(err=>report("stage navigation",err));
import("./needs-parts-runtime.js?v=3").catch(err=>report("parts auto-match",err));
