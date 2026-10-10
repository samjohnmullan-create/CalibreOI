const num=v=>{if(v===''||v==null)return null;const n=Number(v);return Number.isFinite(n)?n:null;};
const text=v=>String(v??'').trim();
export const BENCH_MEASUREMENT_FIELDS=[
  {key:'balanceEndshakeMm',label:'Balance endshake',unit:'mm',step:'0.01',min:0},
  {key:'balanceSideShakeMm',label:'Balance side shake / wobble',unit:'mm',step:'0.01',min:0},
  {key:'trainEndshakeMm',label:'Train endshake',unit:'mm',step:'0.01',min:0},
  {key:'powerReserveHours',label:'Power reserve',unit:'hours',step:'0.1',min:0},
  {key:'positionalSpreadSecDay',label:'Positional spread',unit:'s/day',step:'1',min:0}
];
export function blankBenchMeasurements(raw={}){return {
  balanceEndshakeMm:num(raw.balanceEndshakeMm),
  balanceSideShakeMm:num(raw.balanceSideShakeMm),
  trainEndshakeMm:num(raw.trainEndshakeMm),
  powerReserveHours:num(raw.powerReserveHours),
  positionalSpreadSecDay:num(raw.positionalSpreadSecDay),
  notes:text(raw.notes),
  updatedAt:text(raw.updatedAt)
};}
export function ensureBenchMeasurements(job={}){job.benchMeasurements=blankBenchMeasurements(job.benchMeasurements||{});return job.benchMeasurements;}
export function setBenchMeasurement(job={},key,value){const m=ensureBenchMeasurements(job);if(!BENCH_MEASUREMENT_FIELDS.some(f=>f.key===key)&&key!=='notes')throw new Error('Unknown bench measurement');m[key]=key==='notes'?text(value):num(value);m.updatedAt=new Date().toISOString();return m;}
export function hasBenchMeasurements(job={}){const m=blankBenchMeasurements(job.benchMeasurements||{});return BENCH_MEASUREMENT_FIELDS.some(f=>m[f.key]!=null)||!!m.notes;}
