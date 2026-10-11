import{loadState}from'./store.js?v=26';
import{knowledgeDraftUrl,movementKnowledgeDraft,workKnowledgeDraft,fitKnowledgeDraft}from'./knowledge-learning.js';
const page=(location.pathname.split('/').pop()||'').split('?')[0];
const params=new URLSearchParams(location.search);
function makeLink(label,draft){const a=document.createElement('a');a.className='btn secondary';a.href=knowledgeDraftUrl(draft);a.textContent=label;return a;}
async function enhance(){
 const state=await loadState();state.items=Array.isArray(state.items)?state.items:[];state.work=Array.isArray(state.work)?state.work:[];
 if(page==='passport.html'){
   const id=params.get('id'),item=state.items.find(x=>String(x.id)===String(id));if(!item)return;
   const host=document.querySelector('.identity-head');if(!host||host.querySelector('[data-knowledge-learn]'))return;
   const wrap=document.createElement('div');wrap.dataset.knowledgeLearn='1';wrap.append(makeLink('Add to Knowledge',movementKnowledgeDraft(item)));host.appendChild(wrap);
 }
 if(page==='work.html'){
   const id=params.get('id'),work=state.work.find(x=>String(x.id)===String(id));if(!work)return;const item=state.items.find(x=>String(x.id)===String(work.itemId))||{};
   const host=document.querySelector('.work-actions');if(!host||host.querySelector('[data-knowledge-learn]'))return;
   const a=makeLink('Record bench finding',workKnowledgeDraft(work,item));a.dataset.knowledgeLearn='1';host.insertBefore(a,host.querySelector('.danger'));
 }
 if(page==='suppliers.html'){
   const workId=params.get('work');const work=state.work.find(x=>String(x.id)===String(workId))||state.work.find(x=>x.status==='Active');if(!work)return;
   const evidence=(state.compatibilityEvidence||[]).filter(e=>e?.recordType==='bench-fit'&&String(e.targetWorkId)===String(work.id)&&['verified','used'].includes(e.result)).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0];if(!evidence)return;
   const donorHost=document.getElementById('donors')||document.getElementById('stock');if(!donorHost||document.querySelector('[data-knowledge-fit]'))return;
   const card=document.createElement('div');card.dataset.knowledgeFit='1';card.className='card';card.style.marginTop='12px';card.innerHTML='<h3>Bench learning</h3><p class="muted small">Latest verified/used fit can be promoted into the Research Inbox for review.</p>';
   card.append(makeLink('Add latest fit to Knowledge',fitKnowledgeDraft(evidence,state)));donorHost.parentElement?.appendChild(card);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>enhance().catch(console.warn),{once:true});else enhance().catch(console.warn);
