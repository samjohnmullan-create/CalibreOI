import c0 from './movement-catalog-chunk-0.js';
import c1 from './movement-catalog-chunk-1.js';
import c2 from './movement-catalog-chunk-2.js';
import c3 from './movement-catalog-chunk-3.js';
import c4 from './movement-catalog-chunk-4.js';
import c5 from './movement-catalog-chunk-5.js';
import c6 from './movement-catalog-chunk-6.js';
import c7 from './movement-catalog-chunk-7.js';

export const MOVEMENT_CATALOG_COUNT=3458;
export const MOVEMENT_CATALOG_PACK_LENGTH=15316;
const CHUNK_LENGTH=1915;
const PACK=[c0,c1,c2,c3,c4,c5,c6].map(chunk=>chunk.slice(0,CHUNK_LENGTH)).join('')+c7.slice(0,1911);
let cache=null;

export async function loadMovementCatalog(){
  if(cache)return cache;
  if(PACK.length!==MOVEMENT_CATALOG_PACK_LENGTH)throw new Error(`Movement catalogue pack length mismatch: ${PACK.length}`);
  if(typeof DecompressionStream==='undefined')throw new Error('This browser cannot open the compressed movement catalogue.');
  const binary=Uint8Array.from(atob(PACK),c=>c.charCodeAt(0));
  const stream=new Blob([binary]).stream().pipeThrough(new DecompressionStream('gzip'));
  const rows=JSON.parse(await new Response(stream).text());
  if(rows.length!==MOVEMENT_CATALOG_COUNT)throw new Error(`Movement catalogue row count mismatch: ${rows.length}`);
  cache=rows.map(([maker,calibre,diameter,height,bph,winding,sourceId],index)=>({id:index+1,maker,calibre,diameter,height,bph,winding,sourceId}));
  return cache;
}
