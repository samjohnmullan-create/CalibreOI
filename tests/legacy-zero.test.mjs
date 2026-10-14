import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {join,relative} from 'node:path';

const ROOT=new URL('../',import.meta.url).pathname;
const ACTIVE_EXT=/\.(?:js|html)$/;
const EXCLUDE_PREFIXES=['tests/','cards/','docs/'];
// Core and the explicit persistence boundary deliberately name retired fields so
// validation/migration can reject or strip them. Normal runtime must not.
const EXCLUDE_FILES=new Set(['backup.html','js/core.js','js/persistence-boundary.js']);
const BANNED=[
  ['state.jobs',/\bstate\.jobs\b/],
  ['currentId',/\bcurrentId\b/],
  ['legacyJobId',/\blegacyJobId\b/],
  ['specialistJobId',/\bspecialistJobId\b/],
  ['service.html route',/service\.html/],
  ['summary.html route',/summary\.html/],
  ['legacy watch context nav',/watch-contextnav/],
];

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

test('active runtime contains no legacy Job architecture',async()=>{
  const files=(await walk(ROOT)).filter(file=>ACTIVE_EXT.test(file));
  const violations=[];
  for(const file of files){
    const rel=relative(ROOT,file).replaceAll('\\','/');
    if(EXCLUDE_PREFIXES.some(prefix=>rel.startsWith(prefix))||EXCLUDE_FILES.has(rel))continue;
    const source=await readFile(file,'utf8');
    for(const [label,pattern] of BANNED){if(pattern.test(source))violations.push(`${rel}: ${label}`);}
  }
  assert.deepEqual(violations,[],`Legacy Zero violations:\n${violations.join('\n')}`);
});
