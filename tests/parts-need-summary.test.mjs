import test from 'node:test';
import assert from 'node:assert/strict';
import { openPartRequirements, partsNeedSummary } from '../js/parts-need-summary.js';

test('openPartRequirements excludes fitted parts',()=>{
  const rows=openPartRequirements({parts:[{part:'Stem',fitted:false},{part:'Crystal',fitted:true}]});
  assert.equal(rows.length,1);assert.equal(rows[0].part.part,'Stem');
});

test('partsNeedSummary ranks the matching donor part and exposes storage',()=>{
  const target={id:'job-target',watchName:'Target',status:'Awaiting parts',passport:{calibre:'123'},parts:[{part:'Balance staff',fitted:false}]};
  const donor={id:'job-donor',watchName:'Donor',status:'Spares',passport:{calibre:'123'},sparesParts:[{id:'staff',name:'Balance staff',keep:true},{id:'crown',name:'Crown',keep:true}]};
  const state={jobs:[target,donor],partsStock:[],items:[],partFitEvidence:[],workshopAssets:[{id:'tray-a',type:'tray',name:'Staff tray',location:'Drawer 2',quantity:0},{id:'part-a',type:'part',name:'Balance staff',partName:'Balance staff',quantity:1,trayId:'tray-a',donorJobId:'job-donor',donorPartId:'staff'}]};
  const summary=partsNeedSummary(target,state);assert.equal(summary.length,1);assert.equal(summary[0].best.kind,'donor');assert.equal(summary[0].best.row.keptPart.id,'staff');assert.match(summary[0].best.row.storageDisplay,/Staff tray/);assert.match(summary[0].best.row.storageDisplay,/Drawer 2/);
});

test('partsNeedSummary prefers a named stock match over unrelated stock',()=>{
  const target={id:'job-target',watchName:'Target',passport:{calibre:'123'},parts:[{part:'Winding stem',fitted:false}]};
  const state={jobs:[target],items:[],partFitEvidence:[],workshopAssets:[],partsStock:[{id:'p1',name:'Winding stem',calibre:'123',quantity:1,location:'Tray B'},{id:'p2',name:'Crystal',calibre:'123',quantity:1}]};
  const best=partsNeedSummary(target,state)[0].best;assert.equal(best.kind,'stock');assert.equal(best.row.part.id,'p1');
});
