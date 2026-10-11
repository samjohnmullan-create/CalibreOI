import test from 'node:test';
import assert from 'node:assert/strict';
import {itemMedia,workMedia} from '../js/media-state.js';

test('Item media query uses the canonical Item media library',()=>{
  const state={items:[{id:'item-1',mediaAssets:[{id:'a',itemId:'item-1',workId:'work-1',storageKey:'a.jpg'},{id:'b',itemId:'item-1',workId:'',storageKey:'b.jpg'}]},{id:'item-2',mediaAssets:[{id:'c',itemId:'item-2',workId:'work-2',storageKey:'c.jpg'}]}]};
  assert.deepEqual(itemMedia(state,'item-1').map(x=>x.id),['a','b']);
});

test('Work media query searches canonical Item media',()=>{
  const state={items:[{id:'item-1',mediaAssets:[{id:'a',itemId:'item-1',workId:'work-1',storageKey:'a.jpg'}]},{id:'item-2',mediaAssets:[{id:'c',itemId:'item-2',workId:'work-2',storageKey:'c.jpg'}]}]};
  assert.deepEqual(workMedia(state,'work-2').map(x=>x.id),['c']);
  assert.deepEqual(workMedia(state,'missing'),[]);
});
