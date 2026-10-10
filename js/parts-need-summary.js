import { compatibilitySummary } from './parts-intelligence.js?v=4';
import { donorPartStorage, storageLocationForAsset } from './donor-workshop.js?v=1';

const text=v=>String(v||'').trim();
const fold=v=>text(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const tokens=v=>new Set(fold(v).split(/\s+/).filter(x=>x.length>1));
const overlap=(a,b)=>{const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(A.size,B.size);};

export function openPartRequirements(job={}){
  return (Array.isArray(job.parts)?job.parts:[]).map((part,index)=>({part,index,key:part.workflowKey||part.researchKey||`part-${index}`})).filter(row=>!row.part?.fitted);
}
function stockRelevance(req,row){
  const p=row.part||{},needle=[req.part,req.partNumber].filter(Boolean).join(' '),hay=[p.name,p.category,p.reference,p.calibre,p.notes].filter(Boolean).join(' ');
  let bonus=0;if(req.partNumber&&fold(hay).includes(fold(req.partNumber)))bonus+=45;const ov=overlap(needle,hay);if(ov>=.5)bonus+=30;else if(ov>=.25)bonus+=15;return Math.min(100,(Number(row.score)||0)+bonus);
}
function donorPartRelevance(req,part={}){const needle=[req.part,req.partNumber].filter(Boolean).join(' '),hay=[part.name,part.id].filter(Boolean).join(' ');let bonus=0;if(req.partNumber&&fold(hay).includes(fold(req.partNumber)))bonus+=45;const ov=overlap(needle,hay);if(ov>=.5)bonus+=35;else if(ov>=.25)bonus+=18;return bonus;}
export function partsNeedSummary(job={},state={}){
  const base=compatibilitySummary(job,state),requirements=openPartRequirements(job);
  return requirements.map(({part,index,key})=>{
    const stock=(base.inventory||[]).map(row=>({...row,matchScore:stockRelevance(part,row)})).filter(row=>row.evidence||row.matchScore>=30).sort((a,b)=>b.matchScore-a.matchScore).slice(0,3);
    const donors=[];
    for(const row of (base.donors||[]))for(const kept of (row.kept||[])){
      const bonus=donorPartRelevance(part,kept),matchScore=Math.min(100,(Number(row.score)||0)+bonus);if(!row.evidence&&matchScore<30)continue;
      const sourceType=row.sourceType||'donor',sourceId=row.sourceId||row.donor?.id;
      const link=sourceType==='donorItem'?{donorItemId:sourceId,partId:kept.id}:{donorJobId:sourceId,partId:kept.id};
      const stored=donorPartStorage(state,link),storageDisplay=stored?storageLocationForAsset(state,stored):'';
      donors.push({...row,keptPart:kept,stored,storageDisplay,matchScore});
    }
    donors.sort((a,b)=>b.matchScore-a.matchScore);
    const best=[...stock.map(row=>({kind:'stock',row,score:row.matchScore})),...donors.map(row=>({kind:'donor',row,score:row.matchScore}))].sort((a,b)=>b.score-a.score)[0]||null;
    return {part,index,key,stock,donors:donors.slice(0,3),best};
  });
}
