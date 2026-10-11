import { ITEM_AREAS, itemWorkspaceForPage } from './navigation-model.js';

const page=(location.pathname.split('/').pop()||'index.html').split('?')[0];
const current=itemWorkspaceForPage(page);

if(current){
  const params=new URLSearchParams(location.search);
  const id=params.get('id')||'';
  const suffix=id?`?id=${encodeURIComponent(id)}`:'';
  const areaRoute={work:'service.html',item:'passport.html',commerce:'business.html'};
  const sectionRoutes={
    work:[['Service','service.html'],['Timing','timegrapher.html'],['Parts','suppliers.html']],
    item:[['Passport','passport.html'],['History','summary.html'],['Documents','documents.html']],
    commerce:[['Costs','business.html'],['Sale','sales.html']]
  };

  // The new Item workspace is the only local navigation on watch pages.
  // Remove the legacy eight-tab strip rather than hiding it so old CSS cannot revive it.
  document.querySelectorAll('.watch-contextnav').forEach(node=>node.remove());

  const mount=document.createElement('section');
  mount.className='item-workspace-shell';
  mount.setAttribute('aria-label','Item workspace');
  const areas=ITEM_AREAS.map(area=>{
    const active=area.id===current.area;
    return `<a class="item-area-tab${active?' active':''}" href="${areaRoute[area.id]}${suffix}"${active?' aria-current="page"':''}>${area.label}</a>`;
  }).join('');
  const sections=(sectionRoutes[current.area]||[]).map(([label,href])=>{
    const active=label===current.section;
    return `<a class="item-section-link${active?' active':''}" href="${href}${suffix}"${active?' aria-current="page"':''}>${label}</a>`;
  }).join('');
  mount.innerHTML=`<nav class="item-area-tabs" aria-label="Workspace areas">${areas}</nav><nav class="item-section-links" aria-label="${current.area} sections">${sections}</nav>`;

  const watchStrip=document.querySelector('.watch-strip');
  if(watchStrip)watchStrip.insertAdjacentElement('afterend',mount);
  else document.querySelector('nav.mainnav')?.insertAdjacentElement('afterend',mount);

  if(!document.querySelector('link[data-item-workspace-shell]')){
    const css=document.createElement('link');
    css.rel='stylesheet';
    css.href='css/item-workspace-shell.css?v=2';
    css.dataset.itemWorkspaceShell='1';
    document.head.appendChild(css);
  }
}
