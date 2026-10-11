// Calibre Knowledge Engine foundation.
// This module is intentionally read-only: Core Items reference knowledge; they do not duplicate it.
// Expanded datasets can later be loaded from Supabase/static JSON without changing the public API.

const MOVEMENT_SEED = [
  {maker:'ETA',calibre:'2824-2',aliases:['Sellita SW200-1'],year:1982,diameter:26.0,height:4.60,jewels:25,powerReserve:40,bph:28800,frequency:4,liftAngle:50,movementType:'automatic',source:'https://ranfft.org/caliber/4187-ETA-2824-2'},
  {maker:'Seiko',calibre:'7S26A',aliases:[],year:1995,diameter:27.4,height:5.00,jewels:21,powerReserve:43,bph:21600,frequency:3,liftAngle:53,movementType:'automatic',source:'https://ranfft.org/caliber/9656-Seiko-7S26A'},
  {maker:'Citizen/Miyota',calibre:'8200',aliases:[],year:1974,diameter:29.2,height:5.67,jewels:21,powerReserve:43,bph:21600,frequency:3,liftAngle:null,movementType:'automatic',source:'https://ranfft.org/caliber/1946-Citizen-8200'},
  {maker:'Omega',calibre:'565',aliases:[],year:1966,diameter:28.4,height:5.05,jewels:24,powerReserve:50,bph:19800,frequency:2.75,liftAngle:49,movementType:'automatic',source:'https://ranfft.org/caliber/8477-Omega-565'},
  {maker:'FHF',calibre:'72',aliases:['Helvetia 850','Dugena 998'],year:1970,diameter:26.0,height:3.60,jewels:21,powerReserve:39,bph:18000,frequency:2.5,liftAngle:52,movementType:'manual',source:'https://ranfft.org/caliber/5732-FHF-72'},
  {maker:'AS',calibre:'1130',aliases:[],year:1955,diameter:29.4,height:3.80,jewels:21,powerReserve:41,bph:18000,frequency:2.5,liftAngle:49,movementType:'manual',source:'https://ranfft.org/caliber/496-AS-1130?from=manufacturer'},
  {maker:'Peseux',calibre:'7001',aliases:['ETA 7001','Dugena 3807','Girard-Perregaux 101'],year:2001,diameter:23.7,height:2.50,jewels:17,powerReserve:42,bph:21600,frequency:3,liftAngle:52,movementType:'manual',source:'https://ranfft.org/caliber/8907-Peseux-7001?from=manufacturer'},
  {maker:'Valjoux',calibre:'7750',aliases:['ETA 7750','Sellita SW500'],year:1974,diameter:30.4,height:7.90,jewels:25,powerReserve:46,bph:28800,frequency:4,liftAngle:49,movementType:'automatic',source:'https://ranfft.org/caliber/10545-Valjoux-7750'},
  {maker:'Lemania',calibre:'1873',aliases:['Omega 861'],year:1968,diameter:27.07,height:6.87,jewels:18,powerReserve:40,bph:21600,frequency:3,liftAngle:50,movementType:'manual',source:'https://ranfft.org/caliber/7375-Lemania-1873'},
  {maker:'Omega',calibre:'861',aliases:['Lemania 1873'],year:1968,diameter:27.07,height:6.87,jewels:17,powerReserve:40,bph:21600,frequency:3,liftAngle:50,movementType:'manual',source:'https://ranfft.org/caliber/8516-Omega-861'}
];

const normalise=v=>String(v??'').trim().toLowerCase().replace(/[\s._/]+/g,'-');
const movementKey=(maker,calibre)=>`${normalise(maker)}:${normalise(calibre)}`;

const index=new Map();
for(const movement of MOVEMENT_SEED){
  index.set(movementKey(movement.maker,movement.calibre),movement);
  for(const alias of movement.aliases||[]){
    const split=String(alias).trim().match(/^(.+?)\s+([^\s]+)$/);
    if(split) index.set(movementKey(split[1],split[2]),movement);
  }
}

