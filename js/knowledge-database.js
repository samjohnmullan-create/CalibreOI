// Full v25 Knowledge Database runtime.
// This reference database is lazy-loaded and never persisted into Core Item/Work state.
const ASSET_URL=new URL('../data/calibre-knowledge-v25.json.gz',import.meta.url);
const EXPECTED_GZIP_SHA256='e67f56b3718ad7e15f6f125f395a33862747ba0fb45f573497ca71f9449e3c4a';
const EXPECTED_COUNTS={sources:90,families:67,calibres:3458,part_references:736,calibre_part_refs:1172,compatibility_edges:9165,aliases:14,family_evidence:2,measured_parts:22,dimensional_candidates:17,external_coverage:8,movement_applications:51,source_capabilities:9,application_compatibility:30,movement_specs:18,technical_documents:10,identification_signals:65,app_feature_bindings:15,knowledge_rules:8,owned_watch_profiles:9,owned_watch_research:17,owned_watch_parts:14,calibre_catalog_index:372,manufacturer_coverage:7,research_queue:33,brand_movement_associations:41,brand_identity_notes:12,waltham_grade_index:14};
let databasePromise=null,indexPromise=null;

function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function sha256(bytes){if(globalThis.crypto?.subtle)return hex(await crypto.subtle.digest('SHA-256',bytes));const {createHash}=await import('node:crypto');return createHash('sha256').update(Buffer.from(bytes)).digest('hex');}
async function readAsset(){
  if(typeof window!=='undefined'&&typeof fetch==='function'){
    const res=await fetch(ASSET_URL,{cache:'force-cache'});if(!res.ok)throw new Error(`Knowledge database request failed: ${res.status}`);return res.arrayBuffer();
  }
  const {readFile}=await import('node:fs/promises');const buf=await readFile(ASSET_URL);return buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength);
}
async function gunzip(bytes){
  if(typeof DecompressionStream!=='undefined'){
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).text();
  }
  const {gunzipSync}=await import('node:zlib');return gunzipSync(Buffer.from(bytes)).toString('utf8');
}
function validate(db){
  if(!db||typeof db!=='object')throw new Error('Knowledge database did not contain an object.');
  for(const [table,count] of Object.entries(EXPECTED_COUNTS)){if(!Array.isArray(db[table])&&table!=='metadata')throw new Error(`Knowledge table missing: ${table}`);if(Array.isArray(db[table])&&db[table].length!==count)throw new Error(`Knowledge table ${table} expected ${count} rows, got ${db[table].length}`);}
  return db;
}
export async function loadKnowledgeDatabase(){
  if(!databasePromise)databasePromise=(async()=>{const bytes=await readAsset(),digest=await sha256(bytes);if(digest!==EXPECTED_GZIP_SHA256)throw new Error('Knowledge database integrity check failed.');return validate(JSON.parse(await gunzip(bytes)));})();
  return databasePromise;
}
export async function knowledgeDatabaseStats(){const db=await loadKnowledgeDatabase();return Object.fromEntries(Object.entries(db).map(([k,v])=>[k,Array.isArray(v)?v.length:(v&&typeof v==='object'?Object.keys(v).length:0)]));}
export async function knowledgeTable(name){const db=await loadKnowledgeDatabase();if(!(name in db))throw new Error(`Unknown knowledge table: ${name}`);return db[name];}

