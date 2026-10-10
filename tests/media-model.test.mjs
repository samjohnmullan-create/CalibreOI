import test from 'node:test';
import assert from 'node:assert/strict';
import { blankMediaAsset, normaliseMediaAsset, mediaAssetHasFile, mediaForItem, mediaForLegacyWatch, mediaForWork, coverMedia, attachMediaToItem } from '../js/media-model.js';

test('legacy watch/job fields are preserved without inventing an Item link',()=>{
  const asset=blankMediaAsset({id:'m1',watchId:'legacy-watch-1',jobId:'JOB-1',category:'identity',storageKey:'u/legacy-watch-1/identity/a.jpg'});
  assert.equal(asset.itemId,'');
  assert.equal(asset.legacyWatchId,'legacy-watch-1');
  assert.equal(asset.legacyJobId,'JOB-1');
  assert.equal(asset.visibility,'private');
});

test('explicit permanent Item ownership is retained',()=>{
  const asset=blankMediaAsset({id:'m1',itemId:'item-1',watchId:'legacy-watch-1',storageKey:'a.jpg'});
  assert.equal(asset.itemId,'item-1');
  assert.equal(asset.legacyWatchId,'legacy-watch-1');
});

test('normalisation constrains category and visibility',()=>{
  const asset=normaliseMediaAsset({id:'m1',category:'nonsense',visibility:'secret'});
  assert.equal(asset.category,'workshop');
  assert.equal(asset.visibility,'private');
});

test('media queries distinguish permanent Item, legacy watch and Work ids',()=>{
  const assets=[
    {id:'a',itemId:'item-1',legacyWatchId:'legacy-1',workId:'work-1',storageKey:'a.jpg'},
    {id:'b',itemId:'item-2',legacyWatchId:'legacy-2',workId:'work-2',storageKey:'b.jpg'}
  ];
  assert.deepEqual(mediaForItem(assets,'item-1').map(x=>x.id),['a']);
  assert.deepEqual(mediaForLegacyWatch(assets,'legacy-2').map(x=>x.id),['b']);
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
