import test from 'node:test';
import assert from 'node:assert/strict';
import { safeCheckoutUrl, normaliseCheckout, squareCheckoutForPublication, checkoutReady } from '../js/storefront-commerce.js';

test('accepts only https checkout URLs',()=>{
  assert.equal(safeCheckoutUrl('http://square.link/test'),'');
  assert.equal(safeCheckoutUrl('not a url'),'');
  assert.match(safeCheckoutUrl('https://square.link/u/example'),/^https:\/\//);
});

test('Square checkout is only published for for-sale records',()=>{
  const url='https://square.link/u/example';
  assert.deepEqual(squareCheckoutForPublication('for_sale',url),{provider:'square',url});
  assert.equal(squareCheckoutForPublication('catalogue',url),null);
  assert.equal(squareCheckoutForPublication('sold',url),null);
});

test('checkout readiness requires Square, https and for-sale status',()=>{
  const publicData={checkout:{provider:'square',url:'https://square.link/u/example'}};
  assert.equal(checkoutReady(publicData,'for_sale'),true);
  assert.equal(checkoutReady(publicData,'sold'),false);
  assert.equal(normaliseCheckout({provider:'other',url:'https://example.com'}),null);
});
