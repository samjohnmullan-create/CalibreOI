import test from 'node:test';
import assert from 'node:assert/strict';
import { qrEntityCode, parseQrEntityCode, qrRouteForEntity, qrPayloadForEntity, resolveQrPayload, itemQrIdentity } from '../js/qr-inventory.js';

test('QR entity codes are stable and parseable',()=>{
  const code=qrEntityCode('item','item-123');
  assert.equal(code,'CAL:1:item:item-123');
  assert.deepEqual(parseQrEntityCode(code),{version:'1',type:'item',id:'item-123'});
});

test('Item and Work QR routes preserve full IDs',()=>{
  assert.equal(qrRouteForEntity('item','item 1'),'item.html?id=item%201&from=qr');
  assert.equal(qrRouteForEntity('work','work/2'),'work.html?id=work%2F2&from=qr');
});

test('absolute QR payloads remain app routes',()=>{
  assert.equal(qrPayloadForEntity('item','item-1',{origin:'https://calibre.example/'}),'https://calibre.example/item.html?id=item-1&from=qr');
});

test('QR resolver accepts codes and item URLs',()=>{
  assert.equal(resolveQrPayload('CAL:1:work:work-9').route,'work.html?id=work-9&from=qr');
  const resolved=resolveQrPayload('https://calibre.example/item.html?id=item-7&from=qr');
  assert.equal(resolved.type,'item');
  assert.equal(resolved.id,'item-7');
});

test('Item QR identity is deterministic',()=>{
  assert.deepEqual(itemQrIdentity({id:'item-5'}),{code:'CAL:1:item:item-5',route:'item.html?id=item-5&from=qr'});
  assert.equal(itemQrIdentity({}),null);
});