export function listSeedMovements(){return MOVEMENT_SEED.map(entry=>({...entry,aliases:[...(entry.aliases||[])]}));}

export function findMovementSpec(maker,calibre){
  if(!calibre)return null;
  const direct=index.get(movementKey(maker,calibre));
  if(direct)return {...direct,aliases:[...(direct.aliases||[])]};
  // Calibre-only fallback is allowed only when exactly one seed record matches.
  const target=normalise(calibre);
  const matches=MOVEMENT_SEED.filter(m=>normalise(m.calibre)===target || (m.aliases||[]).some(a=>normalise(a).endsWith(`-${target}`)));
  return matches.length===1?{...matches[0],aliases:[...(matches[0].aliases||[])]}:null;
}

export function getTimegrapherDefaults(maker,calibre){
  const movement=findMovementSpec(maker,calibre);
  if(!movement)return null;
  return {
    bph:movement.bph??null,
    frequency:movement.frequency??null,
    liftAngle:movement.liftAngle??null,
    source:movement.source,
    confidence:'verified-calibre'
  };
}

export function passportPatchForMovement(maker,calibre){
  const m=findMovementSpec(maker,calibre);
  if(!m)return null;
  return {
    maker:m.maker,
    calibre:m.calibre,
    year:m.year??'',
    movementType:m.movementType||'',
    jewels:m.jewels??'',
    dimensions:{diameterMm:m.diameter??null,heightMm:m.height??null},
    powerReserveHours:m.powerReserve??null,
    beatRateBph:m.bph??null,
    liftAngle:m.liftAngle??null,
    aliases:[...(m.aliases||[])],
    knowledgeSource:m.source
  };
}

export function scoreMovementCandidate(observed={},movement){
  let score=0,max=0;
  const near=(a,b,tolerance)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)-Number(b))<=tolerance;
  if(observed.diameter!=null&&movement.diameter!=null){max+=30;if(near(observed.diameter,movement.diameter,0.15))score+=30;else if(near(observed.diameter,movement.diameter,0.5))score+=18;}
  if(observed.height!=null&&movement.height!=null){max+=20;if(near(observed.height,movement.height,0.15))score+=20;else if(near(observed.height,movement.height,0.4))score+=10;}
  if(observed.jewels!=null&&movement.jewels!=null){max+=10;if(Number(observed.jewels)===Number(movement.jewels))score+=10;}
  if(observed.bph!=null&&movement.bph!=null){max+=20;if(Number(observed.bph)===Number(movement.bph))score+=20;}
  if(observed.movementType&&movement.movementType){max+=10;if(normalise(observed.movementType)===normalise(movement.movementType))score+=10;}
  if(observed.maker){max+=10;if(normalise(observed.maker)===normalise(movement.maker))score+=10;}
  return {score:max?Math.round(score/max*100):0,raw:score,max};
}

export function identifyMovementCandidates(observed={}){
  return MOVEMENT_SEED.map(m=>({movement:{...m,aliases:[...(m.aliases||[])]},...scoreMovementCandidate(observed,m)}))
    .sort((a,b)=>b.score-a.score);
}

export function rankCompatibilityEvidence(evidence={}){
  const kind=String(evidence.kind||evidence.scope||'').toLowerCase();
  if(evidence.serialRangeMatched&&evidence.exactFactoryPart)return 100;
  if(kind.includes('identical'))return 100;
  if(evidence.exactFactoryPart)return 99;
  if(kind.includes('explicit')||kind.includes('interchange'))return 96;
  if(kind.includes('alias')||kind.includes('base'))return 92;
  if(kind.includes('shared')&&kind.includes('reference'))return 88;
  if(kind.includes('family'))return 68;
  if(kind.includes('dimension'))return 45;
  return Math.round(Math.max(0,Math.min(1,Number(evidence.confidence)||0))*100);
}

export const KNOWLEDGE_RULES={
  familyIsNotProof:true,
  serialRangeOverridesGeneralGrade:true,
  exactPartReferenceWins:true,
  dimensionalMatchRequiresMeasurement:true,
  neverInventLiftAngle:true
};
