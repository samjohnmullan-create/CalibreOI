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

import("./research-brief.js?v=4").catch(err=>report("research brief",err));
import("./part-tree-runtime.js?v=3").catch(err=>report("parts tree",err));
import("./repair-timeline-runtime.js?v=1").catch(err=>report("repair timeline",err));
import("./final-sale-handoff.js?v=2").catch(err=>report("sale handoff",err));
import("./stage-strip.js?v=7").catch(err=>report("stage navigation",err));