function norm(v){return String(v??'').trim().toLowerCase().replace(/[\s._/]+/g,'-');}
async function indexes(){
  if(!indexPromise)indexPromise=(async()=>{const db=await loadKnowledgeDatabase(),calibreById=new Map(db.calibres.map(r=>[Number(r.id),r])),sourceById=new Map(db.sources.map(r=>[Number(r.id),r])),partById=new Map(db.part_references.map(r=>[Number(r.id),r])),specByCalibreId=new Map(db.movement_specs.map(r=>[Number(r.calibre_id),r])),signalsByCalibreId=new Map(),partLinksByCalibreId=new Map(),edgesByCalibreId=new Map();
    for(const r of db.identification_signals){const k=Number(r.calibre_id),a=signalsByCalibreId.get(k)||[];a.push(r);signalsByCalibreId.set(k,a);}
    for(const r of db.calibre_part_refs){const k=Number(r.calibre_id),a=partLinksByCalibreId.get(k)||[];a.push(r);partLinksByCalibreId.set(k,a);}
    for(const r of db.compatibility_edges){for(const k of [Number(r.calibre_a_id),Number(r.calibre_b_id)]){const a=edgesByCalibreId.get(k)||[];a.push(r);edgesByCalibreId.set(k,a);}}
    return {db,calibreById,sourceById,partById,specByCalibreId,signalsByCalibreId,partLinksByCalibreId,edgesByCalibreId};})();
  return indexPromise;
}
export async function findCalibres({maker='',calibre='',query='',limit=100}={}){const {db}=await indexes(),mk=norm(maker),ck=norm(calibre),q=norm(query);return db.calibres.filter(r=>(!mk||norm(r.maker)===mk||norm(r.maker).includes(mk))&&(!ck||norm(r.calibre)===ck||norm(r.calibre).includes(ck))&&(!q||norm([r.maker,r.calibre,r.notes,...(r.search_aliases||[]),...(r.common_brands||[])].join(' ')).includes(q))).slice(0,limit);}
export async function getCalibreRecord(maker,calibre){const rows=await findCalibres({maker,calibre,limit:20}),mk=norm(maker),ck=norm(calibre);return rows.find(r=>norm(r.maker)===mk&&norm(r.calibre)===ck)||rows.find(r=>norm(r.calibre)===ck)||null;}
export async function movementCatalog(){const {db,specByCalibreId}=await indexes();return db.calibres.map(r=>{const spec=specByCalibreId.get(Number(r.id))||null;return {id:r.id,maker:r.maker,calibre:r.calibre,diameter:r.diameter_mm??spec?.diameter_mm??null,height:r.height_mm??spec?.height_mm??null,bph:r.beat_rate_bph??spec?.beat_rate_bph??null,winding:r.winding||spec?.winding_type||spec?.movement_type||'',familyId:r.family_id??null,sourceId:r.source_id??null,jewels:spec?.jewels??null,richSpec:spec,searchAliases:r.search_aliases||[],commonBrands:r.common_brands||[]};});}
export async function movementSpecForCalibreId(calibreId){const {specByCalibreId}=await indexes();return specByCalibreId.get(Number(calibreId))||null;}
export async function identificationSignalsForCalibreId(calibreId){const {signalsByCalibreId}=await indexes();return [...(signalsByCalibreId.get(Number(calibreId))||[])];}
export async function partReferencesForCalibreId(calibreId){const {partLinksByCalibreId,partById,sourceById}=await indexes();return (partLinksByCalibreId.get(Number(calibreId))||[]).map(link=>({...link,part:partById.get(Number(link.part_ref_id))||null,source:sourceById.get(Number(link.source_id))||null}));}
export async function compatibilityForCalibreId(calibreId){const {edgesByCalibreId,calibreById,sourceById}=await indexes();const id=Number(calibreId);return (edgesByCalibreId.get(id)||[]).map(edge=>({...edge,otherCalibre:calibreById.get(Number(edge.calibre_a_id)===id?Number(edge.calibre_b_id):Number(edge.calibre_a_id))||null,source:sourceById.get(Number(edge.source_id))||null}));}
export async function technicalDocumentsFor(maker,calibre){const {db}=await indexes(),mk=norm(maker),ck=norm(calibre);return db.technical_documents.filter(d=>(!mk||norm(d.maker)===mk)&&(!ck||norm(d.calibre_scope).includes(ck)));}
export async function movementApplicationsFor({maker='',calibre='',serial=null}={}){const {db}=await indexes(),mk=norm(maker),ck=norm(calibre),sn=Number(serial);return db.movement_applications.filter(r=>(!mk||norm(r.maker)===mk)&&(!ck||norm(r.grade_or_calibre)===ck)&&(!Number.isFinite(sn)||((r.serial_min==null||sn>=Number(r.serial_min))&&(r.serial_max==null||sn<=Number(r.serial_max)))));}
export async function brandMovementAssociations(brand){const {db}=await indexes(),b=norm(brand);return db.brand_movement_associations.filter(r=>!b||norm(r.brand)===b);}
export {EXPECTED_COUNTS};
