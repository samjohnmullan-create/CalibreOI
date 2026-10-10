import test from 'node:test';
import assert from 'node:assert/strict';
import { shortItemId, labelRecord, labelSheetItems } from '../js/qr-label-layout.js';

test('short Item IDs stay readable on small labels',()=>{
  assert.equal(shortItemId('item-123'),'item-123');
  assert.equal(shortItemId('item-abcdefghijklmnopqrstuvwxyz'),'…qrstuvwxyz');
});

test('label records preserve title and storage location',()=>{
  const row=labelRecord({id:'item-1',type:'watch',title:'Olma Caravelle',storageLocation:'Tray A3'});
  assert.equal(row.title,'Olma Caravelle');
  assert.equal(row.location,'Tray A3');
  assert.equal(row.type,'watch');
});

test('label sheets ignore records without permanent IDs',()=>{
  const rows=labelSheetItems([{id:'item-1',title:'One'},{title:'No ID'}]);
  assert.equal(rows.length,1);
  assert.equal(rows[0].id,'item-1');
});
