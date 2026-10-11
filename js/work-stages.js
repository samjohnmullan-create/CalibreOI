const FULL_MECH=['Intake','Pre-service timing','Uncasing','Dismantling & inspection','Cleaning & parts inspection','Repairs & parts','Reassembly & lubrication','Train & escapement','Balance & beat','Casing & function','Regulation','Final QC'];
const FULL_AUTO=['Intake','Pre-service timing','Uncasing','Dismantling & inspection','Cleaning & parts inspection','Repairs & parts','Reassembly & lubrication','Train & escapement','Balance & beat','Automatic works','Casing & function','Regulation','Final QC'];
const FULL_POCKET=['Intake','Pre-service timing','Case & pendant','Uncasing','Dismantling & inspection','Cleaning & parts inspection','Repairs & parts','Reassembly & lubrication','Train & escapement','Balance & beat','Casing & function','Regulation','Final QC'];
const QUARTZ=['Intake','Battery & electrical','Uncasing','Movement inspection','Cleaning & contacts','Repair & reassembly','Hands & calendar','Casing & function','Final QC'];
const CLOCK=['Intake','Case','Clock inspection','Clock cleaning','Clock reassembly','Pendulum','Strike','Regulation','Final QC'];
const INSPECT=['Intake','Inspection only','Final QC'];

const text=v=>String(v??'').trim().toLowerCase();
function watchProfile(item={}){
  if(item.type==='clock')return 'clock';
  const p=item.watch?.passport||{},m=item.watch?.movement||{},hay=[m.type,m.movementType,p.movementType,p.caseStyle,item.identity?.title,item.title].map(text).join(' ');
  if(/quartz|battery|electronic/.test(hay))return 'quartz';
  if(/automatic|self.?wind/.test(hay))return 'automatic';
  if(/pocket/.test(hay))return 'pocket';
  return 'manual';
}
export function workStagePath(work={},item={}){
  if(work.type==='inspection')return INSPECT;
  if(!['watch','clock'].includes(item?.type))return INSPECT;
  const profile=watchProfile(item);
  if(profile==='clock')return CLOCK;
  if(profile==='quartz')return QUARTZ;
  const decision=String(work.decision||'');
  if(decision==='Leave it')return ['Intake','Final QC'];
  if(decision==='Regulate only')return ['Intake','Pre-service timing','Regulation','Final QC'];
  if(decision==='Case, hands or crystal')return ['Intake','Uncasing','Case / hands / crystal','Casing & function','Final QC'];
  if(profile==='automatic')return FULL_AUTO;
  if(profile==='pocket')return FULL_POCKET;
  return FULL_MECH;
}
export function blankWorkStage(name=''){return {name,notes:'',condition:'',measure:'',complete:false,checks:{},updatedAt:''};}
export function ensureWorkStages(work={},item={}){
  const path=workStagePath(work,item),existing=Array.isArray(work.stages)?work.stages:[],byName=new Map();
  for(const raw of existing){const name=String(raw?.name||raw?.title||'').trim();if(!name)continue;const prior=byName.get(name);const next={...blankWorkStage(name),...raw,name,checks:raw?.checks&&typeof raw.checks==='object'?raw.checks:{}};if(prior){next.notes=[prior.notes,next.notes].filter(Boolean).join('\n');next.checks={...prior.checks,...next.checks};next.complete=!!(prior.complete||next.complete);}byName.set(name,next);}
  work.stages=path.map(name=>byName.get(name)||blankWorkStage(name));
  work.stageIndex=Math.max(0,Math.min(work.stages.length-1,Number(work.stageIndex)||0));
  return work.stages;
}
