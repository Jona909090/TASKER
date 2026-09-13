// Separate Tasker project: initial structure only.
(function () {
  'use strict'
  const cardId = 'open-employee-hours-project'
  const pageId = 'employee-hours-project'
  const now = new Date()
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  const selection = { date: today, hours: '8', month: today.slice(0, 7) }
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
  function open () {
    const content = document.getElementById('content')
    if (!content) return
    document.querySelector('.shell')?.classList.add('project-home')
    content.innerHTML = `<section id="${pageId}">
      <header class="eh-hero"><div><button type="button" class="eh-back" id="eh-back">← Projekti</button><div class="eh-tag">TASKER · ZASEBAN PROJEKT</div><h1>Radni sati zaposlenih</h1><p>Dnevna evidencija prisutnosti i mjesečni pregled sati.</p></div><span class="eh-clock" aria-hidden="true">◷</span></header>
      <div class="eh-flow">1. Odabir datuma → 2. Radni sati za dan → 3. Prisutan / Odsutan → 4. Mjesečna evidencija</div>
      <section class="eh-panel"><h2>Dnevna evidencija</h2><p>Odaberite datum i broj radnih sati za taj dan.</p><div class="eh-fields"><label>Datum<input id="eh-date" type="date"></label><label>Broj radnih sati za dan<input id="eh-hours" type="number" min="0" max="24" step="0.25" inputmode="decimal"></label></div></section>
      <section class="eh-panel"><h2>Prisutnost zaposlenih</h2><p>Ovdje će biti popis zaposlenih za označavanje dnevne prisutnosti.</p><div class="eh-legend"><span class="eh-present">● Prisutan</span><span class="eh-absent">● Odsutan</span></div><div class="eh-empty"><strong>Još nema zaposlenih u ovom projektu</strong>Unos zaposlenih i označavanje prisutnosti slijede u sljedećem koraku.</div></section>
      <section class="eh-panel"><div class="eh-month-head"><div><h2>Mjesečna evidencija sati</h2><p>Pregled radnih sati zaposlenih po danima u mjesecu.</p></div><label>Mjesec<input id="eh-month" type="month"></label></div><div class="eh-empty"><strong>Evidencija još nije aktivna</strong>Automatsko popunjavanje sati povezat ćemo s dnevnom prisutnošću u sljedećem koraku.</div></section>
    </section>`
    document.getElementById('eh-date').value=selection.date
    document.getElementById('eh-hours').value=selection.hours
    document.getElementById('eh-month').value=selection.month
  }
  document.addEventListener('click', event => {
    if (event.target.closest(`#${cardId}`)) { event.preventDefault(); event.stopImmediatePropagation(); open(); return }
    if (event.target.closest('#eh-back')) { document.getElementById('back-to-projects')?.click() }
  }, true)
  document.addEventListener('input', event => {
    if (!event.target.closest(`#${pageId}`)) return
    if (event.target.id==='eh-date') {selection.date=event.target.value;if(selection.date){selection.month=selection.date.slice(0,7);document.getElementById('eh-month').value=selection.month}}
    if (event.target.id==='eh-hours') selection.hours=event.target.value
    if (event.target.id==='eh-month') selection.month=event.target.value
  })
  new MutationObserver(installCard).observe(document.getElementById('app') || document.body,{childList:true,subtree:true})
  installCard()
})()

