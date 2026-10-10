import test from 'node:test';
import assert from 'node:assert/strict';
import { blankMediaAsset, normaliseMediaAsset, mediaAssetHasFile, mediaForItem, mediaForWork, coverMedia, attachMediaToItem } from '../js/media-model.js';

test('legacy watch/job fields are preserved while canonical item ownership is added',()=>{
  const asset=blankMediaAsset({id:'m1',watchId:'item-1',jobId:'JOB-1',category:'identity',storageKey:'u/item-1/identity/a.jpg'});
  assert.equal(asset.itemId,'item-1');
  assert.equal(asset.legacyWatchId,'item-1');
  assert.equal(asset.legacyJobId,'JOB-1');
  assert.equal(asset.visibility,'private');
});

test('normalisation constrains category and visibility',()=>{
  const asset=normaliseMediaAsset({id:'m1',category:'nonsense',visibility:'secret'});
  assert.equal(asset.category,'workshop');
  assert.equal(asset.visibility,'private');
});

test('media queries use permanent item and work ids',()=>{
  const assets=[
    {id:'a',itemId:'item-1',workId:'work-1',storageKey:'a.jpg'},
    {id:'b',itemId:'item-2',workId:'work-2',storageKey:'b.jpg'}
  ];
  assert.deepEqual(mediaForItem(assets,'item-1').map(x=>x.id),['a']);
  assert.deepEqual(mediaForWork(assets,'work-2').map(x=>x.id),['b']);
});

test('cover selection prefers explicit cover then sale media',()=>{
  assert.equal(coverMedia([{id:'a',category:'identity',storageKey:'a'},{id:'b',category:'sale',storageKey:'b'}]).id,'b');
  assert.equal(coverMedia([{id:'a',category:'identity',storageKey:'a',isCover:true},{id:'b',category:'sale',storageKey:'b'}]).id,'a');
});

test('attaching media is idempotent by id or storage key',()=>{
  const item={id:'item-1',mediaAssets:[]};
  attachMediaToItem(item,{id:'m1',storageKey:'a.jpg'});
  attachMediaToItem(item,{id:'m1',storageKey:'a.jpg',caption:'updated'});
  assert.equal(item.mediaAssets.length,1);
  assert.equal(item.mediaAssets[0].itemId,'item-1');
  assert.equal(item.mediaAssets[0].caption,'updated');
  assert.equal(mediaAssetHasFile(item.mediaAssets[0]),true);
});
