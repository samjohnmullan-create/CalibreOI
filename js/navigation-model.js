export const PRIMARY_NAV = [
  {id:'home',label:'Home',href:'index.html',purpose:'attention'},
  {id:'items',label:'Items',href:'inventory.html',purpose:'physical-items'},
  {id:'workbench',label:'Workbench',href:'workbench.html',purpose:'active-work'},
  {id:'business',label:'Business',href:'finance.html',purpose:'portfolio'},
  {id:'calibre',label:'Calibre',href:'calibre.html',purpose:'system-intelligence'}
];

export const ITEM_AREAS = [
  {id:'work',label:'Work',purpose:'physical-work'},
  {id:'item',label:'Item',purpose:'identity-history'},
  {id:'commerce',label:'Commerce',purpose:'money-sale'}
];

export const ITEM_SECTIONS = {
  watch:{
    work:['Diagnosis','Service','Measurements','Timing','Parts','QC'],
    item:['Identity','Passport','Research','Media','History','Documents'],
    commerce:['Costs','Valuation','Listing','Sale']
  },
  clock:{
    work:['Diagnosis','Service','Measurements','Timing','Parts','QC'],
    item:['Identity','Passport','Research','Media','History','Documents'],
    commerce:['Costs','Valuation','Listing','Sale']
  },
  jewellery:{
    work:['Inspect','Clean','Restore','Measurements','QC'],
    item:['Identity','Research','Media','History','Documents'],
    commerce:['Costs','Valuation','Listing','Sale']
  },
  default:{
    work:['Inspect','Prepare','Restore','QC'],
    item:['Identity','Research','Media','History','Documents'],
    commerce:['Costs','Valuation','Listing','Sale']
  }
};

export const WORKBENCH_GROUPS = [
  {id:'now',label:'Now'},
  {id:'next',label:'Next'},
  {id:'waiting',label:'Waiting'},
  {id:'ready',label:'Ready'},
  {id:'queue',label:'Queue'}
];

export const CALIBRE_SECTIONS = [
  {id:'assistant',label:'Assistant'},
  {id:'inbox',label:'Inbox'},
  {id:'capture',label:'Capture'},
  {id:'knowledge',label:'Knowledge'},
  {id:'settings',label:'Settings'}
];

export function sectionsForItem(type='other'){
  return ITEM_SECTIONS[type]||ITEM_SECTIONS.default;
}

export function breadcrumb(parts=[]){
  return parts.filter(Boolean).map(value=>String(value).trim()).filter(Boolean).join(' › ');
}
