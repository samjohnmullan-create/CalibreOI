const num=v=>{if(v===''||v==null)return null;const n=Number(v);return Number.isFinite(n)?n:null;};
const text=v=>String(v??'').trim();
const assessment=v=>['acceptable','excessive','uncertain'].includes(text(v))?text(v):'';
export const BENCH_MEASUREMENT_FIELDS=[
  {key:'balanceEndshakeMm',label:'Balance endshake',unit:'mm',step:'0.01',min:0,assessmentKey:'balanceEndshakeAssessment'},
  {key:'balanceSideShakeMm',label:'Balance side shake / wobble',unit:'mm',step:'0.01',min:0,assessmentKey:'balanceSideShakeAssessment'},
  {key:'trainEndshakeMm',label:'Train endshake',unit:'mm',step:'0.01',min:0,assessmentKey:'trainEndshakeAssessment'},
  {key:'powerReserveHours',label:'Power reserve',unit:'hours',step:'0.1',min:0},
  {key:'expectedPowerReserveHours',label:'Expected power reserve',unit:'hours',step:'0.1',min:0},
  {key:'positionalSpreadSecDay',label:'Positional spread',unit:'s/day',step:'1',min:0}
];
export function blankBenchMeasurements(raw={}){return {
  balanceEndshakeMm:num(raw.balanceEndshakeMm),balanceEndshakeAssessment:assessment(raw.balanceEndshakeAssessment),
  balanceSideShakeMm:num(raw.balanceSideShakeMm),balanceSideShakeAssessment:assessment(raw.balanceSideShakeAssessment),
  trainEndshakeMm:num(raw.trainEndshakeMm),trainEndshakeAssessment:assessment(raw.trainEndshakeAssessment),
  powerReserveHours:num(raw.powerReserveHours),expectedPowerReserveHours:num(raw.expectedPowerReserveHours),
  positionalSpreadSecDay:num(raw.positionalSpreadSecDay),
  notes:text(raw.notes),updatedAt:text(raw.updatedAt)
};}
export function ensureBenchMeasurements(job={}){job.benchMeasurements=blankBenchMeasurements(job.benchMeasurements||{});return job.benchMeasurements;}
export function setBenchMeasurement(job={},key,value){const m=ensureBenchMeasurements(job);const numeric=BENCH_MEASUREMENT_FIELDS.some(f=>f.key===key),assessmentField=BENCH_MEASUREMENT_FIELDS.some(f=>f.assessmentKey===key);if(!numeric&&!assessmentField&&key!=='notes')throw new Error('Unknown bench measurement');m[key]=key==='notes'?text(value):assessmentField?assessment(value):num(value);m.updatedAt=new Date().toISOString();return m;}
export function hasBenchMeasurements(job={}){const m=blankBenchMeasurements(job.benchMeasurements||{});return BENCH_MEASUREMENT_FIELDS.some(f=>m[f.key]!=null||(f.assessmentKey&&m[f.assessmentKey]))||!!m.notes;}
