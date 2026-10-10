import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseWorkshopAsset, workshopAssets, upsertWorkshopAsset, assetById } from '../js/workshop-assets.js';

test('workshop assets normalise supported physical entity types',()=>{
  const tray=normaliseWorkshopAsset({id:'tray-1',type:'tray',name:'Balance staffs',location:'Drawer 4'});
  assert.equal(tray.type,'tray');
  assert.equal(tray.location,'Drawer 4');
});

test('unsupported workshop asset types fall back safely',()=>{
  assert.equal(normaliseWorkshopAsset({id:'x',type:'watch'}).type,'tray');
});

test('upsert is stable by workshop asset id',()=>{
  const state={workshopAssets:[]};
  upsertWorkshopAsset(state,{id:'tool-1',type:'tool',name:'Staking set'});
  upsertWorkshopAsset(state,{id:'tool-1',type:'tool',name:'Bergeon staking set',location:'Bench shelf'});
  assert.equal(state.workshopAssets.length,1);
  assert.equal(assetById(state,'tool-1').name,'Bergeon staking set');
  assert.equal(workshopAssets(state)[0].location,'Bench shelf');
});
