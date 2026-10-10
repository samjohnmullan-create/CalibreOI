const here=(location.pathname.split('/').pop()||'').split('?')[0];
if(here==='suppliers.html'){
  const mount=()=>{
    if(document.getElementById('workshopAssetsLink'))return;
    const hero=document.querySelector('.hero');if(!hero)return;
    const link=document.createElement('a');link.id='workshopAssetsLink';link.className='btn secondary';link.href='workshop-assets.html';link.textContent='Workshop IDs';
    const box=hero.querySelector('.row')||hero.firstElementChild||hero;box.appendChild(link);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
}
