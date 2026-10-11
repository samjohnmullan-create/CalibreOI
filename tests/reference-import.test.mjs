import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReferenceCsv,parseReferenceJson,validateReferenceImport,importReferenceFacts,validateReferenceImportForState} from '../js/reference-import.js';

test('CSV parser handles quoted commas',()=>{
  const rows=parseReferenceCsv('source,relation,calibre,partName,notes\nfactory,fits,AS 1130,"Balance staff","Factory sheet, page 4"\n');
  assert.equal(rows.length,1);
  assert.equal(rows[0].notes,'Factory sheet, page 4');
});

test('JSON parser accepts array and referenceFacts wrapper',()=>{
  assert.equal(parseReferenceJson('[{"calibre":"1130"}]').length,1);
  assert.equal(parseReferenceJson('{"referenceFacts":[{"calibre":"1130"}]}').length,1);
});

test('validation deduplicates existing and repeated reference facts',()=>{
  const existing=[{source:'factory',relation:'fits',calibre:'AS 1130',relatedCalibre:'',partName:'Balance staff',partReference:'1234',sourceRef:'sheet 1'}];
  const rows=[{...existing[0]},{source:'factory',relation:'fits',calibre:'AS 1130',partName:'Escape wheel',partReference:'5678',sourceRef:'sheet 1'},{source:'factory',relation:'fits',calibre:'AS 1130',partName:'Escape wheel',partReference:'5678',sourceRef:'sheet 1'},{source:'other',relation:'note',notes:'nothing identifying'}];
  const report=validateReferenceImport(rows,existing);
  assert.equal(report.valid.length,1);
  assert.equal(report.duplicates.length,2);
  assert.equal(report.rejected.length,1);
});

test('state-aware validation reads canonical reference facts from knowledge',()=>{
  const state={knowledge:[{id:'fact-1',recordType:'reference-fact',source:'factory',relation:'fits',calibre:'AS 1130',relatedCalibre:'',partName:'Balance staff',partReference:'1234',sourceRef:'sheet 1'}]};
  const report=validateReferenceImportForState([{source:'factory',relation:'fits',calibre:'AS 1130',partName:'Balance staff',partReference:'1234',sourceRef:'sheet 1'}],state);
  assert.equal(report.duplicates.length,1);
});

test('import commits valid rows into canonical knowledge only',()=>{
  const state={knowledge:[]};
  const report=validateReferenceImport([{source:'manual',relation:'donor',calibre:'ETA 2390',relatedCalibre:'ETA 2391',partName:'Setting wheel'}],[]);
  const result=importReferenceFacts(state,report);
  assert.equal(result.imported,1);
  assert.equal(state.knowledge.length,1);
  assert.equal(state.knowledge[0].recordType,'reference-fact');
  assert.equal(state.knowledge[0].relatedCalibre,'ETA 2391');
});
