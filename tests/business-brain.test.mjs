import test from 'node:test';
import assert from 'node:assert/strict';
import {priorityForItem,rankWorkNext,businessSnapshot} from '../js/business-brain.js';

const now=Date.parse('2026-10-12T00:00:00Z');
const item=(id,overrides={})=>({id,purpose:'resale',status:'Acquired',createdAt:'2026-08-01T00:00:00Z',commercial:{purchasePrice:100,targetSale:300,labourMinutes:120,labourRate:30,...(overrides.commercial||{})},...overrides});

test('ready-to-list profitable item outranks blocked item',()=>{
  const ready=item('ready',{status:'Ready to list'});
  const blocked=item('blocked',{commercial:{purchasePrice:200,targetSale:600,labourMinutes:90,labourRate:30}});
  const state={items:[blocked,ready],work:[{id:'w1',itemId:'blocked',status:'Waiting',blocker:'Awaiting balance staff'}]};
  const ranked=rankWorkNext(state,now);
  assert.equal(ranked[0].item.id,'ready');
  assert.equal(ranked.find(x=>x.item.id==='blocked').p.work.blocked,true);
});

test('missing target lowers confidence and records reason',()=>{
  const row=item('x',{commercial:{purchasePrice:80,targetSale:0}});
  const p=priorityForItem({items:[row],work:[]},row,now);
  assert.equal(p.confidence,'low');
  assert.ok(p.reasons.some(r=>r.includes('target sale')));
});

test('business snapshot separates stock and sold economics',()=>{
  const stock=item('stock');
  const sold=item('sold',{status:'Sold',commercial:{purchasePrice:50,targetSale:120,actualSale:140,labourMinutes:0,labourRate:0}});
  const snap=businessSnapshot({items:[stock,sold]},now);
  assert.equal(snap.stockCount,1);
  assert.equal(snap.soldCount,1);
  assert.equal(snap.capital,100);
  assert.equal(snap.realised,90);
});
