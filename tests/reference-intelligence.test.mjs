import test from 'node:test';
import assert from 'node:assert/strict';
import {addReferenceFact,relevantReferenceFacts} from '../js/reference-intelligence.js';

test('factory and documented reference facts rank against the active calibre',()=>{
  const state={items:[{id:'item-1',identity:{maker:'AS'},watch:{passport:{calibre:'1130'}}}],inventory:{parts:[]},knowledge:[]};
  const work={id:'work-1',itemId:'item-1',title:'Replace balance staff',diagnosis:'Broken balance staff',partIds:[]};
  addReferenceFact(state,{source:'factory',relation:'fits',calibre:'AS 1130',partName:'Balance staff',partReference:'staff-12',confidence:95});
  addReferenceFact(state,{source:'other',relation:'note',calibre:'ETA 2824',partName:'Rotor',confidence:40});
  const rows=relevantReferenceFacts(work,state);
  assert.equal(rows.length,1);
  assert.equal(rows[0].fact.partReference,'staff-12');
  assert.equal(rows[0].fact.recordType,'reference-fact');
  assert.ok(rows[0].score>=80);
});

test('related donor calibre can surface as sourced evidence',()=>{
  const state={items:[{id:'item-1',watch:{passport:{calibre:'AS 1130A'}}}],inventory:{parts:[]},knowledge:[]};
  const work={id:'work-1',itemId:'item-1',title:'Find donor',diagnosis:'Needs winding pinion',partIds:[]};
  addReferenceFact(state,{source:'ranfft',relation:'donor',calibre:'AS 1130',relatedCalibre:'AS 1130A',partName:'Winding pinion',confidence:80,sourceUrl:'https://ranfft.org/'});
  const rows=relevantReferenceFacts(work,state);
  assert.equal(rows[0].fact.source,'ranfft');
  assert.ok(rows[0].why.some(x=>x.includes('related')));
});
