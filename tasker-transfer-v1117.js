(function(){
 'use strict';
 const keys={modules:'tasker.module-status.v1',hours:'tasker.employee-hours.v1',reports:'tasker.daily-reports.v1',vtr:'tasker.vtr.v1'},DB='tasker-transfer-backups-v1';
 const clone=x=>JSON.parse(JSON.stringify(x)),stamp=()=>new Date().toISOString();
 const digest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(n=>n.toString(16).padStart(2,'0')).join('');
 function raw(){return Object.fromEntries(Object.entries(keys).map(([k,v])=>[k,localStorage.getItem(v)]))}
 function validate(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||!Object.keys(data).length||Object.keys(data).some(k=>!Object.hasOwn(keys,k)))throw Error('Nepoznat sadržaj kopije.');
  const visit=x=>{if(x&&typeof x==='object'){for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Neispravan sadržaj kopije.');visit(x[k])}}};visit(data);
  if(data.modules){window.TaskerModuleStatusModel.validate(data.modules);for(const m of data.modules.modules)if(m.photo&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(m.photo))throw Error('Kopija nema prenosivu fotografiju. Ponovo izvezite kopiju na izvornom uređaju.')}
  if(data.hours)window.TaskerHoursBooks.validate(data.hours,window.TaskerHoursModel);
  for(const key of ['reports','vtr'])if(Object.hasOwn(data,key)){
   const s=data[key],label=key==='vtr'?'VTR':'Izveštaji',seen=new Set();
   if(!s||s.version!==1||!Array.isArray(s.entries))throw Error(label+': neispravna evidencija.');
   for(const e of s.entries){
    if(!e||typeof e.hallId!=='string'||!e.hallId||typeof e.hallName!=='string'||typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date))||new Date(e.date).toISOString().slice(0,10)!==e.date||typeof e.note!=='string'||!e.note.trim()||e.note.length>(key==='vtr'?20000:50000))throw Error(label+': neispravan zapis.');
    if(key==='vtr'&&(typeof e.hours!=='number'||!Number.isFinite(e.hours)||e.hours<0))throw Error('VTR: neispravan broj sati.');
    const id=JSON.stringify([e.hallId,e.date]);if(seen.has(id))throw Error(label+': ponovljen zapis za isti dan.');seen.add(id);
   }
  }
  for(const k of Object.keys(data))if(!data[k])throw Error('Prazna evidencija u kopiji.');
  return data;
 }
 async function portable(before=raw()){
  const data={};for(const k of Object.keys(keys))if(before[k]!==null)data[k]=JSON.parse(before[k]);
  if(data.modules){await window.TaskerModulePhotos.load(data.modules);data.modules=window.TaskerModulePhotos.hydrate(data.modules)}
  return data;
 }
 async function envelope(data){return {format:'tasker-device-copy',version:1,createdAt:stamp(),data,sha256:await digest(data)}}
 async function exportCopy(){const before=raw(),data=validate(await portable(before));if(JSON.stringify(raw())!==JSON.stringify(before))throw Error('Podaci su promenjeni tokom pripreme. Ponovite izvoz.');return envelope(data)}
 async function inspect(text){let file;try{file=JSON.parse(text)}catch{throw Error('Fajl nije ispravan JSON.')}if(file.format!=='tasker-device-copy'||file.version!==1)throw Error('Izaberite TASKER-PRENOS kopiju napravljenu dugmetom Izvezi kopiju.');validate(file.data);if(file.sha256!==await digest(file.data))throw Error('Kopija je oštećena ili menjana. Ponovo je pošaljite.');return file}
 async function dbAction(mode,fn){const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('copies',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Zatvorite druge prozore Taskera.'))});try{return await new Promise((resolve,reject)=>{const tx=db.transaction('copies',mode),r=fn(tx.objectStore('copies'));tx.oncomplete=()=>resolve(r.result);tx.onerror=tx.onabort=()=>reject(tx.error||Error('Rezerva nije sačuvana.'))})}finally{db.close()}}
 async function importCopy(file,expected){
  await inspect(JSON.stringify(file));const before=raw();if(JSON.stringify(before)!==JSON.stringify(expected))throw Error('Podaci ovog uređaja su promenjeni. Ponovo izaberite fajl.');
  const prior=await portable(before),reserve={id:crypto.randomUUID(),at:stamp(),raw:before,file:Object.keys(prior).length?await envelope(validate(prior)):null};
  await dbAction('readwrite',s=>s.add(reserve));const verified=await dbAction('readonly',s=>s.get(reserve.id));if(JSON.stringify(verified)!==JSON.stringify(reserve))throw Error('Provera rezerve nije uspela. Uvoz je zaustavljen.');
  const prepared={};for(const [k,data] of Object.entries(file.data))prepared[k]=JSON.stringify(k==='modules'?await window.TaskerModulePhotos.prepare(clone(data)):data);
  if(JSON.stringify(raw())!==JSON.stringify(before))throw Error('Podaci su promenjeni tokom pripreme. Uvoz je zaustavljen.');
  const touched=[];try{for(const [k,text] of Object.entries(prepared)){localStorage.setItem(keys[k],text);touched.push(k);if(localStorage.getItem(keys[k])!==text)throw Error('Provera uvoza nije uspela.')}}catch(error){let restored=true;for(const k of touched.reverse())try{if(before[k]===null)localStorage.removeItem(keys[k]);else localStorage.setItem(keys[k],before[k])}catch{restored=false}throw Error(restored?'Uvoz nije uspeo; prethodni podaci su vraćeni. '+error.message:'Uvoz nije završen. Ne nastavljajte unos. Preuzmite prethodnu kopiju iz Rezervi pre uvoza.');}
  // Require a new explicit sync decision, rather than automatically uploading an imported ledger.
  for(const k of Object.keys(prepared))localStorage.removeItem('tasker.sync.v105.base.'+k);
  return reserve.id;
 }
 const summary=data=>[data.reports?'Izveštaji: '+data.reports.entries.length+' dnevnih zapisa':'Izveštaji nisu u ovoj kopiji — ostaju nepromenjeni.',data.vtr?'VTR: '+data.vtr.entries.length+' dnevnih zapisa':'VTR nije u ovoj kopiji — ostaje nepromenjen.',data.modules?'Troškovnici: uključeni u podatke modula (cene, količine i sačuvani obračuni).':'Troškovnici nisu u ovoj kopiji — ostaju nepromenjeni.',data.hours?data.hours.employees.length+' zaposlenih u glavnoj evidenciji; uključena sva gradilišta i sačuvani dani':'Radni sati nisu u ovoj kopiji — ostaju nepromenjeni.',data.modules?data.modules.modules.length+' modula (sa halama, fazama i fotografijama modula)':'Moduli nisu u ovoj kopiji — ostaju nepromenjeni.'].join('\n');
 let d,busy=false,prepared=null,expected=null,urls=[];
 function status(text){d.querySelector('[data-transfer-message]').textContent=text}
 function offer(file,host,prefix='TASKER-PRENOS'){
  const name=prefix+'-'+file.createdAt.replace(/[:.]/g,'-')+'.json',blob=new Blob([JSON.stringify(file)],{type:'application/json'}),attachment=new File([blob],name,{type:'application/json'}),url=URL.createObjectURL(blob);urls.push(url);
  const a=document.createElement('a');a.href=url;a.download=name;a.textContent='Preuzmi kopiju ('+(blob.size/1048576).toFixed(2)+' MB)';host.append(a);
  const share=document.createElement('button');share.textContent='Pošalji / WhatsApp';share.type='button';host.append(share);share.onclick=async()=>{try{if(!navigator.canShare?.({files:[attachment]})){status('Preuzmite kopiju, pa je u WhatsApp razgovoru priložite kao Dokument.');return}await navigator.share({files:[attachment],title:'Tasker kopija'})}catch(e){status(e.name==='AbortError'?'Slanje je otkazano.':'Deljenje nije dostupno. Preuzmite fajl i priložite ga kao Dokument.')}};
 }
 async function run(task){if(busy)return;busy=true;d.querySelectorAll('button,input').forEach(x=>x.disabled=true);try{await task()}catch(e){status(e.message)}finally{busy=false;d.querySelectorAll('button,input').forEach(x=>x.disabled=false);d.querySelector('[data-transfer-confirm]').disabled=!prepared}}
 function open(){
  if(!d){d=document.createElement('dialog');d.id='tasker-transfer';document.body.append(d);d.addEventListener('cancel',e=>{if(busy)e.preventDefault()})}
  urls.forEach(x=>URL.revokeObjectURL(x));urls=[];prepared=null;expected=null;
  d.innerHTML='<header><h2>Kopija / prenos · evidencije</h2><button data-transfer-close>Zatvori</button></header><p>Izvezite na tabletu, pošaljite fajl kroz WhatsApp kao Dokument, pa ga ovde uvezite na računaru. Ovo nije PDF i nije automatska sinhronizacija.</p><p>Uključuje Izveštaje, VTR, troškovnike (cene, količine i sačuvane obračune), radne sate i module sa halama, fazama i fotografijama modula. Ne uključuje zasebni Filter slika, PDF arhive, Odvoz modula, privatne troškove ni pristupne kodove. Prenose se samo sačuvani unosi — pre izvoza pritisnite Zapamti / Sačuvaj.</p><p><b>Kopija sadrži privatne podatke. Šaljite je samo sebi ili ovlašćenoj osobi.</b></p><button data-transfer-export>Izvezi kopiju</button><div data-transfer-download></div><hr><label>Uvezi kopiju <input data-transfer-file type="file" accept=".json,application/json"></label><pre data-transfer-preview></pre><p>Uvoz zamenjuje evidencije sadržane u fajlu; ne spaja izmene. Pre zamene čuvamo proverenu rezervu ovog uređaja.</p><button data-transfer-confirm disabled>Potvrdi uvoz i zameni podatke</button><hr><button data-transfer-backups>Rezerve pre uvoza</button><div data-transfer-backup-list></div><p role="status" data-transfer-message></p>';
  d.querySelector('[data-transfer-close]').onclick=()=>{if(!busy)d.close()};
  d.querySelector('[data-transfer-export]').onclick=()=>run(async()=>{status('Pripremam podatke i fotografije…');const file=await exportCopy(),host=d.querySelector('[data-transfer-download]');host.replaceChildren();offer(file,host);status('Kopija je spremna. Preuzmite je ili izaberite WhatsApp u prozoru za deljenje.')});
  d.querySelector('[data-transfer-file]').onchange=e=>{const file=e.target.files[0];prepared=null;d.querySelector('[data-transfer-preview]').textContent='';if(!file)return;run(async()=>{if(file.size>80*1048576)throw Error('Fajl je prevelik (najviše 80 MB).');const checked=await inspect(await file.text());expected=raw();prepared=checked;d.querySelector('[data-transfer-preview]').textContent='Kopija: '+checked.createdAt+'\n'+summary(checked.data)+'\n\nNa ovom uređaju pre uvoza:\n'+summary(await portable(expected));status('Proverite sadržaj, zatim potvrdite zamenu.')})};
  d.querySelector('[data-transfer-confirm]').onclick=()=>run(async()=>{if(!prepared||!confirm('Zameniti podatke ovog uređaja prikazanom kopijom? Izmene se NE spajaju.'))return;status('Čuvam rezervu i uvozim…');await importCopy(prepared,expected);prepared=null;status('Uvoz je proveren. Aplikacija se ponovo učitava…');location.reload()});
  d.querySelector('[data-transfer-backups]').onclick=()=>run(async()=>{const rows=await dbAction('readonly',s=>s.getAll()),host=d.querySelector('[data-transfer-backup-list]');host.replaceChildren();for(const row of rows.sort((a,b)=>b.at.localeCompare(a.at))){const box=document.createElement('div'),label=document.createElement('p');label.textContent=row.at;box.append(label);if(row.file)offer(row.file,box,'TASKER-PRE-UVOZA');else label.textContent+=' · Uređaj je bio bez podataka.';host.append(box)}status(rows.length?'Preuzetu rezervu možete uvesti istim postupkom.':'Nema sačuvanih rezervi pre uvoza.')});
  d.showModal();
 }
 const css=document.createElement('style');css.textContent='#tasker-transfer{width:min(760px,calc(100vw - 32px));max-height:90vh;overflow:auto;box-sizing:border-box;background:#102b3d;color:#eaf4ff;border:2px solid #d7b55e;border-radius:18px;padding:24px;font:16px/1.5 Arial}#tasker-transfer::backdrop{background:#020914cc}#tasker-transfer header{display:flex;justify-content:space-between;gap:12px}#tasker-transfer h2{color:#69ffae;margin:0}#tasker-transfer button,#tasker-transfer a,.tasker-transfer-open{display:inline-block;background:#17445c;color:#fff;border:1px solid #d7b55e;border-radius:9px;padding:12px;margin:5px;cursor:pointer;font:inherit}#tasker-transfer button:disabled{opacity:.45}#tasker-transfer pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;color:#8dffbb}#tasker-transfer input{max-width:100%}';document.head.append(css);
 function mount(){for(const host of document.querySelectorAll('#module-status .ms-header .ms-actions,#employee-hours-project .eh-hero'))if(!host.querySelector('.tasker-transfer-open')){const b=document.createElement('button');b.type='button';b.className='tasker-transfer-open';b.textContent='📦 Kopija / prenos';b.onclick=open;host.append(b)}}
 new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount();
 window.TaskerTransfer={exportCopy,inspect,importCopy,raw,open};
})();
