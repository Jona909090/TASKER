(function(){
  'use strict'
  const M=window.TaskerModuleStatusModel,KEY='tasker.module-status.v1'
  const el=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const date=s=>s?s.split('-').reverse().join('.')+'.':'—',time=s=>new Date(s).toLocaleString('hr-HR'),uid=()=>crypto.randomUUID()
  let state,raw=null,error='',selected='',locationFilter='',dragged=''
  function read(){const text=localStorage.getItem(KEY);const next=text?M.validate(JSON.parse(text)):M.create();state=next;raw=text}
  try{read()}catch(e){error=e.message}
  function notice(message){const target=document.querySelector('#ms-dialog[open] .ms-error')||el('ms-toast');if(target)target.textContent=message}
  function commit(action){
    try{
      if(localStorage.getItem(KEY)!==raw){read();refresh();throw Error('Podaci su promijenjeni u drugoj kartici. Prikazan je novi zapis; ponovite radnju.')}
      const next=M.change(state,action),text=JSON.stringify(next);localStorage.setItem(KEY,text);state=next;raw=text;refresh();notice('✓ Sačuvano na ovom uređaju.');return true
    }catch(e){notice('Nije sačuvano: '+e.message);return false}
  }
  const options=(value,phase=false)=>Object.entries(M.statuses).filter(([k])=>!phase||k!=='ready').map(([key,v])=>`<option value="${key}" ${key===value?'selected':''}>${phase&&key==='done'?'Završeno':v.label}</option>`).join('')
  const badge=m=>`<span class="ms-badge" style="--status:${M.statuses[m.status].color}">${M.statuses[m.status].icon} ${M.statuses[m.status].label}</span>`
  function places(current){
    let html=''
    for(const h of state.halls)html+=`<optgroup label="${esc(h.name)}">${h.positions.map(p=>{const owner=state.modules.find(m=>m.place.kind==='hall'&&m.place.hallId===h.id&&m.place.positionId===p.id),key='hall:'+h.id+':'+p.id;return `<option value="${key}" ${owner&&owner.id!==current?.id?'disabled':''} ${current?.place.kind==='hall'&&current.place.hallId===h.id&&current.place.positionId===p.id?'selected':''}>Pozicija ${esc(p.label)}${owner?' · '+esc(owner.name):' · slobodna'}</option>`}).join('')}</optgroup>`
    html+=`<optgroup label="Van hale">${state.locations.map(l=>`<option value="external:${l.id}" ${current?.place.kind==='external'&&current.place.locationId===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}</optgroup>`
    return html
  }
  function parsePlace(value){const [kind,id,positionId]=value.split(':');return kind==='hall'?{kind,hallId:id,positionId}:{kind,locationId:id}}
  function open(){
    try{read();error=''}catch(e){error=e.message}
    const content=el('content');if(!content)return
    document.querySelector('.shell')?.classList.remove('project-home')
    document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.id==='open-module-status'))
    if(el('breadcrumb'))el('breadcrumb').textContent='Status modula'
    if(error){content.innerHTML=`<section id="module-status"><h1>Status modula</h1><p role="alert">Spremište nije moguće otvoriti. Postojeći podaci nisu prepisani. ${esc(error)}</p></section>`;return}
    content.innerHTML=`<section id="module-status"><header class="ms-header"><div><p class="ms-eyebrow">TASKER / PROIZVODNJA</p><h1>Status modula</h1><p>Raspored hale, proizvodne faze i kretanje svakog modula.</p></div><div class="ms-actions"><button class="ms-button" data-ms-action="location">+ Dodaj lokaciju</button><button class="ms-button primary" data-ms-action="add">+ Dodaj modul</button></div></header><p id="ms-toast" role="status">Podaci se čuvaju na ovom uređaju. Statusi su ručni; napredak se računa iz završenih faza.</p><div id="ms-stats" class="ms-stats"></div><div class="ms-workspace"><div class="ms-map-column"><div class="ms-map-head"><h2>Proizvodna hala</h2><span>POGLED ODOZGO</span></div><p class="ms-hint">Klikni modul za detalje ili slobodnu poziciju za dodavanje. Na računalu možeš povući modul na slobodnu poziciju; na tabletu koristi Premjesti.</p><div id="ms-halls"></div><div class="ms-legend">${Object.entries(M.statuses).map(([k,s])=>`<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div><section class="ms-panel"><h2>Lokacije van hale</h2><div id="ms-locations" class="ms-locations"></div><div id="ms-location-list"></div></section></div><aside id="ms-detail" class="ms-detail ms-panel" aria-label="Detalji modula"></aside></div><dialog id="ms-dialog" class="ms-dialog"></dialog><input id="ms-photo-file" type="file" accept="image/*" hidden></section>`
    refresh()
  }
  function refresh(){
    if(!el('ms-stats'))return
    const s=M.stats(state)
    el('ms-stats').innerHTML=[['hall','◫','Modula u hali'],['active','⚙','U radu'],['waiting','◷','Čekaju materijal'],['ready','➜','Spremna za otpremu'],['completed','✓','Završena danas']].map(([key,icon,label])=>`<article class="ms-stat ms-${key}"><span>${icon}</span><div><b>${s[key]}</b><small>${label}</small></div></article>`).join('')
    el('ms-halls').innerHTML=state.halls.map(h=>{
      const members=state.modules.filter(m=>m.place.kind==='hall'&&m.place.hallId===h.id),max=Math.max(12,...members.map(m=>m.length))
      const row=side=>h.positions.filter(p=>p.side===side).sort((a,b)=>b.order-a.order).map(p=>{
        const m=members.find(m=>m.place.positionId===p.id)
        return `<div class="ms-bay ${side}" data-ms-drop="${esc(p.id)}" data-ms-hall="${esc(h.id)}"><span class="ms-position">${esc(p.label)}</span>${m?`<button type="button" draggable="true" data-ms-module="${esc(m.id)}" class="ms-container ${selected===m.id?'selected':''}" aria-pressed="${selected===m.id}" style="--status:${M.statuses[m.status].color};height:${Math.max(58,Math.round(m.length/max*152))}px" title="${esc(m.name)} · ${m.length} m · ${M.statuses[m.status].label}"><span class="ms-frame" aria-hidden="true"></span><span class="ms-container-icon">${M.statuses[m.status].icon}</span><strong>${esc(m.name)}</strong><small>${M.progress(m)}% · ${m.length} m</small></button>`:`<button class="ms-free" data-ms-add-position="${esc(p.id)}" data-ms-hall="${esc(h.id)}" aria-label="Dodaj modul na poziciju ${esc(p.label)}"><span>+</span>Slobodno</button>`}</div>`
      }).join('')
      return `<div class="ms-map-scroll"><section class="ms-hall" aria-label="${esc(h.name)}"><div class="ms-gate"><span></span><b>ULAZ ↑</b><span></span></div><div class="ms-floor"><div class="ms-row">${row('left')}</div><div class="ms-safe-zone" aria-label="Radna zona"></div><div class="ms-aisle"><span>CENTRALNI PROLAZ</span><i>↑</i><b>${esc(h.name)}</b><i>↓</i></div><div class="ms-safe-zone" aria-label="Radna zona"></div><div class="ms-row">${row('right')}</div></div><div class="ms-gate"><span></span><b>VRATA / IZLAZ ↓</b><span></span></div></section></div>`
    }).join('')
    el('ms-locations').innerHTML=state.locations.map(l=>`<button class="ms-location ${locationFilter===l.id?'selected':''}" data-ms-location="${esc(l.id)}"><span>⌖</span><b>${esc(l.name)}</b><small>${state.modules.filter(m=>m.place.kind==='external'&&m.place.locationId===l.id).length} modula</small></button>`).join('')
    const loc=state.locations.find(l=>l.id===locationFilter),list=state.modules.filter(m=>m.place.kind==='external'&&m.place.locationId===locationFilter)
    el('ms-location-list').innerHTML=loc?`<h3>${esc(loc.name)}</h3>${list.map(m=>`<button class="ms-list-module ${selected===m.id?'selected':''}" data-ms-module="${esc(m.id)}"><strong>${esc(m.name)}</strong>${badge(m)}<span>${M.progress(m)}%</span></button>`).join('')||'<p class="ms-hint">Nema modula na ovoj lokaciji.</p>'}`:''
    renderDetail()
  }
  function renderDetail(){
    const box=el('ms-detail'),m=state.modules.find(m=>m.id===selected)
    if(!m){box.innerHTML='<div class="ms-empty"><span>◫</span><h2>Detalji modula</h2><p>Odaberi modul na mapi ili u lokacijama van hale.</p><button class="ms-button primary" data-ms-action="add">+ Dodaj prvi modul</button></div>';return}
    const old=box.querySelector('.ms-phases')?.scrollTop||0,historyOpen=box.querySelector('.ms-history')?.open||false,progress=M.progress(m)
    box.innerHTML=`<header class="ms-detail-title"><div><small>ODABRANI MODUL</small><h2>${esc(m.name)}</h2></div><button class="ms-icon-button" data-ms-action="close" aria-label="Zatvori detalje">×</button></header>${badge(m)}<div class="ms-photo">${m.photo?`<img src="${m.photo}" alt="Fotografija ${esc(m.name)}">`:'<div class="ms-steel-preview" aria-hidden="true"><i></i><i></i><i></i></div><small>Nema fotografije modula</small>'}</div><div class="ms-actions"><button class="ms-link" data-ms-action="photo">${m.photo?'Zamijeni':'Dodaj'} fotografiju</button>${m.photo?'<button class="ms-link" data-ms-action="remove-photo">Ukloni fotografiju</button>':''}</div><dl class="ms-data"><div><dt>Tip</dt><dd>${m.type}</dd></div><div><dt>Pozicija u hali</dt><dd>${m.place.kind==='hall'?esc(state.halls.find(h=>h.id===m.place.hallId).positions.find(p=>p.id===m.place.positionId).label):'—'}</dd></div><div><dt>Datum ulaska</dt><dd>${date(m.arrival)}</dd></div><div><dt>Planirana otprema</dt><dd>${date(m.dispatch)}</dd></div><div><dt>Trenutna lokacija</dt><dd>${esc(M.locationName(state,m.place))}</dd></div><div><dt>Dimenzije D × Š × V</dt><dd>${m.length} × ${m.width} × ${m.height} m</dd></div></dl><label class="ms-status-label">Status modula<select data-ms-status="${esc(m.id)}">${options(m.status)}</select></label><div class="ms-progress-label"><b>Ukupan napredak</b><strong>${progress}%</strong></div><div class="ms-progress" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Napredak modula"><i style="width:${progress}%"></i></div><p class="ms-hint">${m.phases.filter(p=>p.status==='done').length} / ${m.phases.length} završenih faza</p>${m.note?`<p class="ms-note">${esc(m.note)}</p>`:''}<h3>Faze izrade</h3><div class="ms-phases">${m.phases.map((p,i)=>`<div class="ms-phase"><span class="ms-phase-number">${i+1}</span><div><b>${esc(p.name)}</b><select aria-label="Status faze ${esc(p.name)}" data-ms-phase="${esc(p.id)}">${options(p.status,true)}</select>${p.completedAt?`<small>✓ ${time(p.completedAt)}</small>`:''}</div><div class="ms-phase-tools"><button data-ms-phase-up="${esc(p.id)}" ${i===0?'disabled':''} aria-label="Pomakni fazu gore">↑</button><button data-ms-phase-down="${esc(p.id)}" ${i===m.phases.length-1?'disabled':''} aria-label="Pomakni fazu dolje">↓</button><button data-ms-phase-delete="${esc(p.id)}" aria-label="Obriši fazu ${esc(p.name)}">×</button></div></div>`).join('')||'<p>Nema faza. Dodaj prvu fazu ispod.</p>'}</div><form id="ms-phase-form" class="ms-actions"><input name="phase" placeholder="Nova faza…" aria-label="Naziv nove faze" required maxlength="120"><button class="ms-button" type="submit">+ Dodaj</button></form><div class="ms-detail-actions"><button class="ms-button" data-ms-action="edit">Uredi</button><button class="ms-button" data-ms-action="move">Premjesti</button><button class="ms-button primary" data-ms-action="finish" ${m.status==='done'&&m.place.kind==='external'&&m.place.locationId==='finished'?'disabled':''}>✓ Završi modul</button></div><details class="ms-history" ${historyOpen?'open':''}><summary>Istorija modula · ${m.history.length} događaja</summary><ol>${[...m.history].reverse().map(e=>`<li><time>${time(e.at)}</time><span>${esc(e.text)}</span></li>`).join('')}</ol></details>`
    box.querySelector('.ms-phases').scrollTop=old
  }
  function dialog(kind,place){
    const d=el('ms-dialog'),m=state.modules.find(m=>m.id===selected),editing=kind==='edit'
    let body=''
    if(kind==='add'||editing){
      if(editing&&!m)return
      body=`<h2>${editing?'Uredi modul':'Dodaj modul'}</h2><div class="ms-form-grid"><label>Naziv modula<input name="name" required maxlength="120" placeholder="MV-12" value="${esc(editing?m.name:'')}"></label><label>Tip<select name="type"><option value="MV">MV</option><option value="MVS" ${editing&&m.type==='MVS'?'selected':''}>MVS</option></select></label>${[['length','Dužina',12],['width','Širina',3],['height','Visina',3.2]].map(([key,label,value])=>`<label>${label} (m)<input name="${key}" type="number" min="0.1" max="100" step="0.01" required value="${editing?m[key]:value}"></label>`).join('')}<label>Status<select name="status">${options(editing?m.status:'new')}</select></label><label>Datum ulaska<input type="date" name="arrival" required value="${editing?m.arrival:M.today()}"></label><label>Planirana otprema<input type="date" name="dispatch" value="${editing?m.dispatch:''}"></label>${editing?'':`<label class="ms-span">Pozicija / lokacija<select name="place" required>${places(null)}</select></label>`}<label class="ms-span">Napomena<textarea name="note" rows="3" maxlength="4000">${esc(editing?m.note:'')}</textarea></label></div>`
    }else if(kind==='move'){if(!m)return;body=`<h2>Premjesti ${esc(m.name)}</h2><p>Trenutno: ${esc(M.locationName(state,m.place))}</p><label>Nova pozicija / lokacija<select name="place" required>${places(m)}</select></label><p>Stara pozicija se oslobađa. Faze, fotografija i istorija ostaju sačuvane.</p>`}
    else body='<h2>Dodaj lokaciju</h2><label>Naziv lokacije<input name="name" required maxlength="120" placeholder="Naziv nove lokacije"></label>'
    d.innerHTML=`<form id="ms-edit-form" data-kind="${kind}" data-id="${editing||kind==='move'?esc(m.id):''}">${body}<p class="ms-error" role="alert"></p><div class="ms-actions"><button type="button" class="ms-button" data-ms-cancel>Odustani</button><button class="ms-button primary" type="submit">${kind==='move'?'Premjesti':'Sačuvaj'}</button></div></form>`
    if(place&&d.querySelector('[name="place"]'))d.querySelector('[name="place"]').value='hall:'+place.hallId+':'+place.positionId
    d.showModal();d.querySelector('input,select')?.focus()
  }
  let pendingAction=null
  function ask(message,action){
    pendingAction=action
    const d=el('ms-dialog')
    d.innerHTML=`<h2>Potvrdi radnju</h2><p>${esc(message)}</p><p class="ms-error" role="alert"></p><div class="ms-actions"><button class="ms-button" data-ms-cancel>Odustani</button><button class="ms-button primary" data-ms-confirm>Potvrdi</button></div>`
    d.showModal()
  }
  window.addEventListener('click',event=>{
    const t=event.target
    if(t.closest('#open-module-status')||t.closest('#module-status-card')){event.preventDefault();event.stopImmediatePropagation();open();return}
    if(!t.closest('#module-status'))return
    let b
    if(t.closest('[data-ms-cancel]')){el('ms-dialog').close();return}
    if(t.closest('[data-ms-confirm]')){if(pendingAction&&commit(pendingAction)){if(pendingAction.type==='finish')locationFilter='finished';pendingAction=null;el('ms-dialog').close();refresh()}return}
    if((b=t.closest('[data-ms-module]'))){selected=b.dataset.msModule;refresh();if(matchMedia('(max-width:1100px)').matches)el('ms-detail').scrollIntoView({behavior:'smooth',block:'start'});return}
    if((b=t.closest('[data-ms-add-position]'))){dialog('add',{hallId:b.dataset.msHall,positionId:b.dataset.msAddPosition});return}
    if((b=t.closest('[data-ms-location]'))){locationFilter=b.dataset.msLocation;refresh();return}
    if((b=t.closest('[data-ms-phase-up]')))commit({type:'reorder-phase',id:selected,phaseId:b.dataset.msPhaseUp,delta:-1})
    if((b=t.closest('[data-ms-phase-down]')))commit({type:'reorder-phase',id:selected,phaseId:b.dataset.msPhaseDown,delta:1})
    if((b=t.closest('[data-ms-phase-delete]'))){const p=state.modules.find(m=>m.id===selected)?.phases.find(p=>p.id===b.dataset.msPhaseDelete);if(p)ask('Obrisati fazu „'+p.name+'”? Napredak će se ponovno izračunati.',{type:'delete-phase',id:selected,phaseId:p.id});return}
    if((b=t.closest('[data-ms-action]'))){const action=b.dataset.msAction
      if(['add','edit','move','location'].includes(action))dialog(action)
      if(action==='close'){selected='';refresh()}
      if(action==='finish')ask('Završiti modul, označiti sve njegove faze završenima i premjestiti ga u Završeni? Pozicija u hali bit će slobodna.',{type:'finish',id:selected})
      if(action==='photo'){el('ms-photo-file').dataset.moduleId=selected;el('ms-photo-file').click()}
      if(action==='remove-photo')ask('Ukloniti fotografiju ovog modula?',{type:'photo',id:selected,value:''})
    }
  },true)
  document.addEventListener('submit',event=>{
    const form=event.target;if(!form.closest('#module-status'))return
    event.preventDefault();const values=Object.fromEntries(new FormData(form))
    if(form.id==='ms-phase-form'){if(commit({type:'add-phase',id:selected,phaseId:uid(),name:values.phase}))form.reset();return}
    if(form.id!=='ms-edit-form')return
    const kind=form.dataset.kind,id=form.dataset.id||uid()
    let action
    if(kind==='location')action={type:'add-location',locationId:uid(),name:values.name}
    else if(kind==='move')action={type:'move',id,place:parsePlace(values.place)}
    else action={type:kind==='edit'?'edit':'create',id,data:{...values,...(kind==='add'?{place:parsePlace(values.place)}:{})}}
    if(commit(action)){if(kind==='add')selected=id;el('ms-dialog').close();refresh()}
  })
  document.addEventListener('change',event=>{
    const t=event.target;if(!t.closest('#module-status'))return
    if(t.dataset.msStatus)commit({type:'status',id:t.dataset.msStatus,value:t.value})
    if(t.dataset.msPhase)commit({type:'phase',id:selected,phaseId:t.dataset.msPhase,value:t.value})
    if(t.id==='ms-photo-file'&&t.files?.[0]){
      const file=t.files[0],id=t.dataset.moduleId,url=URL.createObjectURL(file),img=new Image()
      notice('Pripremam fotografiju…')
      img.onload=()=>{try{const scale=Math.min(1,800/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);commit({type:'photo',id,value:canvas.toDataURL('image/jpeg',.72)})}catch(e){notice('Fotografija nije spremljena: '+e.message)}finally{URL.revokeObjectURL(url);t.value=''}}
      img.onerror=()=>{URL.revokeObjectURL(url);t.value='';notice('Uređaj ne može otvoriti taj format slike. Odaberite JPG, PNG ili WebP.')};img.src=url
    }
  })
  document.addEventListener('dragstart',event=>{const b=event.target.closest('#module-status [data-ms-module][draggable]');if(!b)return;dragged=b.dataset.msModule;event.dataTransfer.setData('text/plain',dragged);event.dataTransfer.effectAllowed='move'})
  document.addEventListener('dragover',event=>{if(dragged&&event.target.closest('#module-status [data-ms-drop]')){event.preventDefault();event.dataTransfer.dropEffect='move'}})
  document.addEventListener('drop',event=>{const bay=event.target.closest('#module-status [data-ms-drop]');if(!bay||!dragged)return;event.preventDefault();const id=dragged;dragged='';if(commit({type:'move',id,place:{kind:'hall',hallId:bay.dataset.msHall,positionId:bay.dataset.msDrop}})){selected=id;refresh()}})
  document.addEventListener('dragend',()=>{dragged=''})
  window.addEventListener('storage',event=>{if(event.key!==KEY)return;try{read();if(!el('ms-dialog')?.open)refresh();notice('Evidencija je osvježena iz druge kartice.')}catch(e){notice(e.message)}})
  function install(){
    const nav=document.querySelector('.sidebar nav')
    if(nav&&!el('open-module-status')){const b=document.createElement('button');b.id='open-module-status';b.className='nav-link';b.type='button';b.dataset.page='module-status';b.innerHTML='<span>◫</span> Status modula';nav.append(b)}
    const grid=document.querySelector('#content .project-grid')
    if(grid&&!el('module-status-card'))grid.insertAdjacentHTML('beforeend','<button type="button" class="project-card" id="module-status-card"><div class="project-card-top"><span class="project-symbol">◫</span><span class="project-status">PROIZVODNJA</span></div><p class="project-label">ZASEBNA EVIDENCIJA</p><h2>Status modula</h2><p class="project-description">Interaktivna hala, proizvodne faze, lokacije i istorija modula.</p><div class="project-card-footer"><span>MV · MVS</span><strong>Otvori halu →</strong></div></button>')
  }
  new MutationObserver(install).observe(el('app')||document.body,{childList:true,subtree:true});install()
})()