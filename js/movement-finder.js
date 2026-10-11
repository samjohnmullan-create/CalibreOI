import {findMovementSpec} from './knowledge-engine.js?v=3';
const norm=v=>String(v??'').trim().toLowerCase().replace(/[\s._/]+/g,'-');
const num=v=>v===''||v==null?null:Number(v);
const close=(a,b,t)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t;

export function scoreCatalogMovement(observed={},movement={}){
  let earned=0,possible=0;const evidence=[];
  const rich=findMovementSpec(movement.maker,movement.calibre),maker=norm(observed.maker),cal=norm(observed.calibre),candidateMaker=norm(movement.maker),candidateCal=norm(movement.calibre);
  if(maker){possible+=30;if(candidateMaker===maker){earned+=30;evidence.push('maker exact');}else if(candidateMaker.includes(maker)||maker.includes(candidateMaker)){earned+=18;evidence.push('maker related text');}}
  if(cal){possible+=55;if(candidateCal===cal){earned+=55;evidence.push('calibre marking exact');}else if(candidateCal.includes(cal)||cal.includes(candidateCal)){earned+=30;evidence.push('calibre marking partial');}}
  const diameter=num(observed.diameter),candidateDiameter=num(movement.diameter??rich?.diameter);
  if(diameter!=null){possible+=30;if(close(diameter,candidateDiameter,.15)){earned+=30;evidence.push('diameter ±0.15 mm');}else if(close(diameter,candidateDiameter,.5)){earned+=18;evidence.push('diameter ±0.5 mm');}else if(close(diameter,candidateDiameter,1)){earned+=7;evidence.push('diameter ±1 mm');}}
  const height=num(observed.height),candidateHeight=num(movement.height??rich?.height);
  if(height!=null){possible+=18;if(close(height,candidateHeight,.15)){earned+=18;evidence.push('height ±0.15 mm');}else if(close(height,candidateHeight,.4)){earned+=10;evidence.push('height ±0.4 mm');}}
  const bph=num(observed.bph),candidateBph=num(movement.bph??rich?.bph);
  if(bph!=null){possible+=25;if(bph===candidateBph){earned+=25;evidence.push('BPH exact');}}
  if(observed.winding){possible+=12;if(norm(observed.winding)===norm(movement.winding||rich?.movementType)){earned+=12;evidence.push('winding type');}}
  const jewels=num(observed.jewels);
  if(jewels!=null){possible+=12;if(rich?.jewels!=null&&Number(rich.jewels)===jewels){earned+=12;evidence.push('jewel count exact');}}
  const score=possible?Math.round(earned/possible*100):0;
  return {score,earned,possible,evidence,rich};
}

export function rankMovementCatalog(rows=[],observed={},limit=30){
  const hasEvidence=['maker','calibre','diameter','height','bph','winding','jewels'].some(k=>String(observed[k]??'').trim()!=='');
  if(!hasEvidence)return [];
  return rows.map(movement=>({movement,...scoreCatalogMovement(observed,movement)})).filter(row=>row.earned>0).sort((a,b)=>b.score-a.score||b.earned-a.earned||String(a.movement.maker).localeCompare(String(b.movement.maker))).slice(0,limit);
}

function rpcNumber(value){const n=num(value);return Number.isFinite(n)?n:null;}
function cloudRow(row={}){
  const movement={id:row.id,maker:row.maker||'',calibre:row.calibre||'',familyName:row.family_name||'',diameter:rpcNumber(row.diameter_mm),height:rpcNumber(row.height_mm),bph:rpcNumber(row.beat_rate_bph),winding:row.winding||row.movement_type||'',sourceId:row.source_url||''};
  const rich=row.rich?{diameter:movement.diameter,height:movement.height,bph:movement.bph,jewels:row.jewels??null,movementType:row.movement_type||movement.winding,source:row.source_url||''}:null;
  return {movement,rich,score:Number(row.score)||0,earned:Number(row.earned)||0,possible:Number(row.possible)||0,evidence:Array.isArray(row.evidence)?row.evidence:[]};
}

export async function rankMovementCatalogRemote(observed={},fallbackRows=[],limit=30){
  const hasEvidence=['maker','calibre','diameter','height','bph','winding','jewels'].some(k=>String(observed[k]??'').trim()!=='');
  if(!hasEvidence)return {source:'none',rows:[],catalogSize:3458,error:''};
  try{
    const {supabaseClient,session}=await import('./cloud.js');
    const s=await session();
    if(!s?.user||s.localOnly)throw new Error('Cloud session unavailable');
    const params={p_maker:observed.maker||null,p_calibre:observed.calibre||null,p_diameter_mm:rpcNumber(observed.diameter),p_height_mm:rpcNumber(observed.height),p_jewels:rpcNumber(observed.jewels),p_bph:rpcNumber(observed.bph),p_winding:observed.winding||null,p_limit:Math.max(1,Math.min(Number(limit)||30,100))};
    const {data,error}=await supabaseClient().rpc('calibre_find_movements',params);
    if(error)throw error;
    return {source:'supabase',rows:(data||[]).map(cloudRow),catalogSize:3458,error:''};
  }catch(error){
    return {source:'local',rows:rankMovementCatalog(fallbackRows,observed,limit),catalogSize:fallbackRows.length,error:String(error?.message||error||'Cloud Finder unavailable')};
  }
}

export function finderLabel(score=0){return score>=85?'Strong evidence':score>=65?'Plausible':score>=40?'Possible':'Weak lead';}
