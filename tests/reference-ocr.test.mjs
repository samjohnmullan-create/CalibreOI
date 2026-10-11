import test from 'node:test';
import assert from 'node:assert/strict';
import {ocrPageLimit,ocrConfidence,summariseOcrPages} from '../js/reference-ocr.js';

test('OCR page limits protect mobile and desktop devices',()=>{
  assert.equal(ocrPageLimit({mobile:false,requested:50,total:80}),12);
  assert.equal(ocrPageLimit({mobile:true,requested:50,total:80}),6);
  assert.equal(ocrPageLimit({mobile:false,requested:4,total:80}),4);
  assert.equal(ocrPageLimit({mobile:false,requested:12,total:3}),3);
});

test('OCR confidence is clamped to a sane percentage',()=>{
  assert.equal(ocrConfidence(91.6),92);
  assert.equal(ocrConfidence(-2),0);
  assert.equal(ocrConfidence(140),100);
  assert.equal(ocrConfidence('bad'),0);
});

test('OCR summary only averages pages that produced text',()=>{
  const summary=summariseOcrPages([
    {page:1,text:'AS 1130 Balance staff 1234',confidence:82},
    {page:2,text:'',confidence:4},
    {page:3,text:'Mainspring 4567',confidence:68}
  ]);
  assert.equal(summary.pages,3);
  assert.equal(summary.usable,2);
  assert.equal(summary.averageConfidence,75);
  assert.ok(summary.characters>20);
});
