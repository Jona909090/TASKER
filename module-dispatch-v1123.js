/* Independent manual dispatch ledger. Does not read or change module state. */
(()=>{
  'use strict'
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  const dateText=s=>s.split('-').reverse().join('.')+'.'
  let connection,rows=[],selected='',dirty=false,busy=false
  const $=id=>document.getElementById(id)
  function db(){return connection||(connection=new Promise((resolve,reject)=>{const r=indexedDB.open('tasker-manual-dispatch-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('entries',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}).catch(e=>{connection=null;throw e}))}
  async function transaction(mode,action){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('entries',mode),r=action(tx.objectStore('entries'));tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Čuvanje nije uspelo.'))})}
  async function load(){rows=await transaction('readonly',s=>s.getAll());rows.sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created)}
  const message=t=>{$('md-message').textContent=t}
  function canLeave(){return !busy&&(!dirty||confirm('Izmene nisu sačuvane. Napustiti ovaj unos?'))}
  function render(){
    const d=$('md-dialog'),r=rows.find(x=>x.id===selected)
    d.innerHTML=`<header><div><small>RUČNA EVIDENCIJA · BAJKMONT</small><h2>🚚 Odvoz modula</h2></div><button type="button" data-md="close">✕ Zatvori</button></header><p>Unosi su nezavisni od hale i statusa modula. Sve podatke unosiš ručno. Čuvaju se samo na ovom uređaju i nisu deo „Kopija / prenos“.</p><div class="md-layout"><section class="md-list"><button type="button" data-md="new">+ Dodaj odvoz modula</button><h3>Evidencija odvoza (${rows.length})</h3>${rows.length?rows.map(x=>`<button type="button" class="md-card" data-md-id="${esc(x.id)}" aria-pressed="${selected===x.id}"><span>🚚 <strong>${esc(x.name)}</strong></span><small>Izašao iz Bajkmonta: ${dateText(x.date)}</small><span class="md-preview">${esc(x.remaining||'Preostali radovi nisu upisani — klikni za unos.')}</span></button>`).join(''):'<p>Još nema unosa. Upiši prvi modul i datum odvoza.</p>'}</section><form id="md-form"><h3>${r?'Podaci i preostali radovi':'Novi odvoz modula'}</h3><label>Naziv / oznaka modula<input id="md-name" required maxlength="120" placeholder="npr. MV - 16 ili MVS - 01" value="${esc(r?.name||'')}"></label><label>Datum izlaska iz Bajkmonta<input id="md-date" type="date" required value="${esc(r?.date||today())}"></label><label>Šta je ostalo da se završi<textarea id="md-remaining" rows="9" maxlength="30000" placeholder="Ovde upiši preostale radove. Možeš ih dopuniti ili izmeniti kasnije…">${esc(r?.remaining||'')}</textarea></label><button type="submit" class="md-save">✓ ${r?'Sačuvaj izmene':'Sačuvaj odvoz'}</button><p id="md-message" role="status"></p></form></div>`
  }
  async function save(e){
    e.preventDefault();if(busy)return
    const name=$('md-name').value.trim(),date=$('md-date').value,remaining=$('md-remaining').value.trim()
    if(!name||!/^\d{4}-\d{2}-\d{2}$/.test(date)){message('Upiši naziv modula i datum odvoza.');return}
    const old=rows.find(x=>x.id===selected),now=Date.now(),entry={id:old?.id||crypto.randomUUID(),name,date,remaining,created:old?.created||now,updated:now}
    busy=true;$('md-form').querySelectorAll('input,textarea,button').forEach(x=>x.disabled=true);message('Čuvam…')
    try{await transaction('readwrite',s=>s.put(entry));selected=entry.id;dirty=false;await load();render();message('✓ Sačuvano. Klikom na karticu možeš ponovo otvoriti i dopuniti zapis.')}
    catch{message('Nije sačuvano. Proveri slobodan prostor na uređaju. Uneti tekst je ostao u obrascu.')}
    finally{busy=false;$('md-form').querySelectorAll('input,textarea,button').forEach(x=>x.disabled=false)}
  }
  async function open(){
    let d=$('md-dialog')
    if(!d){d=document.createElement('dialog');d.id='md-dialog';d.setAttribute('aria-label','Odvoz modula');document.body.append(d)
      d.addEventListener('input',()=>{dirty=true})
      d.addEventListener('submit',save)
      d.addEventListener('cancel',e=>{if(!canLeave())e.preventDefault();else dirty=false})
      d.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.type==='submit')return
        if(b.dataset.md==='close'){if(canLeave()){dirty=false;d.close()}return}
        if(b.dataset.md==='new'||b.dataset.mdId){if(!canLeave())return;selected=b.dataset.mdId||'';dirty=false;render();$('md-form').scrollIntoView({block:'start',behavior:'smooth'})}
      })
    }
    try{await load();dirty=false;render();if(!d.open)d.showModal()}catch{d.innerHTML='<h2>Odvoz modula</h2><p>Nije moguće otvoriti lokalnu evidenciju. Proveri da je čuvanje podataka dozvoljeno.</p><button type="button" data-md="close">Zatvori</button>';if(!d.open)d.showModal()}
  }
  const style=document.createElement('style');style.textContent=`
  #module-status .ms-button[data-action-skin="dispatch"]{--rim:#edb95d;--rgb:240,170,50}
  #md-dialog{box-sizing:border-box;width:min(1100px,96vw);max-height:92dvh;overflow:auto;background:#102b3c;color:#eaf4ff;border:1px solid #d0a84f;border-radius:20px;padding:24px;font:16px Arial}
  #md-dialog::backdrop{background:#020d1cce}#md-dialog header{display:flex;align-items:center;justify-content:space-between;gap:12px}#md-dialog h2{color:#ffe099;margin:8px 0}#md-dialog small{color:#add4e8}#md-dialog p{line-height:1.5;color:#b7ccdb}#md-dialog .md-layout{display:grid;grid-template-columns:minmax(220px,1fr) minmax(0,1.4fr);gap:20px}#md-dialog button{min-height:46px;background:#193d52;border:1px solid #c49b45;color:#eef8ff;border-radius:10px;padding:12px;cursor:pointer;font:inherit}#md-dialog button:disabled{opacity:.5}#md-dialog .md-card{display:grid;text-align:left;width:100%;gap:10px;margin:10px 0;background:linear-gradient(120deg,#234751,#10273b)}#md-dialog .md-card[aria-pressed=true]{outline:2px solid #5af4c4}#md-dialog .md-card strong{color:#ffe099;font-size:20px}#md-dialog .md-preview{white-space:pre-wrap;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-size:14px}#md-dialog form{border:1px solid #53717a;border-radius:14px;padding:18px;align-self:start;scroll-margin-top:12px}#md-dialog label{display:grid;gap:8px;margin-bottom:16px;font-weight:bold}#md-dialog input,#md-dialog textarea{box-sizing:border-box;width:100%;min-width:0;background:#092333;border:1px solid #ae9148;border-radius:8px;padding:12px;color:#fff;font:16px Arial}#md-dialog textarea{resize:vertical;line-height:1.5}#md-dialog .md-save{background:#168850;font-weight:bold}#md-message{color:#7ff7b9!important}#md-dialog button:focus-visible{outline:3px solid #6fefff;outline-offset:2px}@media(max-width:650px){#md-dialog{padding:14px;width:98vw;max-height:96dvh}#md-dialog .md-layout{grid-template-columns:1fr}#md-dialog h2{font-size:23px}#md-dialog form{padding:13px}}`
  document.head.append(style)
  function install(){const bar=document.querySelector('#module-status .ms-header .ms-actions');if(!bar||$('md-open'))return;const b=document.createElement('button');b.id='md-open';b.type='button';b.className='ms-button';b.dataset.actionSkin='dispatch';b.innerHTML='<span class="ms-action-art" aria-hidden="true"><svg viewBox="0 0 82 82"><path d="M6 20h43v39H6z" fill="#ffc65b" stroke="#fff0bd" stroke-width="2"/><path d="M50 34h13l13 15v10H50z" fill="#42c6ef" stroke="#b2efff" stroke-width="2"/><path d="M55 38h7l9 11H55z" fill="#13354b"/><path d="M15 26v26m9-26v26m9-26v26m9-26v26" stroke="#a76818" stroke-width="3"/><circle cx="21" cy="61" r="9" fill="#122b42" stroke="#d6eaff" stroke-width="3"/><circle cx="63" cy="61" r="9" fill="#122b42" stroke="#d6eaff" stroke-width="3"/></svg></span><span class="ms-action-label">Odvoz modula</span>';b.onclick=open;bar.append(b)}
  new MutationObserver(install).observe(document.body,{childList:true,subtree:true});install()
  window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue=''}})
})()
