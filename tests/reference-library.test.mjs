import test from 'node:test';
import assert from 'node:assert/strict';
import {upsertReferenceDocument,factsForReferenceDocument,referenceDocumentStats,searchReferenceDocuments} from '../js/reference-library.js';
import {normaliseReferenceFact} from '../js/reference-intelligence.js';
import {PRIMARY_NAV,primaryHomeForPage} from '../js/navigation-model.js';

test('reference documents deduplicate by source URL or filename',()=>{
  const state={referenceDocuments:[]};
  const a=upsertReferenceDocument(state,{title:'AS 1130 parts sheet',source:'factory',sourceUrl:'https://example.com/as1130.pdf',fileName:'as1130.pdf'});
  const b=upsertReferenceDocument(state,{title:'AS 1130 revised',source:'factory',sourceUrl:'https://example.com/as1130.pdf',fileName:'renamed.pdf',status:'processed'});
  assert.equal(state.referenceDocuments.length,1);
  assert.equal(a.id,b.id);
  assert.equal(state.referenceDocuments[0].status,'processed');
});

test('reference facts link to a stable document id',()=>{
  const state={referenceDocuments:[],referenceFacts:[]};
  const doc=upsertReferenceDocument(state,{title:'BestFit 111A',source:'catalogue',fileName:'bestfit-111a.pdf'});
  state.referenceFacts.push(normaliseReferenceFact({documentId:doc.id,source:'catalogue',sourceName:'bestfit-111a.pdf',calibre:'AS 1130',partName:'Balance staff'}));
  assert.equal(factsForReferenceDocument(doc,state).length,1);
  assert.equal(factsForReferenceDocument(doc,state)[0].documentId,doc.id);
});

test('legacy filename provenance still counts toward a library document',()=>{
  const state={referenceDocuments:[],referenceFacts:[]};
  const doc=upsertReferenceDocument(state,{title:'Felsa sheet',source:'manual',fileName:'felsa-690.pdf'});
  state.referenceFacts.push(normaliseReferenceFact({source:'manual',sourceName:'felsa-690.pdf',calibre:'Felsa 690',partName:'Mainspring'}));
  assert.equal(factsForReferenceDocument(doc,state).length,1);
});

test('library search and stats expose useful review state',()=>{
  const state={referenceDocuments:[],referenceFacts:[{id:'f1'}]};
  upsertReferenceDocument(state,{title:'AS 1130 parts',maker:'A. Schild',calibreRange:'AS 1130',source:'factory',documentType:'parts-sheet',status:'processed'});
  upsertReferenceDocument(state,{title:'Felsa 690 manual',maker:'Felsa',calibreRange:'690',source:'manual',documentType:'service-manual',status:'queued'});
  assert.equal(searchReferenceDocuments(state,'1130').length,1);
  assert.equal(searchReferenceDocuments(state,'',{source:'manual'}).length,1);
  assert.deepEqual(referenceDocumentStats(state),{documents:2,processed:1,partial:0,queued:1,facts:1});
});

test('Reference Library belongs under Calibre without expanding primary navigation',()=>{
  assert.equal(PRIMARY_NAV.length,5);
  assert.equal(primaryHomeForPage('reference-library.html'),'calibre');
});
