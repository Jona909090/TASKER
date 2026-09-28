// TASKER v80: projekt IZVJESTAJI sa sažetim prikazom i lokalnom jezičnom korekcijom.
(function () {
  'use strict'

  const STORAGE_KEY = 'tasker.reports-project-draft'
  const CARD_ID = 'open-reports-project'
  const CONTENT_ID = 'reports-project-content'

  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character])

  const today = () => {
    const date = new Date()
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
  }

  const blankState = () => ({
    location: '',
    date: today(),
    workers: '',
    foremen: '',
    start: '07:00', end: '17:00', note: '',
    modules: []
  })

  const readState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (!saved || typeof saved !== 'object') return blankState()
      return {
        location: String(saved.location || ''),
        date: String(saved.date || today()),
        workers: saved.workers === 0 ? '0' : String(saved.workers || ''),
        foremen: saved.foremen === 0 ? '0' : String(saved.foremen || ''),
        start: String(saved.start || '07:00'), end: String(saved.end || '17:00'), note: String(saved.note || ''),
        modules: Array.isArray(saved.modules) ? saved.modules.map(module => ({
          id: String(module.id || `module-${Date.now()}-${Math.random()}`),
          name: String(module.name || ''),
          code: String(module.code || ''),
          works: Array.isArray(module.works) && module.works.length ? module.works.map(String) : ['']
        })) : []
      }
    } catch {
      return blankState()
    }
  }

  let state = readState()
  const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

  const style = document.createElement('style')
  style.textContent = `
    .project-reports{position:relative;overflow:hidden;border-color:rgba(92,226,255,.35)!important;background:radial-gradient(circle at 86% 10%,rgba(62,211,255,.15),transparent 32%),linear-gradient(145deg,#17314d,#0d2037)!important}
    .project-reports .project-symbol{background:linear-gradient(145deg,#1c8ab2,#14516f)!important;color:#b9f4ff!important;box-shadow:0 0 22px rgba(61,213,255,.25)!important}
    .project-reports .project-status i{background:#58ff8b!important;box-shadow:0 0 9px #58ff8b!important}
    .project-reports:before{content:'';position:absolute;inset:auto -15% -45% 25%;height:78%;pointer-events:none;background:repeating-linear-gradient(135deg,transparent 0 18px,rgba(57,200,255,.035) 19px 20px);transform:rotate(-8deg)}
    .project-reports .reports-card-cover{background:linear-gradient(105deg,rgba(31,151,205,.5),rgba(5,31,53,.15)),repeating-linear-gradient(90deg,transparent 0 32px,rgba(104,220,255,.14) 33px 34px),repeating-linear-gradient(0deg,transparent 0 22px,rgba(104,220,255,.11) 23px 24px)}
    .project-reports .reports-card-cover:after{background:linear-gradient(180deg,transparent 20%,#112a47 100%)}
    .project-reports .reports-card-cover i{border-color:rgba(113,226,255,.5)}

    .reports-project-page{max-width:1180px;margin:0 auto;padding:8px 0 46px}
    .reports-project-header{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:20px;padding:24px 28px;border:1px solid #315777;border-radius:18px;background:linear-gradient(145deg,#172e49,#102139);box-shadow:0 18px 42px rgba(0,0,0,.18)}
    .reports-project-header>div{display:grid;gap:5px}.reports-project-back{width:max-content;padding:0;border:0;background:transparent;color:#62d9ff;font-size:12px;font-weight:900;cursor:pointer}.reports-project-header p{margin:7px 0 0;color:#8fa9c0;font-size:12px}.reports-project-header h1{margin:0;color:#f5fbff;font-size:32px}.reports-project-header>span{display:grid;place-items:center;width:66px;height:66px;border:1px solid #3187aa;border-radius:18px;background:#123c59;color:#77e5ff;font-size:30px;box-shadow:0 0 22px rgba(52,207,255,.18)}

    .reports-basic-fields{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;padding:20px;border:1px solid #2d4d6b;border-radius:16px;background:#172944}
    .reports-project-page label{display:grid;gap:7px;color:#9eb5ca;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}.reports-project-page input{height:43px;padding:0 12px;border:1px solid #365b7b;border-radius:9px;outline:0;background:#0e2037;color:#f2f8ff;font:inherit;color-scheme:dark}.reports-project-page input:focus{border-color:#59d6ff;box-shadow:0 0 0 2px rgba(60,202,255,.12)}
    .reports-modules-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:24px 0 13px}.reports-modules-heading h2{margin:0;font-size:21px}.reports-modules-heading p{margin:5px 0 0;color:#819ab1;font-size:11px}.reports-add-module,.reports-add-work{border:1px solid #44cbf5;border-radius:10px;background:#43c1ed;color:#071626;font-weight:900;cursor:pointer}.reports-add-module{padding:12px 17px}.reports-add-work{padding:9px 12px}.reports-add-module:hover,.reports-add-work:hover{filter:brightness(1.08);box-shadow:0 0 17px rgba(67,203,245,.23)}
    .reports-modules-list{display:grid;gap:15px}.reports-empty{margin:0;padding:30px;border:1px dashed #355a77;border-radius:15px;color:#7590a8;text-align:center;font-size:12px;background:rgba(16,34,56,.45)}
    .reports-module-card{overflow:hidden;border:1px solid #315675;border-radius:16px;background:linear-gradient(145deg,#1b304d,#13243c);box-shadow:0 13px 28px rgba(0,0,0,.14)}.reports-module-card>header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #2a4865;background:rgba(11,28,48,.35)}.reports-module-card>header span{color:#61dcff;font-size:10px;font-weight:900;letter-spacing:.14em}.reports-module-card>header button{width:31px;height:31px;border:1px solid #6a3548;border-radius:8px;background:#3b2230;color:#ff9daf;font-size:18px;cursor:pointer}.reports-module-body{padding:18px}.reports-module-fields{display:grid;grid-template-columns:1.4fr 1fr;gap:12px}.reports-work-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:18px 0 9px}.reports-work-heading h3{margin:0;font-size:15px}.reports-work-list{display:grid;gap:8px}.reports-work-row{display:grid;grid-template-columns:28px 1fr 36px;gap:8px;align-items:center}.reports-work-row>span{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#214866;color:#76ddff;font-size:11px;font-weight:900}.reports-work-row button{height:36px;border:1px solid #623849;border-radius:8px;background:#342330;color:#ff9bad;font-size:17px;cursor:pointer}.reports-work-row input{height:40px}
    .reports-generate{width:100%;margin-top:24px;padding:17px;border:1px solid #5aff8c;border-radius:13px;background:linear-gradient(135deg,#34d875,#50ff91);color:#06170d;font-size:16px;font-weight:1000;letter-spacing:.08em;cursor:pointer;box-shadow:0 0 22px rgba(76,255,139,.18)}.reports-generate:hover{filter:brightness(1.05);box-shadow:0 0 28px rgba(76,255,139,.28)}
    .reports-output{margin-top:22px;padding:28px;border:1px solid #37617e;border-radius:16px;background:#f8fafc;color:#172033;box-shadow:0 18px 42px rgba(0,0,0,.22)}.reports-output[hidden]{display:none}.reports-output>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #172033}.reports-output h2{margin:0;font-size:20px}.reports-output-copy{padding:9px 12px;border:1px solid #adc0cf;border-radius:8px;background:#edf3f7;color:#172033;font-weight:800;cursor:pointer}.reports-output-content{font:16px/1.42 Arial,sans-serif;white-space:normal}.reports-output-content h3{margin:15px 0 5px;font-size:17px}.reports-output-content p{margin:0 0 5px}.reports-output-content ul{margin:4px 0 12px;padding-left:22px}.reports-output-content li{margin:2px 0}
    @media(max-width:820px){.reports-basic-fields{grid-template-columns:1fr 1fr}.reports-basic-fields label:first-child{grid-column:1/-1}.reports-module-fields{grid-template-columns:1fr}.reports-project-header{padding:19px}.reports-project-header h1{font-size:26px}}
    @media(max-width:520px){.reports-basic-fields{grid-template-columns:1fr}.reports-basic-fields label:first-child{grid-column:auto}.reports-modules-heading{align-items:stretch;flex-direction:column}.reports-add-module{width:100%}.reports-project-header>span{display:none}.reports-work-row{grid-template-columns:25px 1fr 34px}.reports-output{padding:19px}}
  `
  document.head.appendChild(style)
  style.textContent += '.reports-project-page textarea{width:100%;box-sizing:border-box;min-height:125px;padding:12px;border:1px solid #365b7b;border-radius:9px;background:#0e2037;color:#f2f8ff;font:16px/1.5 Arial;resize:vertical}.reports-module-fields{grid-template-columns:1fr}.reports-project-page label{font-size:12px;text-transform:none;letter-spacing:0}.reports-basic-fields{grid-template-columns:repeat(3,minmax(0,1fr))}.reports-module-body label+label{margin-top:12px}@media(max-width:600px){.reports-basic-fields{grid-template-columns:1fr 1fr}}'

  function cardMarkup () {
    return `<button type="button" class="project-card project-reports" id="${CARD_ID}">
      <span class="project-card-glow" aria-hidden="true"></span>
      <span class="project-card-cover reports-card-cover" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <div class="project-card-top"><span class="project-symbol">▤</span><span class="project-status"><i></i> Novi projekt</span></div>
      <p class="project-label">PROJEKT</p><h2>IZVJEŠTAJI</h2>
      <p class="project-description">Brz unos dnevnih izvještaja po lokaciji, modulima i izvedenim radovima.</p>
      <div class="project-card-footer"><span>DNEVNI RAD · MODULI</span><strong>Otvori projekt →</strong></div>
    </button>`
  }

  function installCard () {
    const grid = document.querySelector('#content .project-grid')
    if (!grid || document.getElementById(CARD_ID)) return
    const firstEmpty = grid.querySelector('[data-new-project-slot]')
    if (firstEmpty) firstEmpty.insertAdjacentHTML('beforebegin', cardMarkup())
    else grid.insertAdjacentHTML('beforeend', cardMarkup())
  }

  const moduleMarkup = (module, index) => `<article class="reports-module-card" data-report-module="${escapeHtml(module.id)}">
    <header><span>MODUL ${index + 1}</span><button type="button" data-remove-report-module="${escapeHtml(module.id)}" title="Ukloni modul">×</button></header>
    <div class="reports-module-body">
      <div class="reports-module-fields">
        <label>Modul ili lokacija<input data-report-module-code value="${escapeHtml([module.name,module.code].filter(Boolean).join(' / '))}" placeholder="MV-11, MVS-01 ili Dupliko"></label>
      </div>
      <label>Radovi — svaki rad u novi red<textarea data-report-works placeholder="Postavljanje panela&#10;Izvlačenje modula – 2 radnika, 2 sata">${escapeHtml(module.works.join('\n'))}</textarea></label>
    </div>
  </article>`

  function renderModules () {
    const list = document.querySelector('#reports-modules-list')
    if (!list) return
    list.innerHTML = state.modules.length ? state.modules.map(moduleMarkup).join('') : '<p class="reports-empty">Još nema modula. Kliknite „+ Dodaj modul“ za prvi unos.</p>'
  }

  function renderProject () {
    const content = document.querySelector('#content')
    if (!content) return
    document.querySelector('.shell')?.classList.add('project-home')
    content.innerHTML = `<section class="reports-project-page" id="${CONTENT_ID}">
      <header class="reports-project-header"><div><button type="button" class="reports-project-back" id="reports-project-back">← Projekti</button><p class="eyebrow">TASKER · PROJEKT IZVJEŠTAJI</p><h1>Dnevni izvještaj</h1><p>Unesite osnovne podatke, module i izvedene radove.</p></div><span>▤</span></header>
      <section class="reports-basic-fields">
        <label>Projekt / lokacija<input id="report-location" value="${escapeHtml(state.location)}" placeholder="npr. VERTIV – BAJKMONT"></label>
        <label>Datum<input id="report-date" type="date" value="${escapeHtml(state.date || today())}"></label>
        <label>Broj radnika<input id="report-workers" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(state.workers)}"></label>
        <label>Broj poslovođa<input id="report-foremen" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(state.foremen)}"></label>
        <label>Početak rada<input id="report-start" type="time" value="${escapeHtml(state.start || '07:00')}"></label>
        <label>Kraj rada<input id="report-end" type="time" value="${escapeHtml(state.end || '17:00')}"></label>
      </section>
      <section class="reports-modules-heading"><div><h2>Moduli</h2><p>Dodajte potreban broj modula i radova.</p></div><button type="button" class="reports-add-module" id="reports-add-module">+ Dodaj modul</button></section>
      <div class="reports-modules-list" id="reports-modules-list"></div>
      <label style="margin-top:18px">Dodatna napomena (nije obavezna)<textarea id="report-note" placeholder="Npr. dodatna ekipa – 5 radnika">${escapeHtml(state.note || '')}</textarea></label>
      <button type="button" class="reports-generate" id="reports-generate">GENERIRAJ IZVJEŠTAJ</button>
      <section class="reports-output" id="reports-output" hidden><header><h2>Gotov izvještaj</h2><button type="button" class="reports-output-copy" id="reports-copy">Kopiraj tekst</button></header><div class="reports-output-content" id="reports-output-content"></div></section>
    </section>`
    renderModules()
  }

  function syncBasicFields () {
    state.location = document.querySelector('#report-location')?.value || ''
    state.date = document.querySelector('#report-date')?.value || today()
    state.workers = document.querySelector('#report-workers')?.value || ''
    state.foremen = document.querySelector('#report-foremen')?.value || ''
    state.start = document.querySelector('#report-start')?.value || ''
    state.end = document.querySelector('#report-end')?.value || ''
    state.note = document.querySelector('#report-note')?.value || ''
    saveState()
  }

  function syncModuleCard (card) {
    const module = state.modules.find(item => item.id === card.dataset.reportModule)
    if (!module) return
    module.name = card.querySelector('[data-report-module-name]')?.value || ''
    module.code = card.querySelector('[data-report-module-code]')?.value || ''
    module.works = (card.querySelector('[data-report-works]')?.value || '').split('\n')
    saveState()
  }

  const word = (number, one, few, many) => number === 1 ? one : number >= 2 && number <= 4 ? few : many
  const formattedDate = value => {
    const parts = String(value || '').split('-')
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}.` : ''
  }

  const spelling = {
    zavrsili:'završili', zavrsila:'završila', zavrseni:'završeni', zavrsene:'završene',
    demontaznih:'demontažnih', demontazni:'demontažni', demontaznog:'demontažnog',
    lajsni:'lajsni', silikonniranje:'silikoniranje', silikonirnje:'silikoniranje',
    busenje:'bušenje', busenju:'bušenju', izvlacenje:'izvlačenje', premestanje:'premeštanje',
    premjestanje:'premještanje', zastita:'zaštita', zastite:'zaštite', ciscenje:'čišćenje',
    ostecenje:'oštećenje', ostecenja:'oštećenja', pricvrscivanje:'pričvršćivanje',
    nosaca:'nosača', nosaci:'nosači', unutarnjih:'unutarnjih', supljina:'šupljina',
    izvestaj: 'izvještaj', izvestaja: 'izvještaja', izvestaji: 'izvještaji',
    izvjestaj: 'izvještaj', izvjestaja: 'izvještaja', izvjestaji: 'izvještaji',
    unutrasnji: 'unutrašnji', unutrasnja: 'unutrašnja', unutrasnje: 'unutrašnje',
    unutrasnjih: 'unutrašnjih', spoljasnji: 'vanjski', spoljasnja: 'vanjska',
    montaza: 'montaža', montaze: 'montaže', zavrsen: 'završen', zavrseno: 'završeno',
    zavrsavanje: 'završavanje', poslovodja: 'poslovođa', poslovodje: 'poslovođe',
    opsav: 'opšav', opsava: 'opšava', opsave: 'opšave', celicni: 'čelični',
    celicna: 'čelična', celicne: 'čelične', cetris: 'Cetris', promat: 'Promat',
    promata: 'Promata', bajkmont: 'Bajkmont', vertiv: 'VERTIV', tasker: 'TASKER'
  }

  const correctSpelling = value => String(value || '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[A-Za-zČĆŽŠĐčćžšđ]+/g, token => {
      const replacement = spelling[token.toLocaleLowerCase('hr-HR')]
      if (!replacement) return token
      return /^[A-ZČĆŽŠĐ]/.test(token) && !/^[A-ZČĆŽŠĐ]+$/.test(replacement)
        ? replacement.charAt(0).toLocaleUpperCase('hr-HR') + replacement.slice(1)
        : replacement
    })

  const suggestText = value => {
    const text = correctSpelling(value).replace(/\s+([,.;:!?])/g, '$1')
      .replace(/\b(dva radnika) završili\b/gi,'$1 su završili')
      .replace(/\b(tri sata) istovar\b/gi,'$1 istovara')
    return text ? text.charAt(0).toLocaleUpperCase('hr-HR') + text.slice(1) : ''
  }
  // Final rendering must never silently re-apply a rejected suggestion.
  const sentenceText = value => String(value || '').trim()

  const locationText = value => String(value || '')
    .replace(/\s*\/\s*/g, ' – ')
    .replace(/\s*-\s*/g, ' – ')
    .toLocaleUpperCase('hr-HR')

  const moduleCode = value => String(value || '').replace(/\s*-\s*/g, '-').toLocaleUpperCase('hr-HR')

  let review = null
  function reviewReport () {
    syncBasicFields();document.querySelectorAll('[data-report-module]').forEach(syncModuleCard)
    const draft=JSON.parse(JSON.stringify(state)),changes=[]
    draft.modules.forEach((m,mi)=>m.works.forEach((value,wi)=>{const proposed=suggestText(value.replace(/^[•-]\s*/,''));const original=value.replace(/^[•-]\s*/,'').trim();if(proposed!==original)changes.push({mi,wi,original,proposed,label:m.code||m.name||'Modul '+(mi+1)})}))
    String(draft.note||'').split('\n').forEach((original,ni)=>{const proposed=suggestText(original);if(proposed!==original.trim())changes.push({ni,original,proposed,label:'Napomena'})})
    review={draft,changes}
    document.getElementById('reports-review')?.remove()
    const dialog=document.createElement('dialog');dialog.id='reports-review'
    dialog.innerHTML='<h2>Provera teksta pre generisanja</h2><p>Pregledajte predloge. Odznačite izmene koje ne želite ili sami uredite predlog. Oznake modula, brojevi i sati nisu predmet ispravke.</p><p>Lokalna provera poznatih grešaka i izraza — ne prepoznaje sve gramatičke greške.</p>'+(changes.length?changes.map((c,i)=>'<section><label><input type="checkbox" data-review-accept="'+i+'" checked> Prihvati predlog · '+escapeHtml(c.label)+'</label><p><strong>Original:</strong> '+escapeHtml(c.original)+'</p><label>Predlog<textarea data-review-text="'+i+'">'+escapeHtml(c.proposed)+'</textarea></label></section>').join(''):'<p>Nema predloga u lokalnoj proveri. Proverite sadržaj pa potvrdite generisanje.</p>')+'<footer><button type="button" id="reports-review-cancel">Nazad na unos</button><button type="button" id="reports-review-confirm">Potvrdi i generiši izveštaj</button></footer>'
    document.body.append(dialog);dialog.addEventListener('cancel',()=>{review=null;dialog.remove()});dialog.showModal()
  }
  function finishReview () {
    if(!review)return
    const dialog=document.getElementById('reports-review'),{draft,changes}=review,notes=String(draft.note||'').split('\n')
    changes.forEach((c,i)=>{if(!dialog.querySelector('[data-review-accept="'+i+'"]').checked)return;const value=dialog.querySelector('[data-review-text="'+i+'"]').value;if(c.ni!==undefined)notes[c.ni]=value;else draft.modules[c.mi].works[c.wi]=value})
    draft.note=notes.join('\n');state=draft;saveState();renderModules();const note=document.getElementById('report-note');if(note)note.value=state.note
    review=null;dialog.close();dialog.remove();generateReport()
    document.dispatchEvent(new CustomEvent('tasker-report-generated'))
  }
  style.textContent += '#reports-review{box-sizing:border-box;width:min(760px,94vw);max-height:88vh;overflow:auto;padding:24px;border:1px solid #4b9ab4;border-radius:16px;background:#142b44;color:#e8f3ff}#reports-review::backdrop{background:#000b}#reports-review p{line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}#reports-review section{border:1px solid #46627b;border-radius:10px;padding:14px;margin:12px 0}#reports-review label{display:block;font-weight:bold}#reports-review textarea{box-sizing:border-box;width:100%;min-height:85px;margin-top:8px;background:#0b2035;color:white;font:16px/1.5 Arial;border:1px solid #5b829e;border-radius:8px;padding:10px}#reports-review footer{display:flex;gap:12px;flex-wrap:wrap;position:sticky;bottom:-24px;padding:16px 0;background:#142b44}#reports-review button{padding:14px;border:1px solid #62d5ef;border-radius:8px;background:#13556c;color:white;cursor:pointer}#reports-review-confirm{background:#12633e!important}'

  function generateReport () {
    const workers = Number(state.workers) || 0
    const foremen = Number(state.foremen) || 0
    const modules = state.modules.filter(module => module.name.trim() || module.code.trim() || module.works.some(work => work.trim()))
    const output = document.querySelector('#reports-output')
    const content = document.querySelector('#reports-output-content')
    if (!output || !content) return
    content.innerHTML = `<p><strong>${escapeHtml(locationText(state.location) || 'PROJEKT / LOKACIJA')}</strong></p>
      <p>${escapeHtml(formattedDate(state.date))}</p>
      <p>${escapeHtml(state.start)} – ${escapeHtml(state.end)}</p>
      <p>${workers} ${word(workers, 'radnik', 'radnika', 'radnika')}</p>
      <p>${foremen} ${word(foremen, 'poslovođa', 'poslovođe', 'poslovođa')}</p>
      ${modules.map(module => `<h3>${escapeHtml(moduleCode(module.code) || sentenceText(module.name) || 'Modul')}</h3>${module.works.filter(work => work.trim()).length ? `<ul>${module.works.filter(work => work.trim()).map(work => `<li>${escapeHtml(sentenceText(work.replace(/^[•-]\s*/,'')))}</li>`).join('')}</ul>` : '<p>– Nema upisanih radova</p>'}`).join('')}${state.note ? '<p>'+escapeHtml(state.note).replace(/\n/g,'<br>')+'</p>' : ''}`
    output.hidden = false
    output.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function plainReportText () {
    const area = document.querySelector('#reports-output-content')
    if (!area) return ''
    return area.innerText.replace(/\n{3,}/g, '\n\n').trim()
  }

  document.addEventListener('click', event => {
    if(event.target.closest('#reports-review-cancel')){review=null;document.getElementById('reports-review')?.remove();return}
    if(event.target.closest('#reports-review-confirm')){finishReview();return}
    const open = event.target.closest(`#${CARD_ID}`)
    if (open) { event.preventDefault(); event.stopImmediatePropagation(); renderProject(); return }
    if (event.target.closest('#reports-project-back')) {
      const back = document.querySelector('#back-to-projects')
      if (back) back.click()
      else location.reload()
      return
    }
    if (event.target.closest('#reports-add-module')) {
      state.modules.push({ id: `module-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: '', code: '', works: [''] })
      saveState(); renderModules(); return
    }
    const addWork = event.target.closest('[data-add-report-work]')
    if (addWork) {
      const card = addWork.closest('[data-report-module]'); if (card) syncModuleCard(card)
      const module = state.modules.find(item => item.id === addWork.dataset.addReportWork)
      if (module) { module.works.push(''); saveState(); renderModules() }
      return
    }
    const removeModule = event.target.closest('[data-remove-report-module]')
    if (removeModule) {
      if(!confirm('Ukloniti ovaj modul i njegove radove iz nacrta?'))return
      state.modules = state.modules.filter(module => module.id !== removeModule.dataset.removeReportModule)
      saveState(); renderModules(); return
    }
    const removeWork = event.target.closest('[data-remove-report-work]')
    if (removeWork) {
      const card = removeWork.closest('[data-report-module]'); if (!card) return
      syncModuleCard(card)
      const module = state.modules.find(item => item.id === card.dataset.reportModule)
      if (module) { module.works.splice(Number(removeWork.dataset.removeReportWork), 1); if (!module.works.length) module.works.push(''); saveState(); renderModules() }
      return
    }
    if (event.target.closest('#reports-generate')) { event.stopImmediatePropagation();const editor=document.getElementById('ra-editor');if(editor&&!editor.hidden&&!confirm('Ponovno generisanje zamenjuje ručno uređen tekst. Nastaviti?'))return;reviewReport(); return }
    if (event.target.closest('#reports-copy')) {
      navigator.clipboard?.writeText(plainReportText()).then(() => { const button = document.querySelector('#reports-copy'); if (button) { button.textContent = 'Kopirano'; setTimeout(() => { button.textContent = 'Kopiraj tekst' }, 1400) } }).catch(() => {})
    }
  }, true)

  document.addEventListener('input', event => {
    if (!event.target.closest(`#${CONTENT_ID}`)) return
    if (event.target.closest('.reports-basic-fields') || event.target.id==='report-note') syncBasicFields()
    const card = event.target.closest('[data-report-module]')
    if (card) syncModuleCard(card)
  })

  document.addEventListener('tasker-report-load', event => {
    state = event.detail ? JSON.parse(JSON.stringify(event.detail)) : blankState()
    saveState()
    renderProject()
  })

  new MutationObserver(installCard).observe(document.getElementById('app') || document.body, { childList: true, subtree: true })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installCard)
  else installCard()
})()

