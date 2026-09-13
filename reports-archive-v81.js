(function () {
  'use strict'
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  let activeId = null, current = null, busy = false
  const db = new Promise((resolve, reject) => {
    const r = indexedDB.open('tasker-daily-report-archive', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('reports', {keyPath:'id'})
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
  async function storage (method, value) {
    const d = await db
    return new Promise((resolve, reject) => {
      const tx = d.transaction('reports', method === 'getAll' ? 'readonly' : 'readwrite')
      const r = tx.objectStore('reports')[method](value)
      tx.oncomplete = () => resolve(r.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error || new Error('Spremanje nije uspjelo'))
    })
  }
  function message (text) { const el=document.getElementById('ra-message'); if(el) el.textContent=text }
  function snapshot () {
    const area=document.getElementById('reports-output-content')
    const draft=JSON.parse(localStorage.getItem('tasker.reports-project-draft') || '{}')
    const lines=[...area.children].flatMap(el => el.tagName==='UL' ? [...el.children].map(li=>({kind:'work',text:li.textContent})) : [{kind:el.tagName==='H3'?'module':'info',text:el.textContent}])
    return {id:activeId || crypto.randomUUID(), date:draft.date || new Date().toLocaleDateString('sv-SE'), location:draft.location || 'Dnevni izvještaj', draft, lines, updatedAt:new Date().toISOString()}
  }
  const textOf = r => r.lines.map(l=>(l.kind==='module'?'\n':'')+(l.kind==='work'?'- ':'')+l.text).join('\n')
  const filename = (r, ext) => `Izvjestaj-${r.date}-${r.location.replace(/[^\p{L}\p{N}-]+/gu,'-').slice(0,70)}.${ext}`
  function download (blob, name) {
    const url=URL.createObjectURL(blob), a=document.createElement('a')
    a.href=url; a.download=name; document.body.append(a); a.click(); a.remove()
    setTimeout(()=>URL.revokeObjectURL(url),60000)
  }
  async function saveGenerated () {
    try {
      const r=snapshot()
      await storage('put',r)
      activeId=r.id; current=r
      message('Izvještaj je sačuvan u arhivi po datumu.'); await list()
    } catch (e) { message('Izvještaj nije sačuvan: '+e.message) }
  }
  async function list () {
    const target=document.getElementById('ra-list'); if(!target) return
    const rows=await storage('getAll')
    rows.sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt.localeCompare(a.updatedAt))
    target.innerHTML=rows.length?rows.map(r=>`<article class="ra-item"><div><strong>${esc(r.date.split('-').reverse().join('.'))}.</strong><span>${esc(r.location)}</span><small>${r.pdf?'PDF sačuvan · ':''}${r.lines.filter(l=>l.kind==='module').length} modula</small></div><div><button data-ra-open="${esc(r.id)}">Otvori</button><button data-ra-edit="${esc(r.id)}">Uredi</button><button data-ra-delete="${esc(r.id)}">Obriši</button></div></article>`).join(''):'<p>Arhiva je prazna. Generirajte prvi izvještaj.</p>'
  }
  function show (r) {
    activeId=r.id; current=r
    const out=document.getElementById('reports-output'), content=document.getElementById('reports-output-content')
    content.innerHTML=r.lines.map(l=>l.kind==='module'?`<h3>${esc(l.text)}</h3>`:l.kind==='work'?`<p>• ${esc(l.text)}</p>`:`<p>${esc(l.text)}</p>`).join('')
    out.hidden=false; out.scrollIntoView({behavior:'smooth'}); message('Otvoren sačuvani izvještaj.')
  }
  let pdfLibrary
  function loadPdf () {
    if(window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF)
    if(!pdfLibrary) pdfLibrary=new Promise((resolve,reject)=>{
      const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload=()=>resolve(window.jspdf.jsPDF); s.onerror=()=>{pdfLibrary=null;s.remove();reject(new Error('PDF dodatak nije učitan. Provjerite internet i pokušajte ponovo.'))};document.head.append(s)
    })
    return pdfLibrary
  }
  async function makePdf (r) {
    if(r.pdf) return r.pdf
    const PDF=await loadPdf(), pdf=new PDF({unit:'mm',format:'a4'})
    const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754
    const ctx=canvas.getContext('2d');let y=110, page=0
    function start () {ctx.fillStyle='#fff';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#111827';ctx.font='bold 30px Arial';ctx.fillText('DNEVNI IZVJEŠTAJ',85,65);y=120}
    function finish () {ctx.fillStyle='#64748b';ctx.font='18px Arial';ctx.fillText(`TASKER · ${r.date} · ${page+1}`,85,1700);if(page++)pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',.95),'JPEG',0,0,210,297)}
    start()
    for(const line of r.lines){
      if(line.kind==='module')y+=20
      const font=line.kind==='module'?'bold 26px Arial':'25px Arial';ctx.font=font
      const words=((line.kind==='work'?'• ':'')+line.text).split(/\s+/);const wrapped=[];let row=''
      for(const word of words){
        if(ctx.measureText(row+(row?' ':'')+word).width>1050&&row){wrapped.push(row);row=''}
        // Split an unusually long token so it cannot run beyond the page.
        for(const ch of (row?' ':'')+word){if(ctx.measureText(row+ch).width>1050){wrapped.push(row);row=''}row+=ch}
      }
      if(row)wrapped.push(row)
      for(const row of wrapped){if(y>1620){finish();start()}ctx.font=font;ctx.fillStyle='#111827';ctx.fillText(row,85,y);y+=36}
      y+=5
    }
    finish();return pdf.output('blob')
  }
  async function action (kind) {
    if(!current){message('Prvo generirajte ili otvorite izvještaj.');return}
    if(busy)return
    const report=current
    try {
      if(kind==='whatsapp'){window.open('https://wa.me/?text='+encodeURIComponent(textOf(report)),'_blank','noopener');return}
      if(kind==='text'){download(new Blob([textOf(report)],{type:'text/plain;charset=utf-8'}),filename(report,'txt'));return}
      if(kind==='save'){await storage('put',report);message('Izvještaj je sačuvan u arhivi.');return}
      busy=true;message('Pripremam PDF…')
      const pdf=await makePdf(report)
      report.pdf=pdf;await storage('put',report);await list()
      download(pdf,filename(report,'pdf'));message('PDF je sačuvan u arhivi i preuzet na uređaj.')
    }catch(e){message('Radnja nije uspjela: '+e.message)}finally{busy=false}
  }
  function install () {
    const page=document.getElementById('reports-project-content');if(!page||page.querySelector('#ra-folder'))return
    const folder=document.createElement('details');folder.id='ra-folder'
    folder.innerHTML='<summary>▣ Arhiva dnevnih izvještaja</summary><p>Sačuvano na ovom uređaju. Preuzmite tekst ili PDF za kopiju izvan aplikacije.</p><button id="ra-new">+ Novi izvještaj</button><div id="ra-list"></div>'
    page.querySelector('.reports-project-header').after(folder)
    const bar=document.createElement('div');bar.className='ra-actions'
    bar.innerHTML='<button data-ra-action="save">Sačuvaj izvještaj</button><button data-ra-action="whatsapp">WhatsApp</button><button data-ra-action="text">Preuzmi tekst</button><button data-ra-action="pdf">Napravi / preuzmi PDF</button><p id="ra-message" role="status"></p>'
    page.querySelector('#reports-output-content').after(bar)
    current=null;activeId=null;list().catch(e=>message('Arhiva nije dostupna: '+e.message))
  }
  document.addEventListener('click',async e=>{
    if(e.target.closest('#reports-generate')){queueMicrotask(saveGenerated);return}
    const act=e.target.closest('[data-ra-action]');if(act){await action(act.dataset.raAction);return}
    if(e.target.closest('#ra-new')){activeId=null;current=null;document.dispatchEvent(new CustomEvent('tasker-report-load',{detail:null}));return}
    const item=e.target.closest('[data-ra-open],[data-ra-edit],[data-ra-delete]');if(!item)return
    try {
      const rows=await storage('getAll');const id=item.dataset.raOpen||item.dataset.raEdit||item.dataset.raDelete;const r=rows.find(r=>r.id===id);if(!r)return
      if(item.dataset.raDelete){if(!confirm('Obrisati ovaj izvještaj i njegov PDF iz arhive?'))return;await storage('delete',id);if(activeId===id){activeId=null;current=null;document.getElementById('reports-output').hidden=true}await list();return}
      if(item.dataset.raEdit){document.dispatchEvent(new CustomEvent('tasker-report-load',{detail:r.draft}));install();activeId=r.id;current=r;return}
      show(r)
    }catch(error){message('Arhiva: '+error.message)}
  })
  const style=document.createElement('style');style.textContent=`#ra-folder{padding:18px;margin:0 0 18px;border:1px solid #315777;border-radius:14px;background:#142940}#ra-folder summary{cursor:pointer;color:#64ddff;font-weight:bold;font-size:18px}#ra-folder p{color:#a4bdd1;font-size:13px}.ra-item{display:flex;gap:16px;justify-content:space-between;align-items:center;border-top:1px solid #315777;padding:14px 0}.ra-item span,.ra-item small{display:block;margin-top:5px}.ra-item small{color:#8ba9bf}.ra-item>div:last-child,.ra-actions{display:flex;gap:8px;flex-wrap:wrap}#ra-folder button,.ra-actions button{padding:10px 14px;border:1px solid #3ea6c6;background:#153d56;border-radius:8px;color:#c6f3ff;cursor:pointer}.ra-actions{border-top:1px solid #b6c6d1;margin-top:20px;padding-top:16px}#ra-message{width:100%;font-size:13px;color:#195473}@media(max-width:600px){.ra-item{align-items:flex-start;flex-direction:column}}`
    document.head.append(style)
    new MutationObserver(install).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});install()
})()

