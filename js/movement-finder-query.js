const params=new URLSearchParams(location.search),q=(params.get('q')||'').trim();
if(q){
  let tries=0;
  const apply=()=>{
    const maker=document.getElementById('maker'),calibre=document.getElementById('calibre'),button=document.getElementById('searchBtn');
    if(!maker||!calibre||!button){if(tries++<90)requestAnimationFrame(apply);return;}
    const parts=q.split(/\s+/).filter(Boolean),last=parts.at(-1)||'';
    if(parts.length>1&&/\d/.test(last)){maker.value=parts.slice(0,-1).join(' ');calibre.value=last;}
    else if(/\d/.test(q))calibre.value=q;
    else maker.value=q;
    button.click();
  };
  apply();
}
