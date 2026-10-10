import test from 'node:test';
import assert from 'node:assert/strict';
import { workbenchPartsIntel } from '../js/workbench-parts-intel.js';

test('Workbench parts intel is quiet when no parts are needed',()=>{
  assert.deepEqual(workbenchPartsIntel({parts:[]},{}),{needed:0,matched:0,likely:0,bestScore:0,label:''});
});

test('Workbench parts intel surfaces credible owned candidates',()=>{
  const job={id:'job-1',watchName:'Test watch',status:'Awaiting parts',passport:{calibre:'ETA 2801'},parts:[{part:'Balance staff',fitted:false}]};
  const state={jobs:[job],partsStock:[{id:'stock-1',name:'Balance staff ETA 2801',calibre:'ETA 2801',quantity:1}],items:[],partFitEvidence:[],workshopAssets:[]};
  const info=workbenchPartsIntel(job,state);
  assert.equal(info.needed,1);
  assert.ok(info.matched>=1);
  assert.ok(info.bestScore>=35);
  assert.match(info.label,/owned/);
});

test('fitted parts are excluded from Workbench counts',()=>{
  const job={id:'job-2',passport:{},parts:[{part:'Stem',fitted:true},{part:'Crown',fitted:false}]};
  const info=workbenchPartsIntel(job,{jobs:[job],partsStock:[],items:[],partFitEvidence:[],workshopAssets:[]});
  assert.equal(info.needed,1);
});
