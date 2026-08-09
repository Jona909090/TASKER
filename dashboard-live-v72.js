(function () {
  'use strict'

  const STYLE_ID = 'tasker-live-v72-style'
  const PANEL_ID = 'tasker-live-panel'
  const WEATHER_ID = 'tasker-weather-chip'
  let updating = false
  let lastDashboard = false

  const css = `
    .workspace,.content,.topbar{position:relative;z-index:1}
    .tasker-weather-chip{display:flex;align-items:center;gap:9px;margin-left:14px;padding:7px 12px;border:1px solid rgba(57,200,255,.28);border-radius:12px;background:linear-gradient(145deg,rgba(18,45,72,.94),rgba(10,29,49,.94));color:#dff8ff;box-shadow:0 8px 24px rgba(0,0,0,.18);white-space:nowrap;cursor:pointer}
    .tasker-weather-chip:hover{border-color:#39c8ff;box-shadow:0 0 18px rgba(57,200,255,.18)}
    .tasker-weather-chip>span{font-size:20px}.tasker-weather-chip div{display:grid;gap:1px;text-align:left}.tasker-weather-chip b{font-size:12px;color:#fff}.tasker-weather-chip small{font-size:9px;color:#79d9ff;text-transform:uppercase;letter-spacing:.08em}
    .tasker-live-panel{position:fixed;z-index:5;right:24px;top:96px;bottom:24px;width:300px;overflow:auto;display:flex;flex-direction:column;padding:18px;border:1px solid rgba(57,200,255,.35);border-radius:22px;background:linear-gradient(160deg,rgba(16,40,65,.94),rgba(6,19,34,.97));box-shadow:0 24px 60px rgba(0,0,0,.35),inset 0 1px rgba(255,255,255,.035);scrollbar-width:thin;scrollbar-color:#214f71 transparent}
    .tasker-live-panel header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(57,200,255,.22)}
    .tasker-live-panel header div{display:grid;gap:3px}.tasker-live-panel header small{color:#52d5ff;font-size:9px;font-weight:800;letter-spacing:.18em}.tasker-live-panel header strong{font-size:19px;color:#fff}.tasker-live-panel header i{width:9px;height:9px;border-radius:50%;background:#49ff7e;box-shadow:0 0 12px #49ff7e}
    .tasker-live-card{display:grid;grid-template-columns:36px minmax(0,1fr);gap:10px;margin:10px 0;padding:12px;border:1px solid rgba(99,153,194,.22);border-radius:14px;background:linear-gradient(145deg,rgba(25,52,82,.88),rgba(15,36,60,.88))}
    .tasker-live-card>span{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:#123554;color:#63d9ff;font-size:17px;box-shadow:inset 0 0 14px rgba(57,200,255,.08)}
    .tasker-live-card.warn>span{background:#4a3715;color:#ffd64d}.tasker-live-card.people>span{background:#124630;color:#5cff8a}.tasker-live-card.pdf>span{background:#3b234a;color:#ff73d1}
    .tasker-live-card div{min-width:0;display:grid;gap:3px}.tasker-live-card small{color:#7896b3;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.tasker-live-card b{overflow:hidden;color:#f5fbff;font-size:12px;white-space:nowrap;text-overflow:ellipsis}.tasker-live-card em{color:#80a9c8;font-size:10px;font-style:normal;line-height:1.35}
    .tasker-live-brand{display:grid;place-items:center;min-height:84px;margin-top:auto;padding-top:16px;border-top:1px solid rgba(57,200,255,.18);font-size:30px;font-weight:950;letter-spacing:.24em;color:#49ff7e;animation:tasker-calm-pulse 5.8s ease-in-out infinite}
    @keyframes tasker-calm-pulse{0%,100%{opacity:.25;text-shadow:0 0 2px rgba(73,255,126,.2)}50%{opacity:1;text-shadow:0 0 8px #49ff7e,0 0 22px rgba(73,255,126,.58)}}
    @media(min-width:1900px){.tasker-live-panel{display:flex}}
    @media(max-width:1899px){.tasker-live-panel{position:relative;inset:auto;width:auto;margin:26px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tasker-live-panel header,.tasker-live-brand{grid-column:1/-1}.tasker-live-card{margin:0}.tasker-live-brand{min-height:68px;margin-top:0;padding-top:12px}}
    @media(max-width:720px){.tasker-weather-chip{margin-left:6px;padding:6px 8px}.tasker-weather-chip small{display:none}.tasker-live-panel{grid-template-columns:1fr;padding:14px}.tasker-live-panel header,.tasker-live-brand{grid-column:auto}.tasker-live-brand{font-size:24px}.topbar{flex-wrap:wrap}}
    @media(prefers-reduced-motion:reduce){.tasker-live-brand{animation-duration:9s}}
  `

  function addStyle () {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = css
    document.head.appendChild(style)
  }

  const parse = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback } catch { return fallback }
  }
  const clean = (value) => String(value == null ? '' : value).replace(/[<>]/g, '').trim()
  const timeLabel = (value) => {
    if (!value) return 'Upravo sada'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('hr-HR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
  }
  const todayKey = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function readLiveData () {
    const todos = parse('tasker.todos', [])
    const next = todos.find(item => !item.done) || todos[0]
    const inventory = parse('tasker.inventory', [])
    const warning = inventory.find(item => Number(item.stock) <= Number(item.minStock))
    const employees = parse('tasker.employees', [])
    const attendanceAll = parse('tasker.daily-attendance', {})
    const attendance = attendanceAll[todayKey()] || {}
    const present = employees.filter(employee => attendance[employee.id] !== false).length
    const activities = parse('tasker.control-activity', [])
    const last = activities[0]
    return { next, warning, employees, present, last }
  }

  async function latestPdf () {
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('tasker-work-diary', 1)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      const rows = await new Promise((resolve, reject) => {
        const request = db.transaction('pdfs', 'readonly').objectStore('pdfs').getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
      return rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0]
    } catch { return null }
  }

  async function panelMarkup () {
    const data = readLiveData()
    const pdf = await latestPdf()
    const taskText = data.next ? clean(data.next.text) : 'Nema aktivnih obaveza'
    const taskMeta = data.next?.time ? `Podsjetnik u ${clean(data.next.time)}` : 'Pregled današnjih zadataka'
    const warningText = data.warning ? clean(data.warning.name) : 'Materijal je pod kontrolom'
    const warningMeta = data.warning ? `${Number(data.warning.stock) || 0} na stanju · minimum ${Number(data.warning.minStock) || 0}` : 'Nema kritičnih stavki'
    const peopleText = `${data.present}/${data.employees.length} prisutno`
    const lastText = data.last ? clean(data.last.title) : 'Nema zabilježenih promjena'
    const pdfText = pdf ? clean(pdf.fileName || 'PDF dokument') : 'Još nema spremljenog PDF-a'
    return `<header><div><small>KONTROLNI SIGNALI</small><strong>DANAS UŽIVO</strong></div><i aria-hidden="true"></i></header>
      <article class="tasker-live-card"><span>◷</span><div><small>Sljedeća obaveza</small><b>${taskText}</b><em>${taskMeta}</em></div></article>
      <article class="tasker-live-card warn"><span>!</span><div><small>Upozorenja</small><b>${warningText}</b><em>${warningMeta}</em></div></article>
      <article class="tasker-live-card people"><span>●</span><div><small>Prisutni radnici</small><b>${peopleText}</b><em>Prema današnjoj evidenciji</em></div></article>
      <article class="tasker-live-card"><span>↻</span><div><small>Posljednja promjena</small><b>${lastText}</b><em>${timeLabel(data.last?.time)}</em></div></article>
      <article class="tasker-live-card pdf"><span>PDF</span><div><small>Zadnji PDF</small><b>${pdfText}</b><em>${pdf ? timeLabel(pdf.createdAt) : 'Arhiva dnevnika rada'}</em></div></article>
      <div class="tasker-live-brand" aria-label="TASKER">TASKER</div>`
  }

  function dashboardVisible () {
    const heading = document.querySelector('#content #greeting')
    return Boolean(heading && document.querySelector('#content .stat-grid') && document.querySelector('#content .dashboard-grid'))
  }

  async function syncPanel () {
    if (updating) return
    updating = true
    try {
      const visible = dashboardVisible()
      document.body.classList.toggle('tasker-dashboard-live', visible)
      let panel = document.getElementById(PANEL_ID)
      if (!visible) {
        panel?.remove()
        lastDashboard = false
        return
      }
      if (!panel) {
        panel = document.createElement('aside')
        panel.id = PANEL_ID
        panel.className = 'tasker-live-panel'
        panel.setAttribute('aria-label', 'Danas uživo')
        if (matchMedia('(min-width:1900px)').matches) document.body.appendChild(panel)
        else document.querySelector('#content')?.appendChild(panel)
      } else if (matchMedia('(min-width:1900px)').matches && panel.parentElement !== document.body) document.body.appendChild(panel)
      else if (!matchMedia('(min-width:1900px)').matches && panel.parentElement !== document.querySelector('#content')) document.querySelector('#content')?.appendChild(panel)
      panel.innerHTML = await panelMarkup()
      lastDashboard = true
    } finally { updating = false }
  }

  const weatherCode = code => code === 0 ? '☀️' : code < 4 ? '⛅' : code < 50 ? '🌫️' : code < 70 ? '🌧️' : code < 80 ? '🌨️' : '⛈️'
  const fallbackCity = () => Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Belgrade' ? 'Beograd' : 'Zagreb'
  async function fetchWeather (lat, lon, city) {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`)
    if (!response.ok) throw new Error('weather')
    const json = await response.json()
    const result = { city, temperature: Math.round(json.current.temperature_2m), code: Number(json.current.weather_code), savedAt: Date.now() }
    localStorage.setItem('tasker.weather-cache', JSON.stringify(result))
    return result
  }
  function renderWeather (data) {
    let chip = document.getElementById(WEATHER_ID)
    if (!chip) {
      chip = document.createElement('button')
      chip.type = 'button'
      chip.id = WEATHER_ID
      chip.className = 'tasker-weather-chip'
      chip.title = 'Osvježi vrijeme prema lokaciji uređaja'
      document.querySelector('.topbar-time-area')?.insertAdjacentElement('afterend', chip)
      chip.addEventListener('click', () => loadWeather(true))
    }
    chip.innerHTML = `<span>${weatherCode(data.code)}</span><div><b>${data.temperature}°C</b><small>${clean(data.city)}</small></div>`
  }
  function loadWeather (force) {
    const cached = parse('tasker.weather-cache', null)
    if (!force && cached && Date.now() - Number(cached.savedAt) < 30 * 60 * 1000) { renderWeather(cached); return }
    const fallback = () => fetchWeather(45.815, 15.982, fallbackCity()).then(renderWeather).catch(() => renderWeather({ city: fallbackCity(), temperature: '—', code: 1 }))
    if (!navigator.geolocation) { fallback(); return }
    navigator.geolocation.getCurrentPosition(
      position => fetchWeather(position.coords.latitude, position.coords.longitude, fallbackCity()).then(renderWeather).catch(fallback),
      fallback,
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 30 * 60 * 1000 }
    )
  }

  function boot () {
    addStyle()
    loadWeather(false)
    syncPanel()
    const observer = new MutationObserver(() => {
      const visible = dashboardVisible()
      if (visible !== lastDashboard || (visible && !document.getElementById(PANEL_ID))) syncPanel()
    })
    observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true })
    window.addEventListener('resize', syncPanel)
    window.addEventListener('storage', syncPanel)
    setInterval(() => { if (dashboardVisible()) syncPanel() }, 60000)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()

