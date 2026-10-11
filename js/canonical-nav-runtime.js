import { renderPrimaryNavigation, pageName } from './navigation-shell.js';
import './global-command.js?v=1';

renderPrimaryNavigation(document,pageName(location.pathname));
if(pageName(location.pathname)==='movement-finder.html')import('./movement-finder-query.js?v=1').catch(err=>console.warn('Movement search handoff unavailable',err));
