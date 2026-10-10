import test from 'node:test';
import assert from 'node:assert/strict';
import { qrEntityCode, resolveQrPayload, qrPayloadForEntity } from '../js/qr-inventory.js';

test('scanner resolves a permanent Item code to the Item page',()=>{
  const resolved=resolveQrPayload(qrEntityCode('item','item-abc'));
  assert.equal(resolved.type,'item');
  assert.equal(resolved.route,'item.html?id=item-abc&from=qr');
});

test('scanner accepts an absolute Item scan target',()=>{
  const url=qrPayloadForEntity('item','item-abc',{origin:'https://app.calibreco.com.au'});
  const resolved=resolveQrPayload(url);
  assert.equal(resolved.id,'item-abc');
  assert.equal(resolved.route,'item.html?id=item-abc&from=qr');
});
