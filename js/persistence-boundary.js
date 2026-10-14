// Explicit compatibility boundary for retired top-level persisted fields.
// Normal runtime must not read or write these names directly.
const RETIRED_TOP_LEVEL=['jobs','currentId'];

export function stripRetiredTopLevel(raw={}){
  if(!raw||typeof raw!=='object')return raw;
  const legacyJobs=Array.isArray(raw.jobs)?raw.jobs:[];
  const canonicalItems=Array.isArray(raw.items)?raw.items:[];
  const canonicalWork=Array.isArray(raw.work)?raw.work:[];
  if(legacyJobs.length&&!canonicalItems.length&&!canonicalWork.length){
    throw new Error('Legacy Job-only Calibre data requires explicit migration; refusing to discard it.');
  }
  for(const key of RETIRED_TOP_LEVEL)delete raw[key];
  return raw;
}
