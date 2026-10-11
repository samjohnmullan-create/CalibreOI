import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {donorDecisionSummary,donorCompatibilityAlerts} from '../js/donor-intelligence.js';

function baseState(){return {items:[
  {id:'target',type:'watch',title:'Target',purpose:'resale',identity:{maker:'AS'},watch:{passport:{movementMaker:'AS',calibre:'1130',movementMm:'29.4'}}},
  {id:'donor-a',type:'watch',title:'Complete donor A',purpose:'donor',status:'Acquired',identity:{maker:'AS'},commercial:{targetSale:300},watch:{passport:{movementMaker:'AS',calibre:'1130',movementMm:'29.4'},sparesParts:[]}},
  {id:'donor-b',type:'watch',title:'Donor B',purpose:'donor',status:'Acquired',identity:{maker:'AS'},commercial:{purchasePrice:30},watch:{passport:{movementMaker:'AS',calibre:'1130',movementMm:'29.4'},sparesParts:[{name:'Balance staff',keep:true}]}}
],work:[{id:'work-1',itemId:'target',status:'Waiting',diagnosis:'Needs balance staff',partIds:['need-1']}],inventory:{parts:[],tools:[],consumables:[],donors:[],locations:[]},compatibilityEvidence:[]};}

test('high-value complete donor is protected until fit is verified',()=>{const state=baseState(),summary=donorDecisionSummary(state.work[0],state),row=summary.donors.find(x=>x.item.id==='donor-a');assert.equal(row.risk.level,'high');assert.equal(row.action,'protect-donor');assert.match(row.decisionWhy,/not bench-verified/);});

test('similar loose stock candidate is preferred over sacrificing donor',()=>{const state=baseState();state.inventory.parts.push({id:'stock-1',name:'Balance staff AS 1130',calibre:'1130',status:'stock',quantity:1});const summary=donorDecisionSummary(state.work[0],state),row=summary.donors.find(x=>x.item.id==='donor-b');assert.equal(row.action,'prefer-loose-stock');assert.ok(summary.bestStock.score>=60);});

test('bench-verified low-risk donor can become a good donor',()=>{const state=baseState();state.compatibilityEvidence.push({id:'fit-1',recordType:'bench-fit',sourceType:'donorItem',sourceId:'donor-b',sourceKey:'donorItem:donor-b:',targetWorkId:'work-1',targetKey:'1130',result:'verified',at:'2026-10-11T00:00:00Z'});const summary=donorDecisionSummary(state.work[0],state),row=summary.donors.find(x=>x.item.id==='donor-b');assert.equal(row.verified,true);assert.equal(row.action,'good-donor');});

test('same-calibre owned donors create combine lead, not proof',()=>{const alerts=donorCompatibilityAlerts(baseState());assert.equal(alerts[0].kind,'same-calibre');assert.equal(alerts[0].score,95);assert.match(alerts[0].why,/physical verification/);});

test('donor intelligence runtime stays on Parts and Workbench',()=>{const auto=readFileSync(new URL('../js/cloud-auto.js',import.meta.url),'utf8'),runtime=readFileSync(new URL('../js/donor-intelligence-runtime.js',import.meta.url),'utf8');assert.match(auto,/\['suppliers\.html','workbench\.html'\].*donor-intelligence-runtime/);assert.match(runtime,/Use the cheapest sensible source/);assert.match(runtime,/Potential combine opportunities/);});
