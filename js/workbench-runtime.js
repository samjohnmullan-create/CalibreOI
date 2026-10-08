const report=(name,error)=>{
  console.error(`Calibre ${name} failed to load`,error);
  const status=document.getElementById("statusText");
  if(status)status.textContent=`${name} failed to load: ${error?.message||error}`;
};

// Diagnostics is the core Workbench enhancement. Load it first and do not let
// optional features prevent it from starting.
import("./workbench-runtime-core.js?v=5")
  .then(()=>{window.calibreDiagnosticsModuleLoaded=true;})
  .catch(err=>report("diagnostics",err));

// These features are deliberately isolated: a syntax/load error in one must
// not take down diagnostics or the rest of the Workbench.
import("./research-brief.js?v=4").catch(err=>report("research brief",err));
import("./part-tree-runtime.js?v=3").catch(err=>report("parts tree",err));
import("./repair-timeline-runtime.js?v=1").catch(err=>report("repair timeline",err));
import("./workbench-health.js?v=2").catch(err=>report("Workbench health check",err));
