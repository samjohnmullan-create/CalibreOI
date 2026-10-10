import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnosticIntelligence, faultHistory } from '../js/diagnostic-intelligence.js';

test('same-calibre confirmed history boosts a fault',()=>{
  const job={id:'j1',passport:{calibre:'ETA 2801'},diagnosticFaults:[{id:'balance_staff',text:'Balance staff fault',category:'Balance',status:'possible',severity:'Parts required'}]};
  const prior={id:'j2',watchName:'Prior',passport:{calibre:'ETA 2801'},diagnosticFaults:[{id:'balance_staff',status:'confirmed'}]};
  const rows=diagnosticIntelligence(job,{jobs:[job,prior]});
  assert.equal(rows.length,1);
  assert.ok(rows[0].score>48);
  assert.equal(rows[0].history.confirmed,1);
});

test('ruled-out history reduces confidence',()=>{
  const job={id:'j1',passport:{maker:'Elgin',model:'Grade 249'},diagnosticFaults:[{id:'balance_staff',text:'Balance staff fault',category:'Balance',status:'possible'}]};
  const prior={id:'j2',passport:{maker:'Elgin',model:'Grade 249'},diagnosticFaults:[{id:'balance_staff',status:'ruledout'}]};
  const h=faultHistory(job,{jobs:[job,prior]},job.diagnosticFaults[0]);
  const rows=diagnosticIntelligence(job,{jobs:[job,prior]});
  assert.equal(h.ruledout,1);
  assert.ok(rows[0].score<48);
});

test('diagnostic intelligence exposes conservative suggested parts',()=>{
  const job={id:'j1',passport:{},diagnosticFaults:[{id:'mainspring_broken',text:'Mainspring broken',category:'Barrel',status:'confirmed',severity:'Critical'}]};
  const [row]=diagnosticIntelligence(job,{jobs:[job]});
  assert.ok(row.parts.some(x=>/mainspring/i.test(x)));
  assert.ok(row.inspect.length>0);
});
