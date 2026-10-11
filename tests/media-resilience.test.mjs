import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseMediaAsset} from '../js/media-model.js';
import {normaliseQueuedMediaUpload} from '../js/media-upload-queue.js';
import {mergeQueuedAssetIntoState} from '../js/media-queue-state.js';

test('media assets preserve a private thumbnail storage key',()=>{
  const asset=normaliseMediaAsset({id:'m1',itemId:'item-1',storageKey:'full.jpg',thumbnailStorageKey:'thumb.webp'});
  assert.equal(asset.thumbnailStorageKey,'thumb.webp');
});

test('queued media records keep a stable media id for retry',()=>{
  const record=normaliseQueuedMediaUpload({id:'media-stable',options:{mediaId:'media-stable'},status:'queued'});
  assert.equal(record.id,'media-stable');
  assert.equal(record.options.mediaId,'media-stable');
});

test('completed queued media attaches to its Item once',()=>{
  const state={items:[{id:'item-1',mediaAssets:[]}],workRecords:[{id:'work-1',itemId:'item-1'}]};
  const record={id:'media-1',asset:{id:'media-1',itemId:'item-1',workId:'work-1',storageKey:'full.jpg',thumbnailStorageKey:'thumb.webp',category:'identity'}};
  const first=mergeQueuedAssetIntoState(state,record),second=mergeQueuedAssetIntoState(state,record);
  assert.equal(first.changed,true);
  assert.equal(state.items[0].mediaAssets.length,1);
  assert.equal(state.items[0].mediaAssets[0].workId,'work-1');
  assert.equal(state.items[0].mediaAssets[0].thumbnailStorageKey,'thumb.webp');
  assert.equal(second.changed,false);
});
