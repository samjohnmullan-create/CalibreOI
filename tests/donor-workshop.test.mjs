import test from 'node:test';
import assert from 'node:assert/strict';
import { donorPartStorage, storageLocationForAsset, storeDonorPart, consumeStoredDonorPart } from '../js/donor-workshop.js';

test('stores a legacy donor part in a tray without duplicating it',()=>{
  const state={workshopAssets:[{id:'tray-1',type:'tray',name:'Balance tray',location:'Drawer 4'}]};
  const a=storeDonorPart(state,{donorJobId:'job-1',partId:'balance',partName:'Balance complete',trayId:'tray-1',calibre:'249'});
  const b=storeDonorPart(state,{donorJobId:'job-1',partId:'balance',partName:'Balance complete',trayId:'tray-1',calibre:'249'});
  assert.equal(a.id,b.id);
  assert.equal(state.workshopAssets.filter(x=>x.type==='part').length,1);
  assert.equal(donorPartStorage(state,{donorJobId:'job-1',partId:'balance'}).donorPartId,'balance');
  assert.equal(storageLocationForAsset(state,a),'Balance tray · Drawer 4');
});

test('donor Item storage uses the permanent Item id',()=>{
  const state={workshopAssets:[]};
  const asset=storeDonorPart(state,{donorItemId:'item-22',partId:'stem',partName:'Stem',location:'Drawer 2'});
  assert.equal(asset.donorItemId,'item-22');
  assert.equal(asset.donorJobId,'');
  assert.equal(donorPartStorage(state,{donorItemId:'item-22',partId:'stem'}).id,asset.id);
});

test('consuming a stored donor part retires zero quantity stock',()=>{
  const state={workshopAssets:[]};
  storeDonorPart(state,{donorJobId:'job-1',partId:'staff',partName:'Balance staff',quantity:1});
  const asset=consumeStoredDonorPart(state,{donorJobId:'job-1',partId:'staff'});
  assert.equal(asset.quantity,0);
  assert.equal(asset.status,'Consumed');
});
