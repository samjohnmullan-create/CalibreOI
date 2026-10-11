import test from 'node:test';
import assert from 'node:assert/strict';
import {STORE_SCHEMA_VERSION,canonicalState,migratePersistedState} from '../js/store-base.js';
import {workshopAssets,upsertWorkshopAsset} from '../js/workshop-assets.js';

test('schema 5 workshop assets migrate into canonical inventory resources',()=>{
  const old={schemaVersion:5,items:[],work:[],incoming:[],ledger:[],compatibilityEvidence:[],knowledge:[],inventory:{parts:[],tools:[],consumables:[],donors:[]},workshopAssets:[
    {id:'tray-1',type:'tray',name:'Balance tray',location:'Cabinet A / Drawer 2'},
    {id:'tool-1',type:'tool',name:'Staking set',location:'Bench shelf'},
    {id:'part-1',type:'part',name:'Staff stock',partName:'Balance staff',calibre:'AS 1130',quantity:3,location:'Tray 1',donorJobId:'job-old'}
  ]};
  const migrated=migratePersistedState(old);
  assert.equal(migrated.schemaVersion,STORE_SCHEMA_VERSION);
  assert.equal('workshopAssets' in migrated,false);
  assert.equal(migrated.inventory.locations[0].id,'tray-1');
  assert.equal(migrated.inventory.tools[0].id,'tool-1');
  assert.equal(migrated.inventory.parts[0].id,'part-1');
  assert.equal(migrated.inventory.parts[0].storageLocation,'Tray 1');
  assert.equal(migrated.inventory.parts[0].legacyWorkRef,'job-old');
  assert.equal('donorJobId' in migrated.inventory.parts[0],false);
});

test('Workshop IDs reads and writes canonical inventory only',()=>{
  const state=canonicalState({schemaVersion:6,items:[],work:[],incoming:[],ledger:[],compatibilityEvidence:[],knowledge:[],inventory:{parts:[],tools:[],consumables:[],donors:[],locations:[]}});
  upsertWorkshopAsset(state,{type:'tray',name:'Drawer 4',location:'Cabinet A'});
  upsertWorkshopAsset(state,{type:'tool',name:'Microscope',location:'Bench'});
  upsertWorkshopAsset(state,{type:'part',name:'Staff',partName:'Balance staff',quantity:2,location:'Drawer 4'});
  const rows=workshopAssets(state);
  assert.equal(rows.length,3);
  assert.equal(state.inventory.locations.length,1);
  assert.equal(state.inventory.tools.length,1);
  assert.equal(state.inventory.parts.length,1);
  assert.equal('workshopAssets' in state,false);
});
