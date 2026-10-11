const own=new URL(import.meta.url);
const current=own.searchParams.get('v')||'';

async function latestBuild(){
  const url=new URL('build.json',location.href);
  url.searchParams.set('t',Date.now().toString());
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`Build check failed (${response.status})`);
  const data=await response.json();
  return String(data?.sha||'');
}

async function refreshIfStale(){
  const latest=await latestBuild();
  if(!latest||!current||latest===current)return;
  const target=new URL(location.href);
  target.searchParams.set('v',latest);
  location.replace(target.toString());
}

refreshIfStale().catch(error=>console.warn('Calibre build freshness check deferred',error));
