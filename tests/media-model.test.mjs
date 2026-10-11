import test from 'node:test';
import assert from 'node:assert/strict';
import {blankMediaAsset,normaliseMediaAsset,mediaAssetHasFile,mediaForItem,mediaForWork,coverMedia,attachMediaToItem} from '../js/media-model.js';

test('media ownership is Item plus optional Work',()=>{
  const asset=blankMediaAsset({itemId:'item-1',workId:'work-1',storageKey:'a/b.jpg',role:'movement'});
  assert.equal(asset.itemId,'item-1');
  assert.equal(asset.workId,'work-1');
  assert.equal(mediaAssetHasFile(asset),true);
});

test('media queries resolve canonical Item and Work ownership',()=>{
  const assets=[blankMediaAsset({id:'a',itemId:'item-1',workId:'work-1',storageKey:'a.jpg'}),blankMediaAsset({id:'b',itemId:'item-2',storageKey:'b.jpg'})];
  assert.deepEqual(mediaForItem(assets,'item-1').map(x=>x.id),['a']);
  assert.deepEqual(mediaForWork(assets,'work-1').map(x=>x.id),['a']);
});

test('cover media and Item attachment are stable',()=>{
  const item={id:'item-1',mediaAssets:[]},asset=normaliseMediaAsset({id:'a',storageKey:'a.jpg',isCover:true});
  attachMediaToItem(item,asset);
  attachMediaToItem(item,asset);
  assert.equal(item.mediaAssets.length,1);
  assert.equal(item.mediaAssets[0].itemId,'item-1');
  assert.equal(coverMedia(item.mediaAssets).id,'a');
});
