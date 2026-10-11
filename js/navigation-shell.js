import './device-experience.js?v=1';
import {PRIMARY_NAV,primaryHomeForPage} from './navigation-model.js';

const ICONS={
  home:'M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z',
  items:'M5 7h14v13H5zM8 7V4h8v3M8 11h8',
  workbench:'M4 18h16M6 18V8h4v10M14 18V5h4v13',
  business:'M5 7h14v11H5zM5 11h14M8 15h3',
  calibre:'M12 3a4 4 0 0 1 4 4v1a4 4 0 1 1 0 8v1a4 4 0 1 1-8 0v-1a4 4 0 1 1 0-8V7a4 4 0 0 1 4-4z'
};

export function pageName(pathname=''){
  return (String(pathname).split('/').pop()||'index.html').split('?')[0]||'index.html';
}

export function primaryNavMarkup(page='index.html'){
  const active=primaryHomeForPage(page);
  return PRIMARY_NAV.map(entry=>{
    const selected=entry.id===active;
    const icon=ICONS[entry.id]||'';
    return `<a class="navbtn${selected?' active':''}" href="${entry.href}"${selected?' aria-current="page"':''} data-nav-id="${entry.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icon}"/></svg><span>${entry.label}</span></a>`;
  }).join('');
}

export function renderPrimaryNavigation(root=document,page=pageName(location.pathname)){
  root.querySelectorAll?.('nav.mainnav').forEach(nav=>{
    nav.innerHTML=primaryNavMarkup(page);
    nav.dataset.navigationContract='core';
  });
}
