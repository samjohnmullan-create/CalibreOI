const report=(name,error)=>{
  console.error(`Calibre ${name} failed to load`,error);
  const status=document.getElementById("statusText");
  if(status)status.textContent=`${name} failed to load: ${error?.message||error}`;
};

// Stability build: load each Workbench feature once, with no startup watchdog
// and no stage-strip enhancement until Chrome stability is confirmed.
import("./workbench-runtime-core.js?v=5")
  .then(()=>{window.calibreDiagnosticsModuleLoaded=true;})
  .catch(err=>report("diagnostics",err));

import("./research-brief.js?v=4").catch(err=>report("research brief",err));
import("./part-tree-runtime.js?v=3").catch(err=>report("parts tree",err));
import("./repair-timeline-runtime.js?v=1").catch(err=>report("repair timeline",err));
import("./final-sale-handoff.js?v=2").catch(err=>report("sale handoff",err));
