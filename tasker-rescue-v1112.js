(() => {
  'use strict';
  const knownDatabases = ['tasker-module-photo-storage-v1','tasker-module-photos-v1','tasker-receipt-images','tasker-order-pdfs','tasker-workforce-pdfs','tasker-work-diary','tasker-photo-archive','tasker-costing-pdfs-v1'];
  const style = document.createElement('style');
  style.textContent = '#tasker-rescue-open{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9000;padding:13px 18px;border:2px solid #ffe39a;border-radius:12px;background:#17354b;color:#ffe39a;font:bold 15px Arial;cursor:pointer}#tasker-rescue{position:fixed;inset:0;z-index:2147483647;background:#061322eF;color:#eaf5ff;overflow:auto;padding:24px;font:16px/1.5 Arial}#tasker-rescue[hidden]{display:none}#tasker-rescue>section{max-width:720px;margin:auto;padding:22px;border:1px solid #ddba64;border-radius:16px;background:#102b3d}#tasker-rescue button,#tasker-rescue a{display:inline-block;padding:12px;margin:6px;border:1px solid #dfbc66;border-radius:8px;color:#fff;background:#1c4964;font:inherit;cursor:pointer}#tasker-rescue button:disabled{opacity:.5}#tasker-rescue p{overflow-wrap:anywhere}#tasker-rescue .rescue-file{border-top:1px solid #486174;padding:10px 0}';
  document.head.append(style);
  const trigger = document.createElement('button');
  trigger.id='tasker-rescue-open';trigger.type='button';trigger.textContent='🛟 Spasi podatke';
  const panel=document.createElement('div');panel.id='tasker-rescue';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Spasi podatke');
  panel.innerHTML='<section><button type="button" data-close>Zatvori</button><h2>Spasi podatke sa ovog uređaja</h2><p>Otvorite ovo iz Taskera preko ikonice, gde vidite svoje unose. Kopije se pripremaju samo čitanjem: ništa se ne briše, ne premešta i ne upisuje u spremište aplikacije.</p><p><b>Kopije mogu sadržati fotografije, lične podatke i pristupne kodove. Čuvajte ih privatno u Datotekama; ne objavljujte ih.</b></p><button type="button" data-basic>1. Pripremi osnovnu kopiju</button><p>Obuhvata sve lokalne zapise: module i fotografije u tim zapisima, radne sate, VTR, izveštaje i ostale unose iz lokalnog spremišta. Zasebne PDF i foto-arhive preuzmite u drugom koraku.</p><div data-basic-files></div><button type="button" data-archives>2. Pronađi PDF i foto-arhive</button><div data-archive-files></div><p data-status role="status" aria-live="polite"></p><p>Preuzimanje nije potvrda da je fajl sačuvan. Proverite u aplikaciji Datoteke da fajl postoji i nije prazan. Za sada ne brišite originalne podatke.</p></section>';
  document.body.append(trigger,panel);
  const status=panel.querySelector('[data-status]');
  const urls=[];
  const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
  function offer(container,name,data){
    const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
    const file=new File([blob],name,{type:'application/json'});
    const url=URL.createObjectURL(blob);urls.push(url);
    const row=document.createElement('div');row.className='rescue-file';
    const info=document.createElement('p');info.textContent=name+' · '+(blob.size/1048576).toFixed(2)+' MB';
    const link=document.createElement('a');link.href=url;link.download=name;link.textContent='Preuzmi kopiju';
    row.append(info,link);
    let canShare=false;try{canShare=!!navigator.canShare && navigator.canShare({files:[file]})}catch(e){}
    if(canShare){
      const share=document.createElement('button');share.type='button';share.textContent='Sačuvaj u Datoteke / Podeli';
      share.onclick=async()=>{try{await navigator.share({files:[file],title:name});status.textContent='Proverite da li je kopija sačuvana u Datotekama.'}catch(e){status.textContent=e.name==='AbortError'?'Čuvanje je otkazano. Kopija je i dalje spremna.':'Deljenje nije uspelo. Pokušajte Preuzmi kopiju.'}};
      row.append(share);
    }
    container.append(row);
  }
  trigger.onclick=()=>{panel.hidden=false;panel.querySelector('[data-close]').focus()};
  panel.querySelector('[data-close]').onclick=()=>{panel.hidden=true;trigger.focus()};
  panel.querySelector('[data-basic]').onclick=()=>{
    try{
      const entries=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);entries.push([key,localStorage.getItem(key)])}
      const target=panel.querySelector('[data-basic-files]');target.replaceChildren();
      offer(target,'TASKER-SPASAVANJE-OSNOVNO-'+stamp()+'.json',{format:'tasker-rescue',version:1,createdAt:new Date().toISOString(),origin:location.origin,scope:'localStorage',entries});
      status.textContent=entries.length?'Osnovna kopija je spremna: '+entries.length+' zapisa. Sada pritisnite Preuzmi kopiju ili Sačuvaj u Datoteke.':'U ovom načinu otvaranja nema lokalnih zapisa. Vratite se u Tasker preko ikonice gde vidite podatke.';
    }catch(e){status.textContent='Kopija nije pripremljena: '+e.message+'. Originalni podaci nisu menjani.'}
  };
  function openExisting(name){return new Promise((resolve,reject)=>{
    const request=indexedDB.open(name);let absent=false;
    request.onupgradeneeded=()=>{absent=true;request.transaction.abort()};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>absent?resolve(null):reject(request.error);
    request.onblocked=()=>reject(new Error('Baza je zauzeta. Zatvorite druge prozore Taskera i ponovite.'));
  })}
  async function encode(value){
    if(value instanceof Blob)return {$type:'Blob',mime:value.type,name:value.name||null,data:await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(value)})};
    if(value instanceof Date)return {$type:'Date',value:value.toISOString()};
    if(value instanceof ArrayBuffer || ArrayBuffer.isView(value)){const bytes=value instanceof ArrayBuffer?new Uint8Array(value):new Uint8Array(value.buffer,value.byteOffset,value.byteLength);return {$type:value.constructor.name,bytes:Array.from(bytes)}}
    if(value===undefined)return {$type:'undefined'};
    if(Array.isArray(value))return Promise.all(value.map(encode));
    if(value && typeof value==='object'){const out={};for(const [k,v] of Object.entries(value))Object.defineProperty(out,k,{value:await encode(v),enumerable:true});return out}
    return value;
  }
  async function exportDatabase(name){
    const db=await openExisting(name);if(!db)return null;
    try{
      const names=Array.from(db.objectStoreNames);const raw=await new Promise((resolve,reject)=>{
        if(!names.length){resolve([]);return}
        const tx=db.transaction(names,'readonly'),stores=[];
        for(const name of names){const store=tx.objectStore(name),record={name,keyPath:store.keyPath,autoIncrement:store.autoIncrement,entries:[]};stores.push(record);const cursor=store.openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(c){record.entries.push({key:c.key,value:c.value});c.continue()}}}
        tx.oncomplete=()=>resolve(stores);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Čitanje je prekinuto'));
      });
      return {format:'tasker-rescue',version:1,scope:'indexedDB',createdAt:new Date().toISOString(),origin:location.origin,database:name,databaseVersion:db.version,stores:await encode(raw)};
    }finally{db.close()}
  }
  panel.querySelector('[data-archives]').onclick=async()=>{
    const target=panel.querySelector('[data-archive-files]');target.replaceChildren();status.textContent='Tražim arhive…';
    try{
      let names=knownDatabases;
      if(indexedDB.databases){const list=await indexedDB.databases();names=[...new Set([...knownDatabases,...list.map(x=>x.name).filter(n=>n&&n.startsWith('tasker'))])]}
      for(const name of names){const row=document.createElement('div');const button=document.createElement('button');button.type='button';button.textContent='Pripremi: '+name;row.append(button);target.append(row);button.onclick=async()=>{button.disabled=true;status.textContent='Čitam '+name+'…';try{const data=await exportDatabase(name);if(data){offer(row,'TASKER-ARHIVA-'+name+'-'+stamp()+'.json',data);status.textContent='Arhiva je spremna za preuzimanje.'}else status.textContent='Arhiva '+name+' ne postoji na ovom uređaju.'}catch(e){status.textContent='Arhiva nije izvezena: '+e.message+'. Original nije promenjen.'}finally{button.disabled=false}}}
      status.textContent='Pripremite i preuzmite arhive jednu po jednu. Neke mogu biti prazne ili ne postoje.';
    }catch(e){status.textContent='Arhive nisu dostupne: '+e.message+'. Osnovnu kopiju i dalje možete preuzeti.'}
  };
  window.addEventListener('pagehide',()=>urls.forEach(url=>URL.revokeObjectURL(url)));
})();
