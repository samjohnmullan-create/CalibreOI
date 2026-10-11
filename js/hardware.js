const hasBrowser=typeof window!=='undefined'&&typeof navigator!=='undefined';

export function hardwareCapabilities(){
  const nav=hasBrowser?navigator:{};
  return {
    browserPrint:hasBrowser&&typeof window.print==='function',
    fileShare:hasBrowser&&typeof nav.share==='function'&&typeof nav.canShare==='function',
    audioInputs:!!nav.mediaDevices?.enumerateDevices,
    audioCapture:!!nav.mediaDevices?.getUserMedia,
    deviceChange:!!nav.mediaDevices?.addEventListener,
    webUsb:!!nav.usb,
    webSerial:!!nav.serial,
    bluetooth:!!nav.bluetooth
  };
}

export async function audioInputDevices(){
  if(!hasBrowser||!navigator.mediaDevices?.enumerateDevices)return [];
  return (await navigator.mediaDevices.enumerateDevices()).filter(device=>device.kind==='audioinput');
}

export async function shareFiles(files,{title='Calibre & Co.',text=''}={}){
  const list=(Array.isArray(files)?files:[]).filter(Boolean);
  if(!hasBrowser||!list.length)return {shared:false,reason:'no-files'};
  if(typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:list})){
    await navigator.share({files:list,title,text});
    return {shared:true,method:'share'};
  }
  return {shared:false,reason:'unsupported'};
}

export function downloadFile(file){
  if(!hasBrowser||!file)return false;
  const url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;a.download=file.name||'calibre-file';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  return true;
}

if(hasBrowser)window.CalibreHardware={capabilities:hardwareCapabilities,audioInputs:audioInputDevices,shareFiles,downloadFile};
