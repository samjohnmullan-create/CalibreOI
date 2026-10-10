const here=(location.pathname.split('/').pop()||'index.html').split('?')[0]||'index.html';
if(here!=='qr-scan.html'&&here!=='settings.html'){
  const mount=()=>{
    if(document.getElementById('calibreScanFab'))return;
    const button=document.createElement('a');
    button.id='calibreScanFab';button.href='qr-scan.html';button.setAttribute('aria-label','Scan Calibre QR');button.textContent='Scan';
    button.style.cssText='position:fixed;right:14px;bottom:max(14px,env(safe-area-inset-bottom));z-index:1200;display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:46px;padding:0 13px;border-radius:999px;background:var(--accent,#123f4c);color:#fff;text-decoration:none;font:800 .72rem/1 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.22);border:1px solid color-mix(in srgb,var(--accent,#123f4c) 75%,#000)';
    document.body.appendChild(button);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
}
