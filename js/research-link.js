function installResearchLink(){
  if(document.getElementById('requestResearchQuick'))return;
  const params=new URLSearchParams(location.search);
  const id=params.get('id')||'';
  const actions=document.querySelector('.service-actions');
  if(!actions)return;
  const a=document.createElement('a');
  a.id='requestResearchQuick';
  a.className='btn secondary';
  a.textContent='Request research';
  a.href=`summary.html${id?`?id=${encodeURIComponent(id)}&research=1`:'?research=1'}`;
  a.title='Open the research handoff for this job';
  actions.appendChild(a);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installResearchLink,{once:true});
else installResearchLink();
