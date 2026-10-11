import test from 'node:test';
import assert from 'node:assert/strict';
import {BACKUP_VERSION,appendAuditEvent,auditEvents,buildBackupPayload,portableCoreState,stateCounts,validateBackupPayload} from '../js/reliability.js';

function state(){return {schemaVersion:6,currentItemId:'i1',currentWorkId:'w1',items:[{id:'i1',title:'Watch'}],work:[{id:'w1',itemId:'i1'}],mediaAssets:[{id:'m1',itemId:'i1',storageKey:'private/a.jpg'}],inventory:{parts:[{id:'p1'}],tools:[{id:'t1'}],consumables:[],donors:[],locations:[{id:'l1'}]},compatibilityEvidence:[],incoming:[],knowledge:[{id:'k1'}],ledger:[],settings:{},updatedAt:'2026-10-11T12:00:00.000Z'};}

test('portable backup contains canonical Core only',()=>{const raw={...state(),jobs:[{id:'legacy'}],_cloud:{signedIn:true},_syncUpdatedAt:'later'};const portable=portableCoreState(raw);assert.equal(portable.schemaVersion,6);assert.equal(Object.hasOwn(portable,'jobs'),false);assert.equal(Object.hasOwn(portable,'_cloud'),false);assert.equal(Object.hasOwn(portable,'_syncUpdatedAt'),false);assert.equal(portable.mediaAssets[0].id,'m1');});

test('backup payload round-trips with checksum',()=>{const payload=buildBackupPayload(state(),{exportedAt:'2026-10-11T12:30:00.000Z'});assert.equal(payload.version,BACKUP_VERSION);assert.match(payload.checksum,/^fnv1a-/);const checked=validateBackupPayload(payload);assert.equal(checked.ok,true);assert.equal(checked.state.items[0].id,'i1');});

test('backup checksum detects changed content',()=>{const payload=buildBackupPayload(state(),{exportedAt:'2026-10-11T12:30:00.000Z'});payload.state.items[0].title='Tampered';const checked=validateBackupPayload(payload);assert.equal(checked.ok,false);assert.ok(checked.errors.some(x=>x.includes('checksum')));});

test('audit history is bounded and newest first',()=>{const s=state();appendAuditEvent(s,{id:'a1',at:'2026-10-11T10:00:00.000Z',summary:'First'});appendAuditEvent(s,{id:'a2',at:'2026-10-11T11:00:00.000Z',summary:'Second'});assert.deepEqual(auditEvents(s).map(x=>x.id),['a2','a1']);assert.equal(s.settings.reliability.auditTrail.length,2);});

test('state counts cover canonical inventory and knowledge',()=>{assert.deepEqual(stateCounts(state()),{items:1,work:1,media:1,parts:1,tools:1,consumables:0,donors:0,locations:1,incoming:0,knowledge:1,ledger:0});});
