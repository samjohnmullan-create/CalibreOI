import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {canonicalState,migratePersistedState,STORE_SCHEMA_VERSION} from '../js/store-base.js';

const ROOT=new URL('../',import.meta.url).pathname;
const ACTIVE_EXT=/\.(?:js|html)$/;
const EXCLUDE_PREFIXES=['tests/','cards/','docs/'];
const EXCLUDE_FILES=new Set([
  'backup.html',
  'js/core.js',
  'js/store-base.js',
  'js/store-sync-safe.js'
]);

async function walk(dir){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.name==='.git'||entry.name==='node_modules')continue;
    const full=join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

test('schema 1 persisted Work migrates without changing IDs or currentWorkId',()=>{
  const raw={schemaVersion:1,currentWorkId:'work-2',items:[{id:'item-1'}],workRecords:[{id:'work-1',itemId:'item-1',title:'One'},{id:'work-2',itemId:'item-1',title:'Two'}]};
  const migrated=migratePersistedState(raw);
  assert.equal(migrated.schemaVersion,STORE_SCHEMA_VERSION);
  assert.deepEqual(migrated.work.map(x=>x.id),['work-1','work-2']);
  assert.equal(migrated.currentWorkId,'work-2');
  assert.equal('workRecords' in migrated,false);
});

test('canonical store output saves work only',()=>{
  const state=canonicalState({workRecords:[{id:'work-1'}]});
  assert.deepEqual(state.work,[{id:'work-1'}]);
  assert.equal('workRecords' in state,false);
});

test('active runtime does not depend on retired workRecords collection',async()=>{
  const files=(await walk(ROOT)).filter(file=>ACTIVE_EXT.test(file));
  const violations=[];
  for(const file of files){
    const rel=relative(ROOT,file).replaceAll('\\','/');
    if(EXCLUDE_PREFIXES.some(prefix=>rel.startsWith(prefix))||EXCLUDE_FILES.has(rel))continue;
    const source=await readFile(file,'utf8');
    if(/\bworkRecords\b/.test(source))violations.push(rel);
  }
  assert.deepEqual(violations,[],`Retired workRecords references remain:\n${violations.join('\n')}`);
});
