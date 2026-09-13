// TASKER v79: osnovni projekt IZVJESTAJI.
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

    .reports-project-page{max-width:1180px;margin:0 auto;padding:8px 0 46px}
    .reports-project-header{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:20px;padding:24px 28px;border:1px solid #315777;border-radius:18px;background:linear-gradient(145deg,#172e49,#102139);box-shadow:0 18px 42px rgba(0,0,0,.18)}
    .reports-project-header>div{display:grid;gap:5px}.reports-project-back{width:max-content;padding:0;border:0;background:transparent;color:#62d9ff;font-size:12px;font-weight:900;cursor:pointer}.reports-project-header p{margin:7px 0 0;color:#8fa9c0;font-size:12px}.reports-project-header h1{margin:0;color:#f5fbff;font-size:32px}.reports-project-header>span{display:grid;place-items:center;width:66px;height:66px;border:1px solid #3187aa;border-radius:18px;background:#123c59;color:#77e5ff;font-size:30px;box-shadow:0 0 22px rgba(52,207,255,.18)}

    .reports-basic-fields{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;padding:20px;border:1px solid #2d4d6b;border-radius:16px;background:#172944}
    .reports-project-page label{display:grid;gap:7px;color:#9eb5ca;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}.reports-project-page input{height:43px;padding:0 12px;border:1px solid #365b7b;border-radius:9px;outline:0;background:#0e2037;color:#f2f8ff;font:inherit;color-scheme:dark}.reports-project-page input:focus{border-color:#59d6ff;box-shadow:0 0 0 2px rgba(60,202,255,.12)}
    .reports-modules-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:24px 0 13px}.reports-modules-heading h2{margin:0;font-size:21px}.reports-modules-heading p{margin:5px 0 0;color:#819ab1;font-size:11px}.reports-add-module,.reports-add-work{border:1px solid #44cbf5;border-radius:10px;background:#43c1ed;color:#071626;font-weight:900;cursor:pointer}.reports-add-module{padding:12px 17px}.reports-add-work{padding:9px 12px}.reports-add-module:hover,.reports-add-work:hover{filter:brightness(1.08);box-shadow:0 0 17px rgba(67,203,245,.23)}
    .reports-modules-list{display:grid;gap:15px}.reports-empty{margin:0;padding:30px;border:1px dashed #355a77;border-radius:15px;color:#7590a8;text-align:center;font-size:12px;background:rgba(16,34,56,.45)}
    .reports-module-card{overflow:hidden;border:1px solid #315675;border-radius:16px;background:linear-gradient(145deg,#1b304d,#13243c);box-shadow:0 13px 28px rgba(0,0,0,.14)}.reports-module-card>header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #2a4865;background:rgba(11,28,48,.35)}.reports-module-card>header span{color:#61dcff;font-size:10px;font-weight:900;letter-spacing:.14em}.reports-module-card>header button{width:31px;height:31px;border:1px solid #6a3548;border-radius:8px;background:#3b2230;color:#ff9daf;font-size:18px;cursor:pointer}.reports-module-body{padding:18px}.reports-module-fields{display:grid;grid-template-columns:1.4fr 1fr;gap:12px}.reports-work-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:18px 0 9px}.reports-work-heading h3{margin:0;font-size:15px}.reports-work-list{display:grid;gap:8px}.reports-work-row{display:grid;grid-template-columns:28px 1fr 36px;gap:8px;align-items:center}.reports-work-row>span{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#214866;color:#76ddff;font-size:11px;font-weight:900}.reports-work-row button{height:36px;border:1px solid #623849;border-radius:8px;background:#342330;color:#ff9bad;font-size:17px;cursor:pointer}.reports-work-row input{height:40px}
    .reports-generate{width:100%;margin-top:24px;padding:17px;border:1px solid #5aff8c;border-radius:13px;background:linear-gradient(135deg,#34d875,#50ff91);color:#06170d;font-size:16px;font-weight:1000;letter-spacing:.08em;cursor:pointer;box-shadow:0 0 22px rgba(76,255,139,.18)}.reports-generate:hover{filter:brightness(1.05);box-shadow:0 0 28px rgba(76,255,139,.28)}
    .reports-output{margin-top:22px;padding:28px;border:1px solid #37617e;border-radius:16px;background:#f8fafc;color:#172033;box-shadow:0 18px 42px rgba(0,0,0,.22)}.reports-output[hidden]{display:none}.reports-output>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;padding-bottom:12px;border-bottom:2px solid #172033}.reports-output h2{margin:0;font-size:20px}.reports-output-copy{padding:9px 12px;border:1px solid #adc0cf;border-radius:8px;background:#edf3f7;color:#172033;font-weight:800;cursor:pointer}.reports-output-content{font:16px/1.55 Arial,sans-serif;white-space:pre-wrap}.reports-output-content h3{margin:22px 0 7px;font-size:17px}.reports-output-content p{margin:0 0 8px}.reports-output-content ul{margin:7px 0 18px;padding-left:22px}.reports-output-content li{margin:4px 0}
    @media(max-width:820px){.reports-basic-fields{grid-template-columns:1fr 1fr}.reports-basic-fields label:first-child{grid-column:1/-1}.reports-module-fields{grid-template-columns:1fr}.reports-project-header{padding:19px}.reports-project-header h1{font-size:26px}}
    @media(max-width:520px){.reports-basic-fields{grid-template-columns:1fr}.reports-basic-fields label:first-child{grid-column:auto}.reports-modules-heading{align-items:stretch;flex-direction:column}.reports-add-module{width:100%}.reports-project-header>span{display:none}.reports-work-row{grid-template-columns:25px 1fr 34px}.reports-output{padding:19px}}
  `
  document.head.appendChild(style)

  function cardMarkup () {
    return `<button type="button" class="project-card project-reports" id="${CARD_ID}">
      <span class="project-card-glow" aria-hidden="true"></span>
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
        <label>Naziv modula<input data-report-module-name value="${escapeHtml(module.name)}" placeholder="npr. Drugi modul"></label>
        <label>Oznaka modula<input data-report-module-code value="${escapeHtml(module.code)}" placeholder="npr. MV-15"></label>
      </div>
      <div class="reports-work-heading"><h3>Izvedeni radovi</h3><button type="button" class="reports-add-work" data-add-report-work="${escapeHtml(module.id)}">+ Dodaj rad</button></div>
      <div class="reports-work-list">${module.works.map((work, workIndex) => `<div class="reports-work-row" data-report-work="${workIndex}"><span>${workIndex + 1}</span><input value="${escapeHtml(work)}" placeholder="Unesite izvedeni rad"><button type="button" data-remove-report-work="${workIndex}" title="Ukloni rad">×</button></div>`).join('')}</div>
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
      </section>
      <section class="reports-modules-heading"><div><h2>Moduli</h2><p>Dodajte potreban broj modula i radova.</p></div><button type="button" class="reports-add-module" id="reports-add-module">+ Dodaj modul</button></section>
      <div class="reports-modules-list" id="reports-modules-list"></div>
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
    saveState()
  }

  function syncModuleCard (card) {
    const module = state.modules.find(item => item.id === card.dataset.reportModule)
    if (!module) return
    module.name = card.querySelector('[data-report-module-name]')?.value || ''
    module.code = card.querySelector('[data-report-module-code]')?.value || ''
    module.works = [...card.querySelectorAll('[data-report-work] input')].map(input => input.value)
    saveState()
  }

  const word = (number, one, few, many) => number === 1 ? one : number >= 2 && number <= 4 ? few : many
  const formattedDate = value => {
    const parts = String(value || '').split('-')
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}.` : ''
  }

  function generateReport () {
    syncBasicFields()
    document.querySelectorAll('[data-report-module]').forEach(syncModuleCard)
    const workers = Number(state.workers) || 0
    const foremen = Number(state.foremen) || 0
    const modules = state.modules.filter(module => module.name.trim() || module.code.trim() || module.works.some(work => work.trim()))
    const output = document.querySelector('#reports-output')
    const content = document.querySelector('#reports-output-content')
    if (!output || !content) return
    content.innerHTML = `<p><strong>${escapeHtml(state.location.trim() || 'Projekt / lokacija')}</strong></p>
      <p>${escapeHtml(formattedDate(state.date))}</p>
      <p>${workers} ${word(workers, 'radnik', 'radnika', 'radnika')}</p>
      <p>${foremen} ${word(foremen, 'poslovođa', 'poslovođe', 'poslovođa')}</p>
      ${modules.map(module => `<h3>${escapeHtml(module.name.trim() || 'Modul')}${module.code.trim() ? ` (modul ${escapeHtml(module.code.trim())})` : ''}</h3>${module.works.filter(work => work.trim()).length ? `<ul>${module.works.filter(work => work.trim()).map(work => `<li>${escapeHtml(work.trim())}</li>`).join('')}</ul>` : '<p>– Nema upisanih radova</p>'}`).join('')}`
    output.hidden = false
    output.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function plainReportText () {
    const area = document.querySelector('#reports-output-content')
    if (!area) return ''
    return area.innerText.replace(/\n{3,}/g, '\n\n').trim()
  }

  document.addEventListener('click', event => {
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
    if (event.target.closest('#reports-generate')) { generateReport(); return }
    if (event.target.closest('#reports-copy')) {
      navigator.clipboard?.writeText(plainReportText()).then(() => { const button = document.querySelector('#reports-copy'); if (button) { button.textContent = 'Kopirano'; setTimeout(() => { button.textContent = 'Kopiraj tekst' }, 1400) } }).catch(() => {})
    }
  }, true)

  document.addEventListener('input', event => {
    if (!event.target.closest(`#${CONTENT_ID}`)) return
    if (event.target.closest('.reports-basic-fields')) syncBasicFields()
    const card = event.target.closest('[data-report-module]')
    if (card) syncModuleCard(card)
  })

  new MutationObserver(installCard).observe(document.getElementById('app') || document.body, { childList: true, subtree: true })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installCard)
  else installCard()
})()

