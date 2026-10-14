import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Sale workspace resolves Item and Work instead of current pseudo-Job',()=>{
  const html=read('sales.html');
  assert.match(html,/resolveSaleContext/);
  assert.match(html,/recordSold/);
  assert.doesNotMatch(html,/\bcurrent\(state\)/);
  assert.doesNotMatch(html,/job\.business|job\.passport|job\.photos/);
});

test('Listing and channel strategy use canonical Item ownership',()=>{
  const listing=read('js/listing-pack.js'),channels=read('js/channel-strategy.js');
  assert.match(listing,/mountListingPack\(\{item,work,save\}\)/);
  assert.match(listing,/privateMediaThumbnailObjectUrl/);
  assert.doesNotMatch(listing,/job\?\.photos|job\.business|job\.passport/);
  assert.match(channels,/mountChannelStrategy\(\{item,work,save\}\)/);
  assert.match(channels,/item\.commercial/);
  assert.doesNotMatch(channels,/job\.business|job\?\.passport/);
});

test('Public catalogue and Square checkout are keyed to Item id',()=>{
  const publish=read('js/publish-controls.js'),square=read('js/square-storefront-runtime.js');
  assert.match(publish,/watch_id:item\.id/);
  assert.match(publish,/itemId:item\.id/);
  assert.match(publish,/saleReadiness\(item,work,state\)/);
  assert.match(square,/resolveSaleContext/);
  assert.match(square,/watch_id',item\.id|watch_id",item\.id|watch_id', item\.id/);
  assert.doesNotMatch(square,/\bcurrent\(state\)|job\.id/);
});

test('Sold public sync closes public availability and checkout',()=>{
  const source=read('js/sold-public-sync.js'),runtime=read('js/sale-readiness-runtime.js');
  assert.match(source,/status:'sold'/);
  assert.match(source,/availability:'sold'/);
  assert.match(source,/checkout:null/);
  assert.match(runtime,/sold-public-sync\.js/);
});
