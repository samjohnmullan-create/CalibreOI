import { renderPrimaryNavigation, pageName } from './navigation-shell.js';
import './global-command.js?v=1';

const page=pageName(location.pathname);
renderPrimaryNavigation(document,page);

// Workbench is the central hub: default to All so queued work is visible without
// automatically promoting it onto the active bench.
if(page==='workbench.html'&&!new URLSearchParams(location.search).has('view')){
  const showAll=()=>{
    const button=document.querySelector('#toolbar button[data-filter="All"]');
    if(button&&!button.classList.contains('on'))button.click();
  };
  setTimeout(showAll,0);
  setTimeout(showAll,250);
}

if(page==='movement-finder.html')import('./movement-finder-query.js?v=1').catch(err=>console.warn('Movement search handoff unavailable',err));
