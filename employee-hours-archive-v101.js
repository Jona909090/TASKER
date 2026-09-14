(function(root){
  'use strict'
  const DB='tasker-hours-documents-v1',STORE='documents'
  let connection
  function open(){
    if(!connection)connection=new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB,1)
      r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'})
      r.onsuccess=()=>resolve(r.result)
      r.onerror=()=>{connection=null;reject(r.error||Error('Arhiva nije dostupna.'))}
      r.onblocked=()=>{connection=null;reject(Error('Zatvorite druge Tasker kartice i pokušajte ponovno.'))}
    })
    return connection
  }
  async function transaction(mode,run){
    const db=await open()
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode);let result
      const req=run(tx.objectStore(STORE));req.onsuccess=()=>{result=req.result}
      tx.oncomplete=()=>resolve(result)
      tx.onerror=tx.onabort=()=>reject(tx.error||Error('Dokument nije spremljen. Provjerite slobodan prostor uređaja.'))
    })
  }
  async function save(file,meta={}){
    const record={id:crypto.randomUUID(),created:Date.now(),name:file.name,type:file.type,size:file.size,blob:file,month:meta.month||'',site:meta.site||'',subject:meta.subject||file.name}
    await transaction('readwrite',store=>store.put(record))
    if(typeof document==='object')await render()
    return record.id
  }
  const list=()=>transaction('readonly',store=>store.getAll())
  async function importFile(file){
    const extension=String(file.name||'').split('.').pop().toLowerCase()
    const types={pdf:'application/pdf',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',xls:'application/vnd.ms-excel'}
    if(!types[extension])throw Error('Odaberite PDF ili Excel (.xlsx, .xls) dokument.')
    if(!file.size)throw Error('Odabrana datoteka je prazna.')
    const copy=new File([file],file.name,{type:types[extension],lastModified:file.lastModified})
    return save(copy,{subject:file.name})
  }
  const api={save,list,importFile};root.TaskerHoursArchive=api
  if(typeof module==='object'&&module.exports){module.exports=api;return}
  const el=id=>document.getElementById(id),entries=new Map(),urls=[]
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  let rendering=0
  async function render(){
    if(!el('eh-archive-list'))return
    const token=++rendering
    try{
      const records=await list();if(token!==rendering||!el('eh-archive-list'))return
      urls.splice(0).forEach(url=>URL.revokeObjectURL(url));entries.clear()
      records.sort((a,b)=>b.created-a.created)
      el('eh-archive-count').textContent=records.length+' spremljenih dokumenata'
      el('eh-archive-list').innerHTML=records.map(r=>{
        const file=new File([r.blob],r.name,{type:r.type}),url=URL.createObjectURL(file);urls.push(url);entries.set(r.id,{...r,file})
        return `<article class="eh-archive-item"><strong>${r.type==='application/pdf'?'PDF':'EXCEL'} · ${esc(r.name)}</strong><p>✓ Sačuvano na ovom uređaju · ${new Date(r.created).toLocaleString('hr-HR')} · ${Math.ceil(r.size/1024)} KB</p><div class="eh-tools"><a class="eh-btn" href="${url}" ${r.type==='application/pdf'?'target="_blank" rel="noopener"':'download="'+esc(r.name)+'"'}>${r.type==='application/pdf'?'Otvori PDF':'Otvori / preuzmi Excel'}</a><a class="eh-btn" href="${url}" download="${esc(r.name)}">Preuzmi dokument</a><button class="eh-btn primary" data-hours-archive-share="${r.id}" data-channel="WhatsApp">WhatsApp — dokument</button><button class="eh-btn" data-hours-archive-share="${r.id}" data-channel="e-mail">E-mail — dokument</button></div><p id="eh-archive-result-${r.id}" role="status"></p></article>`
      }).join('')||'<p>Arhiva je prazna. Napravite Excel ili PDF izvoz iznad; dokument se automatski sprema ovdje.</p>'
    }catch(e){if(el('eh-archive-list'))el('eh-archive-list').textContent='Arhiva se ne može otvoriti: '+e.message}
  }
  function install(){
    const page=el('employee-hours-project');if(!page||el('eh-document-archive'))return
    const panel=document.createElement('section');panel.id='eh-document-archive';panel.className='eh-panel'
    panel.innerHTML='<details open><summary><strong>📁 Arhiva dokumenata — radni sati</strong> <span id="eh-archive-count"></span></summary><p>Svaki napravljeni Excel ili PDF čuva se ovdje kao zasebna datoteka, i nakon zatvaranja Taskera. Dokument je snimka sati u trenutku izrade. Za nove sate napravite novi izvoz.</p><p>Arhiva je lokalna na ovom uređaju i pregledniku. Za sigurnosnu kopiju preuzmite dokumente; brisanje podataka preglednika briše i lokalnu arhivu.</p><div class="eh-tools"><button type="button" class="eh-btn primary" id="eh-import-document">+ Dodaj dokument s uređaja</button><input type="file" id="eh-import-files" accept=".pdf,.xlsx,.xls" multiple hidden></div><p>Odaberite datoteku iz Preuzimanja ili druge mape. U arhivu se sprema cijeli dokument; izvornik na uređaju ostaje netaknut.</p><p id="eh-import-status" role="status"></p><div id="eh-archive-list" aria-live="polite">Učitavam arhivu…</div></details>'
    page.append(panel);render()
  }
  document.addEventListener('click',async event=>{
    if(event.target.closest('#eh-import-document')){el('eh-import-files').click();return}
    const button=event.target.closest('[data-hours-archive-share]');if(!button)return
    const record=entries.get(button.dataset.hoursArchiveShare);if(!record)return
    const result=el('eh-archive-result-'+record.id),channel=button.dataset.channel
    let can=false;try{can=!!navigator.canShare?.({files:[record.file]})}catch{}
    if(!can){result.textContent='Ovaj preglednik ne podržava izravno dijeljenje datoteka. Kliknite Preuzmi dokument, zatim u '+channel+' dodajte tu datoteku kao prilog (spajalica / + → Dokument). Ne šalje se samo tekst.';return}
    try{
      result.textContent='Odaberite '+channel+' u izborniku za dijeljenje dokumenta.'
      await navigator.share({files:[record.file],title:record.subject})
      result.textContent='Dokument je predan odabranoj aplikaciji. Tamo odaberite primatelja i potvrdite slanje.'
    }catch(e){result.textContent=e.name==='AbortError'?'Dijeljenje je otkazano. Dokument ostaje u arhivi.':'Dijeljenje nije uspjelo. Preuzmite spremljeni dokument i dodajte ga kao prilog.'}
  })
  document.addEventListener('change',async event=>{
    if(event.target.id!=='eh-import-files')return
    const input=event.target,files=Array.from(input.files||[])
    if(!files.length)return
    const button=el('eh-import-document'),message=el('eh-import-status')
    button.disabled=true;input.disabled=true;message.textContent='Spremam dokumente u arhivu…'
    let count=0;const errors=[]
    try{
      for(const file of files){try{await importFile(file);count++}catch(e){errors.push(file.name+': '+e.message)}}
      message.textContent=(count?'✓ Sačuvano u arhivu: '+count+' dokumenata. Izvorne datoteke nisu promijenjene. ':'')+errors.join(' ')
    }finally{button.disabled=false;input.disabled=false;input.value=''}
  })
  const style=document.createElement('style');style.textContent='#eh-document-archive summary{cursor:pointer;font-size:18px;color:#81e9c0}#eh-archive-count{font-size:13px;color:#a5bdd1;margin-left:12px}.eh-archive-item{margin-top:14px;padding:16px;border:1px solid #355872;border-radius:12px;background:#10253b}.eh-archive-item strong{overflow-wrap:anywhere}.eh-archive-item a{display:inline-block;text-decoration:none}.eh-archive-item p{font-size:13px}'
  document.head.append(style)
  new MutationObserver(install).observe(document.getElementById('app')||document.body,{childList:true,subtree:true})
  install()
})(typeof window==='object'?window:globalThis)
