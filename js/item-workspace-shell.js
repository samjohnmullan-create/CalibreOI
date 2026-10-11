import {ITEM_AREAS,itemWorkspaceForPage} from './navigation-model.js';
import {renderPrimaryNavigation} from './navigation-shell.js';

const page=(location.pathname.split('/').pop()||'index.html').split('?')[0];
const current=itemWorkspaceForPage(page);
if(current){
  renderPrimaryNavigation(document,page);
  const params=new URLSearchParams(location.search),itemId=params.get('id')||'',workId=params.get('work')||(page==='work.html'?params.get('id'):'')||'';
  const itemSuffix=itemId?`?id=${encodeURIComponent(itemId)}`:'',workSuffix=workId?`?work=${encodeURIComponent(workId)}`:'',workRecordHref=workId?`work.html?id=${encodeURIComponent(workId)}`:'workbench.html';
  const areaRoute={work:workRecordHref,item:itemId?`item.html${itemSuffix}`:'inventory.html',commerce:itemId?`business.html${itemSuffix}`:'finance.html'};
  const sectionRoutes={
    work:[['Work',workRecordHref],['Timing',`timegrapher.html${workSuffix}`],['Parts',`suppliers.html${workSuffix}`]],
    item:[['Item',itemId?`item.html${itemSuffix}`:'inventory.html'],['Passport',`passport.html${itemSuffix}`],['Documents',`documents.html${itemSuffix}`]],
    commerce:[['Costs',`business.html${itemSuffix}`],['Sale',`sales.html${itemSuffix}`]]
  };
  document.querySelectorAll('.item-workspace-shell').forEach(node=>node.remove());
  const mount=document.createElement('section');mount.className='item-workspace-shell';mount.setAttribute('aria-label','Item workspace');
  const areas=ITEM_AREAS.map(area=>{const active=area.id===current.area;return `<a class="item-area-tab${active?' active':''}" href="${areaRoute[area.id]}"${active?' aria-current="page"':''}>${area.label}</a>`;}).join('');
  const sections=(sectionRoutes[current.area]||[]).map(([label,href])=>{const active=label===current.section;return `<a class="item-section-link${active?' active':''}" href="${href}"${active?' aria-current="page"':''}>${label}</a>`;}).join('');
  mount.innerHTML=`<nav class="item-area-tabs" aria-label="Workspace areas">${areas}</nav><nav class="item-section-links" aria-label="${current.area} sections">${sections}</nav>`;
  document.querySelector('nav.mainnav')?.insertAdjacentElement('afterend',mount);
  document.querySelectorAll('link[data-item-workspace-shell]').forEach(node=>node.remove());
  const css=document.createElement('link');css.rel='stylesheet';css.href='css/item-workspace-shell.css?v=5';css.dataset.itemWorkspaceShell='1';document.head.appendChild(css);
}
