(function(root){
  'use strict'
  function decision(local,base,remoteRevision,remoteHash){
    if(local===remoteHash)return 'equal'
    if(!base)return remoteRevision===0?'initial-upload':'initial-download'
    if(remoteRevision===base.revision)return local===base.hash?'equal':'upload'
    return local===base.hash?'download':'conflict'
  }
  if(typeof module==='object'&&module.exports){module.exports={decision};return}
  const ENDPOINT='https://script.google.com/macros/s/AKfycbwtn4IQ0OwnQq8hn0Mm0VfQ7PGWqH-UTp62j4rAVH-u8E2pAwB1jXbct36FVtZrIONS1w/exec'
  const TOKEN='tasker.sync.v105.token',META='tasker.sync.v105.base.'
  const configs={modules:{key:'tasker.module-status.v1',host:'module-status',label:'Status modula'},hours:{key:'tasker.employee-hours.v1',host:'employee-hours-project',label:'Radni sati'}}
  const sessions={};let running=false
  const $=id=>document.getElementById(id)
  const hash=async s=>s===null?null:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(n=>n.toString(16).padStart(2,'0')).join('')
  const read=d=>{const s=localStorage.getItem(configs[d].key);return s===null?null:JSON.stringify(JSON.parse(s))}
  const base=d=>{try{return JSON.parse(localStorage.getItem(META+d)||'null')}catch{return null}}
  const saveBase=(d,revision,h)=>localStorage.setItem(META+d,JSON.stringify({revision,hash:h}))
  function valid(d,data){
    if(!data||typeof data!=='object')throw Error('Podaci nisu ispravni.')
    if(d==='modules')root.TaskerModuleStatusModel.validate(data)
    else root.TaskerHoursBooks.validate(data,root.TaskerHoursModel)
    return data
  }
  async function api(q,token=localStorage.getItem(TOKEN)){
    if(!token)throw Error('Unesite tajni kod.')
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000)
    try{
      const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({...q,token}),credentials:'omit',redirect:'follow',signal:controller.signal})
      if(!response.ok)throw Error('Servis trenutno nije dostupan.')
      const data=await response.json()
      if(!data.success){const e=Error(({UNAUTHORIZED:'Tajni kod nije ispravan.',CONFLICT:'Drugi uređaj je sačuvao novije podatke. Ponovo proverite vezu.',BUSY:'Servis je zauzet. Pokušajte ponovo.',TOO_LARGE:'Podaci su preveliki za ovaj prenos.'})[data.code]||'Sinhronizacija nije uspela ('+(data.code||'nepoznato')+').');e.code=data.code;throw e}
      return data
    }catch(e){if(e.name==='AbortError')throw Error('Veza je istekla. Lokalni podaci su sačuvani; sledeća provera utvrdiće da li je prenos završen.');throw e}finally{clearTimeout(timer)}
  }
  function backup(d,local,remote){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open('tasker-sync-backups-v105',1)
      req.onupgradeneeded=()=>req.result.createObjectStore('snapshots',{keyPath:'id'})
      req.onerror=()=>reject(Error('Rezervna kopija nije sačuvana. Prenos je zaustavljen.'))
      req.onsuccess=()=>{const db=req.result,tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').add({id:crypto.randomUUID(),dataset:d,at:new Date().toISOString(),local,remote});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=tx.onabort=()=>{db.close();reject(Error('Nema prostora za rezervnu kopiju. Prenos je zaustavljen.'))}}
    })
  }
  function message(d,text){const n=$('ts-message-'+d);if(n)n.textContent=text;const p=$('ts-panel-'+d);if(p)p.querySelector('summary').textContent='☁ Povezivanje tableta i računara · '+text.slice(0,90)}
  function actions(d,mode){
    const n=$('ts-actions-'+d);if(!n)return;n.replaceChildren()
    if(d==='modules'&&mode!=='reload')return
    if(['initial-upload','initial-download','download','conflict','reload'].includes(mode))$('ts-panel-'+d).open=true
    const button=(text,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.tsAction=action;b.dataset.dataset=d;n.append(b)}
    if(mode==='initial-upload')button('Pošalji postojeće podatke ovog uređaja','upload')
    if(mode==='initial-download'||mode==='download')button('Preuzmi podatke sa drugog uređaja','download')
    if(mode==='conflict'||mode==='initial-download'){
      if(mode==='conflict')button('Preuzmi podatke iz oblaka','download')
      button('Zadrži ovaj uređaj i pošalji u oblak','replace')
    }
    if(mode==='reload')button('Otvori preuzete podatke','reload')
  }
  async function check(d,automatic=false){
    if(sessions[d]?.reload){actions(d,'reload');message(d,'Podaci su preuzeti. Otvorite novu verziju pre nastavka rada.');return}
    const local=read(d),localHash=await hash(local),b=base(d)
    const remote=await api({action:'read',dataset:d})
    if(read(d)!==local){sessions[d]=null;throw Error('Podaci su promenjeni tokom provere. Pokušajte ponovo.')}
    if(remote.data!==null)valid(d,remote.data)
    const remoteText=remote.data===null?null:JSON.stringify(remote.data),remoteHash=await hash(remoteText)
    const mode=decision(localHash,b,remote.revision,remoteHash)
    sessions[d]={local,localHash,remote,remoteText,remoteHash,mode}
    actions(d,mode)
    if(mode==='equal'){
      // Do not initialise automatic upload against an empty server until user chooses it.
      if(remote.revision>0)saveBase(d,remote.revision,localHash)
      message(d,remote.revision?'✓ Usklađeno · '+new Date().toLocaleTimeString('hr-HR'):'Još nema sačuvanih podataka za prenos.')
    }else if(mode==='upload'&&local!==null&&d!=='modules'){await upload(d,false)}
    else message(d,({
      upload:'Izmene su na ovom uređaju. Kliknite Pošalji podatke na server.',
      'initial-upload':'Prvo povezivanje: u oblaku još nema evidencije. Pošaljite podatke sa uređaja na kojem su tačni sati i moduli.',
      'initial-download':'U oblaku već postoji evidencija. Izaberite koju verziju želite; pre promene čuvamo rezervnu kopiju.',
      download:'Nova verzija je dostupna sa drugog uređaja. Kliknite Preuzmi kada završite trenutni unos.',
      conflict:'PAŽNJA: oba uređaja imaju različite izmene. Automatski prenos je zaustavljen. Izbor verzije zamenjuje celu ovu evidenciju, ne spaja podatke.'
    })[mode]||'Podaci su sačuvani lokalno.')
  }
  async function upload(d,explicit){
    const s=sessions[d];if(!s||s.local===null)throw Error('Na ovom uređaju nema sačuvanih podataka.')
    if(read(d)!==s.local)throw Error('Podaci su promenjeni. Kliknite Proveri vezu ponovo.')
    valid(d,JSON.parse(s.local))
    if(explicit){if(!confirm('Poslati sve podatke kartice '+configs[d].label+' sa OVOG uređaja? Ako postoji druga verzija u oblaku, ona će biti zamenjena, uz sačuvanu rezervnu kopiju.'))return;await backup(d,s.local,s.remoteText)}
    else if(!['upload','initial-upload'].includes(s.mode))throw Error('Prvo potvrdite početnu verziju.')
    if(read(d)!==s.local)throw Error('Podaci su promenjeni tokom pripreme. Pokušajte ponovo.')
    const result=await api({action:'write',dataset:d,baseRevision:s.remote.revision,requestId:crypto.randomUUID(),data:JSON.parse(s.local)})
    saveBase(d,result.revision,s.localHash);actions(d,'equal');message(d,'✓ Sačuvano u oblaku. Dostupno na drugom povezanom uređaju.');sessions[d]=null
  }
  async function download(d){
    const s=sessions[d];if(!s||!s.remoteText)throw Error('Nema podataka za preuzimanje.')
    if(!confirm('Preuzeti celu evidenciju '+configs[d].label+' iz oblaka? Trenutna lokalna verzija će biti sačuvana kao rezervna kopija, a stranica ponovo učitana.'))return
    if(read(d)!==s.local)throw Error('Lokalni podaci su promenjeni. Proverite vezu ponovo.')
    valid(d,s.remote.data);await backup(d,s.local,s.remoteText)
    if(read(d)!==s.local)throw Error('U međuvremenu je sačuvana nova izmena. Prenos je zaustavljen.')
    // Remove the baseline first so an interrupted import can never blindly upload stale data.
    localStorage.removeItem(META+d)
    localStorage.setItem(configs[d].key,s.remoteText)
    saveBase(d,s.remote.revision,s.remoteHash)
    sessions[d]={reload:true};actions(d,'reload');location.reload()
  }
  async function transfer(d,direction){
    if(!localStorage.getItem(TOKEN)){
      const settings=$('ts-settings-'+d);if(settings)settings.open=true
      message(d,'Prvo unesite isti tajni kod u Podešavanjima na oba uređaja.');return
    }
    message(d,direction==='send'?'Šaljem podatke na server…':'Preuzimam podatke sa servera…')
    await check(d)
    const s=sessions[d]
    if(s?.reload){location.reload();return}
    if(!s)throw Error('Ponovite prenos.')
    if(s.mode==='equal'){message(d,s.remote.revision?'✓ Ovaj uređaj već ima iste podatke kao server.':'Još nema sačuvanih podataka za prenos.');return}
    if(direction==='send'){
      await upload(d,['conflict','download','initial-download'].includes(s.mode))
    }else{
      if(!s.remoteText)throw Error('Na serveru još nema podataka. Prvo na tabletu kliknite Pošalji podatke na server.')
      await download(d)
    }
  }
  async function exportBackups(d){
    const rows=await new Promise((resolve,reject)=>{const req=indexedDB.open('tasker-sync-backups-v105',1);req.onupgradeneeded=()=>req.result.createObjectStore('snapshots',{keyPath:'id'});req.onerror=()=>reject(Error('Kopije nisu dostupne.'));req.onsuccess=()=>{const db=req.result,r=db.transaction('snapshots').objectStore('snapshots').getAll();r.onsuccess=()=>{db.close();resolve(r.result.filter(x=>x.dataset===d))};r.onerror=()=>{db.close();reject(Error('Kopije nisu dostupne.'))}}})
    const blob=new Blob([JSON.stringify({dataset:d,current:read(d),backups:rows},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='TASKER-rezervne-kopije-'+d+'-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)
  }
  function mount(){
    for(const [d,c]of Object.entries(configs)){
      const host=$(c.host);if(!host||$('ts-panel-'+d))continue
      const panel=document.createElement('details');panel.id='ts-panel-'+d;panel.className='tasker-sync-panel'
      panel.innerHTML=`<summary>☁ Povezivanje tableta i računara</summary><p>Sinhronizuje se samo ${c.label}. Tajni kod unesite jednom na svakom uređaju. PDF/Excel arhiva na uređaju nije deo ovog prenosa.</p><form data-ts-form="${d}"><label>Tajni kod za sinhronizaciju<input type="password" name="token" autocomplete="off" required placeholder="Unesite TASKER_SYNC_TOKEN"></label><button type="submit">Poveži uređaj</button></form><div class="ts-tools"><button type="button" data-ts-action="check" data-dataset="${d}">Proveri vezu / nove podatke</button><button type="button" data-ts-action="backup" data-dataset="${d}">Preuzmi rezervne kopije</button><button type="button" data-ts-action="disconnect" data-dataset="${d}">Isključi povezivanje uređaja</button></div><p id="ts-message-${d}" role="status"></p><div id="ts-actions-${d}" class="ts-tools"></div>`
      if(d==='modules'){
        panel.open=true
        panel.innerHTML=`<summary>☁ Prenos podataka — tablet / računar</summary><div class="ts-tools ts-primary"><button type="button" data-ts-action="send" data-dataset="modules">↑ Pošalji podatke na server</button><button type="button" data-ts-action="receive" data-dataset="modules">↓ Upari / preuzmi podatke</button></div><p>Na tabletu pošalji podatke. Na računaru klikni Upari / preuzmi podatke. Prenosi se cela kartica Status modula, za sve hale. Filter slika i PDF/Excel arhiva nisu uključeni.</p><p id="ts-message-modules" role="status"></p><div id="ts-actions-modules" class="ts-tools"></div><details id="ts-settings-modules"><summary>Podešavanja povezivanja</summary><p>Isti tajni kod unosi se samo jednom na svakom uređaju.</p><form data-ts-form="modules"><label>Tajni kod<input type="password" name="token" autocomplete="off" required placeholder="Unesite tajni kod"></label><button type="submit">Sačuvaj povezivanje</button></form><div class="ts-tools"><button type="button" data-ts-action="backup" data-dataset="modules">Preuzmi rezervne kopije</button><button type="button" data-ts-action="disconnect" data-dataset="modules">Isključi povezivanje uređaja</button></div></details>`
      }
      host.prepend(panel);message(d,localStorage.getItem(TOKEN)?(d==='modules'?'Spremno. Izaberite slanje ili preuzimanje.':'Veza je podešena. Provera u toku…'):'Nije povezano. Podaci ostaju na ovom uređaju.')
    }
  }
  async function exclusive(d,fn){
    if(running)return;running=true
    const buttons=[...document.querySelectorAll('[data-ts-action], [data-ts-form] button')];buttons.forEach(b=>b.disabled=true)
    try{await fn()}catch(e){message(d,e.message||'Veza nije dostupna. Podaci ostaju sačuvani lokalno.');if(e.code==='CONFLICT')sessions[d]=null}finally{running=false;buttons.forEach(b=>b.disabled=false)}
  }
  document.addEventListener('submit',event=>{
    const form=event.target;if(!form.dataset.tsForm)return;event.preventDefault();const d=form.dataset.tsForm,token=form.elements.token.value.trim()
    exclusive(d,async()=>{await api({action:'ping'},token);const old=localStorage.getItem(TOKEN);if(old!==token){for(const k of Object.keys(configs)){localStorage.removeItem(META+k);sessions[k]=null}}localStorage.setItem(TOKEN,token);form.reset();if(d==='modules'){const settings=$('ts-settings-modules');if(settings)settings.open=false;message(d,'✓ Povezano. Sada izaberite slanje ili preuzimanje.')}else await check(d)})
  })
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-ts-action]');if(!b)return;const d=b.dataset.dataset,a=b.dataset.tsAction
    exclusive(d,async()=>{
      if(a==='send'||a==='receive')await transfer(d,a)
      if(a==='check')await check(d)
      if(a==='upload'||a==='replace')await upload(d,true)
      if(a==='download')await download(d)
      if(a==='backup')await exportBackups(d)
      if(a==='reload')location.reload()
      if(a==='disconnect'&&confirm('Isključiti sinhronizaciju obe kartice na ovom uređaju? Podaci se ne brišu.')){localStorage.removeItem(TOKEN);for(const k of Object.keys(configs)){localStorage.removeItem(META+k);sessions[k]=null;actions(k,'equal');message(k,'Sinhronizacija je isključena. Lokalni podaci nisu obrisani.')}}
    })
  })
  const style=document.createElement('style');style.textContent='.tasker-sync-panel{padding:15px;margin:12px 0 20px;border:1px solid #38647b;border-radius:12px;background:#10263a;color:#dceafa}.tasker-sync-panel summary{cursor:pointer;font-weight:700;color:#65dbed}.tasker-sync-panel p{font-size:13px;line-height:1.5}.tasker-sync-panel form,.tasker-sync-panel .ts-tools{display:flex;align-items:end;gap:9px;flex-wrap:wrap;margin:12px 0}.tasker-sync-panel label{display:grid;gap:6px}.tasker-sync-panel input{background:#091b2c;color:white;padding:10px;border:1px solid #49738c;border-radius:8px;max-width:100%}.tasker-sync-panel button{padding:10px 14px;border:1px solid #467994;border-radius:8px;background:#173c53;color:#e5f8ff;cursor:pointer;font-weight:700} .tasker-sync-panel .ts-primary button{min-height:48px;background:#096db8;font-size:15px}.tasker-sync-panel .ts-primary button+button{background:#11745e}.tasker-sync-panel button:disabled{opacity:.5;cursor:wait}';document.head.append(style)
  new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount()
  async function tick(){
    if(running||document.hidden||!navigator.onLine||!localStorage.getItem(TOKEN))return
    for(const d of Object.keys(configs))if(d!=='modules'&&($(configs[d].host)||base(d)))await exclusive(d,()=>check(d,true))
  }
  setInterval(tick,15000);window.addEventListener('online',tick);window.addEventListener('focus',tick)
})(typeof window==='object'?window:globalThis)

