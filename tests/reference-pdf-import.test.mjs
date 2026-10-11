import test from 'node:test';
import assert from 'node:assert/strict';
import {extractTechnicalReferenceCandidates} from '../js/reference-pdf-import.js';

test('technical reference parser carries calibre and page provenance',()=>{
  const rows=extractTechnicalReferenceCandidates([
    {page:1,text:'AS 1130\nBalance staff 1234\nMainspring 5678'},
    {page:2,text:'Escape wheel 9012'}
  ],{source:'factory',fileName:'AS 1130 parts.pdf'});
  assert.equal(rows.length,3);
  assert.equal(rows[0].calibre,'AS 1130');
  assert.equal(rows[0].partName,'Balance Staff');
  assert.equal(rows[0].partReference,'1234');
  assert.match(rows[0].sourceRef,/p\. 1$/);
  assert.equal(rows[2].calibre,'AS 1130');
  assert.match(rows[2].sourceRef,/p\. 2$/);
});

test('technical reference parser keeps cautious confidence',()=>{
  const [row]=extractTechnicalReferenceCandidates([{page:3,text:'ETA 2801-2\nCannon pinion 407'}],{source:'manual',fileName:'manual.pdf'});
  assert.ok(row.confidence<80);
  assert.ok(row.confidence>=50);
});

test('technical reference parser removes duplicate candidates on same page',()=>{
  const rows=extractTechnicalReferenceCandidates([{page:1,text:'FHF 96\nBalance staff 111\nBalance staff 111'}],{fileName:'sheet.pdf'});
  assert.equal(rows.length,1);
});
