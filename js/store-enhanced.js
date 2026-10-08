import * as cloud from "./store-cloud.js?v=5";
import * as base from "./store-base.js?v=1";

export * from "./store-cloud.js?v=5";

function list(v){return Array.isArray(v)?v.filter(Boolean):[];}
function text(v){return typeof v==="string"?v:"";}
function normaliseLead(v={}){return {part:text(v.part||v.name),reference:text(v.reference||v.partNumber),compatibility:text(v.compatibility||v.fit),confidence:text(v.confidence||"Unknown"),source:text(v.source),notes:text(v.notes)};}
function normaliseResearchBrief(raw={}){
  const r=raw.researchBrief||raw.researchDossier||{};
  return {
    summary:text(r.summary||raw.research),
    technicalNotes:text(r.technicalNotes||r.technicalSummary),
    valuationConfidence:text(r.valuationConfidence),
    valuationBasis:text(r.valuationBasis),
    partsLeads:list(r.partsLeads).map(normaliseLead),
    repairPlan:list(r.repairPlan).map(String),
    nextChecks:list(r.nextChecks).map(String),
    risks:list(r.risks).map(String),
    references:list(r.references||raw.references).map(String),
    updatedAt:r.updatedAt||new Date().toISOString()
  };
}
function hasResearch(r){return !!(r.summary||r.technicalNotes||r.valuationConfidence||r.valuationBasis||r.partsLeads.length||r.repairPlan.length||r.nextChecks.length||r.risks.length||r.references.length);}
function enrich(job,raw={}){
  if(!job)return job;
  const research=normaliseResearchBrief(raw);
  if(hasResearch(research))job.researchBrief=research;
  else if(!job.researchBrief)job.researchBrief=normaliseResearchBrief({});
  if(raw.service!=null)job.service=raw.service;
  if(raw.serviceNotes!=null)job.serviceNotes=raw.serviceNotes;
  if(raw.research!=null&&!job.research)job.research=raw.research;
  if(Array.isArray(raw.references))job.references=raw.references;
  return job;
}

export function importCard(raw){return enrich(base.importCard(raw),raw);}

export async function importInboxItems(items){
  const result=await cloud.importInboxItems(items);
  const cards=list(items).filter(item=>item?.job_data?.type==="calibrejob"&&item.job_data);
  if(!cards.length)return result;
  const state=await cloud.loadState();
  let changed=false;
  for(const item of cards){
    const raw=item.job_data;
    const job=(state.jobs||[]).find(j=>(raw.pushId&&j.pushId===raw.pushId)||(raw.jobId&&j.jobId===raw.jobId));
    if(!job)continue;
    enrich(job,raw);changed=true;
  }
  if(changed)await cloud.saveState(state);
  return {...result,state};
}
