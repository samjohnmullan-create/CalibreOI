import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseMediaAsset } from '../js/media-model.js';
import { normaliseQueuedMediaUpload } from '../js/media-upload-queue.js';
import { mergeQueuedAssetIntoState } from '../js/media-queue-state.js';

test('media assets preserve a private thumbnail storage key',()=>{
  const asset=normaliseMediaAsset({id:'m1',storageKey:'full.jpg',thumbnailStorageKey:'thumb.webp'});
  assert.equal(asset.thumbnailStorageKey,'thumb.webp');
});

test('queued media records keep a stable media id for retry',()=>{
  const record=normaliseQueuedMediaUpload({id:'media-stable',options:{mediaId:'media-stable'},status:'queued'});
  assert.equal(record.id,'media-stable');
  assert.equal(record.options.mediaId,'media-stable');
});

test('completed queued media is attached to legacy job and permanent item once',()=>{
  const state={jobs:[{id:'watch-1',jobId:'JOB-1',watchName:'Test watch',jobType:'watch',passport:{},business:{},mediaAssets:[]}],items:[]};
  const record={id:'media-1',options:{watchId:'watch-1'},asset:{id:'media-1',legacyWatchId:'watch-1',legacyJobId:'JOB-1',storageKey:'full.jpg',thumbnailStorageKey:'thumb.webp',category:'identity'}};
  const first=mergeQueuedAssetIntoState(state,record);
  const second=mergeQueuedAssetIntoState(state,record);
  assert.equal(first.changed,true);
  assert.equal(state.jobs[0].mediaAssets.length,1);
  assert.equal(state.items.length,1);
  assert.equal(state.items[0].mediaAssets.length,1);
  assert.equal(state.items[0].mediaAssets[0].thumbnailStorageKey,'thumb.webp');
  assert.equal(state.jobs[0].itemId,state.items[0].id);
  assert.equal(second.changed,false);
});
