// Separate Tasker employee attendance and monthly hours project.
(function () {
  'use strict'
  const cardId = 'open-employee-hours-project'
  const pageId = 'employee-hours-project'
  const now = new Date()
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  const M=window.TaskerHoursModel, KEY='tasker.employee-hours.v1'
  let state, loadError=''
  try {const raw=localStorage.getItem(KEY);state=raw?M.validate(JSON.parse(raw)):M.create()} catch(e){loadError=e.message}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const fmt=m=>new Intl.NumberFormat('hr-HR',{maximumFractionDigits:2}).format(m/60)
  const el=id=>document.getElementById(id)
  function commit(action, redraw=true){
    try {const next=M.change(state,action);localStorage.setItem(KEY,JSON.stringify(next));state=next;if(redraw)refresh();el('eh-save').textContent='Sačuvano na ovom uređaju';return true}
    catch(e){el('eh-save').textContent='Nije sačuvano: '+e.message;return false}
  }
  const style = document.createElement('style')
  style.textContent = `
    .project-employee-hours{background:radial-gradient(circle at 85% 10%,#25df9a20,transparent 45%),linear-gradient(145deg,#17314d,#0d2037)!important;border-color:#39bb9866!important}
    .project-employee-hours .project-symbol{background:#164d48;color:#78f6c0;box-shadow:0 0 20px #42efa52b}
    #employee-hours-project{max-width:1180px;margin:0 auto;padding:8px 0 40px;color:#edf7ff}
    #employee-hours-project .eh-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:26px;border:1px solid #315777;border-radius:18px;background:linear-gradient(145deg,#172e49,#102139);margin-bottom:20px}
    #employee-hours-project h1{font-size:clamp(24px,3vw,34px);margin:9px 0}
    #employee-hours-project h2{font-size:20px;margin:0 0 9px}
    #employee-hours-project p{color:#9eb7cc;line-height:1.5;margin:6px 0}
    #employee-hours-project .eh-back{border:0;background:transparent;color:#62d9ff;padding:0;cursor:pointer;font-weight:bold}
    #employee-hours-project .eh-tag{color:#62d9ff;font-size:11px;font-weight:bold;letter-spacing:.12em;margin-top:16px}
    #employee-hours-project .eh-clock{display:grid;place-items:center;width:68px;height:68px;flex-shrink:0;border:1px solid #378b83;border-radius:18px;background:#123b40;color:#72fac0;font-size:36px}
    #employee-hours-project .eh-flow{padding:14px 18px;margin-bottom:20px;border:1px solid #2d526c;border-radius:12px;background:#10273b;color:#9edced;font-size:14px;line-height:1.7}
    #employee-hours-project .eh-panel{padding:22px;border:1px solid #2d4d6b;border-radius:16px;background:#172944;margin-bottom:18px}
    #employee-hours-project .eh-fields{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}
    #employee-hours-project label{display:grid;gap:8px;color:#a7c0d3;font-size:13px;font-weight:bold}
    #employee-hours-project input{height:44px;min-width:0;padding:0 12px;background:#0e2037;color:#f2f8ff;border:1px solid #365b7b;border-radius:9px;color-scheme:dark;font:inherit}
    #employee-hours-project input:focus{outline:2px solid #50d8ed;outline-offset:2px}
    #employee-hours-project .eh-empty{margin-top:18px;padding:28px 18px;text-align:center;border:1px dashed #3c6079;border-radius:12px;color:#a7c0d3;background:#102239}
    #employee-hours-project .eh-empty strong{display:block;margin-bottom:6px;color:#d7e9f5}
    #employee-hours-project .eh-month-head{display:flex;gap:18px;justify-content:space-between;align-items:center}
    #employee-hours-project .eh-legend{display:flex;gap:12px;margin-top:16px;font-size:12px}.eh-present{color:#72efac}.eh-absent{color:#ffadb7}
    @media(max-width:600px){#employee-hours-project .eh-fields{grid-template-columns:1fr}#employee-hours-project .eh-month-head{align-items:stretch;flex-direction:column}#employee-hours-project .eh-clock{display:none}#employee-hours-project .eh-panel,#employee-hours-project .eh-hero{padding:18px}}
  `
  document.head.append(style)
  function installCard () {
    const grid = document.querySelector('#content .project-grid')
    if (!grid || document.getElementById(cardId)) return
    const card = `<button type="button" class="project-card project-employee-hours" id="${cardId}"><span class="project-card-glow" aria-hidden="true"></span><div class="project-card-top"><span class="project-symbol" aria-hidden="true">◷</span><span class="project-status">Novi projekt</span></div><p class="project-label">PROJEKT</p><h2>RADNI SATI ZAPOSLENIH</h2><p class="project-description">Dnevna prisutnost i mjesečna evidencija radnih sati.</p><div class="project-card-footer"><span>PRISUTNOST · RADNI SATI</span><strong>Otvori projekt →</strong></div></button>`
    const empty = grid.querySelector('[data-new-project-slot]')
    if (empty) empty.insertAdjacentHTML('beforebegin', card)
    else grid.insertAdjacentHTML('beforeend', card)
  }

  const extra=document.createElement('style')
  extra.textContent=`
    #employee-hours-project button{font:inherit;cursor:pointer}
    #employee-hours-project button:disabled{opacity:.35;cursor:default}
    #employee-hours-project .eh-btn{min-height:44px;padding:10px 14px;border:1px solid #3b617f;border-radius:9px;background:#12324a;color:#d9f3ff;font-size:13px;font-weight:700}
    #employee-hours-project .eh-btn.primary,#employee-hours-project .eh-btn.is-present{background:#146740;border-color:#40e895;color:#baffd7}
    #employee-hours-project .eh-btn.is-absent{background:#712a3a;border-color:#ee778c;color:#ffe0e4}
    #employee-hours-project .eh-btn.chosen{border-color:#5eeaff;box-shadow:0 0 0 1px #5eeaff}
    #employee-hours-project .eh-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}
    #employee-hours-project .eh-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}
    #employee-hours-project .eh-stat{background:#172944;border:1px solid #315777;border-radius:14px;padding:18px}
    #employee-hours-project .eh-stat b{display:block;font-size:30px;margin-top:6px;color:#69e2ef}
    #employee-hours-project .eh-person{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:16px 0;border-top:1px solid #31516b}
    #employee-hours-project .eh-identity{display:flex;gap:12px;align-items:center}
    #employee-hours-project .eh-avatar{display:grid;place-items:center;background:#1d4a62;border-radius:12px;min-width:44px;height:44px;color:#7aeaff;font-weight:bold}
    #employee-hours-project .eh-person small{display:block;color:#9bb4c9;margin-top:5px}
    #employee-hours-project .eh-person-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
    #employee-hours-project .eh-person-actions .eh-mini{padding:6px 9px;min-height:36px}
    #employee-hours-project .eh-scroll{overflow:auto;max-height:620px;border:1px solid #365773;border-radius:10px;margin-top:15px}
    #employee-hours-project table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;font-size:13px;font-variant-numeric:tabular-nums}
    #employee-hours-project th,#employee-hours-project td{padding:11px 9px;border-right:1px solid #314a62;border-bottom:1px solid #314a62;text-align:center;min-width:43px;white-space:nowrap;background:#11253c}
    #employee-hours-project th{position:sticky;top:0;z-index:2;background:#1d3954}
    #employee-hours-project td.eh-name{text-align:left;min-width:100px}
    #employee-hours-project .eh-weekend{background:#342f42}
    #employee-hours-project .eh-today{box-shadow:inset 2px 0 #4de6db,inset -2px 0 #4de6db;background:#164751}
    #employee-hours-project .eh-day-button{border:0;background:transparent;color:#d6f5ff;font-weight:bold;padding:4px}
    #employee-hours-project .eh-total{color:#86ffc1;font-weight:bold;background:#14392f}
    #employee-hours-project .eh-month-total{margin-top:16px;font-size:18px;color:#93ffcb}
    #employee-hours-project .eh-month-title{color:#65dcec;font-weight:bold;margin-top:14px}
    #eh-editor{width:min(500px,calc(100% - 28px));box-sizing:border-box;background:#152b43;color:#e8f6ff;border:1px solid #3c7c97;border-radius:16px;padding:24px}
    #eh-editor::backdrop{background:#020b16bb}#eh-editor label{display:grid;gap:7px;margin:14px 0}
    #eh-editor input{padding:12px;border:1px solid #39617d;background:#0b2035;color:#fff;border-radius:8px;font:inherit}
    #eh-editor button{padding:12px;border:1px solid #51bed7;background:#17495c;color:#e6fbff;border-radius:8px;cursor:pointer}
    #eh-save{min-height:22px;font-size:13px;color:#87e8b5!important}
    @media(max-width:750px){#employee-hours-project .eh-person{align-items:stretch;flex-direction:column}#employee-hours-project .eh-stats{gap:7px}#employee-hours-project .eh-stat{padding:12px;font-size:12px}#employee-hours-project .eh-person-actions>.eh-btn:first-child,#employee-hours-project .eh-person-actions>.eh-btn:nth-child(2){flex:1}}
  `
  document.head.append(extra)
  function open () {
    const content=el('content');if(!content)return
    document.querySelector('.shell')?.classList.add('project-home')
    if(loadError){content.innerHTML='<section id="'+pageId+'"><button class="eh-back" id="eh-back">← Projekti</button><h1>Radni sati zaposlenih</h1><p>Spremište se ne može otvoriti. Postojeći podaci nisu promijenjeni.</p><p>'+esc(loadError)+'</p></section>';return}
    content.innerHTML=`<section id="${pageId}">
      <header class="eh-hero"><div><button type="button" class="eh-back" id="eh-back">← Projekti</button><div class="eh-tag">RADNI SATI ZAPOSLENIH</div><h1>Dnevno stanje ljudi</h1><p>Odaberi sate, označi prisutnost — mjesečna evidencija popunjava se automatski.</p></div><span class="eh-clock" aria-hidden="true">◷</span></header>
      <section class="eh-panel"><div class="eh-fields"><label>Datum<input id="eh-date" type="date" value="${state.date}"></label><div><label>Radno vrijeme danas</label><div class="eh-tools" id="eh-hour-buttons">${[8,9,10,12].map(h=>`<button class="eh-btn" data-eh-hours="${h}">${h} h</button>`).join('')}<button class="eh-btn" id="eh-other">Drugo</button></div><label>Broj sati (0–24)<input id="eh-hours" type="text" inputmode="decimal" value="${M.day(state).minutes/60}" aria-describedby="eh-save"></label></div></div><p id="eh-save" role="status">Podaci se automatski čuvaju na ovom uređaju.</p></section>
      <div id="eh-stats" class="eh-stats"></div>
      <section class="eh-panel"><div class="eh-month-head"><h2>Prisutnost zaposlenih</h2><button class="eh-btn" id="eh-add">+ DODAJ ZAPOSLENOG</button></div><div class="eh-tools"><button class="eh-btn primary" data-eh-all="present">OZNAČI SVE PRISUTNE</button><button class="eh-btn" data-eh-all="absent">OZNAČI SVE ODSUTNE</button></div><p id="eh-unmarked"></p><div id="eh-people"></div></section>
      <section class="eh-panel"><h2>MJESEČNA EVIDENCIJA SATI</h2><div class="eh-fields"><label>Projekt / Gradilište<input id="eh-site" placeholder="npr. VERTIV" value="${esc(state.site)}"></label><label>Mjesec i godina<input id="eh-month" type="month" value="${state.month}"></label></div><div id="eh-month-title" class="eh-month-title"></div><p>— nije uneseno · 0 odsutan · vikendi su ljubičasti · današnji datum tirkizan. Kliknite broj dana za ispravak evidencije.</p><div id="eh-table" class="eh-scroll" role="region" aria-label="Mjesečna evidencija sati" tabindex="0"></div><div id="eh-month-total" class="eh-month-total"></div></section>
      <dialog id="eh-editor"><form id="eh-person-form"><h2 id="eh-editor-title">Dodaj zaposlenog</h2><input type="hidden" id="eh-person-id"><label>Ime<input id="eh-first" required maxlength="80" autocomplete="given-name"></label><label>Prezime<input id="eh-last" required maxlength="80" autocomplete="family-name"></label><label>Funkcija<input id="eh-role" value="Radnik" maxlength="80" list="eh-roles"></label><datalist id="eh-roles"><option value="Radnik"><option value="Poslovođa"></datalist><p id="eh-person-error" role="alert"></p><div class="eh-tools"><button type="button" id="eh-cancel">Odustani</button><button type="submit">Potvrdi zaposlenog</button></div></form></dialog>
    </section>`
    refresh()
  }
  function refresh(){
    if(!el('eh-people'))return
    const d=M.day(state),present=state.employees.filter(e=>d.statuses[e.id]==='present').length,absent=state.employees.filter(e=>d.statuses[e.id]==='absent').length
    el('eh-stats').innerHTML=[['Ukupno zaposlenih',state.employees.length],['Prisutni danas',present],['Odsutni danas',absent]].map(([s,n])=>`<div class="eh-stat">${s}<b>${n}</b></div>`).join('')
    el('eh-unmarked').textContent='Nije označeno: '+(state.employees.length-present-absent)
    el('eh-people').innerHTML=state.employees.length?state.employees.map((e,i)=>{
      const status=d.statuses[e.id],hours=status==='present'?fmt(d.minutes)+' h':status==='absent'?'0 h':'Nije označeno'
      return `<article class="eh-person"><div class="eh-identity"><span class="eh-avatar">${esc((e.first[0]+e.last[0]).toLocaleUpperCase())}</span><div><strong>${esc(e.first)} ${esc(e.last)}</strong><small>${esc(e.role)} · ${hours}</small></div></div><div class="eh-person-actions"><button class="eh-btn ${status==='present'?'is-present':''}" data-eh-status="present" data-eh-id="${esc(e.id)}" aria-pressed="${status==='present'}">PRISUTAN</button><button class="eh-btn ${status==='absent'?'is-absent':''}" data-eh-status="absent" data-eh-id="${esc(e.id)}" aria-pressed="${status==='absent'}">ODSUTAN</button><button class="eh-btn eh-mini" data-eh-edit="${esc(e.id)}">Uredi</button><button class="eh-btn eh-mini" data-eh-move="-1" data-eh-id="${esc(e.id)}" aria-label="Pomakni prema gore" ${i===0?'disabled':''}>↑</button><button class="eh-btn eh-mini" data-eh-move="1" data-eh-id="${esc(e.id)}" aria-label="Pomakni prema dolje" ${i===state.employees.length-1?'disabled':''}>↓</button><button class="eh-btn eh-mini" data-eh-remove="${esc(e.id)}">Obriši</button></div></article>`
    }).join(''):'<div class="eh-empty"><strong>Još nema zaposlenih</strong>Kliknite + DODAJ ZAPOSLENOG za prvi unos.</div>'
    document.querySelectorAll('[data-eh-hours]').forEach(b=>{b.classList.toggle('chosen',Number(b.dataset.ehHours)*60===d.minutes);b.setAttribute('aria-pressed',String(Number(b.dataset.ehHours)*60===d.minutes))})
    el('eh-other').classList.toggle('chosen',![480,540,600,720].includes(d.minutes))
    const m=M.month(state),current=M.today(),cls=x=>(x.weekend?'eh-weekend ':'')+(x.date===current?'eh-today':'')
    el('eh-month-title').textContent=new Intl.DateTimeFormat('hr-HR',{month:'long',year:'numeric'}).format(new Date(state.month+'-15T12:00:00')).toLocaleUpperCase('hr-HR')
    el('eh-table').innerHTML=`<table><thead><tr><th scope="col">R.br.</th><th scope="col">Ime</th><th scope="col">Prezime</th>${m.dates.map((x,i)=>`<th scope="col" class="${cls(x)}"><button class="eh-day-button" data-eh-date="${x.date}" title="Otvori ${x.date}">${i+1}</button></th>`).join('')}<th scope="col">UKUPNO</th></tr></thead><tbody>${m.rows.map((r,i)=>`<tr><td>${i+1}</td><td class="eh-name">${esc(r.employee.first)}</td><td class="eh-name">${esc(r.employee.last)}</td>${r.cells.map((v,j)=>`<td class="${cls(m.dates[j])}">${v===null?'—':fmt(v)}</td>`).join('')}<td class="eh-total">${fmt(r.total)}</td></tr>`).join('')||`<tr><td colspan="${m.dates.length+4}">Dodajte zaposlene za prikaz evidencije.</td></tr>`}</tbody></table>`
    el('eh-month-total').textContent='UKUPNO SVIH SATI: '+fmt(m.total)+' h'
  }
  function editor(id){
    const e=state.employees.find(e=>e.id===id)
    el('eh-person-id').value=e?.id||crypto.randomUUID();el('eh-first').value=e?.first||'';el('eh-last').value=e?.last||'';el('eh-role').value=e?.role||'Radnik'
    el('eh-editor-title').textContent=e?'Uredi zaposlenog':'Dodaj zaposlenog';el('eh-person-error').textContent='';el('eh-editor').showModal();el('eh-first').focus()
  }
  function selectDate(date){
    if(commit({type:'date',value:date})){el('eh-date').value=state.date;el('eh-month').value=state.month;el('eh-hours').value=M.day(state).minutes/60}
  }
  document.addEventListener('click',event=>{
    const target=event.target
    if(target.closest('#'+cardId)){event.preventDefault();event.stopImmediatePropagation();open();return}
    if(!target.closest('#'+pageId))return
    if(target.closest('#eh-back')){el('back-to-projects')?.click();return}
    if(target.closest('#eh-add')){editor();return}
    if(target.closest('#eh-cancel')){el('eh-editor').close();return}
    if(target.closest('#eh-other')){el('eh-hours').focus();el('eh-hours').select();return}
    let b
    if((b=target.closest('[data-eh-hours]'))){if(commit({type:'hours',value:b.dataset.ehHours}))el('eh-hours').value=M.day(state).minutes/60}
    if((b=target.closest('[data-eh-status]'))){try{M.minutes(el('eh-hours').value)}catch(e){el('eh-save').textContent=e.message;el('eh-hours').focus();return}commit({type:'status',id:b.dataset.ehId,value:b.dataset.ehStatus})}
    if((b=target.closest('[data-eh-all]'))){try{M.minutes(el('eh-hours').value)}catch(e){el('eh-save').textContent=e.message;el('eh-hours').focus();return}commit({type:'all',value:b.dataset.ehAll})}
    if((b=target.closest('[data-eh-edit]')))editor(b.dataset.ehEdit)
    if((b=target.closest('[data-eh-move]')))commit({type:'move',id:b.dataset.ehId,delta:Number(b.dataset.ehMove)})
    if((b=target.closest('[data-eh-date]'))){selectDate(b.dataset.ehDate);el('eh-date').scrollIntoView({behavior:'smooth',block:'center'})}
    if((b=target.closest('[data-eh-remove]'))){const e=state.employees.find(e=>e.id===b.dataset.ehRemove);if(e&&confirm('Obrisati '+e.first+' '+e.last+' i sve njegove evidentirane sate u ovom projektu?'))commit({type:'remove',id:e.id})}
  },true)
  document.addEventListener('input',event=>{
    if(!event.target.closest('#'+pageId))return
    if(event.target.id==='eh-hours')commit({type:'hours',value:event.target.value})
    if(event.target.id==='eh-site')commit({type:'site',value:event.target.value},false)
  })
  document.addEventListener('change',event=>{
    if(event.target.id==='eh-date')selectDate(event.target.value)
    if(event.target.id==='eh-month')commit({type:'month',value:event.target.value})
  })
  document.addEventListener('submit',event=>{
    if(event.target.id!=='eh-person-form')return
    event.preventDefault()
    if(commit({type:'employee',id:el('eh-person-id').value,first:el('eh-first').value,last:el('eh-last').value,role:el('eh-role').value}))el('eh-editor').close()
    else el('eh-person-error').textContent=el('eh-save').textContent
  })
  new MutationObserver(installCard).observe(document.getElementById('app') || document.body,{childList:true,subtree:true})
  installCard()
})()


