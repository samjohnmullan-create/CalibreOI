const GROUPS=[
  {id:"balance",label:"Balance & regulating",keys:["balance","hairspring","staff","pivot","jewel","roller","beat","amplitude"],parts:["Balance complete","Balance bridge / cock","Balance staff","Staff pivot","Balance jewel","Cap jewel","Hairspring","Collet","Stud / stud carrier","Regulator / regulator pins","Roller table","Impulse jewel"]},
  {id:"power",label:"Mainspring & barrel",keys:["mainspring","barrel","arbor","power reserve","ratchet","click"],parts:["Mainspring","Barrel complete","Barrel drum","Barrel cover","Barrel arbor","Barrel bridge","Ratchet wheel","Crown wheel","Click","Click spring"]},
  {id:"train",label:"Train of wheels",keys:["train","wheel","pinion","centre","center","third","fourth","seconds"],parts:["Centre wheel","Centre wheel pinion","Third wheel","Third wheel pinion","Fourth wheel","Fourth wheel pinion","Seconds pinion","Train bridge","Train jewel"]},
  {id:"escapement",label:"Escapement",keys:["escape","pallet","fork","lock","drop","impulse"],parts:["Escape wheel","Escape wheel pinion","Pallet fork","Pallet bridge","Pallet staff","Pallet jewel","Banking pin"]},
  {id:"winding",label:"Winding & setting",keys:["winding","winder","stem","crown","keyless","setting","yoke","sliding","clutch","setting lever"],parts:["Winding stem","Crown","Winding pinion","Sliding pinion / clutch","Yoke","Yoke spring","Setting lever","Setting lever spring / jumper","Minute wheel","Intermediate setting wheel","Cannon pinion","Keyless works bridge"]},
  {id:"motion",label:"Motion works & hands",keys:["motion","cannon","minute","hour","hand"],parts:["Cannon pinion","Minute wheel","Hour wheel","Intermediate wheel","Hour hand","Minute hand","Seconds hand"]},
  {id:"calendar",label:"Calendar",keys:["calendar","date","day","quickset"],parts:["Date wheel","Day wheel","Date jumper","Date jumper spring","Date driving wheel","Calendar corrector","Quickset wheel","Calendar bridge"]},
  {id:"case",label:"Case, crown & crystal",keys:["case","crystal","glass","bow","pendant","bezel","case screw"],parts:["Crystal","Bezel","Case back","Case screw / clamp","Movement ring / spacer","Pendant","Bow","Crown","Crown tube","Stem"]},
  {id:"dial",label:"Dial & dial fixing",keys:["dial","dial foot","dial feet"],parts:["Dial","Dial foot","Dial screw","Dial washer / spacer"]},
  {id:"automatic",label:"Automatic works",keys:["automatic","rotor","reverser","oscillating weight"],parts:["Rotor / oscillating weight","Rotor bearing","Automatic bridge","Reversing wheel","Reduction wheel","Automatic driving wheel"]},
  {id:"quartz",label:"Quartz / electrical",keys:["quartz","battery","coil","circuit","stepper","electrical"],parts:["Battery","Coil","Circuit / module","Stepper motor","Rotor","Battery clamp","Contact spring","Complete movement"]},
  {id:"general",label:"General movement",keys:[],parts:["Bridge","Plate","Screw","Jewel","Spring","Complete movement"]}
];

const fold=s=>String(s||"").toLowerCase();
export function partGroups(){return GROUPS.map(g=>({...g,parts:[...g.parts]}));}
export function suggestedGroup(text){const t=fold(text);let best=GROUPS[GROUPS.length-1],score=0;for(const g of GROUPS){let n=0;for(const k of g.keys)if(t.includes(k))n++;if(n>score){best=g;score=n;}}return {...best,parts:[...best.parts]};}
export function groupById(id){const g=GROUPS.find(x=>x.id===id)||GROUPS[GROUPS.length-1];return {...g,parts:[...g.parts]};}
