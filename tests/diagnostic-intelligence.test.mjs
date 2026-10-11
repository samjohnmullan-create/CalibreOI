import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnosticIntelligence,faultHistory} from '../js/diagnostic-intelligence.js';

function watchItem(id,{maker='',model='',calibre=''}={}){
  return {id,type:'watch',identity:{maker,model},watch:{passport:{maker,model,calibre}}};
}

test('same-calibre confirmed Work history boosts a fault',()=>{
  const fault={id:'balance_staff',text:'Balance staff fault',category:'Balance',status:'possible',severity:'Parts required'};
  const work={id:'work-1',itemId:'item-1',diagnosticFaults:[fault]};
  const prior={id:'work-2',itemId:'item-2',diagnosticFaults:[{id:'balance_staff',status:'confirmed'}]};
  const state={items:[watchItem('item-1',{calibre:'ETA 2801'}),watchItem('item-2',{calibre:'ETA 2801'})],work:[work,prior]};
  const rows=diagnosticIntelligence(work,state);
  assert.equal(rows.length,1);
  assert.ok(rows[0].score>48);
  assert.equal(rows[0].history.confirmed,1);
});

test('ruled-out Work history reduces confidence',()=>{
  const fault={id:'balance_staff',text:'Balance staff fault',category:'Balance',status:'possible'};
  const work={id:'work-1',itemId:'item-1',diagnosticFaults:[fault]};
  const prior={id:'work-2',itemId:'item-2',diagnosticFaults:[{id:'balance_staff',status:'ruledout'}]};
  const state={items:[watchItem('item-1',{maker:'Elgin',model:'Grade 249'}),watchItem('item-2',{maker:'Elgin',model:'Grade 249'})],work:[work,prior]};
  const h=faultHistory(work,state,fault);
  const rows=diagnosticIntelligence(work,state);
  assert.equal(h.ruledout,1);
  assert.ok(rows[0].score<48);
});

test('diagnostic intelligence exposes conservative suggested parts',()=>{
  const work={id:'work-1',itemId:'item-1',diagnosticFaults:[{id:'mainspring_broken',text:'Mainspring broken',category:'Barrel',status:'confirmed',severity:'Critical'}]};
  const [row]=diagnosticIntelligence(work,{items:[watchItem('item-1')],work:[work]});
  assert.ok(row.parts.some(x=>/mainspring/i.test(x)));
  assert.ok(row.inspect.length>0);
});
