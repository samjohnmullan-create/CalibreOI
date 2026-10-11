// Calibre Knowledge Engine: read-only workshop reference layer.
// Core Items reference knowledge; this module never copies reference datasets into Core state.
import {V25_MOVEMENTS,V25_TECHNICAL_DOCUMENTS} from './knowledge-v25-pack.js?v=1';

const normalise=v=>String(v??'').trim().toLowerCase().replace(/[\s._/]+/g,'-');
const movementKey=(maker,calibre)=>`${normalise(maker)}:${normalise(calibre)}`;
const cloneMovement=m=>m?{...m,aliases:(m.aliases||[]).map(a=>Array.isArray(a)?[...a]:structuredClone(a)),parts:(m.parts||[]).map(p=>Array.isArray(p)?[...p]:structuredClone(p))}:null;
const aliasTuple=a=>Array.isArray(a)?a:[a?.alias_maker,a?.alias_calibre,a?.relationship,a?.confidence];

const index=new Map();
for(const movement of V25_MOVEMENTS){
  index.set(movementKey(movement.maker,movement.calibre),movement);
  for(const raw of movement.aliases||[]){const [maker,calibre,relationship,confidence]=aliasTuple(raw);if(maker&&calibre&&(!confidence||Number(confidence)>=.9)&&String(relationship||'').includes('also_known_as'))index.set(movementKey(maker,calibre),movement);}
}

export function listSeedMovements(){return V25_MOVEMENTS.map(cloneMovement);}
export const listVerifiedMovements=listSeedMovements;

export function findMovementSpec(maker,calibre){
  if(!calibre)return null;
  const direct=index.get(movementKey(maker,calibre));if(direct)return cloneMovement(direct);
  const target=normalise(calibre),matches=V25_MOVEMENTS.filter(m=>normalise(m.calibre)===target||(m.aliases||[]).some(raw=>{const [,aliasCalibre,relationship,confidence]=aliasTuple(raw);return normalise(aliasCalibre)===target&&String(relationship||'').includes('also_known_as')&&Number(confidence||1)>=.9;}));
  return matches.length===1?cloneMovement(matches[0]):null;
}

export function movementIdentityForItem(item={}){
  const passport=item.watch?.passport||{},movement=item.watch?.movement||{},identity=item.identity||{};
  return {maker:passport.movementMaker||movement.maker||identity.maker||passport.maker||'',calibre:passport.calibre||movement.calibre||''};
}

export function getMovementKnowledgeForItem(item={}){const {maker,calibre}=movementIdentityForItem(item);return findMovementSpec(maker,calibre);}

export function getTimegrapherDefaults(maker,calibre){
  const movement=findMovementSpec(maker,calibre);if(!movement)return null;
  return {bph:movement.bph??null,frequency:movement.frequency??null,liftAngle:movement.liftAngle??null,source:movement.source,confidence:'verified-calibre'};
}

export function passportPatchForMovement(maker,calibre){
  const m=findMovementSpec(maker,calibre);if(!m)return null;
  return {movementMaker:m.maker,maker:m.maker,calibre:m.calibre,year:m.year??'',movementType:m.movementType||'',jewels:m.jewels??'',movementMm:m.diameter??'',powerReserve:m.powerReserve??'',beatRate:m.bph??'',settingType:m.settingType||'',dimensions:{diameterMm:m.diameter??null,heightMm:m.height??null},frequencyHz:m.frequency??null,liftAngle:m.liftAngle??null,aliases:(m.aliases||[]).map(aliasTuple),knowledgeSource:m.source,knowledgeNotes:m.notes||''};
}

export function getPartReferences(maker,calibre){
  const m=findMovementSpec(maker,calibre);if(!m)return [];
  return (m.parts||[]).map(raw=>{const [partType,reference,confidence,notes]=Array.isArray(raw)?raw:[raw.t||raw.partType,raw.r||raw.reference,raw.c||raw.confidence,raw.n||raw.notes];return {partType,reference,confidence:confidence||'candidate',notes:notes||'',source:m.source,calibre:m.calibre,maker:m.maker,exact:confidence==='confirmed'};});
}

export function getTechnicalDocuments(maker,calibre){
  const target=normalise(calibre),makerKey=normalise(maker);
  return V25_TECHNICAL_DOCUMENTS.filter(doc=>(!makerKey||normalise(doc.maker)===makerKey)&&(doc.calibres||[]).some(c=>normalise(c)===target)).map(doc=>({...doc,calibres:[...(doc.calibres||[])],confidence:'documented-calibre'}));
}

export function contextualKnowledge(item={},state={}){
  const {maker,calibre}=movementIdentityForItem(item),movement=findMovementSpec(maker,calibre),parts=getPartReferences(maker,calibre),packDocs=getTechnicalDocuments(maker,calibre);
  const canonicalDocs=(Array.isArray(state.knowledge)?state.knowledge:[]).filter(k=>k?.recordType==='reference-document'&&(!calibre||normalise(k.calibreRange||k.calibre||'').includes(normalise(calibre))));
  const canonicalFacts=(Array.isArray(state.knowledge)?state.knowledge:[]).filter(k=>k?.recordType==='reference-fact'&&(!calibre||normalise(k.calibre||'')===normalise(calibre)));
  return {maker,calibre,movement,parts,documents:[...packDocs,...canonicalDocs],facts:canonicalFacts};
}

export function scoreMovementCandidate(observed={},movement){
  let score=0,max=0;const near=(a,b,t)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)-Number(b))<=t;
  if(observed.diameter!=null&&movement.diameter!=null){max+=30;if(near(observed.diameter,movement.diameter,.15))score+=30;else if(near(observed.diameter,movement.diameter,.5))score+=18;}
  if(observed.height!=null&&movement.height!=null){max+=20;if(near(observed.height,movement.height,.15))score+=20;else if(near(observed.height,movement.height,.4))score+=10;}
  if(observed.jewels!=null&&movement.jewels!=null){max+=10;if(Number(observed.jewels)===Number(movement.jewels))score+=10;}
  if(observed.bph!=null&&movement.bph!=null){max+=20;if(Number(observed.bph)===Number(movement.bph))score+=20;}
  if(observed.movementType&&movement.movementType){max+=10;if(normalise(observed.movementType)===normalise(movement.movementType))score+=10;}
  if(observed.maker){max+=10;if(normalise(observed.maker)===normalise(movement.maker))score+=10;}
  return {score:max?Math.round(score/max*100):0,raw:score,max};
}

export function identifyMovementCandidates(observed={}){return V25_MOVEMENTS.map(m=>({movement:cloneMovement(m),...scoreMovementCandidate(observed,m)})).sort((a,b)=>b.score-a.score);}

export function rankCompatibilityEvidence(evidence={}){
  const kind=String(evidence.kind||evidence.scope||'').toLowerCase();
  if(evidence.serialRangeMatched&&evidence.exactFactoryPart)return 100;if(kind.includes('identical'))return 100;if(evidence.exactFactoryPart)return 99;if(kind.includes('explicit')||kind.includes('interchange'))return 96;if(kind.includes('alias')||kind.includes('base'))return 92;if(kind.includes('shared')&&kind.includes('reference'))return 88;if(kind.includes('family'))return 68;if(kind.includes('dimension'))return 45;return Math.round(Math.max(0,Math.min(1,Number(evidence.confidence)||0))*100);
}

export const KNOWLEDGE_RULES={familyIsNotProof:true,serialRangeOverridesGeneralGrade:true,exactPartReferenceWins:true,dimensionalMatchRequiresMeasurement:true,neverInventLiftAngle:true};
