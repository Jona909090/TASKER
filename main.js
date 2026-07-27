import { categories, materials, renderCategory, renderItems, renderMaterials } from './materials.js'

const controlActivityStorage = 'tasker.control-activity';
const controlActivityLabels = { material: 'Materijal', employees: 'Zaposleni', attendance: 'Prisutnost', orders: 'Narudžbine', tasks: 'Obaveze', modules: 'Moduli', hours: 'Radni sati', plans: 'Plan rada' }
function readControlActivities() { try { const list = JSON.parse(localStorage.getItem(controlActivityStorage) || '[]'); return Array.isArray(list) ? list : [] } catch { return [] } }
function recordControlActivity(kind, title) { const list = readControlActivities(); const now = Date.now(); if (list[0]?.kind === kind && list[0]?.title === title && now - Number(list[0].time) < 2000) return; list.unshift({ id: `${now}-${Math.random().toString(16).slice(2)}`, kind, title, time: now }); localStorage.setItem(controlActivityStorage, JSON.stringify(list.slice(0, 60))) }

const storage = 'tasker.todos'; const filterStorage = 'tasker.filter'; const inventoryStorage = 'tasker.inventory'; const categoryStorage = 'tasker.categories'; const orderStorage = 'tasker.order-lines'; const moduleStorage = 'tasker.module-progress'; const moduleDetailStorage = 'tasker.module-details'; const employeeStorage = 'tasker.employees'; const attendanceStorage = 'tasker.daily-attendance'; const workHoursStorage = 'tasker.work-hours'; const workPlanStorage = 'tasker.work-plans'; const diaryStorage = 'tasker.work-diary'; const settingsStorage = 'tasker.settings'; const projectStorage = 'tasker.projects'
try { const savedCategories = JSON.parse(localStorage.getItem(categoryStorage) || 'null'); if (Array.isArray(savedCategories)) categories.splice(0, categories.length, ...savedCategories) } catch {}
const saveCategories = () => localStorage.setItem(categoryStorage, JSON.stringify(categories))
try { const savedInventory = JSON.parse(localStorage.getItem(inventoryStorage) || 'null'); if (Array.isArray(savedInventory)) materials.splice(0, materials.length, ...savedInventory) } catch {}
const saveInventory = () => { localStorage.setItem(inventoryStorage, JSON.stringify(materials)); recordControlActivity('material', 'Stanje materijala je izmenjeno') }
const defaultSettings = { userName: 'Stefan Jonić', companyName: 'TASKER', defaultMinStock: 0, theme: 'dark' }
let savedSettings = {}
try { savedSettings = JSON.parse(localStorage.getItem(settingsStorage) || '{}') || {}; if (savedSettings.theme === 'light') savedSettings.theme = 'dark' } catch {}
let savedProjects = []
try { const storedProjects = JSON.parse(localStorage.getItem(projectStorage) || '[]'); savedProjects = Array.isArray(storedProjects) ? storedProjects : [] } catch {}
const saveProjects = () => localStorage.setItem(projectStorage, JSON.stringify(savedProjects))
const projectForSlot = (slot) => savedProjects.find((project) => Number(project.slot) === Number(slot))
const projectPassword = '7070'
const projectAccessKey = (key) => `tasker.project-access.${key}`
const hasProjectAccess = (key) => sessionStorage.getItem(projectAccessKey(key)) === 'granted'
const grantProjectAccess = (key) => sessionStorage.setItem(projectAccessKey(key), 'granted')
const state = { todos: JSON.parse(localStorage.getItem(storage) || '[]'), filter: localStorage.getItem(filterStorage) || 'all', currentCategory: null, orderLines: JSON.parse(localStorage.getItem(orderStorage) || '[]'), moduleProgress: JSON.parse(localStorage.getItem(moduleStorage) || '{"mv":0,"mvs":0,"rpp":0}'), moduleDetails: JSON.parse(localStorage.getItem(moduleDetailStorage) || '{}'), attendance: JSON.parse(localStorage.getItem(attendanceStorage) || '{}'), workHours: JSON.parse(localStorage.getItem(workHoursStorage) || '{}'), workPlans: JSON.parse(localStorage.getItem(workPlanStorage) || '{}'), settings: { ...defaultSettings, ...savedSettings } }
const defaultEmployees = [{ id: 1, name: 'Stefan Jonic', role: 'Vodja gradilista', phone: '---', active: true }, { id: 2, name: 'Marko Petrovic', role: 'Nadzor', phone: '---', active: true }, { id: 3, name: 'Nikola Ilic', role: 'Radnik', phone: '---', active: true }, { id: 4, name: 'Milan Jovanovic', role: 'Radnik', phone: '---', active: true }, { id: 5, name: 'Dejan Markovic', role: 'Radnik', phone: '---', active: true }, { id: 6, name: 'Aleksandar Nikolic', role: 'Pomocni radnik', phone: '---', active: true }]
try { const savedEmployees = JSON.parse(localStorage.getItem(employeeStorage) || 'null'); state.employees = Array.isArray(savedEmployees) ? savedEmployees : defaultEmployees } catch { state.employees = defaultEmployees }
const saveEmployees = () => { localStorage.setItem(employeeStorage, JSON.stringify(state.employees)); recordControlActivity('employees', 'Podaci zaposlenih su izmenjeni') }
const saveAttendance = () => { localStorage.setItem(attendanceStorage, JSON.stringify(state.attendance)); recordControlActivity('attendance', 'Evidencija prisutnosti je izmenjena') }
const saveWorkHours = () => { localStorage.setItem(workHoursStorage, JSON.stringify(state.workHours)); recordControlActivity('hours', 'Radni sati su sačuvani') }
const saveWorkPlans = () => { localStorage.setItem(workPlanStorage, JSON.stringify(state.workPlans)); recordControlActivity('plans', 'Plan rada je izmenjen') }
const saveSettings = () => localStorage.setItem(settingsStorage, JSON.stringify(state.settings))
const applyTheme = () => document.documentElement.dataset.theme = state.settings.theme
applyTheme()
const app = document.querySelector('#app'); let projectOpen = false; let newProjectSlot = null; const low = materials.filter((item) => item.stock > 0 && item.stock <= item.minStock).length; const noStock = materials.filter((item) => item.stock <= 0).length
const esc = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const save = () => { localStorage.setItem(storage, JSON.stringify(state.todos)); localStorage.setItem(filterStorage, state.filter); recordControlActivity('tasks', 'Dnevne obaveze su izmenjene') }
const saveOrder = () => { localStorage.setItem(orderStorage, JSON.stringify(state.orderLines)); recordControlActivity('orders', 'Narudžbenica je izmenjena') }
const saveModuleProgress = () => { localStorage.setItem(moduleStorage, JSON.stringify(state.moduleProgress)); recordControlActivity('modules', 'Napredak modula je izmenjen') }
const saveModuleDetails = () => { localStorage.setItem(moduleDetailStorage, JSON.stringify(state.moduleDetails)); recordControlActivity('modules', 'Detalji modula su izmenjeni') }

app.innerHTML = `<div class="shell project-home"><aside class="sidebar"><a class="brand" href="#"><span class="brand-mark"><i></i><b>T</b><i></i></span><span><strong id="brand-company">${esc(state.settings.companyName)}</strong></span></a><button class="back-to-projects" id="back-to-projects" type="button">\u2190 Projekti</button><nav><button class="nav-link active" data-page="dashboard"><span>\u2302</span> Po\u010Detna</button><button class="nav-link" data-page="control-center"><span>◉</span> Kontrolni centar</button><button class="nav-link" data-page="materials"><span>\u25A6</span> Materijal <b>${materials.length}</b></button><button class="nav-link" data-page="employees"><span>\u263B</span> Zaposleni</button><button class="nav-link" data-page="orders"><span>\u25A4</span> Narud\u017Ebine</button><button class="nav-link" data-page="reports"><span>\u25A5</span> Izve\u0161taji</button></nav><div class="sidebar-footer"><button class="nav-link" data-page="settings"><span>\u2699</span> Pode\u0161avanja</button><p>Tasker v2.0</p></div></aside><div class="workspace"><header class="topbar"><div class="topbar-time-area"><span id="breadcrumb" hidden>Po\u010Detna</span></div><div class="topbar-profile-actions"><a class="radio-tvornica" href="https://www.radiotvornica.hr/" target="_blank" rel="noopener noreferrer" aria-label="Otvori Radio Tvornicu" title="Radio Tvornica">&#128251;</a><button type="button" class="profile" aria-label="Otvori profil" style="border:0;background:transparent;color:inherit;cursor:pointer;"><span id="profile-initials">SJ</span><b id="profile-name">${esc(state.settings.userName)}</b></button></div></header><main id="content" class="content"></main></div></div>`


/* TASKER instalacija na telefon i tablet. */
let taskerInstallPrompt=null
const taskerStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true
const showTaskerInstallHelp=()=>{
  document.querySelector('#tasker-install-help')?.remove()
  const isApple=/iphone|ipad|ipod/i.test(navigator.userAgent)
  document.body.insertAdjacentHTML('beforeend',`<div class="tasker-install-help" id="tasker-install-help"><section role="dialog" aria-modal="true"><button type="button" data-install-close>×</button><span class="tasker-install-logo"><i></i><b>T</b><i></i></span><p class="eyebrow">TASKER APLIKACIJA</p><h2>Instaliraj TASKER</h2><p>${isApple?'Na iPhone/iPad uređaju dodirnite dugme Deljenje u Safariju, pa izaberite „Dodaj na početni ekran“.':'Otvorite meni pregledača i izaberite „Instaliraj aplikaciju“ ili „Dodaj na početni ekran“.'}</p><small>Aplikacija će dobiti svoju ikonicu i otvarati se preko celog ekrana.</small><button type="button" class="primary-btn" data-install-close>Razumem</button></section></div>`)
  const modal=document.querySelector('#tasker-install-help'),close=()=>modal.remove()
  modal.querySelectorAll('[data-install-close]').forEach((button)=>button.addEventListener('click',close))
  modal.addEventListener('click',(event)=>{if(event.target===modal)close()})
}
const taskerInstallButton=document.createElement('button')
taskerInstallButton.type='button'
taskerInstallButton.className='tasker-install-button'
taskerInstallButton.innerHTML='<span>⇩</span><b>Instaliraj</b>'
taskerInstallButton.title='Instaliraj TASKER na uređaj'
document.querySelector('.topbar-profile-actions')?.prepend(taskerInstallButton)
if(taskerStandalone())taskerInstallButton.hidden=true
window.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();taskerInstallPrompt=event;taskerInstallButton.hidden=false;taskerInstallButton.classList.add('ready')})
taskerInstallButton.addEventListener('click',async()=>{if(taskerInstallPrompt){taskerInstallPrompt.prompt();await taskerInstallPrompt.userChoice;taskerInstallPrompt=null}else showTaskerInstallHelp()})
window.addEventListener('appinstalled',()=>{taskerInstallButton.hidden=true;taskerInstallPrompt=null})

const systemStatus = document.createElement('section')
systemStatus.className = 'system-status'
systemStatus.setAttribute('aria-label', 'Sistem status')
const projectCount = 1 + savedProjects.length
systemStatus.innerHTML = `<p class="system-status-title">Sistem status</p><div class="system-status-row"><span><i></i>Aplikacija</span><b>Online</b></div><div class="system-status-row"><span><i></i>Lokalni podaci</span><b>Aktivno</b></div><div class="system-status-row"><span><i></i>Skladi\u0161te</span><b>Aktivno</b></div><div class="system-status-row"><span><i></i>Sinhronizacija</span><b>Lokalna</b></div><div class="system-status-separator"></div><div class="system-status-row"><span><i></i>Za\u0161ti\u0107en pristup</span><b>Aktivan</b></div><div class="system-status-row"><span><i></i>Rezervna kopija</span><b>Spremna</b></div><div class="system-status-row"><span><i></i>Radio stanica</span><b>Dostupna</b></div><div class="system-status-row"><span><i></i>Projekti</span><b>${projectCount} / 6</b></div><div class="system-status-row"><span><i></i>Zadnja izmjena</span><b>Danas</b></div><p class="system-status-version">TASKER v2.0 <span>\u00a9 2026</span></p>`
document.querySelector('.sidebar-footer').insertAdjacentElement('beforebegin', systemStatus)

const moduleLink = document.createElement('button')
moduleLink.className = 'nav-link'
moduleLink.dataset.page = 'modules'
moduleLink.innerHTML = '<span>\u2318</span> Modul'
document.querySelector('nav').insertBefore(moduleLink, document.querySelector('[data-page="reports"]'))

const dailyReportLink = document.createElement('button')
dailyReportLink.className = 'nav-link'
dailyReportLink.dataset.page = 'daily-report'
dailyReportLink.innerHTML = '<span>\u25A4</span> Dnevni izve\u0161taj rada'
document.querySelector('nav').insertBefore(dailyReportLink, document.querySelector('[data-page="reports"]'))

const workDiaryLink = document.createElement('button')
workDiaryLink.className = 'nav-link'
workDiaryLink.dataset.page = 'work-diary'
workDiaryLink.innerHTML = '<span>✎</span> Dnevnik rada'
document.querySelector('nav').insertBefore(workDiaryLink, document.querySelector('[data-page="reports"]'))

const workHoursLink = document.createElement('button')
workHoursLink.className = 'nav-link'
workHoursLink.dataset.page = 'work-hours'
workHoursLink.innerHTML = '<span>\u25F7</span> Radni sati'
document.querySelector('nav').insertBefore(workHoursLink, document.querySelector('[data-page="reports"]'))

const monthlyHoursLink = document.createElement('button')
monthlyHoursLink.className = 'nav-link'
monthlyHoursLink.dataset.page = 'monthly-hours'
monthlyHoursLink.innerHTML = '<span>\u25A6</span> Mesecni sati'
document.querySelector('nav').insertBefore(monthlyHoursLink, document.querySelector('[data-page="reports"]'))

const workPlanLink = document.createElement('button')
workPlanLink.className = 'nav-link'
workPlanLink.dataset.page = 'work-plan'
workPlanLink.innerHTML = '<span>\u25C8</span> Plan rada'
document.querySelector('nav').insertBefore(workPlanLink, document.querySelector('[data-page="reports"]'))

const documentsLink = document.createElement('button')
documentsLink.className = 'nav-link'
documentsLink.dataset.page = 'documents'
documentsLink.innerHTML = '<span>\u25A3</span> Dokumentacija'
document.querySelector('nav').insertBefore(documentsLink, document.querySelector('[data-page="reports"]'))

const photosLink = document.createElement('button')
photosLink.className = 'nav-link'
photosLink.dataset.page = 'photos'
photosLink.innerHTML = '<span>▧</span> Slike'
document.querySelector('nav').insertBefore(photosLink, documentsLink)

const navOrderStorage = 'tasker.nav-order'
const navLabels = {
  dashboard: 'Početna',
  'control-center': 'Kontrolni centar',
  materials: 'Materijal',
  employees: 'Zaposleni',
  orders: 'Narudžbine',
  modules: 'Modul',
  'daily-report': 'Dnevni izveštaj rada',
  'work-diary': 'Dnevnik rada',
  'work-hours': 'Radni sati',
  'monthly-hours': 'Mesečni sati',
  'work-plan': 'Plan rada',
  photos: 'Slike',
  documents: 'Dokumentacija',
  reports: 'Izveštaji'
}
const mainNav = document.querySelector('nav')
const currentNavPages = () => Array.from(mainNav.querySelectorAll('.nav-link[data-page]')).map((button) => button.dataset.page)
const loadNavOrder = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(navOrderStorage) || '[]')
    const available = currentNavPages()
    const merged = [...saved.filter((page) => available.includes(page)), ...available.filter((page) => !saved.includes(page))]
    if (!saved.includes('control-center')) {
      const currentIndex = merged.indexOf('control-center')
      if (currentIndex >= 0) merged.splice(currentIndex, 1)
      const dashboardIndex = merged.indexOf('dashboard')
      merged.splice(dashboardIndex >= 0 ? dashboardIndex + 1 : 0, 0, 'control-center')
    }
    return merged
  } catch {
    return currentNavPages()
  }
}
let navOrder = loadNavOrder()
const applyNavOrder = () => {
  navOrder.forEach((page) => {
    const button = mainNav.querySelector(`[data-page="${page}"]`)
    if (button) mainNav.appendChild(button)
  })
}
applyNavOrder()

const navOrganizerButton = document.createElement('button')
navOrganizerButton.type = 'button'
navOrganizerButton.className = 'nav-organizer-toggle'
navOrganizerButton.innerHTML = '<span>↕</span> Rasporedi meni'
const sidebarFooter = document.querySelector('.sidebar-footer')
sidebarFooter.insertBefore(navOrganizerButton, sidebarFooter.querySelector('[data-page="settings"]'))
const navOrganizer = document.createElement('section')
navOrganizer.className = 'nav-organizer'
navOrganizer.hidden = true
navOrganizer.innerHTML = '<header><b>Redosled menija</b><button type="button" aria-label="Zatvori">×</button></header><div class="nav-organizer-list"></div><p>Strelicama pomerite karticu gore ili dole.</p>'
navOrganizerButton.insertAdjacentElement('afterend', navOrganizer)
const navOrganizerStyle = document.createElement('style')
navOrganizerStyle.textContent = `
  .sidebar nav .nav-link{border:1px solid rgba(220,168,53,.22);background:linear-gradient(105deg,rgba(92,67,18,.18),rgba(24,37,58,.08));color:#d8c489;box-shadow:inset 2px 0 0 rgba(235,184,65,.42),0 0 9px rgba(184,127,24,.06);transition:color .18s,border-color .18s,background .18s,box-shadow .18s,transform .18s}
  .sidebar nav .nav-link:hover{border-color:#5dff8b;background:linear-gradient(105deg,rgba(31,112,57,.38),rgba(18,48,39,.3));color:#9dffb9;box-shadow:inset 3px 0 0 #58ff87,0 0 13px rgba(73,255,126,.28),0 0 24px rgba(73,255,126,.1);transform:translateX(2px);text-shadow:0 0 8px rgba(80,255,130,.45)}
  .sidebar nav .nav-link.active{border-color:#d5a83c;background:linear-gradient(105deg,rgba(119,81,15,.38),rgba(38,48,57,.24));color:#ffe09a;box-shadow:inset 3px 0 0 #f0ba43,0 0 12px rgba(226,169,53,.18)}
  .sidebar nav .nav-link.active:hover{border-color:#65ff91;color:#adffc2;box-shadow:inset 3px 0 0 #58ff87,0 0 15px rgba(73,255,126,.34)}
  .nav-organizer-toggle{display:flex;align-items:center;justify-content:center;gap:8px;width:calc(100% - 24px);margin:0 12px 8px;padding:11px;border:1px solid #2b4158;border-radius:10px;background:#132238;color:#70ff98;font-size:11px;font-weight:900;cursor:pointer;box-shadow:none;text-shadow:0 0 7px rgba(73,255,126,.72),0 0 13px rgba(73,255,126,.28)}
  .nav-organizer-toggle:hover,.nav-organizer-toggle.active{border-color:#354f69;color:#a2ffba;background:#162940;box-shadow:none;text-shadow:0 0 8px rgba(73,255,126,.9),0 0 15px rgba(73,255,126,.4)}
  .nav-organizer{position:absolute;z-index:40;left:12px;right:12px;top:82px;max-height:calc(100vh - 105px);overflow:auto;padding:12px;border:1px solid #3d617f;border-radius:13px;background:#101d30;box-shadow:0 18px 45px rgba(0,0,0,.48)}
  .nav-organizer[hidden]{display:none}
  .nav-organizer header{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;color:#ecf7ff;font-size:13px}
  .nav-organizer header button{width:30px;height:30px;border:1px solid #3a5572;border-radius:8px;background:#172a43;color:#bcd2e7;font-size:18px;cursor:pointer}
  .nav-organizer-list{display:grid;gap:6px}
  .nav-organizer-row{display:grid;grid-template-columns:1fr 34px 34px;align-items:center;gap:5px;padding:7px 8px;border:1px solid #263f5b;border-radius:9px;background:#14263e}
  .nav-organizer-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#dcecff;font-size:11px;font-weight:700}
  .nav-organizer-row button{height:31px;border:1px solid #3a5876;border-radius:7px;background:#1a3452;color:#82dcff;font-size:16px;cursor:pointer}
  .nav-organizer-row button:disabled{opacity:.25;cursor:default}
  .nav-organizer>p{margin:10px 2px 0;color:#7892aa;font-size:9px;text-align:center}
`
document.head.appendChild(navOrganizerStyle)
const renderNavOrganizer = () => {
  navOrganizer.querySelector('.nav-organizer-list').innerHTML = navOrder.map((page, index) => `<div class="nav-organizer-row" data-nav-page="${page}"><span>${esc(navLabels[page] || page)}</span><button type="button" data-nav-up="${page}" ${index === 0 ? 'disabled' : ''} aria-label="Pomeri gore">↑</button><button type="button" data-nav-down="${page}" ${index === navOrder.length - 1 ? 'disabled' : ''} aria-label="Pomeri dole">↓</button></div>`).join('')
}
const closeNavOrganizer = () => {
  navOrganizer.hidden = true
  navOrganizerButton.classList.remove('active')
}
navOrganizerButton.addEventListener('click', () => {
  navOrganizer.hidden = !navOrganizer.hidden
  navOrganizerButton.classList.toggle('active', !navOrganizer.hidden)
  if (!navOrganizer.hidden) renderNavOrganizer()
})
navOrganizer.querySelector('header button').addEventListener('click', closeNavOrganizer)
navOrganizer.addEventListener('click', (event) => {
  const up = event.target.closest('[data-nav-up]')
  const down = event.target.closest('[data-nav-down]')
  const page = up?.dataset.navUp || down?.dataset.navDown
  if (!page) return
  const index = navOrder.indexOf(page)
  const target = up ? index - 1 : index + 1
  if (target < 0 || target >= navOrder.length) return
  ;[navOrder[index], navOrder[target]] = [navOrder[target], navOrder[index]]
  localStorage.setItem(navOrderStorage, JSON.stringify(navOrder))
  applyNavOrder()
  renderNavOrganizer()
})

const content = document.querySelector('#content')
const breadcrumb = document.querySelector('#breadcrumb')
const topbarMeta = document.querySelector('.topbar > div:first-child')
const topbarSlogan = document.createElement('div')
topbarSlogan.className = 'topbar-slogan'
topbarSlogan.setAttribute('aria-label', 'Tasker slogan')
topbarSlogan.innerHTML = '<div class="topbar-slogan-track"><strong>TASKER</strong></div>'
document.querySelector('.topbar-profile-actions').insertAdjacentElement('beforebegin', topbarSlogan)
const topbarSloganStyle = document.createElement('style')
topbarSloganStyle.textContent = `
  .topbar-slogan{position:relative;flex:1;min-width:120px;height:42px;margin:0 24px;overflow:hidden;display:flex;align-items:center;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
  .topbar-slogan-track{position:absolute;left:0;display:flex;align-items:center;gap:14px;width:max-content;white-space:nowrap;color:#78ff9d;font-size:24px;font-weight:900;letter-spacing:.16em;text-shadow:0 0 8px rgba(73,255,126,.9),0 0 22px rgba(73,255,126,.42);animation:tasker-slogan-move 42s linear infinite}
  .topbar-slogan-track strong{color:#8fffaa;font-size:24px;letter-spacing:.22em}
  @keyframes tasker-slogan-move{0%{transform:translateX(-100%)}100%{transform:translateX(calc(100vw - 430px))}}
  @media(max-width:900px){.topbar-slogan{margin:0 10px}.topbar-slogan-track{font-size:19px}.topbar-slogan-track strong{font-size:19px}@keyframes tasker-slogan-move{0%{transform:translateX(-100%)}100%{transform:translateX(65vw)}}}
  @media(max-width:620px){.topbar-slogan{display:none}}
  @media(prefers-reduced-motion:reduce){.topbar-slogan-track{animation-duration:38s}}
`
document.head.appendChild(topbarSloganStyle)
const greetingFor = (date) => date.getHours() < 12 ? 'Dobro jutro' : date.getHours() < 18 ? 'Dobar dan' : 'Dobro ve\u010De'
const firstName = () => state.settings.userName.trim().split(/\s+/)[0] || 'Korisniče'
const initialsFor = (name) => name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'T'

const updateClock = () => {
  const now = new Date()
  const date = new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  const time = new Intl.DateTimeFormat('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now)
  const hourAngle = ((now.getHours() % 12) * 30) + (now.getMinutes() * .5)
  const minuteAngle = now.getMinutes() * 6
  const secondAngle = now.getSeconds() * 6
  topbarMeta.innerHTML = `<span id="breadcrumb" hidden>Po\u010Detna</span><div class="topbar-clock"><span class="calendar-icon" aria-hidden="true">&#128197;</span><span class="clock-date">${date.charAt(0).toLocaleUpperCase('sr')}${date.slice(1)}.</span><span class="clock-divider" aria-hidden="true"></span><span class="analog-clock" aria-hidden="true"><i class="clock-hour" style="transform:rotate(${hourAngle}deg)"></i><i class="clock-minute" style="transform:rotate(${minuteAngle}deg)"></i><i class="clock-second" style="transform:rotate(${secondAngle}deg)"></i><b></b></span><strong class="digital-clock">${time}</strong></div>`
  const greeting = document.querySelector('#greeting')
  if (greeting) greeting.textContent = `${greetingFor(now)}, ${firstName()}.`
}

updateClock()
setInterval(updateClock, 1000)

const projectDateLabel = (value) => {
  if (!value) return 'Datum nije unesen'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Datum nije unesen'
  return new Intl.DateTimeFormat('hr-HR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

const todayInputValue = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function requestProjectAccess(key, onSuccess) {
  if (hasProjectAccess(key)) { onSuccess(); return }
  document.querySelector('.project-password-modal')?.remove()
  document.body.insertAdjacentHTML('beforeend', `<div class="project-password-modal" role="dialog" aria-modal="true" aria-labelledby="project-password-title"><form class="project-password-dialog" id="project-password-form"><button type="button" class="project-password-close" aria-label="Zatvori">&times;</button><span class="project-password-icon" aria-hidden="true">&#128274;</span><p class="eyebrow">ZA&Scaron;TI&Cacute;ENI PRISTUP</p><h2 id="project-password-title">Unesite lozinku</h2><p>Za otvaranje ovog projekta potrebna je lozinka.</p><label>Lozinka<input id="project-password-input" type="password" inputmode="numeric" autocomplete="current-password" maxlength="20" required autofocus placeholder="****"></label><p class="project-password-error" id="project-password-error" role="alert" hidden>Pogre&scaron;na lozinka. Poku&scaron;ajte ponovno.</p><div class="project-password-actions"><button type="button" class="secondary-btn project-password-close">Odustani</button><button type="submit" class="primary-btn">Otklju&#269;aj projekt</button></div></form></div>`)
  const modal = document.querySelector('.project-password-modal')
  const close = () => modal.remove()
  modal.querySelectorAll('.project-password-close').forEach((button) => button.addEventListener('click', close))
  modal.addEventListener('click', (event) => { if (event.target === modal) close() })
  const form = modal.querySelector('#project-password-form')
  const input = modal.querySelector('#project-password-input')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (input.value !== projectPassword) {
      modal.querySelector('#project-password-error').hidden = false
      input.value = ''
      input.focus()
      return
    }
    grantProjectAccess(key)
    close()
    onSuccess()
  })
  setTimeout(() => input.focus(), 0)
}

const projectCard = (slot) => {
  const project = projectForSlot(slot)
  const slotLabel = String(slot).padStart(2, '0')
  if (!project) return `<button type="button" class="project-card project-card-empty" data-new-project-slot="${slot}" aria-label="Otvori mjesto ${slotLabel} za novi projekt"><span class="empty-project-number">${slotLabel}</span><span class="empty-project-plus">+</span><p>Novi projekt</p><small>Slobodno mjesto</small></button>`
  const name = esc(project.name || 'Novi projekt')
  const location = esc(project.location || 'Lokacija nije unesena')
  const mark = esc((project.name || 'P').trim().charAt(0).toUpperCase() || 'P')
  return `<button type="button" class="project-card project-card-custom" data-open-project-slot="${slot}" aria-label="Otvori projekt ${name}"><span class="empty-project-number">${slotLabel}</span><div class="project-card-top"><span class="project-symbol">${mark}</span><span class="project-status"><i></i> Projekt spremljen</span></div><p class="project-label">PROJEKT</p><h2>${name}</h2><p class="project-description">${location}</p><div class="project-card-footer"><span>${projectDateLabel(project.startDate)}</span><strong>Otvori projekt \u2192</strong></div></button>`
}

function projectsHome() {
  projectOpen = false
  newProjectSlot = null
  document.querySelector('.shell').classList.add('project-home')
  const projectCount = 1 + savedProjects.length
  const projectWord = projectCount === 1 ? 'projekt' : projectCount < 5 ? 'projekta' : 'projekata'
  const waitingProjectCards = Array.from({ length: 5 }, (_, index) => projectCard(index + 2)).join('')
  content.innerHTML = `<section class="project-welcome"><div class="project-welcome-copy"><p class="eyebrow">TASKER \u2022 PORTAL PROJEKATA</p><h1 id="greeting">${greetingFor(new Date())}, ${esc(firstName())}.</h1><p>Organizujte projekte, kontroli\u0161ite materijal, pratite napredak i vodite evidenciju rada. Sve na jednom mestu.</p><p class="project-portal-slogan">Tasker \u2014 Kontrola svakog projekta.</p></div><div class="project-blueprint" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="project-welcome-count"><span>Aktivni projekti</span><b>${projectCount}</b><small>${projectWord}</small></div></section><div class="projects-section-heading"><span></span><h2>Moji projekti</h2><p>Izaberite aktivni projekat ili pripremite mesto za naredni.</p></div><section class="project-grid"><button type="button" class="project-card project-vertiv" id="open-vertiv-project"><span class="project-card-glow" aria-hidden="true"></span><span class="project-card-cover" aria-hidden="true"><i></i><i></i><i></i><i></i></span><div class="project-card-top"><span class="project-symbol">V</span><span class="project-status"><i></i> Aktivan projekat</span></div><p class="project-label">PROJEKAT</p><h2>VERTIV</h2><p class="project-description">Upravljanje materijalom, modulima, zaposlenima i kompletnom evidencijom rada na gradili\u0161tu.</p><div class="project-card-footer"><span>MV \u00B7 MVS \u00B7 RPP</span><strong>Otvori projekat \u2192</strong></div></button>${waitingProjectCards}</section>`
  document.querySelector('#open-vertiv-project').addEventListener('click', () => requestProjectAccess('vertiv', enterVertivProject))
  document.querySelectorAll('[data-new-project-slot]').forEach((card) => card.addEventListener('click', () => requestProjectAccess(`slot-${card.dataset.newProjectSlot}`, () => openNewProject(card.dataset.newProjectSlot))))
  document.querySelectorAll('[data-open-project-slot]').forEach((card) => card.addEventListener('click', () => requestProjectAccess(`slot-${card.dataset.openProjectSlot}`, () => openNewProject(card.dataset.openProjectSlot))))
}

function openNewProject(slot) {
  projectOpen = false
  newProjectSlot = Number(slot)
  const project = projectForSlot(newProjectSlot)
  if (project) {
    showSavedProject(project)
    return
  }
  showNewProjectForm()
}

function showNewProjectForm(project = null) {
  document.querySelector('.shell').classList.add('project-home')
  const slotLabel = String(newProjectSlot).padStart(2, '0')
  content.innerHTML = `<section class="new-project-screen"><section class="new-project-welcome new-project-form-card"><span class="new-project-slot">MJESTO ${slotLabel}</span><p class="eyebrow">TASKER \u2022 NOVI PROJEKT</p><h1>Dobro do\u0161li na novi projekt.</h1><p>Unesite osnovne podatke. Projekt \u0107e ostati na ovom mjestu i mo\u017eete ga otvoriti kad god vam zatreba.</p><form id="new-project-form" class="new-project-form"><label>Naziv projekta<input name="projectName" required maxlength="70" placeholder="npr. Arena Zagreb" value="${esc(project?.name || '')}"></label><label>Lokacija / gradili\u0161te<input name="projectLocation" maxlength="100" placeholder="npr. Zagreb" value="${esc(project?.location || '')}"></label><label>Datum po\u010detka<input name="projectStartDate" type="date" value="${esc(project?.startDate || todayInputValue())}"></label><div class="new-project-form-actions"><button type="submit" class="primary-btn">Sa\u010duvaj projekt</button><button type="button" class="new-project-return" id="back-to-project-list">\u2190 Nazad na projekte</button></div></form></section></section>`
  document.querySelector('#back-to-project-list').addEventListener('click', projectsHome)
  document.querySelector('#new-project-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('projectName') || '').trim()
    if (!name) return
    const savedProject = { slot: newProjectSlot, name, location: String(form.get('projectLocation') || '').trim(), startDate: String(form.get('projectStartDate') || ''), savedAt: new Date().toISOString() }
    savedProjects = [...savedProjects.filter((item) => Number(item.slot) !== newProjectSlot), savedProject]
    saveProjects()
    showSavedProject(savedProject)
  })
}

function showSavedProject(project) {
  document.querySelector('.shell').classList.add('project-home')
  const slotLabel = String(project.slot).padStart(2, '0')
  content.innerHTML = `<section class="new-project-screen"><section class="new-project-welcome new-project-form-card"><span class="new-project-slot">PROJEKT ${slotLabel}</span><p class="eyebrow">TASKER \u2022 PORTAL PROJEKATA</p><h1>Dobro do\u0161li na ${esc(project.name)}.</h1><p>Projekt je spremljen na portalu. Ovdje \u0107e se u sljede\u0107em koraku postaviti njegov zaseban sustav rada.</p><div class="new-project-ready"><article><span>Lokacija</span><strong>${esc(project.location || 'Nije unesena')}</strong></article><article><span>Po\u010detak projekta</span><strong>${projectDateLabel(project.startDate)}</strong></article></div><div class="new-project-detail-actions"><button type="button" class="primary-btn" id="edit-new-project">Uredi podatke</button><button type="button" class="new-project-return" id="back-to-project-list">\u2190 Nazad na projekte</button></div></section></section>`
  document.querySelector('#edit-new-project').addEventListener('click', () => showNewProjectForm(project))
  document.querySelector('#back-to-project-list').addEventListener('click', projectsHome)
}

function enterVertivProject() {
  projectOpen = true
  document.querySelector('.shell').classList.remove('project-home')
  navigate('dashboard')
}

const notificationSeenStorage = 'tasker.notification-seen'
const notificationDayKey = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}
const readNotificationSeen = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(notificationSeenStorage) || '{}')
    return saved.day === notificationDayKey() && Array.isArray(saved.ids) ? saved.ids : []
  } catch { return [] }
}
const saveNotificationSeen = (ids) => localStorage.setItem(notificationSeenStorage, JSON.stringify({ day:notificationDayKey(), ids }))
const notificationMinutes = (time) => {
  const [hour,minute] = String(time || '').split(':').map(Number)
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour*60+minute : 9999
}
const isSmallHardware = (item) => /šraf|sraf|vijak|zakovic|matica|podlošk|podlosk|tipla|anker|spojn|kopč|kopc/i.test(`${item.name} ${item.standard} ${item.category}`)
const taskerNotifications = () => {
  const now = new Date()
  const minutes = now.getHours()*60+now.getMinutes()
  const day = notificationDayKey()
  const items = [
    { id:`${day}-report-0800`, kind:'rok', time:'08:00', title:'Pošalji dnevni izveštaj', text:minutes>=480?'Rok 08:00 je stigao ili je prošao.':'Dnevni izveštaj treba poslati do 08:00.', urgent:minutes>=480 },
    { id:`${day}-people-0830`, kind:'rok', time:'08:30', title:'Pošalji brojno stanje ljudi', text:minutes>=510?'Rok 08:30 je stigao ili je prošao.':'Brojno stanje ljudi treba poslati do 08:30.', urgent:minutes>=510 }
  ]
  state.todos.filter((todo)=>!todo.done && todo.time).forEach((todo)=>{
    const due=notificationMinutes(todo.time)
    items.push({ id:`${day}-todo-${todo.id}-${todo.time}`, kind:'obaveza', time:todo.time, title:todo.text, text:minutes>=due?`Obaveza je zakazana za ${todo.time}.`:`Podsetnik je zakazan za ${todo.time}.`, urgent:minutes>=due })
  })
  materials.forEach((item)=>{
    const stock=Number(item.stock)||0
    const threshold=isSmallHardware(item)?100:10
    if(stock<threshold) items.push({ id:`material-${item.id}-${threshold}`, kind:'materijal', time:'', title:item.name, text:`Na stanju: ${stock} ${item.unit}. Upozorenje ispod ${threshold}.`, urgent:true })
  })
  return items.sort((a,b)=>Number(b.urgent)-Number(a.urgent)||notificationMinutes(a.time)-notificationMinutes(b.time))
}
let taskerBellAudioPending=false
const playTaskerBell = () => {
  try {
    const AudioContextClass=window.AudioContext||window.webkitAudioContext
    if(!AudioContextClass) return
    const ctx=new AudioContextClass()
    const ring=(delay,frequency)=>{
      const oscillator=ctx.createOscillator(), gain=ctx.createGain()
      oscillator.type='sine'; oscillator.frequency.setValueAtTime(frequency,ctx.currentTime+delay)
      gain.gain.setValueAtTime(.0001,ctx.currentTime+delay)
      gain.gain.exponentialRampToValueAtTime(.19,ctx.currentTime+delay+.025)
      gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+delay+.42)
      oscillator.connect(gain); gain.connect(ctx.destination)
      oscillator.start(ctx.currentTime+delay); oscillator.stop(ctx.currentTime+delay+.46)
    }
    ring(0,880); ring(.18,1174); ring(.42,988)
    taskerBellAudioPending=false
    setTimeout(()=>ctx.close(),1200)
  } catch { taskerBellAudioPending=true }
}
const taskerUnreadNotifications = () => {
  const seen=readNotificationSeen()
  return taskerNotifications().filter((item)=>!seen.includes(item.id))
}
const updateTaskerBell = () => {
  const button=document.querySelector('#tasker-notification-bell')
  if(!button) return
  const unread=taskerUnreadNotifications()
  button.classList.toggle('has-alerts',unread.length>0)
  button.querySelector('b').textContent=unread.length
  button.querySelector('b').hidden=!unread.length
  button.title=unread.length?`${unread.length} novih obaveštenja`:'Nema novih obaveštenja'
}
const openTaskerNotifications = () => {
  document.querySelector('#tasker-notification-modal')?.remove()
  const notifications=taskerNotifications()
  const seen=readNotificationSeen()
  document.body.insertAdjacentHTML('beforeend',`<div class="tasker-notification-modal" id="tasker-notification-modal"><section role="dialog" aria-modal="true" aria-label="Obaveštenja i podsetnici"><header><div><span>🔔</span><div><h2>Obaveštenja i podsetnici</h2><p>${notifications.length} aktivnih stavki</p></div></div><button type="button" data-notification-close aria-label="Zatvori">×</button></header><div class="tasker-notification-list">${notifications.length?notifications.map((item)=>`<article class="${item.urgent?'urgent':''} ${seen.includes(item.id)?'seen':''}"><span>${item.kind==='materijal'?'▣':item.kind==='rok'?'⌚':'✓'}</span><div><small>${item.kind.toLocaleUpperCase('sr')}${item.time?` · ${item.time}`:''}</small><b>${esc(item.title)}</b><p>${esc(item.text)}</p></div><em>${seen.includes(item.id)?'Pregledano':'Novo'}</em></article>`).join(''):'<div class="notification-empty">✓ Sve je pod kontrolom. Nema aktivnih upozorenja.</div>'}</div><footer><button type="button" class="secondary-btn" data-notification-close>Zatvori</button><button type="button" class="primary-btn" id="mark-notifications-read">Označi sve kao pregledano</button></footer></section></div>`)
  const modal=document.querySelector('#tasker-notification-modal')
  const close=()=>modal.remove()
  modal.querySelectorAll('[data-notification-close]').forEach((button)=>button.addEventListener('click',close))
  modal.addEventListener('click',(event)=>{if(event.target===modal)close()})
  modal.querySelector('#mark-notifications-read')?.addEventListener('click',()=>{
    saveNotificationSeen(notifications.map((item)=>item.id)); close(); updateTaskerBell()
  })
}
let taskerNotificationTimer
const bindTaskerNotificationCenter = () => {
  const button=document.querySelector('#tasker-notification-bell')
  if(!button) return
  updateTaskerBell()
  button.addEventListener('click',openTaskerNotifications)
  const unread=taskerUnreadNotifications()
  const soundKey=`tasker.notification-sounded.${notificationDayKey()}`
  if(unread.some((item)=>item.urgent)&&!sessionStorage.getItem(soundKey)){
    sessionStorage.setItem(soundKey,'yes')
    taskerBellAudioPending=true
    playTaskerBell()
    if(taskerBellAudioPending) document.addEventListener('pointerdown',playTaskerBell,{once:true})
  }
  clearInterval(taskerNotificationTimer)
  taskerNotificationTimer=setInterval(()=>{
    const before=document.querySelector('#tasker-notification-bell')?.classList.contains('has-alerts')
    updateTaskerBell()
    const urgent=taskerUnreadNotifications().some((item)=>item.urgent)
    if(urgent&&!before) playTaskerBell()
  },30000)
}

const dashboardLayoutStorage='tasker.dashboard-layout'
const defaultDashboardLayout={order:['tasks','modules','overview'],statOrder:['stat-materials','stat-low','stat-empty','stat-orders','stat-employees'],liveOrder:['live-employees','live-materials','live-modules'],sections:['stats','live','search','main'],sizes:{tasks:6,modules:3,overview:3,'stat-materials':3,'stat-low':2,'stat-empty':2,'stat-orders':2,'stat-employees':3,'live-employees':4,'live-materials':4,'live-modules':4},searchWidth:100}
const mergeLayoutOrder=(saved,defaults)=>[...(Array.isArray(saved)?saved:[]).filter((id)=>defaults.includes(id)),...defaults.filter((id)=>!(saved||[]).includes(id))]
const readDashboardLayout=()=>{try{const saved=JSON.parse(localStorage.getItem(dashboardLayoutStorage)||'{}');return{order:mergeLayoutOrder(saved.order,defaultDashboardLayout.order),statOrder:mergeLayoutOrder(saved.statOrder,defaultDashboardLayout.statOrder),liveOrder:mergeLayoutOrder(saved.liveOrder,defaultDashboardLayout.liveOrder),sections:mergeLayoutOrder(saved.sections,defaultDashboardLayout.sections),sizes:{...defaultDashboardLayout.sizes,...(saved.sizes||{})},searchWidth:Number(saved.searchWidth)||100}}catch{return JSON.parse(JSON.stringify(defaultDashboardLayout))}}
const saveDashboardLayout=(layout)=>localStorage.setItem(dashboardLayoutStorage,JSON.stringify(layout))
const applyDashboardLayout=()=>{const layout=readDashboardLayout(),main=document.querySelector('.dashboard-grid'),stats=document.querySelector('.stat-grid'),live=document.querySelector('.dashboard-live-strip'),search=document.querySelector('.tasker-smart-search'),welcome=document.querySelector('.welcome');if(!main||!stats||!live||!search||!welcome)return;layout.order.forEach((id)=>{const card=main.querySelector(`[data-dashboard-card="${id}"]`);if(card){card.style.setProperty('--card-span',layout.sizes[id]||4);card.style.setProperty('--layout-span',layout.sizes[id]||4);main.appendChild(card)}});layout.statOrder.forEach((id)=>{const card=stats.querySelector(`[data-layout-id="${id}"]`);if(card){card.style.setProperty('--layout-span',layout.sizes[id]||3);stats.appendChild(card)}});layout.liveOrder.forEach((id)=>{const card=live.querySelector(`[data-layout-id="${id}"]`);if(card){card.style.setProperty('--layout-span',layout.sizes[id]||4);live.appendChild(card)}});search.style.setProperty('--search-width',`${Math.max(50,Math.min(100,layout.searchWidth))}%`);const sections={stats,live,search,main};let cursor=welcome;layout.sections.forEach((id)=>{const section=sections[id];if(section){cursor.insertAdjacentElement('afterend',section);cursor=section}})}
const dashboardLayoutNames={'stat-materials':'Ukupno artikala','stat-low':'Materijal pri kraju','stat-empty':'Nema na stanju','stat-orders':'Aktivne narudžbine','stat-employees':'Zaposleni danas','live-employees':'Zaposleni danas – brzi pregled','live-materials':'Materijal za proveru','live-modules':'Modul u toku',tasks:'Dnevne obaveze',modules:'Moduli danas',overview:'Brzi pregled'}
const dashboardSizeLabel=(size)=>({2:'Mala',3:'Uža',4:'Srednja',6:'Pola širine',8:'Velika',12:'Cela širina'}[size]||'Srednja')
const dashboardManagerRows=(ids,group,layout)=>ids.map((id,index)=>`<div class="layout-manager-row" data-manager-id="${id}" data-manager-group="${group}"><span><b>${dashboardLayoutNames[id]||id}</b><small>Veličina: ${dashboardSizeLabel(layout.sizes[id])}</small></span><div><button type="button" data-manager-move="-1" ${index===0?'disabled':''}>↑</button><button type="button" data-manager-move="1" ${index===ids.length-1?'disabled':''}>↓</button><button type="button" data-manager-size="-1">−</button><button type="button" data-manager-size="1">＋</button></div></div>`).join('')
const openDashboardLayoutManager=()=>{document.querySelector('#dashboard-layout-manager')?.remove();const layout=readDashboardLayout();document.body.insertAdjacentHTML('beforeend',`<div class="dashboard-layout-manager" id="dashboard-layout-manager"><section role="dialog" aria-modal="true" aria-label="Raspored početnih kartica"><header><div><p class="eyebrow">POČETNA STRANICA</p><h2>Rasporedi kartice</h2><span>Sve komande su ovde. Na početnoj strani ostaje čist prikaz.</span></div><button type="button" data-layout-close>×</button></header><div class="layout-manager-scroll"><article><h3>Polje za pretragu</h3><div class="layout-manager-row search-manager-row"><span><b>Pametna pretraga</b><small>Širina: ${layout.searchWidth}%</small></span><div><button type="button" data-manager-section="-1">↑</button><button type="button" data-manager-section="1">↓</button><button type="button" data-manager-search-size="-1">−</button><button type="button" data-manager-search-size="1">＋</button></div></div></article><article><h3>Pet gornjih kartica</h3>${dashboardManagerRows(layout.statOrder,'stat',layout)}</article><article><h3>Tri kartice brzog pregleda</h3>${dashboardManagerRows(layout.liveOrder,'live',layout)}</article><article><h3>Velike centralne kartice</h3>${dashboardManagerRows(layout.order,'main',layout)}</article></div><footer><button type="button" class="secondary-btn" id="reset-dashboard-layout">Vrati početni raspored</button><button type="button" class="primary-btn" data-layout-close>Sačuvaj i zatvori</button></footer></section></div>`);const modal=document.querySelector('#dashboard-layout-manager'),close=()=>modal.remove(),refresh=()=>{close();applyDashboardLayout();openDashboardLayoutManager()};modal.querySelectorAll('[data-layout-close]').forEach((button)=>button.addEventListener('click',close));modal.addEventListener('click',(event)=>{if(event.target===modal)close()});modal.addEventListener('click',(event)=>{const control=event.target.closest('[data-manager-move],[data-manager-size],[data-manager-section],[data-manager-search-size]');if(!control)return;const current=readDashboardLayout(),row=control.closest('[data-manager-id]');if(control.dataset.managerSection){const index=current.sections.indexOf('search'),target=index+Number(control.dataset.managerSection);if(target>=0&&target<current.sections.length)[current.sections[index],current.sections[target]]=[current.sections[target],current.sections[index]]}else if(control.dataset.managerSearchSize){const widths=[50,70,85,100],index=Math.max(0,widths.indexOf(current.searchWidth)),target=Math.max(0,Math.min(widths.length-1,index+Number(control.dataset.managerSearchSize)));current.searchWidth=widths[target]}else if(row){const id=row.dataset.managerId,group=row.dataset.managerGroup,key=group==='stat'?'statOrder':group==='live'?'liveOrder':'order';if(control.dataset.managerMove){const index=current[key].indexOf(id),target=index+Number(control.dataset.managerMove);if(target>=0&&target<current[key].length)[current[key][index],current[key][target]]=[current[key][target],current[key][index]]}else{const sizes=[2,3,4,6,8,12],index=Math.max(0,sizes.indexOf(Number(current.sizes[id])||4)),target=Math.max(0,Math.min(sizes.length-1,index+Number(control.dataset.managerSize)));current.sizes[id]=sizes[target]}}saveDashboardLayout(current);refresh()});modal.querySelector('#reset-dashboard-layout').addEventListener('click',()=>{if(!confirm('Vratiti početni raspored svih kartica?'))return;saveDashboardLayout(JSON.parse(JSON.stringify(defaultDashboardLayout)));refresh()})}
const bindDashboardLayoutEditor=()=>{const main=document.querySelector('.dashboard-grid'),stats=document.querySelector('.stat-grid'),live=document.querySelector('.dashboard-live-strip'),toggle=document.querySelector('#dashboard-layout-toggle');if(!main||!stats||!live||!toggle)return;content.classList.remove('dashboard-layout-editing');const statIds=defaultDashboardLayout.statOrder,liveIds=defaultDashboardLayout.liveOrder;Array.from(stats.children).forEach((card,index)=>{card.dataset.layoutId=statIds[index];card.dataset.layoutGroup='stat'});Array.from(live.children).forEach((card,index)=>{card.dataset.layoutId=liveIds[index];card.dataset.layoutGroup='live'});main.querySelectorAll('[data-dashboard-card]').forEach((card)=>{card.dataset.layoutId=card.dataset.dashboardCard;card.dataset.layoutGroup='main'});applyDashboardLayout();toggle.innerHTML='⚙ Rasporedi kartice';toggle.addEventListener('click',openDashboardLayoutManager)}
let taskerSearchRun=0
const taskerSearchEntries=async(term)=>{const query=term.toLocaleLowerCase('sr'),matches=(value)=>String(value||'').toLocaleLowerCase('sr').includes(query);const results=[];materials.forEach((item)=>{if(matches(`${item.name} ${item.standard} ${item.supplier} ${item.location}`))results.push({type:'material',id:String(item.id),icon:'▣',group:'Materijal',title:item.name,text:`${item.stock} ${item.unit} · ${item.location}`})});state.employees.forEach((item)=>{if(matches(`${item.name} ${item.role} ${item.phone}`))results.push({type:'employee',id:String(item.id),icon:'☻',group:'Zaposleni',title:item.name,text:item.role})});state.todos.forEach((item)=>{if(matches(item.text))results.push({type:'todo',id:item.id,icon:'✓',group:'Dnevne obaveze',title:item.text,text:item.time?`Podsetnik u ${item.time}`:(item.done?'Završeno':'Aktivno')})});state.orderLines.forEach((item,index)=>{const title=item.name||item.item||item.material||item.description||`Stavka ${index+1}`;if(matches(JSON.stringify(item)))results.push({type:'order',id:String(index),icon:'▤',group:'Narudžbine',title,text:'Otvori narudžbine'})});[{title:'Crteži',text:'Dokumentacija'},{title:'Dnevni izveštaji',text:'Dokumentacija'},{title:'Narudžbine i ponude',text:'Dokumentacija'}].forEach((item,index)=>{if(matches(`${item.title} ${item.text}`))results.push({type:'document',id:String(index),icon:'▧',group:'Dokumenti',title:item.title,text:item.text})});try{const photos=await getTaskerPhotos();photos.forEach((item)=>{const label=`Slika ${taskerPhotoDate(item.createdAt)} ${taskerPhotoTime(item.createdAt)}`;if(matches(label))results.push({type:'photo',id:item.id,icon:'▧',group:'Slike',title:label,text:'Otvori foto arhivu'})})}catch{}return results.slice(0,30)}
const bindTaskerSmartSearch=()=>{const input=document.querySelector('#tasker-smart-search'),results=document.querySelector('#tasker-search-results');if(!input||!results)return;input.addEventListener('input',async()=>{const term=input.value.trim(),run=++taskerSearchRun;if(term.length<2){results.hidden=true;results.innerHTML='';return}results.hidden=false;results.innerHTML='<p class="search-loading">Pretražujem TASKER…</p>';const items=await taskerSearchEntries(term);if(run!==taskerSearchRun)return;results.innerHTML=items.length?items.map((item)=>`<button type="button" data-search-type="${item.type}" data-search-id="${esc(item.id)}"><span>${item.icon}</span><div><small>${item.group}</small><b>${esc(item.title)}</b><p>${esc(item.text)}</p></div><em>Otvori →</em></button>`).join(''):'<p class="search-empty">Nema rezultata za ovu pretragu.</p>'});results.addEventListener('click',(event)=>{const button=event.target.closest('[data-search-type]');if(!button)return;const type=button.dataset.searchType,id=button.dataset.searchId;if(type==='material'){const item=materials.find((entry)=>String(entry.id)===id);if(item)categoryPage(item.category)}else if(type==='employee')navigate('employees');else if(type==='todo')navigate('dashboard');else if(type==='order')navigate('orders');else if(type==='document')navigate('documents');else if(type==='photo')navigate('photos')});input.addEventListener('keydown',(event)=>{if(event.key==='Escape'){input.value='';results.hidden=true}})}
const dashboardChartColors=['#ff3f5f','#65ff8d','#39c8ff','#ffd43b','#ff5fca','#8d7bff','#ff8a3d']
const dashboardWeekDays=()=>Array.from({length:7},(_,index)=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-(6-index));return{date,key:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,label:new Intl.DateTimeFormat('sr-Latn-RS',{weekday:'short'}).format(date).replace('.','')}})
const dashboardConsumptionByDay=()=>{const totals={};moduleTypes.forEach((type)=>Object.values(moduleData(type).units||{}).forEach((unit)=>(unit.consumption||[]).forEach((entry)=>{if(entry.date)totals[entry.date]=(totals[entry.date]||0)+(Number(entry.quantity)||0)})));return totals}
const dashboardAttendanceByDay=()=>{const totals={};Object.entries(state.attendance||{}).forEach(([day,attendance])=>{totals[day]=state.employees.filter((employee)=>attendance?.[employee.id]!==false).length});return totals}
const renderDashboardCharts=()=>{const grid=document.querySelector('.dashboard-grid');if(!grid)return;document.querySelector('.dashboard-charts')?.remove();const days=dashboardWeekDays(),consumption=dashboardConsumptionByDay(),attendance=dashboardAttendanceByDay(),consumptionValues=days.map((day)=>consumption[day.key]||0),attendanceValues=days.map((day)=>attendance[day.key]),maxConsumption=Math.max(1,...consumptionValues),maxAttendance=Math.max(1,state.employees.length,...attendanceValues.filter(Number.isFinite)),typeValues=moduleTypes.map((type)=>({label:type.label,value:typeProgress(type),color:type.color})),totalModules=moduleTypes.reduce((sum,type)=>sum+(Number(moduleData(type).count)||0),0),overall=totalModules?Math.round(moduleTypes.reduce((sum,type)=>sum+typeProgress(type)*(Number(moduleData(type).count)||0),0)/totalModules):0,totalUsed=consumptionValues.reduce((sum,value)=>sum+value,0),attendanceRecorded=attendanceValues.filter(Number.isFinite).length;grid.insertAdjacentHTML('afterend',`<section class="dashboard-charts"><article class="dashboard-chart-card module-chart"><header><div><p class="eyebrow">NAPREDAK</p><h2>Moduli</h2></div><span>Ukupni napredak</span></header><div class="module-chart-body"><div class="neon-donut" style="--progress:${overall}"><div><strong>${overall}%</strong><small>završeno</small></div></div><div class="module-chart-legend">${typeValues.map((type)=>`<div><span><i style="background:${type.color};box-shadow:0 0 10px ${type.color}"></i><b>${type.label}</b></span><em>${type.value}%</em><u><i style="width:${type.value}%;background:${type.color};box-shadow:0 0 9px ${type.color}"></i></u></div>`).join('')}</div></div></article><article class="dashboard-chart-card consumption-chart"><header><div><p class="eyebrow">OVA NEDELJA</p><h2>Potrošnja materijala</h2></div><strong>${totalUsed}</strong></header><div class="neon-bar-chart">${days.map((day,index)=>`<div class="neon-bar-column"><span>${consumptionValues[index]||''}</span><i style="height:${Math.max(consumptionValues[index]?10:3,consumptionValues[index]/maxConsumption*100)}%;--bar-color:${dashboardChartColors[index]}"></i><small>${day.label}</small></div>`).join('')}</div><footer><i></i><span>Evidentirana potrošnja kroz module</span></footer></article><article class="dashboard-chart-card attendance-chart"><header><div><p class="eyebrow">PRISUTNOST</p><h2>Ljudi po danima</h2></div><strong>${attendanceRecorded}/7</strong></header><div class="attendance-scale">${days.map((day,index)=>{const value=attendanceValues[index];return`<div><small>${day.label}</small><span><i style="width:${Number.isFinite(value)?Math.max(5,value/maxAttendance*100):2}%;--scale-color:${dashboardChartColors[(index+1)%dashboardChartColors.length]}"></i></span><b>${Number.isFinite(value)?value:'—'}</b></div>`}).join('')}</div><footer><span>Upisani dani ove nedelje</span><b>${attendanceRecorded}</b></footer></article></section>`)}
function dashboard() {
  const done = state.todos.filter((todo) => todo.done).length
  const activeEmployees = state.employees.filter((employee) => employee.active !== false).length
  const inactiveEmployees = state.employees.length - activeEmployees
  const activeModuleUnits = moduleTypes.flatMap((type) => Object.values(moduleData(type).units).map((unit) => ({ type, unit }))).filter(({ unit }) => Number(unit.progress) > 0 && Number(unit.progress) < 100)
  const highlightedModule = activeModuleUnits[0]
  const moduleRows = moduleTypes.map((type) => {
    const progress = typeProgress(type)
    const count = Number(moduleData(type).count) || 0
    return `<button class="module-today-row" data-module-type="${type.id}"><span class="module-today-name"><b>${type.label}</b><small>${count} modula</small></span><span class="module-today-progress"><i><em style="width:${progress}%"></em></i><strong>${progress}%</strong></span></button>`
  }).join('')
  content.innerHTML = `<style id="dashboard-compact-layout">#content .dashboard-grid{grid-template-columns:minmax(0,1.12fr) minmax(250px,.84fr) minmax(290px,.9fr);gap:22px;align-items:stretch}#content .modules-today-panel{display:flex;flex-direction:column}#content .modules-today-panel .panel-heading{margin-bottom:9px}#content .modules-today-panel .panel-heading p{max-width:190px}.module-today-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 0;border:0;border-top:1px solid var(--line);background:transparent;color:var(--text);text-align:left;cursor:pointer}.module-today-row:hover .module-today-name b{color:var(--blue)}.module-today-name{display:grid;gap:3px}.module-today-name b{font-size:13px}.module-today-name small{color:var(--muted);font-size:11px}.module-today-progress{display:flex;align-items:center;gap:8px}.module-today-progress i{display:block;width:64px;height:7px;overflow:hidden;border-radius:99px;background:#0e1b30}.module-today-progress i em{display:block;height:100%;border-radius:inherit;background:var(--blue)}.module-today-progress strong{min-width:31px;text-align:right;color:#7bd8ff;font-size:13px}.modules-today-link{margin-top:auto;padding-top:13px;border:0;background:transparent;color:#82dcfb;font-size:12px;font-weight:700;text-align:left;cursor:pointer}@media(max-width:1180px){#content .dashboard-grid{grid-template-columns:minmax(0,1.12fr) minmax(270px,.88fr)}#content .modules-today-panel{grid-column:1/2}#content .dashboard-grid>article:last-child{grid-column:2;grid-row:1/3}}@media(max-width:1050px){#content .dashboard-grid{grid-template-columns:1fr}#content .modules-today-panel,#content .dashboard-grid>article:last-child{grid-column:auto;grid-row:auto}}</style><section class="welcome"><div><p class="eyebrow">Kontrolna tabla</p><h1 id="greeting">${greetingFor(new Date())}, ${esc(firstName())}.</h1><p>Ovo je pregled stanja magacina i dana\u0161njih obaveza.</p></div><div class="welcome-actions"><button type="button" class="tasker-notification-bell" id="tasker-notification-bell" aria-label="Otvori obaveštenja"><span>🔔</span><b hidden>0</b><small>Obaveštenja</small></button><button class="primary-btn" data-page="materials">Pregledaj materijal \u2192</button></div></section><section class="stat-grid"><article><span class="stat-icon blue">\u25A6</span><p>Ukupno artikala</p><strong>${materials.length}</strong><small>u 12 kategorija</small></article><article><span class="stat-icon amber">!</span><p>Materijal pri kraju</p><strong>${low}</strong><small>zahteva proveru</small></article><article><span class="stat-icon red">\u00D7</span><p>Nema na stanju</p><strong>${noStock}</strong><small>potrebna narud\u017Ebina</small></article><article><span class="stat-icon green">\u25A4</span><p>Aktivne narud\u017Ebine</p><strong>0</strong><small>nema otvorenih</small></article><button class="employee-overview" data-page="employees" title="Otvori zaposlene"><span class="stat-icon employee-icon">\u263B</span><p>Zaposleni danas</p><strong>${activeEmployees}</strong><small><b>${activeEmployees} aktivnih</b><i>${inactiveEmployees} neaktivnih</i></small><em>Otvori pregled \u2192</em></button></section><section class="dashboard-grid"><article class="panel" data-dashboard-card="tasks"><header class="panel-heading"><div><h2>Dnevne obaveze</h2><p>Organizujte zadatke za danas.</p></div><span>${done}/${state.todos.length} zavr\u0161eno</span></header><form id="add-form" class="add-form"><input id="new-todo" maxlength="200" placeholder="Dodajte novu obavezu\u2026"><input id="new-todo-time" type="time" aria-label="Vreme podsetnika"><button aria-label="Dodaj obavezu">+</button></form><div class="filters" id="filters"><button data-filter="all">Sve</button><button data-filter="active">Aktivne</button><button data-filter="done">Zavr\u0161ene</button></div><ul class="todo-list" id="todo-list"></ul><button id="clear-done" class="clear-btn">Obri\u0161i zavr\u0161ene</button></article><article class="panel modules-today-panel" data-dashboard-card="modules"><header class="panel-heading"><div><h2>Moduli danas</h2><p>Brz pregled napretka po tipu modula.</p></div></header>${moduleRows}<button class="modules-today-link" id="open-dashboard-modules">Otvori kontrolnu tablu modula \u2192</button></article><article class="panel" data-dashboard-card="overview"><header class="panel-heading"><div><h2>Brzi pregled</h2><p>Najva\u017Enije informacije iz magacina.</p></div></header><div class="activity"><span class="blue">\u25A6</span><div><b>\u0160rafovska roba</b><p>3.220 komada na stanju</p></div></div><div class="activity"><span class="amber">!</span><div><b>Zakovice pri kraju</b><p>850 kom \u00B7 minimum 1.000</p></div></div><div class="activity"><span class="green">\u2713</span><div><b>Plywood 18 mm</b><p>152 plo\u010De na stanju</p></div></div></article></section>`
  content.insertAdjacentHTML('afterbegin', `<style id="live-strip-style">.dashboard-live-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:-8px 0 23px}.live-item{display:flex;align-items:center;gap:11px;padding:12px 14px;border:1px solid var(--line);border-radius:13px;background:linear-gradient(145deg,#172b45,#132239);color:var(--text);text-align:left;cursor:pointer;transition:.18s}.live-item:hover{transform:translateY(-2px);border-color:#4a7898;box-shadow:0 12px 22px rgba(0,0,0,.16)}.live-item>span{display:grid;place-items:center;width:29px;height:29px;border-radius:9px;font-size:15px;font-weight:900}.live-item div{display:grid;gap:3px;min-width:0}.live-item small{color:var(--muted);font-size:10px;font-weight:700}.live-item b{overflow:hidden;font-size:12px;white-space:nowrap;text-overflow:ellipsis}.live-item em{margin-left:auto;color:#83dcff;font-size:11px;font-style:normal;font-weight:800;white-space:nowrap}.live-green>span{background:#194833;color:#80f1bd}.live-amber>span{background:#503e18;color:#ffd768}.live-blue>span{background:#174d73;color:#6ed9ff}@media(max-width:850px){.dashboard-live-strip{grid-template-columns:1fr}.live-item{min-height:56px}}@media(max-width:520px){.dashboard-live-strip{gap:8px;margin-top:0}.live-item{padding:11px}.live-item em{display:none}}</style>`)
  document.querySelector('.stat-grid').insertAdjacentHTML('afterend', `<section class="dashboard-live-strip"><button class="live-item live-green" data-live-page="employees"><span>●</span><div><small>Zaposleni danas</small><b>${activeEmployees} aktivnih</b></div><em>Otvori →</em></button><button class="live-item live-amber" data-live-page="materials-low"><span>!</span><div><small>Materijal za proveru</small><b>${low ? `${low} ${low === 1 ? 'stavka' : 'stavke'}` : 'Sve je na stanju'}</b></div><em>Otvori →</em></button><button class="live-item live-blue" data-live-page="modules"><span>⌁</span><div><small>Modul u toku</small><b>${highlightedModule ? `${highlightedModule.unit.id} · ${highlightedModule.unit.progress}%` : 'Nema modula u toku'}</b></div><em>Otvori →</em></button></section>`)
  document.querySelector('.dashboard-live-strip').addEventListener('click', (event) => { const button = event.target.closest('[data-live-page]'); if (!button) return; if (button.dataset.livePage === 'employees') navigate('employees'); if (button.dataset.livePage === 'materials-low') materialStatusPage('low'); if (button.dataset.livePage === 'modules') moduleDashboardPage() })
  document.querySelector('.dashboard-live-strip').insertAdjacentHTML('afterend', `<section class="tasker-smart-search"><div class="tasker-search-box"><span>⌕</span><input id="tasker-smart-search" autocomplete="off" placeholder="Pretraži materijal, zaposlenog, obavezu, narudžbinu, dokument ili sliku…"><button type="button" id="dashboard-layout-toggle">↔ Rasporedi kartice</button></div><div class="tasker-search-results" id="tasker-search-results" hidden></div></section>`)
  bindTaskerSmartSearch()
  bindDashboardLayoutEditor()
  bindTodos()
  bindTaskerNotificationCenter()
  document.querySelector('#open-dashboard-modules')?.addEventListener('click', moduleDashboardPage)
  document.querySelectorAll('.module-today-row').forEach((button) => button.addEventListener('click', () => moduleTypePage(button.dataset.moduleType)))
  const dashboardActions = { 'stat-materials': () => navigate('materials'), 'stat-low': () => materialStatusPage('low'), 'stat-empty': () => materialStatusPage('empty'), 'stat-orders': () => navigate('orders') }
  document.querySelectorAll('.stat-grid > article').forEach((card) => {
    const action = dashboardActions[card.dataset.layoutId]
    if (!action) return
    card.tabIndex = 0
    card.setAttribute('role', 'button')
    card.title = 'Otvori pregled'
    card.style.cursor = 'pointer'
    card.addEventListener('click', action)
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action() } })
  })
  renderDashboardCharts()
}

function showTodos() {
  const list = document.querySelector('#todo-list')
  const data = state.filter === 'active' ? state.todos.filter((todo) => !todo.done) : state.filter === 'done' ? state.todos.filter((todo) => todo.done) : state.todos
  document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === state.filter))
  list.innerHTML = data.length ? data.map((todo) => `<li data-id="${todo.id}" class="todo ${todo.done ? 'done' : ''}"><button class="check">${todo.done ? '\u2713' : ''}</button><span>${esc(todo.text)}${todo.time?`<small class="todo-reminder-time">🔔 ${esc(todo.time)}</small>`:''}</span><button class="delete">\u00D7</button></li>`).join('') : '<li class="task-empty">Nema obaveza za ovaj prikaz.</li>'
}

function bindTodos() {
  showTodos()
  document.querySelector('#add-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const input = document.querySelector('#new-todo')
    const timeInput = document.querySelector('#new-todo-time')
    if (!input.value.trim()) return
    state.todos.unshift({ id: String(Date.now()), text: input.value.trim(), time: timeInput?.value || '', done: false })
    input.value = ''
    if (timeInput) timeInput.value = ''
    save()
    showTodos()
    updateTaskerBell()
  })

  document.querySelector('#filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]')
    if (!button) return
    state.filter = button.dataset.filter
    save()
    showTodos()
  })

  document.querySelector('#todo-list').addEventListener('click', (event) => {
    const row = event.target.closest('[data-id]')
    if (!row) return
    const todo = state.todos.find((item) => item.id === row.dataset.id)
    if (event.target.closest('.check')) todo.done = !todo.done
    if (event.target.closest('.delete')) state.todos = state.todos.filter((item) => item !== todo)
    save()
    showTodos()
    updateTaskerBell()
  })

  document.querySelector('#clear-done').addEventListener('click', () => {
    state.todos = state.todos.filter((todo) => !todo.done)
    save()
    showTodos()
  })
}

function materialsPage() {
  content.innerHTML = renderMaterials()
  document.querySelector('#category-grid').addEventListener('click', (event) => {
    const remove = event.target.closest('[data-delete-category]')
    if (remove) {
      const category = categories.find((entry) => entry.id === remove.dataset.deleteCategory)
      if (!category || !confirm(`Da li \u017Eelite potpuno da obri\u0161ete kategoriju \u201E${category.name}\u201C i sve artikle u njoj?`)) return
      for (let index = materials.length - 1; index >= 0; index -= 1) if (materials[index].category === category.id) materials.splice(index, 1)
      categories.splice(categories.indexOf(category), 1)
      saveInventory()
      saveCategories()
      materialsPage()
      return
    }

    const card = event.target.closest('[data-category]')
    if (card) categoryPage(card.dataset.category)
  })

  document.querySelector('#category-search').addEventListener('input', (event) => {
    const term = event.target.value.toLocaleLowerCase('sr')
    document.querySelectorAll('.category-card').forEach((card) => card.hidden = !card.textContent.toLocaleLowerCase('sr').includes(term))
  })
}

function categoryPage(id) {
  state.currentCategory = id
  content.innerHTML = renderCategory(id)
  document.querySelector('[data-back]').addEventListener('click', materialsPage)
  document.querySelector('#material-search').addEventListener('input', (event) => {
    const term = event.target.value.toLocaleLowerCase('sr')
    document.querySelector('#inventory-list').innerHTML = renderItems(materials.filter((item) => item.category === state.currentCategory && `${item.name} ${item.standard} ${item.location}`.toLocaleLowerCase('sr').includes(term)))
  })
}

function materialStatusPage(status) {
  const config = status === 'empty'
    ? { title: 'Nema na stanju', text: 'Artikli koji trenutno nisu dostupni u magacinu.', matches: (item) => item.stock <= 0 }
    : { title: 'Materijal pri kraju', text: 'Artikli koje treba proveriti ili dopuniti.', matches: (item) => item.stock > 0 && item.stock <= item.minStock }
  const listedItems = materials.filter(config.matches)
  content.innerHTML = `<section class="page-heading"><div><button class="back-btn" id="back-to-materials">&larr; Materijal</button><p class="eyebrow">Magacin / pregled</p><h1>${config.title}</h1><p>${config.text}</p></div><button class="primary-btn add-material">+ Dodaj materijal</button></section><label class="search-field"><span>&#8981;</span><input id="status-material-search" type="search" placeholder="Pretrazi materijal..."></label><section id="status-inventory-list" class="inventory-list">${renderItems(listedItems)}</section>`
  document.querySelector('#back-to-materials').addEventListener('click', materialsPage)
  document.querySelector('#status-material-search').addEventListener('input', (event) => {
    const term = event.target.value.toLocaleLowerCase('sr')
    const filtered = materials.filter(config.matches).filter((item) => `${item.name} ${item.standard} ${item.location}`.toLocaleLowerCase('sr').includes(term))
    document.querySelector('#status-inventory-list').innerHTML = renderItems(filtered)
  })
}

function employeesPage() {
  content.innerHTML = `<section class="page-heading employee-heading"><div><p class="eyebrow">Tim i organizacija</p><h1>Zaposleni</h1><p>Pregled radnika, pozicija i telefona.</p></div><div class="employee-heading-actions"><span class="employee-count">${state.employees.length} zaposlenih</span><button class="primary-btn" id="add-employee">+ Dodaj zaposlenog</button></div></section><section class="employee-tools"><div class="employee-search"><span>\u2315</span><input id="employee-search" placeholder="Pretrazi zaposlenog..."></div><span>Aktivni zaposleni</span></section><section class="employee-grid">${state.employees.map((employee) => { const initials = employee.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(); const active = employee.active !== false; return `<article class="employee-card" data-employee="${employee.name.toLocaleLowerCase('sr')}"><header><span class="employee-avatar">${initials}</span><div><h2>${esc(employee.name)}</h2><p>${esc(employee.role)}</p></div><b class="employee-status ${active ? 'active' : 'inactive'}">${active ? 'AKTIVAN' : 'NEAKTIVAN'}</b></header><div class="employee-details"><p><span>\u25C9</span> Pozicija: <strong>${esc(employee.role)}</strong></p><p><span>\u260E</span> Telefon: <strong>${esc(employee.phone)}</strong></p></div><div class="employee-card-actions"><button class="employee-edit" data-edit-employee="${employee.id}">Izmeni</button><button class="employee-delete" data-delete-employee="${employee.id}" title="Obrisi zaposlenog">\u00D7</button></div></article>` }).join('')}</section>`

  document.querySelector('#employee-search').addEventListener('input', (event) => {
    const term = event.target.value.toLocaleLowerCase('sr')
    document.querySelectorAll('[data-employee]').forEach((card) => { card.hidden = !card.textContent.toLocaleLowerCase('sr').includes(term) })
  })

  document.querySelector('#add-employee').addEventListener('click', showAddEmployee)
  document.querySelector('.employee-grid').addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-employee]')
    if (edit) { showEditEmployee(Number(edit.dataset.editEmployee)); return }
    const remove = event.target.closest('[data-delete-employee]')
    if (!remove) return
    const employee = state.employees.find((entry) => entry.id === Number(remove.dataset.deleteEmployee))
    if (!employee || !confirm(`Da li zelite da obrisete zaposlenog ${employee.name}?`)) return
    state.employees = state.employees.filter((entry) => entry !== employee)
    saveEmployees()
    employeesPage()
  })
}

function showEditEmployee(id) {
  const employee = state.employees.find((entry) => entry.id === id)
  if (!employee) return
  document.querySelector('.material-modal')?.remove()
  document.body.insertAdjacentHTML('beforeend', `<div class="material-modal" role="dialog" aria-modal="true"><form class="material-dialog material-form" id="employee-edit-form"><button type="button" class="modal-close" aria-label="Zatvori">\u00D7</button><p class="eyebrow">Podaci zaposlenog</p><h2>Izmeni zaposlenog</h2><p class="material-standard">Promenite podatke i sacuvajte izmene.</p><div class="form-grid"><label>Ime i prezime<input name="name" required value="${esc(employee.name)}"></label><label>Pozicija<input name="role" required value="${esc(employee.role)}"></label><label>Telefon<input name="phone" required value="${esc(employee.phone)}"></label><label>Status<select name="active"><option value="true" ${employee.active !== false ? 'selected' : ''}>Aktivan</option><option value="false" ${employee.active === false ? 'selected' : ''}>Neaktivan</option></select></label></div><div class="detail-actions"><button type="button" class="secondary-btn modal-close">Otkazi</button><button class="primary-btn">Sacuvaj izmene</button></div></form></div>`)
  document.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', () => document.querySelector('.material-modal')?.remove()))
  document.querySelector('#employee-edit-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    employee.name = data.get('name').trim()
    employee.role = data.get('role').trim()
    employee.phone = data.get('phone').trim() || '---'
    employee.active = data.get('active') === 'true'
    saveEmployees()
    document.querySelector('.material-modal')?.remove()
    employeesPage()
  })
}

function showAddEmployee() {
  document.querySelector('.material-modal')?.remove()
  document.body.insertAdjacentHTML('beforeend', `<div class="material-modal" role="dialog" aria-modal="true"><form class="material-dialog material-form" id="employee-form"><button type="button" class="modal-close" aria-label="Zatvori">\u00D7</button><p class="eyebrow">Novi clan tima</p><h2>Dodaj zaposlenog</h2><p class="material-standard">Unesite osnovne podatke o zaposlenom.</p><div class="form-grid"><label>Ime i prezime<input name="name" required placeholder="npr. Marko Markovic"></label><label>Pozicija<input name="role" required placeholder="npr. Radnik"></label><label>Telefon<input name="phone" required placeholder="npr. 099 123 4567"></label></div><div class="detail-actions"><button type="button" class="secondary-btn modal-close">Otkazi</button><button class="primary-btn">Sacuvaj zaposlenog</button></div></form></div>`)
  document.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', () => document.querySelector('.material-modal')?.remove()))
  document.querySelector('#employee-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    state.employees.push({ id: Date.now(), name: data.get('name').trim(), role: data.get('role').trim(), phone: data.get('phone').trim() || '---', active: true })
    saveEmployees()
    document.querySelector('.material-modal')?.remove()
    employeesPage()
  })
}

function normalizeOrderLines() {
  return state.orderLines.map((line) => {
    const material = materials.find((item) => item.id === Number(line.materialId))
    return {
      ...line,
      name: line.name || material?.name || 'Stavka',
      description: line.description ?? material?.standard ?? '',
      quantity: Number(line.quantity) || 1,
      unit: line.unit || material?.unit || 'kom'
    }
  })
}

function orderPdfDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tasker-order-pdfs', 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('pdfs')) request.result.createObjectStore('pdfs', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function storeOrderPdf(entry) {
  const db = await orderPdfDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pdfs', 'readwrite')
    transaction.objectStore('pdfs').put(entry)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
}

async function listOrderPdfs() {
  const db = await orderPdfDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction('pdfs', 'readonly').objectStore('pdfs').getAll()
    request.onsuccess = () => resolve(request.result.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))))
    request.onerror = () => reject(request.error)
  })
}

async function deleteOrderPdf(id) {
  const db = await orderPdfDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pdfs', 'readwrite')
    transaction.objectStore('pdfs').delete(id)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
}


function downloadTaskerPdf(entry) {
  const url = URL.createObjectURL(entry.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = entry.fileName || 'tasker-dokument.pdf'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

async function shareTaskerPdf(entry, title, text) {
  const file = new File([entry.blob], entry.fileName || 'tasker-dokument.pdf', { type: 'application/pdf' })
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ title, text, files: [file] })
      return
    }
    downloadTaskerPdf(entry)
    alert('PDF je preuzet. Dodajte ga ručno u mail ili WhatsApp poruku.')
  } catch (error) {
    if (error?.name !== 'AbortError') {
      downloadTaskerPdf(entry)
      alert('Direktno slanje nije dostupno, zato je PDF preuzet na uređaj.')
    }
  }
}

function openTaskerPdfViewer(entry, title = 'TASKER PDF dokument') {
  document.querySelector('#tasker-pdf-viewer')?.remove()
  const url = URL.createObjectURL(entry.blob)
  const viewer = document.createElement('div')
  viewer.id = 'tasker-pdf-viewer'
  viewer.className = 'tasker-pdf-viewer'
  viewer.innerHTML = `<section class="tasker-pdf-viewer-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header><div><b>${esc(title)}</b><small>${esc(entry.fileName || '')}</small></div><button type="button" data-pdf-close aria-label="Zatvori">×</button></header>
    <div class="tasker-pdf-frame"><object data="${url}" type="application/pdf"><p>Pregled PDF-a nije podržan na ovom uređaju. Koristite dugme „Preuzmi PDF“.</p></object></div>
    <footer><button type="button" data-pdf-download>↓ Preuzmi PDF</button><button type="button" class="primary-btn" data-pdf-share>↗ Pošalji</button></footer>
  </section>`
  const close = () => {
    URL.revokeObjectURL(url)
    viewer.remove()
  }
  viewer.addEventListener('click', async (event) => {
    if (event.target === viewer || event.target.closest('[data-pdf-close]')) close()
    else if (event.target.closest('[data-pdf-download]')) downloadTaskerPdf(entry)
    else if (event.target.closest('[data-pdf-share]')) await shareTaskerPdf(entry, title, entry.fileName || title)
  })
  document.body.appendChild(viewer)
}

async function renderOrderPdfArchive() {
  const list = document.querySelector('#order-pdf-list')
  if (!list) return
  try {
    const entries = await listOrderPdfs()
    list.innerHTML = entries.length ? entries.map((entry) => `<article class="order-pdf-file"><span>PDF</span><div><b>${esc(entry.fileName)}</b><small>${esc(entry.documentNumber)} · ${new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</small></div><div class="order-pdf-actions"><button type="button" data-order-share="${esc(entry.id)}">↗ Pošalji</button><button type="button" data-order-open="${esc(entry.id)}">Otvori</button><button type="button" class="order-pdf-delete" data-order-delete="${esc(entry.id)}">×</button></div></article>`).join('') : '<p class="order-pdf-empty">Još nema sačuvanih PDF narudžbenica.</p>'
  } catch {
    list.innerHTML = '<p class="order-pdf-empty">Arhiva trenutno nije dostupna.</p>'
  }
}

async function createOrderPdf(meta, lines) {
  const [jsPDF, html2canvas] = await Promise.all([loadPdfLibrary(), loadHtml2Canvas()])
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const rowsPerPage = 14
  const pages = Math.max(1, Math.ceil(lines.length / rowsPerPage))

  for (let pageIndex = 0; pageIndex < pages; pageIndex += 1) {
    const pageRows = lines.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage)
    const rows = Array.from({ length: rowsPerPage }, (_, index) => {
      const line = pageRows[index]
      if (!line) return `<div class="pdf-order-row empty"><span>${(pageIndex * rowsPerPage) + index + 1}</span><div></div><b></b><em></em><small></small></div>`
      return `<div class="pdf-order-row"><span>${(pageIndex * rowsPerPage) + index + 1}</span><div><b>${esc(line.name)}</b><small>${esc(line.description || '')}</small></div><b>${esc(line.quantity)}</b><em>${esc(line.unit)}</em><small>${esc(line.note || '')}</small></div>`
    }).join('')

    const sheet = document.createElement('section')
    sheet.className = 'order-pdf-render-sheet'
    sheet.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;box-sizing:border-box;overflow:hidden;background:#0b1220;color:#edf6ff;font-family:Arial,sans-serif;'
    sheet.innerHTML = `<header class="pdf-order-header">
      <div class="pdf-tasker-mark"><i></i><b>T</b><i></i></div>
      <h1>NARUDŽBENICA</h1>
      <p class="pdf-order-date">Datum: ${esc(meta.date.split('-').reverse().join('.'))}</p>
      <p class="pdf-order-number">Broj dokumenta: <b>${esc(meta.documentNumber)}</b></p>
    </header>
    <main class="pdf-order-main">
      <div class="pdf-order-columns"><span>R.br.</span><span>Artikal / opis</span><span>Količina</span><span>Jed.</span><span>Napomena</span></div>
      <div class="pdf-order-rows">${rows}</div>
    </main>
    <footer><span>TASKER · Narudžbenica</span><span>Pripremio: ${esc(meta.preparedBy)} &nbsp;·&nbsp; ${Number(meta.pageNumber) + pageIndex}</span></footer>
    <style>
      .order-pdf-render-sheet *{box-sizing:border-box}
      .pdf-order-header{position:relative;height:188px;padding-top:42px;background:linear-gradient(135deg,#101f34,#0d192a);border-bottom:1px solid #29445f}
      .pdf-tasker-mark{position:absolute;left:54px;top:28px;display:flex;flex-direction:column;align-items:center;gap:3px}
      .pdf-tasker-mark i{display:block;width:20px;height:7px;border-radius:8px;background:#f05252}
      .pdf-tasker-mark i:last-child{background:#f5f7fa}
      .pdf-tasker-mark b{display:grid;place-items:center;width:31px;height:31px;border-radius:11px;background:#3b82f6;color:white;font-size:19px}
      .pdf-order-header h1{margin:0;text-align:center;color:#f3f9ff;font-size:31px;letter-spacing:1.5px}
      .pdf-order-date{position:absolute;right:18px;top:35px;margin:0;color:#b9cce0;font-size:15px}
      .pdf-order-number{position:absolute;right:18px;bottom:12px;margin:0;color:#a9bfd5;font-size:13px}
      .pdf-order-number b{color:#7ee6ff;font-size:14px}
      .pdf-order-main{padding:0}
      .pdf-order-columns,.pdf-order-row{display:grid;grid-template-columns:58px minmax(0,1fr) 100px 78px 155px;align-items:center}
      .pdf-order-columns{height:46px;padding:0 10px;border:1px solid #315272;border-radius:0;background:#173a5c;color:#f5fbff;font-size:12px;font-weight:900}
      .pdf-order-columns span:nth-child(3),.pdf-order-columns span:nth-child(4){text-align:center}
      .pdf-order-row{height:59.5px;padding:0 10px;border:1px solid #29445f;border-top:0;background:#101f33;color:#eaf4ff}
      .pdf-order-row:nth-child(even){background:#13263d}
      .pdf-order-row>span{text-align:center;color:#91a8be;font-size:12px}
      .pdf-order-row>div{display:grid;gap:4px;min-width:0;padding-right:10px}
      .pdf-order-row>div b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f5f9ff;font-size:13px}
      .pdf-order-row>div small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#91a9bf;font-size:10px}
      .pdf-order-row>b,.pdf-order-row>em{text-align:center;color:#dcecff;font-size:13px;font-style:normal}
      .pdf-order-row>small{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;padding-left:8px;color:#b8cce0;font-size:10px;line-height:14px}
      .pdf-order-row.empty{color:#53697f}
      .order-pdf-render-sheet footer{position:absolute;left:18px;right:18px;bottom:20px;display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #29445f;color:#8299af;font-size:11px}
    </style>`
    document.body.appendChild(sheet)
    try {
      const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#0b1220', useCORS: true })
      if (pageIndex) pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/jpeg', .94), 'JPEG', 0, 0, 210, 297)
    } finally {
      sheet.remove()
    }
  }
  return pdf.output('blob')
}
function ordersPage() {
  const today = todayInputValue()
  let savedMeta = {}
  try { savedMeta = JSON.parse(localStorage.getItem('tasker.order-document-meta') || '{}') || {} } catch {}
  const meta = {
    date: savedMeta.date || today,
    documentNumber: savedMeta.documentNumber || `NAR-${today.replaceAll('-', '')}-001`,
    pageNumber: Number(savedMeta.pageNumber) || 1,
    preparedBy: savedMeta.preparedBy || state.settings.userName || 'Stefan Jonić'
  }
  content.innerHTML = `<section class="page-heading order-page-heading"><div><p class="eyebrow">Nabavka</p><h1>Narudžbenice</h1><p>Slobodno unesite i uredite sve stavke prije izrade dokumenta.</p></div><button class="secondary-btn clear-order" ${state.orderLines.length ? '' : 'disabled'}>Obriši listu</button></section>
  <section class="order-document-meta">
    <label>Datum<input id="order-doc-date" type="date" value="${esc(meta.date)}"></label>
    <label>Broj dokumenta<input id="order-doc-number" required value="${esc(meta.documentNumber)}" maxlength="40"></label>
    <label>Početni broj strane<input id="order-page-number" type="number" min="1" value="${meta.pageNumber}"></label>
    <label>Pripremio<input id="order-prepared-by" value="${esc(meta.preparedBy)}" maxlength="50"></label>
  </section>
  <section class="order-panel custom-order-panel"><h2>Dodaj stavku</h2><form class="order-form custom-order-form" id="order-form">
    <label>Naziv artikla<input id="order-name" list="order-material-options" required placeholder="Upišite bilo koji artikal"><datalist id="order-material-options">${materials.map((item) => `<option value="${esc(item.name)}">${esc(item.standard)}</option>`).join('')}</datalist></label>
    <label>Opis<input id="order-description" placeholder="Model, dimenzija ili specifikacija"></label>
    <label>Količina<input id="order-quantity" type="number" min="0.01" step="any" required value="1"></label>
    <label>Jedinica<input id="order-unit" required value="kom"></label>
    <label>Napomena<input id="order-note" placeholder="Dobavljač, rok ili drugo"></label>
    <button class="primary-btn">＋ Dodaj</button>
  </form></section>
  <section class="order-list editable-order-list"><header><h2>Stavke narudžbenice</h2><span>${state.orderLines.length} stavki</span></header>${renderOrderLines()}</section>
  <div class="order-document-actions"><p id="order-document-status" role="status">Sve stavke možete mijenjati direktno u tabeli.</p><button id="save-order-pdf" class="primary-btn" ${state.orderLines.length ? '' : 'disabled'}>Sačuvaj PDF narudžbenicu</button></div>
  <section class="order-pdf-archive"><header><span class="order-folder-icon">▰</span><div><h2>Sačuvane narudžbenice</h2><p>PDF dokumenti na ovom uređaju</p></div></header><div id="order-pdf-list"><p class="order-pdf-empty">Učitavanje...</p></div></section>
  <style id="order-document-styles">
    #content .order-page-heading{display:flex!important;justify-content:space-between!important;align-items:end!important}
    #content .order-document-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}
    #content .order-document-meta label,#content .custom-order-form label{display:grid;gap:6px;color:var(--muted);font-size:10px;font-weight:800;text-transform:uppercase}
    #content .order-document-meta input,#content .custom-order-form input,#content .editable-order-row input{box-sizing:border-box;width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:#14243b;color:var(--text);font:inherit}
    #content .custom-order-form{display:grid!important;grid-template-columns:1.5fr 1.5fr .6fr .55fr 1.2fr auto!important;align-items:end!important;gap:10px!important}
    #content .editable-order-list{margin-top:18px}
    #content .editable-order-table{overflow-x:auto}
    #content .editable-order-head,#content .editable-order-row{display:grid;grid-template-columns:1.35fr 1.35fr .55fr .5fr 1fr 38px;gap:8px;align-items:center;min-width:760px}
    #content .editable-order-head{padding:9px;color:var(--muted);font-size:9px;font-weight:900;text-transform:uppercase}
    #content .editable-order-row{padding:8px;border-top:1px solid var(--line)}
    #content .editable-order-row .remove-order{height:38px;border:1px solid #6a3543;border-radius:8px;background:#482332;color:#ffacb8;font-size:20px;cursor:pointer}
    #content .order-document-actions{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:16px}
    #content .order-document-actions p{margin:0;color:var(--muted);font-size:12px}
    #content .order-pdf-archive{margin-top:22px;border:1px solid var(--line);border-radius:16px;background:var(--panel);overflow:hidden}
    #content .order-pdf-archive>header{display:flex;align-items:center;gap:13px;padding:18px 20px;border-bottom:1px solid var(--line)}
    #content .order-pdf-archive h2{margin:0;font-size:17px}
    #content .order-pdf-archive header p{margin:4px 0 0;color:var(--muted);font-size:11px}
    #content .order-folder-icon{position:relative;display:grid;place-items:center;width:48px;height:38px;border-radius:7px 10px 10px 10px;background:linear-gradient(145deg,#e0a62d,#b87912);color:#fff3c5}
    #content #order-pdf-list{padding:8px 18px}
    #content .order-pdf-file{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
    #content .order-pdf-file>span{display:grid;place-items:center;width:40px;height:40px;border-radius:9px;background:#692e3e;color:#ffbac5;font-size:10px;font-weight:900}
    #content .order-pdf-file>div:nth-child(2){display:grid;gap:4px;min-width:0}
    #content .order-pdf-file b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
    #content .order-pdf-file small{color:var(--muted);font-size:10px}
    #content .order-pdf-actions{display:flex;gap:7px}
    #content .order-pdf-actions button{padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#172944;color:var(--text);font-weight:800;cursor:pointer}
    #content .order-pdf-actions button:first-child{border-color:#2e8d69;background:#176044;color:#c4ffe0}
    #content .order-pdf-actions .order-pdf-delete{color:#ff9eaa}
    #content .order-pdf-empty{margin:0;padding:22px;color:var(--muted);font-size:12px;text-align:center}
    @media(max-width:900px){#content .order-document-meta{grid-template-columns:repeat(2,1fr)}#content .custom-order-form{grid-template-columns:repeat(2,1fr)!important}#content .custom-order-form button{grid-column:1/-1}}
    @media(max-width:600px){#content .order-document-meta{grid-template-columns:1fr}#content .order-document-actions{align-items:stretch;flex-direction:column}#content .order-document-actions button{width:100%}#content .order-pdf-file{grid-template-columns:auto 1fr}#content .order-pdf-actions{grid-column:1/-1}#content .order-pdf-actions button{flex:1}}
  </style>`

  const saveMeta = () => {
    const next = {
      date: document.querySelector('#order-doc-date').value,
      documentNumber: document.querySelector('#order-doc-number').value.trim(),
      pageNumber: Number(document.querySelector('#order-page-number').value) || 1,
      preparedBy: document.querySelector('#order-prepared-by').value.trim() || 'Stefan Jonić'
    }
    localStorage.setItem('tasker.order-document-meta', JSON.stringify(next))
    return next
  }
  document.querySelectorAll('.order-document-meta input').forEach((input) => input.addEventListener('change', saveMeta))
  renderOrderPdfArchive()

  document.querySelector('#order-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const name = document.querySelector('#order-name').value.trim()
    const quantity = Number(document.querySelector('#order-quantity').value)
    if (!name || !quantity) return
    state.orderLines.push({
      id: Date.now(),
      name,
      description: document.querySelector('#order-description').value.trim(),
      quantity,
      unit: document.querySelector('#order-unit').value.trim() || 'kom',
      note: document.querySelector('#order-note').value.trim()
    })
    saveOrder()
    ordersPage()
  })

  document.querySelector('.clear-order').addEventListener('click', () => {
    if (state.orderLines.length && confirm('Obrisati sve stavke trenutne narudžbenice?')) {
      state.orderLines = []
      saveOrder()
      ordersPage()
    }
  })

  document.querySelector('.order-list').addEventListener('change', (event) => {
    const input = event.target.closest('[data-order-field]')
    if (!input) return
    const id = Number(input.closest('[data-order-id]').dataset.orderId)
    const line = state.orderLines.find((entry) => Number(entry.id) === id)
    if (!line) return
    const field = input.dataset.orderField
    line[field] = field === 'quantity' ? Number(input.value) || 0 : input.value.trim()
    if (!line.name && line.materialId) line.name = materials.find((item) => item.id === Number(line.materialId))?.name || 'Stavka'
    saveOrder()
  })

  document.querySelector('.order-list').addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-order]')
    if (!remove) return
    state.orderLines = state.orderLines.filter((line) => Number(line.id) !== Number(remove.dataset.removeOrder))
    saveOrder()
    ordersPage()
  })

  document.querySelector('#save-order-pdf').addEventListener('click', async (event) => {
    const button = event.currentTarget
    const status = document.querySelector('#order-document-status')
    const documentMeta = saveMeta()
    if (!documentMeta.documentNumber) {
      status.textContent = 'Unesite obavezni broj dokumenta.'
      document.querySelector('#order-doc-number').focus()
      return
    }
    const lines = normalizeOrderLines()
    if (!lines.length) return
    button.disabled = true
    button.textContent = 'Pravim PDF...'
    status.textContent = 'Priprema narudžbenice.'
    try {
      const blob = await createOrderPdf(documentMeta, lines)
      const now = new Date()
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map((value) => String(value).padStart(2, '0')).join('')
      const fileName = `Narudzbenica-${documentMeta.date}-${time}.pdf`
      await storeOrderPdf({ id: `${documentMeta.date}-${now.getTime()}`, fileName, blob, documentNumber: documentMeta.documentNumber, createdAt: now.toISOString() })
      await renderOrderPdfArchive()
      status.innerHTML = `PDF <b>${fileName}</b> je sačuvan u Tasker.`
    } catch {
      status.textContent = 'PDF nije sačuvan. Pokušajte ponovo.'
    } finally {
      button.disabled = false
      button.textContent = 'Sačuvaj PDF narudžbenicu'
    }
  })

  document.querySelector('#order-pdf-list').addEventListener('click', async (event) => {
    const shareId = event.target.closest('[data-order-share]')?.dataset.orderShare
    const openId = event.target.closest('[data-order-open]')?.dataset.orderOpen
    const deleteId = event.target.closest('[data-order-delete]')?.dataset.orderDelete
    if (!shareId && !openId && !deleteId) return
    const entries = await listOrderPdfs()
    const entry = entries.find((item) => item.id === (shareId || openId || deleteId))
    if (!entry) return
    if (shareId) {
      const file = new File([entry.blob], entry.fileName, { type: 'application/pdf' })
      try {
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          await navigator.share({ title: 'Tasker · Narudžbenica', text: `Narudžbenica ${entry.documentNumber}`, files: [file] })
        } else {
          const url = URL.createObjectURL(entry.blob)
          const link = document.createElement('a')
          link.href = url
          link.download = entry.fileName
          link.click()
          setTimeout(() => URL.revokeObjectURL(url), 60000)
          alert('PDF je preuzet. Dodajte ga ručno u mail ili WhatsApp.')
        }
      } catch (error) {
        if (error?.name !== 'AbortError') alert('Slanje nije uspelo.')
      }
    }
    if (openId) openTaskerPdfViewer(entry, 'Tasker · Narudžbenica')
    if (deleteId && confirm('Obrisati ovu PDF narudžbenicu?')) {
      await deleteOrderPdf(entry.id)
      renderOrderPdfArchive()
    }
  })
}

function renderOrderLines() {
  const lines = normalizeOrderLines()
  if (!lines.length) return '<div class="order-empty"><b>Lista je prazna.</b><span>Upišite prvu stavku koju treba naručiti.</span></div>'
  return `<div class="editable-order-table"><div class="editable-order-head"><span>Artikal</span><span>Opis</span><span>Količina</span><span>Jed.</span><span>Napomena</span><span></span></div>${lines.map((line) => `<div class="editable-order-row" data-order-id="${line.id}"><input data-order-field="name" value="${esc(line.name)}" aria-label="Naziv artikla"><input data-order-field="description" value="${esc(line.description)}" aria-label="Opis"><input data-order-field="quantity" type="number" min="0.01" step="any" value="${line.quantity}" aria-label="Količina"><input data-order-field="unit" value="${esc(line.unit)}" aria-label="Jedinica"><input data-order-field="note" value="${esc(line.note || '')}" aria-label="Napomena"><button class="remove-order" data-remove-order="${line.id}" aria-label="Ukloni stavku">×</button></div>`).join('')}</div>`
}

function reportsPage() {
  const lowItems = materials.filter((item) => item.stock > 0 && item.stock <= item.minStock)
  const emptyItems = materials.filter((item) => item.stock <= 0)
  const totalUnits = materials.reduce((sum, item) => sum + item.stock, 0)

  content.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Analitika magacina</p><h1>Izve\u0161taji</h1><p>Pregled trenutnog stanja materijala i lagera.</p></div><div class="report-actions"><button class="secondary-btn" id="print-report">\u25A3 \u0160tampaj</button><button class="primary-btn" id="export-csv">\u2193 Izvezi CSV</button></div></section><section class="report-stats"><article><span class="stat-icon blue">\u25A6</span><p>Ukupno artikala</p><strong>${materials.length}</strong><small>u ${categories.length} kategorija</small></article><article><span class="stat-icon green">\u2713</span><p>Ukupno na stanju</p><strong>${new Intl.NumberFormat('sr-RS').format(totalUnits)}</strong><small>komada, plo\u010Da i ostalo</small></article><article><span class="stat-icon amber">!</span><p>Pri kraju</p><strong>${lowItems.length}</strong><small>zahteva proveru</small></article><article><span class="stat-icon red">\u00D7</span><p>Nema na stanju</p><strong>${emptyItems.length}</strong><small>potrebna nabavka</small></article></section><section class="report-table"><header><div><h2>Stanje lagera</h2><p>Aktuelni pregled svih artikala.</p></div><span>${new Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</span></header><div class="stock-table"><div class="stock-row stock-labels"><span>Materijal</span><span>Kategorija</span><span>Lokacija</span><span>Na stanju</span><span>Status</span></div>${materials.map((item) => {
    const status = item.stock <= 0 ? ['Nema na stanju', 'empty'] : item.stock <= item.minStock ? ['Pri kraju', 'low'] : ['Na stanju', 'ok']
    const category = categories.find((entry) => entry.id === item.category)
    return `<div class="stock-row"><div><b>${item.name}</b><small>${item.standard}</small></div><span>${category?.name || item.category}</span><span>${item.location}</span><strong>${new Intl.NumberFormat('sr-RS').format(item.stock)} <em>${item.unit}</em></strong><span class="stock-status ${status[1]}">${status[0]}</span></div>`
  }).join('')}</div></section>`

  document.querySelector('#print-report').addEventListener('click', () => window.print())
  document.querySelector('#export-csv').addEventListener('click', exportCsv)
}

function exportCsv() {
  const quote = (value) => `"${String(value).replaceAll('"', '""')}"`
  const rows = [['Naziv', 'Kategorija', 'Standard', 'Dobavlja\u010D', 'Lokacija', 'Jedinica', 'Na stanju', 'Minimalna koli\u010Dina'], ...materials.map((item) => [item.name, categories.find((entry) => entry.id === item.category)?.name || item.category, item.standard, item.supplier, item.location, item.unit, item.stock, item.minStock])]
  const csv = '\uFEFF' + rows.map((row) => row.map(quote).join(';')).join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  link.download = `izvestaj-lagera-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function settingsPage() {
  const now = new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'full', timeStyle: 'medium' }).format(new Date())
  const themes = [
    { id: 'dark', name: 'Noćno plava', note: 'Originalna TASKER tamna tema.', color: '#17385b' },
    { id: 'graphite', name: 'Grafitna', note: 'Elegantna crna i siva nijansa.', color: '#343b46' },
    { id: 'midnight', name: 'Ponoćna', note: 'Duboka teget sa ljubičastim odsjajem.', color: '#29285e' },
    { id: 'emerald', name: 'Tamnozelena', note: 'Tamna tema sa zelenim akcentima.', color: '#174a3b' }
  ]
  if (!themes.some((theme) => theme.id === state.settings.theme)) state.settings.theme = 'dark'
  content.innerHTML = `<section class="page-heading settings-heading"><div><p class="eyebrow">Administracija sistema</p><h1>Podešavanja</h1><p>Upravljajte profilom, podacima i izgledom aplikacije.</p></div><button type="button" class="secondary-btn settings-back" id="settings-back">← Nazad na početnu</button></section><div class="settings-notice" id="settings-notice" role="status" hidden></div><section class="settings-grid"><article class="settings-card"><header><span class="stat-icon blue">◉</span><div><h2>Korisnik i firma</h2><p>Podaci koji se prikazuju u aplikaciji.</p></div></header><form id="profile-settings" class="settings-form"><label>Ime korisnika<input name="userName" required value="${esc(state.settings.userName)}"></label><label>Naziv firme / aplikacije<input name="companyName" required value="${esc(state.settings.companyName)}"></label><div class="settings-form-actions"><button type="submit" class="primary-btn">Sačuvaj podatke</button><button type="button" class="secondary-btn" id="quick-change-profile">Promeni kroz prozor</button></div></form></article><article class="settings-card"><header><span class="stat-icon amber">◐</span><div><h2>Izgled aplikacije</h2><p>Sve ponuđene teme su tamne.</p></div></header><div class="theme-options">${themes.map((theme) => `<button type="button" class="theme-option ${state.settings.theme === theme.id ? 'selected' : ''}" data-theme="${theme.id}"><i style="--theme-dot:${theme.color}"></i><span><b>${theme.name}</b><small>${theme.note}</small></span><em>${state.settings.theme === theme.id ? '✓' : ''}</em></button>`).join('')}</div></article><article class="settings-card"><header><span class="stat-icon green">⌚</span><div><h2>Datum i vreme</h2><p>Aplikacija koristi vreme vašeg uređaja.</p></div></header><div class="settings-info"><b>${now}</b><small>Za promenu vremena podesite datum i sat na uređaju.</small></div></article><article class="settings-card"><header><span class="stat-icon blue">▣</span><div><h2>Magacin</h2><p>Minimalna količina za nove artikle.</p></div></header><form id="warehouse-settings" class="settings-form inline-form"><label>Minimalna količina<input name="defaultMinStock" type="number" min="0" value="${Number(state.settings.defaultMinStock) || 0}"></label><button type="submit" class="secondary-btn">Sačuvaj</button></form></article><article class="settings-card settings-card-wide"><header><span class="stat-icon green">⇩</span><div><h2>Rezervna kopija podataka</h2><p>Sačuvajte kompletno stanje aplikacije ili vratite raniju kopiju.</p></div></header><div class="settings-actions"><button type="button" class="primary-btn" id="backup-data">Preuzmi rezervnu kopiju</button><label class="secondary-btn restore-label">Učitaj rezervnu kopiju<input id="restore-data" type="file" accept="application/json,.json"></label><button type="button" class="secondary-btn" id="settings-export-csv">Izvezi materijal u CSV</button></div></article><article class="settings-card danger-card settings-card-wide"><header><span class="stat-icon red">!</span><div><h2>Brisanje podataka</h2><p>Radnje se ne mogu vratiti bez rezervne kopije.</p></div></header><div class="settings-actions"><button type="button" class="danger-btn" id="clear-attendance">Obriši dnevnu evidenciju</button><button type="button" class="danger-btn" id="reset-app">Obriši sve probne podatke</button></div></article><article class="settings-card settings-card-wide about-card"><header><span class="stat-icon blue">i</span><div><h2>O aplikaciji</h2><p><b>Tasker v2.0</b> · Sistem za materijal, zaposlene, narudžbine i evidenciju rada.</p></div></header></article></section>`

  const root = content
  const notice = (message) => {
    const box = root.querySelector('#settings-notice')
    if (!box) return
    box.textContent = message
    box.hidden = false
    clearTimeout(settingsPage.noticeTimer)
    settingsPage.noticeTimer = setTimeout(() => { if (box.isConnected) box.hidden = true }, 3200)
  }
  root.querySelector('#settings-back')?.addEventListener('click', () => navigate('dashboard'))
  root.querySelector('#profile-settings')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const userName = String(data.get('userName') || '').trim()
    const companyName = String(data.get('companyName') || '').trim()
    if (!userName || !companyName) return notice('Unesite ime korisnika i naziv firme.')
    state.settings.userName = userName
    state.settings.companyName = companyName.toLocaleUpperCase('sr')
    saveSettings()
    document.querySelector('#brand-company').textContent = state.settings.companyName
    document.querySelector('#profile-name').textContent = state.settings.userName
    document.querySelector('#profile-initials').textContent = initialsFor(state.settings.userName)
    notice('Ime i naziv firme su sačuvani.')
  })
  root.querySelector('#quick-change-profile')?.addEventListener('click', () => {
    const userName = prompt('Upišite novo ime korisnika:', state.settings.userName)
    if (userName === null || !userName.trim()) return
    const companyName = prompt('Upišite novi naziv firme / aplikacije:', state.settings.companyName)
    if (companyName === null || !companyName.trim()) return
    state.settings.userName = userName.trim()
    state.settings.companyName = companyName.trim().toLocaleUpperCase('sr')
    saveSettings()
    document.querySelector('#brand-company').textContent = state.settings.companyName
    document.querySelector('#profile-name').textContent = state.settings.userName
    document.querySelector('#profile-initials').textContent = initialsFor(state.settings.userName)
    root.querySelector('[name="userName"]').value = state.settings.userName
    root.querySelector('[name="companyName"]').value = state.settings.companyName
    notice('Ime i naziv firme su sačuvani.')
  })
  root.querySelectorAll('.theme-option[data-theme]').forEach((button) => button.addEventListener('click', () => {
    state.settings.theme = button.dataset.theme
    saveSettings()
    applyTheme()
    settingsPage()
  }))
  root.querySelector('#warehouse-settings')?.addEventListener('submit', (event) => {
    event.preventDefault()
    state.settings.defaultMinStock = Math.max(0, Number(new FormData(event.currentTarget).get('defaultMinStock')) || 0)
    saveSettings()
    notice('Minimalna količina je sačuvana.')
  })
  root.querySelector('#backup-data')?.addEventListener('click', () => {
    const backup = { version:'Tasker v2.0', createdAt:new Date().toISOString(), data:{ todos:state.todos, filter:state.filter, inventory:materials, categories, orderLines:state.orderLines, moduleProgress:state.moduleProgress, moduleDetails:state.moduleDetails, employees:state.employees, attendance:state.attendance, workHours:state.workHours, workPlans:state.workPlans, settings:state.settings } }
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}))
    const link = document.createElement('a')
    link.href=url; link.download=`tasker-rezervna-kopija-${dateKeyFor()}.json`; document.body.appendChild(link); link.click(); link.remove()
    setTimeout(() => URL.revokeObjectURL(url),1000)
    notice('Rezervna kopija je preuzeta.')
  })
  root.querySelector('#restore-data')?.addEventListener('change', (event) => {
    const file=event.target.files?.[0]
    if(!file) return
    const reader=new FileReader()
    reader.onload=()=>{
      try {
        const data=JSON.parse(reader.result)?.data
        if(!data||!Array.isArray(data.inventory)||!Array.isArray(data.categories)||!Array.isArray(data.employees)) throw new Error()
        if(!confirm('Vratiti rezervnu kopiju i zameniti trenutne podatke?')) return
        localStorage.setItem(storage,JSON.stringify(data.todos||[])); localStorage.setItem(filterStorage,data.filter||'all'); localStorage.setItem(inventoryStorage,JSON.stringify(data.inventory)); localStorage.setItem(categoryStorage,JSON.stringify(data.categories)); localStorage.setItem(orderStorage,JSON.stringify(data.orderLines||[])); localStorage.setItem(moduleStorage,JSON.stringify(data.moduleProgress||{mv:0,mvs:0,rpp:0})); localStorage.setItem(moduleDetailStorage,JSON.stringify(data.moduleDetails||{})); localStorage.setItem(employeeStorage,JSON.stringify(data.employees)); localStorage.setItem(attendanceStorage,JSON.stringify(data.attendance||{})); localStorage.setItem(workHoursStorage,JSON.stringify(data.workHours||{})); localStorage.setItem(workPlanStorage,JSON.stringify(data.workPlans||{})); localStorage.setItem(settingsStorage,JSON.stringify({...defaultSettings,...(data.settings||{}),theme:data.settings?.theme==='light'?'dark':(data.settings?.theme||'dark')}))
        location.reload()
      } catch { alert('Ovaj fajl nije ispravna Tasker rezervna kopija.') }
    }
    reader.readAsText(file)
  })
  root.querySelector('#settings-export-csv')?.addEventListener('click', () => { exportCsv(); notice('CSV izvoz je pokrenut.') })
  root.querySelector('#clear-attendance')?.addEventListener('click', () => {
    if(!confirm('Obrisati svu dnevnu evidenciju rada?')) return
    state.attendance={}; saveAttendance(); notice('Dnevna evidencija je obrisana.')
  })
  root.querySelector('#reset-app')?.addEventListener('click', () => {
    if(!confirm('Ovo briše sve unete podatke. Da li ste sigurni?')) return
    ;[storage,filterStorage,inventoryStorage,categoryStorage,orderStorage,moduleStorage,moduleDetailStorage,employeeStorage,attendanceStorage,workHoursStorage,workPlanStorage,settingsStorage].forEach((key)=>localStorage.removeItem(key))
    location.reload()
  })
}

const moduleTypes = [{ id: 'mv', label: 'MV', name: 'MV moduli', color: '#43c5f6', defaultCount: 16 }, { id: 'mvs', label: 'MVS', name: 'MVS moduli', color: '#a78bfa', defaultCount: 0 }, { id: 'rpp', label: 'RPP', name: 'RPP moduli', color: '#5de18e', defaultCount: 0 }]
moduleTypes.forEach((type) => { const savedLabel = state.settings.moduleLabels?.[type.id]; if (typeof savedLabel === 'string' && savedLabel.trim()) { type.label = savedLabel.trim(); type.name = `${type.label} moduli` } })
const defaultModuleStages = ['Postavljanje folije', 'Postavljanje podnog lima (odozdo)', 'Postavljanje mineralne vune', 'Postavljanje plywooda', 'Postavljanje cetris ploca', 'Postavljanje mineralne vune u strop', 'Postavljanje folije u strop', 'Postavljanje okapne lajsne za panele', 'Postavljanje zidnih panela', 'Postavljanje stropnih panela', 'Silikoniranje vanjskog ruba panela i celika', 'Postavljanje kutne lajsne', 'Probijanje otvora', 'Postavljanje okapnih lajsni na modulu']
const newModuleStages = () => defaultModuleStages.map((title, index) => ({ id: `osnovno-${index + 1}`, title, status: 'nije-zavrseno', percent: 0, custom: false }))
const moduleStageStatus = { 'nije-zavrseno': { label: 'Nije zavrseno', icon: '&times;', className: 'stage-red' }, 'u-toku': { label: 'U toku', icon: '&#8226;', className: 'stage-yellow' }, zavrseno: { label: 'Zavrseno', icon: '&#10003;', className: 'stage-green' } }

function moduleData(type) {
  if (!state.moduleDetails[type.id]) state.moduleDetails[type.id] = { count: type.defaultCount, units: {} }
  const data = state.moduleDetails[type.id]
  if (!data.units) data.units = {}
  return data
}

function moduleUnit(type, number) {
  const data = moduleData(type)
  const id = `${type.label}-${String(number).padStart(2, '0')}`
  if (!data.units[id]) data.units[id] = { id, progress: 0, work: '', note: '', photos: [] }
  if (!Array.isArray(data.units[id].photos)) data.units[id].photos = []
  if (!Array.isArray(data.units[id].consumption)) data.units[id].consumption = []
  if (!Array.isArray(data.units[id].stages)) data.units[id].stages = newModuleStages()
  data.units[id].stages.forEach((stage) => { if (!Number.isFinite(Number(stage.percent))) stage.percent = stage.status === 'zavrseno' ? 100 : 0 })
  if (data.units[id].stageVersion !== 2) {
    const stages = data.units[id].stages
    const cetrisIndex = stages.findIndex((stage) => stage.title === 'Postavljanje cetris ploca')
    const additions = [
      { id: 'osnovno-vuna-strop', title: 'Postavljanje mineralne vune u strop', status: 'nije-zavrseno', percent: 0, custom: false },
      { id: 'osnovno-folija-strop', title: 'Postavljanje folije u strop', status: 'nije-zavrseno', percent: 0, custom: false }
    ].filter((addition) => !stages.some((stage) => stage.title === addition.title))
    if (additions.length) stages.splice(cetrisIndex >= 0 ? cetrisIndex + 1 : stages.length, 0, ...additions)
    data.units[id].stageVersion = 2
  }
  return data.units[id]
}

function typeProgress(type) {
  const data = moduleData(type)
  const count = Number(data.count) || 0
  if (!count) return 0
  return Math.round(Array.from({ length: count }, (_, index) => moduleUnit(type, index + 1).progress).reduce((sum, value) => sum + Number(value || 0), 0) / count)
}

function modulesPage() {
  content.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Planiranje proizvodnje</p><h1>Modul</h1><p>Otvorite tip modula i pratite zavrsetak svakog pojedinacno.</p></div></section><section class="module-grid">${moduleTypes.map((type) => { const data = moduleData(type); const progress = typeProgress(type); return `<button class="module-card module-open" data-open-module="${type.id}"><div><p class="eyebrow">Modul</p><h2>${type.label}</h2><p>${data.count ? `${data.count} modula` : 'Nema dodatih modula'}</p><span>Otvori pregled &rarr;</span></div><div class="progress-ring" style="--progress:${progress};--ring:${type.color}"><div><strong>${progress}%</strong><small>zavrseno</small></div></div></button>` }).join('')}</section><button class="module-dashboard-card" id="open-module-dashboard"><span class="dashboard-card-icon">&#9776;</span><span><b>Kontrolna tabla modula</b><small>Pregled svih MV, MVS i RPP modula na jednom mestu.</small></span><strong>Otvori pregled &rarr;</strong></button>`
  content.insertAdjacentHTML('beforeend', `<style>#content .module-dashboard-card{display:grid!important;grid-template-columns:auto 1fr auto!important;gap:16px!important;align-items:center!important;width:100%!important;margin-top:20px!important;padding:22px!important;border:1px solid #2d6186!important;border-radius:17px!important;background:linear-gradient(120deg,#173c5b,#1b2e49)!important;color:#eff8ff!important;text-align:left!important;cursor:pointer!important}#content .module-dashboard-card:hover{border-color:#55cdf5!important;transform:translateY(-1px)!important}.dashboard-card-icon{display:grid!important;place-items:center!important;width:44px!important;height:44px!important;border-radius:12px!important;background:#14567c!important;color:#75dcff!important;font-size:22px!important}.module-dashboard-card b,.module-dashboard-card small{display:block!important}.module-dashboard-card b{font-size:17px!important}.module-dashboard-card small{margin-top:5px!important;color:#aac0d5!important;font-size:12px!important}.module-dashboard-card strong{color:#6edcff!important;font-size:13px!important}@media(max-width:600px){#content .module-dashboard-card{grid-template-columns:auto 1fr!important}.module-dashboard-card strong{grid-column:1/-1!important}}</style>`)
  document.querySelectorAll('[data-open-module]').forEach((button) => button.addEventListener('click', () => moduleDetailPage(button.dataset.openModule)))
  document.querySelector('#open-module-dashboard').addEventListener('click', moduleDashboardPage)
}

function moduleDashboardPage() {
  const allUnits = moduleTypes.flatMap((type) => {
    const count = Number(moduleData(type).count) || 0
    return Array.from({ length: count }, (_, index) => ({ type, unit: moduleUnit(type, index + 1) }))
  })
  const finished = allUnits.filter(({ unit }) => Number(unit.progress) >= 100).length
  const started = allUnits.filter(({ unit }) => Number(unit.progress) > 0 && Number(unit.progress) < 100).length
  const notStarted = allUnits.filter(({ unit }) => Number(unit.progress) <= 0).length
  content.innerHTML = `<section class="page-heading module-detail-heading"><div><button class="back-link" id="back-to-module-types">&larr; Svi moduli</button><p class="eyebrow">Centralni pregled</p><h1>Kontrolna tabla modula</h1><p>Pregled napretka svih MV, MVS i RPP modula.</p></div></section><section class="module-overview-stats"><article class="overview-done"><span>&#10003;</span><p>Zavrseni moduli</p><strong>${finished}</strong></article><article class="overview-active"><span>&#8226;</span><p>Moduli u toku</p><strong>${started}</strong></article><article class="overview-wait"><span>&times;</span><p>Nisu poceti</p><strong>${notStarted}</strong></article></section><section class="module-overview-panel">${moduleTypes.map((type) => { const count = Number(moduleData(type).count) || 0; const units = Array.from({ length: count }, (_, index) => moduleUnit(type, index + 1)); return `<section class="module-type-section"><header><div><span style="background:${type.color}"></span><h2>${type.label} moduli</h2><small>${count} modula</small></div><b>${typeProgress(type)}% ukupno</b></header>${units.length ? `<div class="overview-table"><div class="overview-head"><span>Modul</span><span>Napredak</span><span>U toku</span><span>Nije zavrseno</span><span>Poslednje uradjeno</span></div>${units.map((unit) => { const stages = unit.stages || []; const inProgress = stages.filter((stage) => stage.status === 'u-toku').length; const pending = stages.filter((stage) => stage.status !== 'zavrseno').length; return `<button class="overview-row" data-dashboard-unit="${unit.id}" data-dashboard-type="${type.id}"><b>${unit.id}</b><strong style="color:${type.color}">${unit.progress}%</strong><span class="overview-yellow">${inProgress} faza</span><span class="overview-red">${pending} faza</span><small>${unit.work ? esc(unit.work) : 'Nema unete aktivnosti'}</small></button>` }).join('')}</div>` : '<p class="plan-empty">Nema dodatih modula u ovoj grupi.</p>'}</section>` }).join('')}</section>`
  content.insertAdjacentHTML('beforeend', `<style>#content .module-overview-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:16px!important;margin-bottom:20px!important}#content .module-overview-stats article{padding:19px!important;border:1px solid #2d4c6b!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important}.module-overview-stats article span{display:grid!important;place-items:center!important;width:29px!important;height:29px!important;border-radius:8px!important;font-size:16px!important;font-weight:900!important}.overview-done span{color:#7df2b8!important;background:#123d35!important}.overview-active span{color:#ffdc73!important;background:#4b3b16!important}.overview-wait span{color:#ff9cab!important;background:#482332!important}.module-overview-stats p{margin:12px 0 4px!important;color:#9dafc5!important;font-size:12px!important}.module-overview-stats strong{font-size:28px!important}.module-overview-panel{padding:6px 20px!important;border:1px solid #2c4d6b!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important}.module-type-section{padding:20px 0!important;border-bottom:2px solid #365979!important}.module-type-section:last-child{border-bottom:0!important}.module-type-section header{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:12px!important;margin-bottom:14px!important}.module-type-section header>div{display:flex!important;align-items:center!important;gap:10px!important}.module-type-section header span{width:11px!important;height:11px!important;border-radius:50%!important}.module-type-section h2{margin:0!important;font-size:18px!important}.module-type-section header small{color:#9cafc4!important;font-size:12px!important}.module-type-section header>b{color:#80dcff!important;font-size:13px!important}.overview-table{border-top:1px solid #2b4966!important}.overview-head,.overview-row{display:grid!important;grid-template-columns:1.1fr .8fr .8fr 1fr 2.1fr!important;gap:12px!important;align-items:center!important}.overview-head{padding:11px 4px!important;color:#7e96af!important;font-size:10px!important;font-weight:800!important;text-transform:uppercase!important;letter-spacing:.05em!important}.overview-row{width:100%!important;padding:14px 4px!important;border:0!important;border-top:1px solid #2b4966!important;background:transparent!important;color:#f1f8ff!important;text-align:left!important;cursor:pointer!important}.overview-row:hover{background:#203a59!important}.overview-row>b{font-size:13px!important}.overview-row>strong{font-size:15px!important}.overview-row>small{color:#a0b4c9!important;font-size:11px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.overview-yellow,.overview-red{width:max-content!important;padding:4px 8px!important;border-radius:999px!important;font-size:11px!important;font-weight:800!important}.overview-yellow{color:#ffe07b!important;background:#4a3c16!important}.overview-red{color:#ffb3be!important;background:#452635!important}@media(max-width:760px){#content .module-overview-stats{grid-template-columns:1fr!important}.module-overview-panel{padding:6px 14px!important}.overview-head{display:none!important}.overview-row{grid-template-columns:1fr 1fr!important}.overview-row>small{grid-column:1/-1!important}.module-type-section header{align-items:flex-start!important;flex-direction:column!important}}</style>`)
  document.querySelector('#back-to-module-types').addEventListener('click', modulesPage)
  document.querySelectorAll('[data-dashboard-unit]').forEach((button) => button.addEventListener('click', () => moduleUnitPage(button.dataset.dashboardType, button.dataset.dashboardUnit)))
}

function moduleDetailPage(typeId) {
  const type = moduleTypes.find((entry) => entry.id === typeId)
  if (!type) return modulesPage()
  const data = moduleData(type)
  const count = Math.max(0, Math.min(100, Number(data.count) || 0))
  const progress = typeProgress(type)
  content.innerHTML = `<section class="page-heading module-detail-heading"><div><button class="back-link" id="back-modules">&larr; Svi moduli</button><p class="eyebrow">${type.label} moduli</p><h1>${type.label}</h1><p>Pregled pojedinacnih modula i njihovog napretka.</p></div><div class="module-total"><span>Ukupno zavrseno</span><b>${progress}%</b></div></section><section class="module-controls"><label>Broj ${type.label} modula<input id="module-count" type="number" min="0" max="100" value="${count}"></label><button class="primary-btn" id="save-module-count">Sacuvaj broj modula</button></section><section class="individual-module-grid">${count ? Array.from({ length: count }, (_, index) => { const unit = moduleUnit(type, index + 1); return `<button class="individual-module" data-open-unit="${unit.id}"><div><p>MODUL</p><h2>${unit.id}</h2></div><div class="mini-progress" style="--progress:${unit.progress};--ring:${type.color}"><b>${unit.progress}%</b></div><label><span>${unit.work ? esc(unit.work) : 'Dodajte sta je uradjeno'}</span></label></button>` }).join('') : '<p class="plan-empty">Unesite broj modula da bi se pojavile pojedinacne kartice.</p>'}</section>`
  document.querySelector('.module-controls').insertAdjacentHTML('beforeend', `<button class="secondary-btn" id="rename-module-type">&#9998; Preimenuj grupu ${esc(type.label)}</button>`)
  document.querySelector('#back-modules').addEventListener('click', modulesPage)
  document.querySelector('#save-module-count').addEventListener('click', () => { data.count = Math.max(0, Math.min(100, Number(document.querySelector('#module-count').value) || 0)); saveModuleDetails(); moduleDetailPage(typeId) })
  document.querySelector('#rename-module-type').addEventListener('click', () => renameModuleType(typeId))
  document.querySelectorAll('[data-open-unit]').forEach((button) => button.addEventListener('click', () => moduleUnitPage(typeId, button.dataset.openUnit)))
}

function renameModuleType(typeId) {
  const type = moduleTypes.find((entry) => entry.id === typeId)
  if (!type) return
  document.body.insertAdjacentHTML('beforeend', `<div class="material-modal" role="dialog" aria-modal="true"><form class="material-dialog material-form" id="rename-module-form"><button type="button" class="modal-close" aria-label="Zatvori">&times;</button><p class="eyebrow">Naziv modula</p><h2>Promeni naziv</h2><p class="material-standard">Novi naziv ce se prikazivati na svim karticama i u pregledima.</p><div class="form-grid"><label>Naziv tipa modula<input name="label" maxlength="24" required value="${esc(type.label)}" placeholder="npr. MV, ECO DC, Server sala"></label></div><div class="detail-actions"><button type="button" class="secondary-btn modal-close">Otkazi</button><button class="primary-btn">Sacuvaj naziv</button></div></form></div>`)
  const modal = document.querySelector('.material-modal:last-child')
  const close = () => modal.remove()
  modal.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', close))
  modal.addEventListener('click', (event) => { if (event.target === modal) close() })
  modal.querySelector('#rename-module-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const newLabel = new FormData(event.currentTarget).get('label').trim()
    if (!newLabel) return
    if (moduleTypes.some((entry) => entry.id !== type.id && entry.label.toLocaleLowerCase('sr') === newLabel.toLocaleLowerCase('sr'))) return alert('Vec postoji modul sa tim nazivom.')
    const oldLabel = type.label
    const data = moduleData(type)
    Object.keys(data.units).forEach((oldId) => {
      if (!oldId.startsWith(`${oldLabel}-`)) return
      const newId = `${newLabel}${oldId.slice(oldLabel.length)}`
      data.units[newId] = { ...data.units[oldId], id: newId }
      delete data.units[oldId]
    })
    type.label = newLabel
    type.name = `${newLabel} moduli`
    state.settings.moduleLabels = state.settings.moduleLabels || {}
    state.settings.moduleLabels[type.id] = newLabel
    saveModuleDetails()
    saveSettings()
    close()
    moduleDetailPage(typeId)
  })
}

function moduleUnitPage(typeId, unitId) {
  const type = moduleTypes.find((entry) => entry.id === typeId)
  const unit = Object.values(moduleData(type).units).find((entry) => entry.id === unitId)
  if (!type || !unit) return moduleDetailPage(typeId)
  if (!Array.isArray(unit.consumption)) unit.consumption = []
  const today = new Intl.DateTimeFormat('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
  content.innerHTML = `<section class="page-heading module-detail-heading"><div><button class="back-link" id="back-module-type">&larr; Nazad na ${type.label}</button><p class="eyebrow">Detalji modula</p><h1>${unit.id}</h1><p>Vodite evidenciju radova i fotografija za ovaj modul.</p></div><div class="module-total"><span>Napredak</span><b>${unit.progress}%</b></div></section><section class="unit-detail-grid"><article class="plan-panel"><h2>Stanje radova</h2><form id="module-unit-form" class="unit-form"><label>Procenat zavrsenosti<input name="progress" type="number" min="0" max="100" value="${unit.progress}"></label><label>Sta je uradjeno<input name="work" maxlength="180" value="${esc(unit.work)}" placeholder="npr. Postavljen plywood i cetris"></label><label>Beleška<textarea name="note" maxlength="1000" placeholder="Upisite napomenu za ovaj modul...">${esc(unit.note)}</textarea></label><button class="primary-btn">Sacuvaj promene</button></form></article><article class="plan-panel gallery-panel"><header><div><h2>Fotografije modula</h2><p>${today} - najvise 3 manje fotografije.</p></div></header><label class="photo-upload"><span>+ Dodaj fotografiju</span><input id="module-photo-input" type="file" accept="image/*" multiple></label><p class="photo-help">Fotografije se trenutno cuvaju u ovom browseru. Za trajno cuvanje na svim uredjajima kasnije dodajemo Drive ili bazu.</p><div id="module-gallery" class="module-gallery">${unit.photos.length ? unit.photos.map((photo, index) => `<figure><img src="${photo.data}" alt="Fotografija ${index + 1}"><figcaption>${photo.date}<button data-delete-photo="${index}" title="Obrisi fotografiju">&times;</button></figcaption></figure>`).join('') : '<p class="plan-empty">Jos nema fotografija za ovaj modul.</p>'}</div></article></section>`
  const doneStages = unit.stages.filter((stage) => stage.status === 'zavrseno').length
  content.insertAdjacentHTML('beforeend', `<section class="plan-panel stages-panel"><header><div><h2>Faze rada modula</h2><p>Za svaku fazu oznacite trenutno stanje rada ili promenite redosled.</p></div><span>${doneStages}/${unit.stages.length} zavrseno</span></header><div id="module-stages" class="module-stages">${unit.stages.map((stage, index) => { const status = moduleStageStatus[stage.status] || moduleStageStatus['nije-zavrseno']; return `<article class="module-stage"><div class="stage-title"><span>${index + 1}</span><b>${esc(stage.title)}</b></div><div class="stage-status-actions"><button class="${stage.status === 'nije-zavrseno' ? 'selected ' : ''}stage-red" data-stage-status="nije-zavrseno" data-stage-id="${stage.id}" title="Nije zavrseno">&times;</button><button class="${stage.status === 'u-toku' ? 'selected ' : ''}stage-yellow" data-stage-status="u-toku" data-stage-id="${stage.id}" title="U toku">&#8226;</button><button class="${stage.status === 'zavrseno' ? 'selected ' : ''}stage-green" data-stage-status="zavrseno" data-stage-id="${stage.id}" title="Zavrseno">&#10003;</button><button class="stage-edit" data-edit-stage="${stage.id}" title="Izmeni naziv faze">&#9998;</button><button class="stage-move" data-move-stage="up" data-stage-id="${stage.id}" title="Pomeri gore" ${index === 0 ? 'disabled' : ''}>&uarr;</button><button class="stage-move" data-move-stage="down" data-stage-id="${stage.id}" title="Pomeri dole" ${index === unit.stages.length - 1 ? 'disabled' : ''}>&darr;</button><button class="stage-remove" data-remove-stage="${stage.id}" title="Obrisi fazu">&times;</button></div><div class="stage-status-line"><small class="${status.className}">${status.label}</small><label class="stage-percent"><span>Procenat</span><input data-stage-percent="${stage.id}" type="number" min="0" max="100" value="${Math.max(0, Math.min(100, Number(stage.percent) || 0))}" title="Procenat zavrsenosti"><i>%</i></label></div></article>` }).join('')}</div><form id="module-stage-form" class="stage-add-form"><input name="stage-title" maxlength="120" placeholder="Dodajte novu fazu rada..." required><select name="insert-after"><option value="start">Dodaj na pocetak</option>${unit.stages.map((stage, index) => `<option value="${stage.id}" ${index === unit.stages.length - 1 ? 'selected' : ''}>Dodaj iza: ${esc(stage.title)}</option>`).join('')}</select><button class="primary-btn">+ Dodaj fazu</button></form></section>`)
  content.insertAdjacentHTML('beforeend', `<section class="plan-panel consumption-panel"><header><div><h2>Potrosnja materijala</h2><p>Materijal se automatski skida sa stanja magacina.</p></div><span>${unit.consumption.length} stavki</span></header><form id="consumption-form" class="consumption-form"><label>Materijal<select name="material" required>${materials.map((item) => `<option value="${item.id}">${esc(item.name)} - ${new Intl.NumberFormat('sr-RS').format(item.stock)} ${esc(item.unit)}</option>`).join('')}</select></label><label>Kolicina<input name="quantity" type="number" min="1" required value="1"></label><button class="primary-btn" ${materials.length ? '' : 'disabled'}>Skini sa stanja</button></form><div id="consumption-list" class="consumption-list">${unit.consumption.length ? unit.consumption.slice().reverse().map((entry) => `<article><div><b>${esc(entry.name)}</b><p>${entry.date} &middot; ${entry.quantity} ${esc(entry.unit)} skinuto sa stanja</p></div><strong>-${entry.quantity} ${esc(entry.unit)}</strong><button data-undo-consumption="${entry.id}" title="Vrati materijal na stanje">&crarr;</button></article>`).join('') : '<p class="plan-empty">Jos nije evidentirana potrosnja materijala za ovaj modul.</p>'}</div></section>`)
  content.insertAdjacentHTML('beforeend', `<style>#content .consumption-panel{margin-top:18px!important;padding:21px!important;border:1px solid #2c4d6b!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important}#content .consumption-panel header{display:flex!important;justify-content:space-between!important;gap:12px!important;align-items:flex-start!important;margin-bottom:16px!important}#content .consumption-panel h2{margin:0!important;font-size:18px!important}#content .consumption-panel header p{margin:5px 0 0!important;color:#9cafc5!important;font-size:12px!important}#content .consumption-panel header>span{color:#82ddff!important;font-size:11px!important;font-weight:800!important}.consumption-form{display:grid!important;grid-template-columns:minmax(240px,1fr) 150px auto!important;gap:12px!important;align-items:end!important;padding-bottom:17px!important;border-bottom:1px solid #2d4b68!important}.consumption-form label{display:grid!important;gap:6px!important;color:#a4b8cf!important;font-size:11px!important;font-weight:800!important}.consumption-form select,.consumption-form input{height:43px!important;padding:0 11px!important;border:1px solid #365b7b!important;border-radius:9px!important;outline:0!important;background:#102039!important;color:#f0f8ff!important}.consumption-list article{display:grid!important;grid-template-columns:1fr auto 30px!important;gap:14px!important;align-items:center!important;padding:13px 4px!important;border-bottom:1px solid #294762!important}.consumption-list article b{font-size:13px!important}.consumption-list article p{margin:4px 0 0!important;color:#99aec6!important;font-size:11px!important}.consumption-list article strong{color:#ffadba!important;font-size:13px!important}.consumption-list article button{width:28px!important;height:28px!important;border:1px solid #3c6988!important;border-radius:8px!important;background:#1b4564!important;color:#8bdefc!important;font-size:17px!important;cursor:pointer!important}@media(max-width:620px){.consumption-form{grid-template-columns:1fr!important}.consumption-form .primary-btn{width:100%!important}.consumption-list article{grid-template-columns:1fr auto!important}.consumption-list article button{grid-column:2!important}}</style>`)
  content.insertAdjacentHTML('beforeend', `<style>#content .stages-panel{margin-top:18px!important;padding:21px!important;border:1px solid #2c4d6b!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important}#content .stages-panel header{display:flex!important;justify-content:space-between!important;gap:12px!important;align-items:flex-start!important;margin-bottom:15px!important}#content .stages-panel h2{margin:0!important;font-size:18px!important}#content .stages-panel header p{margin:5px 0 0!important;color:#9cafc5!important;font-size:12px!important}#content .stages-panel header>span{color:#82ddff!important;font-size:11px!important;font-weight:800!important}.module-stages{border-top:1px solid #2d4b68!important}.module-stage{display:grid!important;grid-template-columns:1fr auto!important;gap:10px!important;align-items:center!important;padding:11px 3px!important;border-bottom:1px solid #2d4b68!important}.stage-title{display:flex!important;gap:10px!important;align-items:center!important}.stage-title>span{display:grid!important;place-items:center!important;width:25px!important;height:25px!important;border-radius:8px!important;background:#254b6c!important;color:#83dfff!important;font-size:11px!important;font-weight:800!important}.stage-title b{font-size:13px!important}.stage-status-actions{display:flex!important;flex-wrap:wrap!important;justify-content:flex-end!important;gap:6px!important;align-items:center!important}.stage-status-actions button{width:30px!important;height:30px!important;border-radius:8px!important;cursor:pointer!important;font-weight:900!important;font-size:16px!important;opacity:.5!important}.stage-status-actions button:disabled{cursor:not-allowed!important;opacity:.18!important}.stage-status-actions button.selected{opacity:1!important;box-shadow:0 0 0 2px rgba(255,255,255,.17)!important}.stage-red{border:1px solid #863d50!important;background:#472332!important;color:#ff9bae!important}.stage-yellow{border:1px solid #896a21!important;background:#4c3a15!important;color:#ffd469!important}.stage-green{border:1px solid #27775b!important;background:#123e35!important;color:#7bf0b6!important}.stage-edit,.stage-move{border:1px solid #3b6483!important;background:#173854!important;color:#9be5ff!important}.stage-remove{border:1px solid #643445!important;background:#2e2030!important;color:#ff9bad!important}.module-stage small{grid-column:1/-1!important;margin-left:35px!important;font-size:10px!important;font-weight:800!important}.stage-add-form{display:grid!important;grid-template-columns:1fr minmax(170px,260px) auto!important;gap:10px!important;padding-top:16px!important}.stage-add-form input,.stage-add-form select{height:42px!important;padding:0 12px!important;border:1px solid #365b7b!important;border-radius:9px!important;outline:0!important;background:#102039!important;color:#f0f8ff!important}.stage-add-form input:focus,.stage-add-form select:focus{border-color:#59cdf5!important}@media(max-width:760px){.module-stage{grid-template-columns:1fr!important}.stage-status-actions{justify-content:flex-start!important;margin-left:35px!important}.stage-add-form{grid-template-columns:1fr!important}.stage-add-form .primary-btn{width:100%!important}}</style>`)
  content.insertAdjacentHTML('beforeend', `<style>#content .module-stage{grid-template-columns:1fr auto 60px!important}.stage-percent{display:flex!important;align-items:center!important;gap:4px!important;color:#a8bed4!important;font-size:11px!important;font-weight:800!important}.stage-percent input{width:43px!important;height:30px!important;padding:0 4px!important;border:1px solid #3d6686!important;border-radius:8px!important;outline:0!important;background:#102039!important;color:#f1f8ff!important;text-align:center!important;font-weight:800!important}.stage-percent input:focus{border-color:#59cdf5!important}@media(max-width:760px){#content .module-stage{grid-template-columns:1fr!important}.stage-percent{margin-left:35px!important}.stage-percent input{width:58px!important}}</style>`)
  content.insertAdjacentHTML('beforeend', `<style>#content .module-stage{grid-template-columns:1fr auto!important}.stage-status-line{grid-column:1/-1!important;display:flex!important;justify-content:space-between!important;align-items:center!important;gap:14px!important;margin-left:35px!important}.stage-status-line small{display:inline-flex!important;align-items:center!important;width:max-content!important;margin:0!important;padding:4px 8px!important;border-radius:7px!important;font-size:10px!important;font-weight:800!important}.stage-status-line .stage-percent{margin:0!important}.stage-percent span,.stage-percent i{font-style:normal!important;color:#a8bed4!important;font-size:11px!important}@media(max-width:760px){.stage-status-line{margin-left:35px!important}.stage-status-line .stage-percent{margin:0!important}}</style>`)
  document.querySelector('#back-module-type').addEventListener('click', () => moduleDetailPage(typeId))
  document.querySelector('#module-stage-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = form.get('stage-title').trim()
    const insertAfter = form.get('insert-after')
    if (!title) return
    const newStage = { id: `dodatno-${Date.now()}`, title, status: 'nije-zavrseno', percent: 0, custom: true }
    const position = insertAfter === 'start' ? -1 : unit.stages.findIndex((stage) => stage.id === insertAfter)
    unit.stages.splice(position + 1, 0, newStage)
    saveModuleDetails()
    moduleUnitPage(typeId, unitId)
  })
  document.querySelector('#module-stages').addEventListener('click', (event) => {
    const statusButton = event.target.closest('[data-stage-status]')
    const removeButton = event.target.closest('[data-remove-stage]')
    const editButton = event.target.closest('[data-edit-stage]')
    const moveButton = event.target.closest('[data-move-stage]')
    if (statusButton) {
      const stage = unit.stages.find((entry) => entry.id === statusButton.dataset.stageId)
      if (!stage) return
      stage.status = statusButton.dataset.stageStatus
      saveModuleDetails()
      moduleUnitPage(typeId, unitId)
      return
    }
    if (editButton) {
      const stage = unit.stages.find((entry) => entry.id === editButton.dataset.editStage)
      if (!stage) return
      const title = prompt('Izmenite naziv faze:', stage.title)
      if (title === null || !title.trim()) return
      stage.title = title.trim()
      saveModuleDetails()
      moduleUnitPage(typeId, unitId)
      return
    }
    if (moveButton) {
      const index = unit.stages.findIndex((stage) => stage.id === moveButton.dataset.stageId)
      const target = moveButton.dataset.moveStage === 'up' ? index - 1 : index + 1
      if (index < 0 || target < 0 || target >= unit.stages.length) return
      ;[unit.stages[index], unit.stages[target]] = [unit.stages[target], unit.stages[index]]
      saveModuleDetails()
      moduleUnitPage(typeId, unitId)
      return
    }
    if (removeButton) {
      const stage = unit.stages.find((entry) => entry.id === removeButton.dataset.removeStage)
      if (!stage || !confirm(`Obrisati fazu: ${stage.title}?`)) return
      unit.stages = unit.stages.filter((entry) => entry !== stage)
      saveModuleDetails()
      moduleUnitPage(typeId, unitId)
    }
  })
  document.querySelector('#module-stages').addEventListener('change', (event) => {
    const input = event.target.closest('[data-stage-percent]')
    if (!input) return
    const stage = unit.stages.find((entry) => entry.id === input.dataset.stagePercent)
    if (!stage) return
    stage.percent = Math.max(0, Math.min(100, Number(input.value) || 0))
    saveModuleDetails()
    moduleUnitPage(typeId, unitId)
  })
  document.querySelector('#module-unit-form').addEventListener('submit', (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); unit.progress = Math.max(0, Math.min(100, Number(form.get('progress')) || 0)); unit.work = form.get('work').trim(); unit.note = form.get('note').trim(); saveModuleDetails(); moduleUnitPage(typeId, unitId) })
  document.querySelector('#module-gallery').addEventListener('click', (event) => { const button = event.target.closest('[data-delete-photo]'); if (!button) return; unit.photos.splice(Number(button.dataset.deletePhoto), 1); saveModuleDetails(); moduleUnitPage(typeId, unitId) })
  document.querySelector('#module-photo-input').addEventListener('change', (event) => {
    const files = [...event.target.files].slice(0, Math.max(0, 3 - unit.photos.length))
    if (!files.length) return
    if (files.some((file) => file.size > 900000)) { alert('Jedna ili vise slika je prevelika. Izaberite fotografiju manju od 900 KB.'); event.target.value = ''; return }
    Promise.all(files.map((file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ data: reader.result, date: today }); reader.readAsDataURL(file) }))).then((photos) => { unit.photos.push(...photos); saveModuleDetails(); moduleUnitPage(typeId, unitId) }).catch(() => alert('Fotografija nije mogla biti dodata.'))
  })
  document.querySelector('#consumption-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const item = materials.find((entry) => entry.id === Number(data.get('material')))
    const quantity = Number(data.get('quantity'))
    if (!item || !Number.isInteger(quantity) || quantity < 1) return
    if (item.stock < quantity) { alert(`Nema dovoljno materijala. Na stanju je ${item.stock} ${item.unit}.`); return }
    const before = item.stock
    item.stock -= quantity
    unit.consumption.push({ id: String(Date.now()), materialId: item.id, name: item.name, unit: item.unit, quantity, date: today, before, after: item.stock })
    saveInventory()
    saveModuleDetails()
    moduleUnitPage(typeId, unitId)
  })
  document.querySelector('#consumption-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-undo-consumption]')
    if (!button) return
    const entry = unit.consumption.find((item) => item.id === button.dataset.undoConsumption)
    if (!entry || !confirm(`Vratiti ${entry.quantity} ${entry.unit} na stanje magacina?`)) return
    const item = materials.find((material) => material.id === Number(entry.materialId))
    if (item) { item.stock += Number(entry.quantity); saveInventory() }
    unit.consumption = unit.consumption.filter((item) => item !== entry)
    saveModuleDetails()
    moduleUnitPage(typeId, unitId)
  })
}

const dateKeyFor = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function attendanceFor(dateKey) {
  if (!state.attendance[dateKey]) {
    state.attendance[dateKey] = Object.fromEntries(state.employees.map((employee) => [employee.id, employee.active !== false]))
    saveAttendance()
  }
  return state.attendance[dateKey]
}

function dailyReportPage(dateKey = dateKeyFor()) {
  const attendance = attendanceFor(dateKey)
  const activeToday = state.employees.filter((employee) => attendance[employee.id] !== false)
  const inactiveToday = state.employees.filter((employee) => attendance[employee.id] === false)
  const dateTitle = new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${dateKey}T12:00:00`))

  content.innerHTML = `<section class="page-heading attendance-heading"><div><p class="eyebrow">Kontrolna tabla rada</p><h1>Dnevno stanje ljudi</h1><p>Izaberite datum i označite ko je bio aktivan na gradilištu.</p></div><label class="attendance-date"><span>Datum</span><input id="attendance-date" type="date" value="${dateKey}"></label></section><section class="attendance-stats"><article><span class="stat-icon blue">☷</span><p>Ukupno zaposlenih</p><strong>${state.employees.length}</strong><small>evidencija za izabrani dan</small></article><article><span class="stat-icon green">✓</span><p>Aktivni danas</p><strong>${activeToday.length}</strong><small>prisutni na radu</small></article><article><span class="stat-icon red">×</span><p>Neaktivni danas</p><strong>${inactiveToday.length}</strong><small>nisu bili na radu</small></article></section><section class="attendance-panel"><header><div><h2>Prisustvo zaposlenih</h2><p>${dateTitle.charAt(0).toLocaleUpperCase('sr')}${dateTitle.slice(1)}</p></div><span>Promene se čuvaju automatski</span></header><div class="attendance-list">${state.employees.length ? state.employees.map((employee) => { const initials = employee.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(); const active = attendance[employee.id] !== false; return `<article class="attendance-row"><span class="employee-avatar">${initials}</span><div class="attendance-person"><b>${esc(employee.name)}</b><small>${esc(employee.role)}</small></div><div class="attendance-actions"><button class="attendance-status ${active ? 'selected-active' : ''}" data-attendance="active" data-employee-id="${employee.id}">Aktivan</button><button class="attendance-status ${!active ? 'selected-inactive' : ''}" data-attendance="inactive" data-employee-id="${employee.id}">Neaktivan</button></div></article>` }).join('') : '<p class="attendance-empty">Nema zaposlenih za evidenciju.</p>'}</div></section>`

  document.querySelector('#attendance-date').addEventListener('change', (event) => dailyReportPage(event.target.value || dateKeyFor()))
  document.querySelector('.attendance-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-attendance]')
    if (!button) return
    attendance[Number(button.dataset.employeeId)] = button.dataset.attendance === 'active'
    saveAttendance()
    dailyReportPage(dateKey)
  })
}

function workHoursFor(dateKey) {
  if (!state.workHours[dateKey]) state.workHours[dateKey] = {}
  state.employees.forEach((employee) => {
    if (state.workHours[dateKey][employee.id] === undefined) state.workHours[dateKey][employee.id] = employee.active === false ? 0 : 9
  })
  return state.workHours[dateKey]
}

function workHoursPage(dateKey = dateKeyFor()) {
  const hours = workHoursFor(dateKey)
  const total = state.employees.reduce((sum, employee) => sum + (Number(hours[employee.id]) || 0), 0)
  const average = state.employees.length ? (total / state.employees.length).toFixed(1).replace('.', ',') : '0'
  const date = new Date(`${dateKey}T12:00:00`)
  const dateTitle = new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  const savedNotice = state.lastSavedWorkHours === dateKey ? `<div class="hours-saved">✓ Sačuvano za <b>${dateKey}</b>. Ove sate ponovo nalazite ovde u meniju <b>Radni sati</b>, kada izaberete isti datum.</div>` : ''
  content.innerHTML = `<section class="page-heading hours-heading"><div><p class="eyebrow">Evidencija rada</p><h1>Radni sati</h1><p>Unesite i sacuvajte broj radnih sati za svaki dan.</p></div><label class="attendance-date"><span>Datum</span><input id="hours-date" type="date" value="${dateKey}"></label></section>${savedNotice}<section class="hours-summary"><article><span class="stat-icon blue">&#9201;</span><p>Ukupno sati danas</p><strong>${total.toLocaleString('sr-RS')}</strong><small>zbir cele ekipe</small></article><article><span class="stat-icon green">&#9787;</span><p>Zaposlenih</p><strong>${state.employees.length}</strong><small>u dnevnoj evidenciji</small></article><article><span class="stat-icon amber">&#8776;</span><p>Prosek po radniku</p><strong>${average}</strong><small>sati za izabrani dan</small></article></section><section class="hours-panel"><header><div><h2>Dnevna evidencija sati</h2><p>${dateTitle.charAt(0).toLocaleUpperCase('sr')}${dateTitle.slice(1)}.</p></div><span>Podrazumevano: 9 sati</span></header><form id="hours-form"><div class="hours-list">${state.employees.length ? state.employees.map((employee) => { const initials = employee.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(); const value = hours[employee.id]; return `<article class="hours-row"><span class="employee-avatar">${initials}</span><div><b>${esc(employee.name)}</b><p>${esc(employee.role)} ${employee.active === false ? '<em>Neaktivan</em>' : ''}</p></div><label>Sati<input name="hours-${employee.id}" type="number" min="0" max="24" step="0.5" value="${value}"></label></article>` }).join('') : '<p class="plan-empty">Nema zaposlenih u evidenciji.</p>'}</div><div class="hours-actions"><span>Promenite sate po potrebi, pa sacuvajte dnevni zbir.</span><button class="primary-btn">Sacuvaj sate za ovaj dan</button></div></form></section>`
  content.insertAdjacentHTML('afterbegin', `<style>#content .hours-heading{align-items:flex-end!important}#content .hours-saved{margin:-4px 0 18px!important;padding:13px 16px!important;border:1px solid #267e5f!important;border-radius:12px!important;background:#123e36!important;color:#a7f5d4!important;font-size:13px!important}#content .hours-summary{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:16px!important;margin-bottom:20px!important}#content .hours-summary article{padding:20px!important;border:1px solid #2d4c6b!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important}#content .hours-summary p{margin:14px 0 4px!important;color:#9cb1c8!important;font-size:13px!important}#content .hours-summary strong{display:block!important;font-size:29px!important}#content .hours-summary small{color:#7890aa!important;font-size:11px!important}#content .hours-panel{padding:22px!important;border:1px solid #2c4c6b!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important}#content .hours-panel header{display:flex!important;justify-content:space-between!important;gap:14px!important;align-items:flex-start!important;margin-bottom:16px!important}#content .hours-panel h2{margin:0!important;font-size:18px!important}#content .hours-panel header p{margin:5px 0 0!important;color:#a0b4ca!important;font-size:12px!important}#content .hours-panel header>span{color:#83ddff!important;font-size:11px!important;font-weight:800!important}.hours-list{border-top:1px solid #2b4966!important}.hours-row{display:grid!important;grid-template-columns:auto 1fr 120px!important;gap:13px!important;align-items:center!important;padding:13px 4px!important;border-bottom:1px solid #2b4966!important}.hours-row>div b{display:block!important;font-size:13px!important}.hours-row>div p{margin:4px 0 0!important;color:#9bafc5!important;font-size:11px!important}.hours-row>div em{margin-left:7px;color:#ff9db0!important;font-style:normal!important;font-weight:800!important}.hours-row label{display:grid!important;grid-template-columns:1fr auto!important;align-items:center!important;gap:8px!important;color:#9db2c8!important;font-size:11px!important;font-weight:800!important}.hours-row input{width:58px!important;height:39px!important;padding:0 8px!important;border:1px solid #3d6686!important;border-radius:9px!important;outline:0!important;background:#102039!important;color:#f1f8ff!important;font-weight:800!important;text-align:center!important}.hours-row input:focus{border-color:#59cdf5!important;box-shadow:0 0 0 3px rgba(67,197,246,.13)!important}.hours-actions{display:flex!important;justify-content:space-between!important;gap:12px!important;align-items:center!important;padding-top:18px!important;color:#9aafc5!important;font-size:12px!important}@media(max-width:700px){#content .hours-heading{align-items:flex-start!important}#content .hours-summary{grid-template-columns:1fr!important}.hours-row{grid-template-columns:auto 1fr!important}.hours-row label{grid-column:1/-1!important;justify-self:stretch!important}.hours-row input{width:76px!important}.hours-actions{align-items:stretch!important;flex-direction:column!important}.hours-actions .primary-btn{width:100%!important}}</style>`)
  content.insertAdjacentHTML('afterbegin', `<style>#content .hours-summary article,#content .hours-panel{border-color:rgba(239,190,68,.52)!important;box-shadow:inset 0 1px 0 rgba(255,230,142,.08),0 12px 28px rgba(0,0,0,.14)!important;position:relative!important;overflow:hidden!important}#content .hours-summary article:before,#content .hours-panel:before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,217,116,.9),transparent)}</style>`)
  document.querySelector('#hours-date').addEventListener('change', (event) => workHoursPage(event.target.value || dateKeyFor()))
  document.querySelector('#hours-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    state.employees.forEach((employee) => { hours[employee.id] = Math.max(0, Math.min(24, Number(form.get(`hours-${employee.id}`)) || 0)) })
    saveWorkHours()
    state.lastSavedWorkHours = dateKey
    workHoursPage(dateKey)
  })
}

function monthlyHoursPage(monthKey = dateKeyFor().slice(0, 7)) {
  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthTitle = new Intl.DateTimeFormat('sr-Latn-RS', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  const totals = state.employees.map((employee) => {
    const values = Object.entries(state.workHours).filter(([date]) => date.startsWith(`${monthKey}-`)).map(([, daily]) => Number(daily[employee.id]) || 0)
    const workDays = values.filter((value) => value > 0).length
    return { employee, total: values.reduce((sum, value) => sum + value, 0), workDays, nonWorkDays: daysInMonth - workDays }
  })
  const allHours = totals.reduce((sum, entry) => sum + entry.total, 0)
  content.innerHTML = `<section class="page-heading monthly-heading"><div><p class="eyebrow">Evidencija rada</p><h1>Mesecni pregled sati</h1><p>Pregled sacuvanih radnih sati po zaposlenom.</p></div><label class="attendance-date"><span>Mesec</span><input id="monthly-hours-date" type="month" value="${monthKey}"></label></section><section class="monthly-stats"><article><span>Ukupno sati</span><strong>${allHours.toLocaleString('sr-RS')}</strong><small>za ceo tim</small></article><article><span>Broj zaposlenih</span><strong>${state.employees.length}</strong><small>u evidenciji</small></article><article><span>Mesec</span><strong>${daysInMonth}</strong><small>kalendarskih dana</small></article></section><section class="monthly-panel"><header><div><h2>${monthTitle.charAt(0).toLocaleUpperCase('sr')}${monthTitle.slice(1)}</h2><p>Radni dani se racunaju samo kada zaposleni ima vise od 0 upisanih sati.</p></div></header><div class="monthly-table"><div class="monthly-head"><span>Zaposleni</span><span>Ukupno sati</span><span>Radnih dana</span><span>Neradnih dana</span></div>${totals.length ? totals.map(({ employee, total, workDays, nonWorkDays }) => `<div class="monthly-row"><span><b>${esc(employee.name)}</b><small>${esc(employee.role)}</small></span><strong>${total.toLocaleString('sr-RS')} h</strong><em class="work-days">${workDays}</em><em class="non-work-days">${nonWorkDays}</em></div>`).join('') : '<p class="plan-empty">Nema zaposlenih u evidenciji.</p>'}</div></section>`
  content.insertAdjacentHTML('afterbegin', `<style>#content .monthly-heading{align-items:flex-end!important}#content .monthly-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:16px!important;margin-bottom:20px!important}#content .monthly-stats article,#content .monthly-panel{padding:20px!important;border:1px solid #2d4c6b!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important}#content .monthly-stats span,#content .monthly-stats small{display:block!important;color:#9db2c9!important;font-size:12px!important}#content .monthly-stats strong{display:block!important;margin:10px 0 3px!important;font-size:29px!important}.monthly-panel header{margin-bottom:16px!important}.monthly-panel h2{margin:0!important;font-size:19px!important}.monthly-panel header p{margin:6px 0 0!important;color:#9db2c9!important;font-size:12px!important}.monthly-table{border-top:1px solid #2b4966!important}.monthly-head,.monthly-row{display:grid!important;grid-template-columns:2fr 1fr 1fr 1fr!important;gap:14px!important;align-items:center!important}.monthly-head{padding:11px 4px!important;color:#7991ab!important;font-size:10px!important;font-weight:800!important;text-transform:uppercase!important;letter-spacing:.06em!important}.monthly-row{padding:14px 4px!important;border-top:1px solid #2b4966!important}.monthly-row b,.monthly-row small{display:block!important}.monthly-row b{font-size:13px!important}.monthly-row small{margin-top:4px!important;color:#9db2c9!important;font-size:11px!important}.monthly-row strong{font-size:15px!important}.monthly-row em{width:max-content!important;padding:5px 9px!important;border-radius:999px!important;font-style:normal!important;font-size:12px!important;font-weight:800!important}.work-days{color:#84f2bf!important;background:#123f36!important}.non-work-days{color:#ffc3cb!important;background:#482535!important}@media(max-width:700px){#content .monthly-heading{align-items:flex-start!important}#content .monthly-stats{grid-template-columns:1fr!important}.monthly-head{display:none!important}.monthly-row{grid-template-columns:1fr 1fr!important}.monthly-row>span{grid-column:1/-1!important}.monthly-row strong:before{content:'Ukupno: '!important;color:#9db2c9!important;font-size:11px!important}.work-days:before{content:'Radni: '!important}.non-work-days:before{content:'Neradni: '!important}}</style>`)
  content.insertAdjacentHTML('afterbegin', `<style>#content .monthly-stats article,#content .monthly-panel{border-color:rgba(239,190,68,.52)!important;box-shadow:inset 0 1px 0 rgba(255,230,142,.08),0 12px 28px rgba(0,0,0,.14)!important;position:relative!important;overflow:hidden!important}#content .monthly-stats article:before,#content .monthly-panel:before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,217,116,.9),transparent)}</style>`)
  document.querySelector('#monthly-hours-date').addEventListener('change', (event) => monthlyHoursPage(event.target.value || dateKeyFor().slice(0, 7)))
}

function workPlanPage(dateKey = dateKeyFor()) {
  const plans = state.workPlans[dateKey] || []
  const activeEmployees = state.employees.filter((employee) => employee.active !== false)
  const date = new Date(`${dateKey}T12:00:00`)
  const dateTitle = new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  const completed = plans.filter((plan) => plan.done).length
  const previous = new Date(date); previous.setDate(previous.getDate() - 1)
  const next = new Date(date); next.setDate(next.getDate() + 1)

  content.innerHTML = `<section class="page-heading plan-heading"><div><p class="eyebrow">Organizacija gradilista</p><h1>Plan rada</h1><p>Napravite dnevni plan i dodelite zadatke zaposlenima.</p></div><div class="plan-calendar"><button type="button" class="calendar-step" data-plan-date="${dateKeyFor(previous)}" aria-label="Prethodni dan">&larr;</button><label><span>Datum plana</span><input id="plan-date" type="date" value="${dateKey}"></label><button type="button" class="calendar-step" data-plan-date="${dateKeyFor(next)}" aria-label="Sledeci dan">&rarr;</button></div></section><section class="plan-summary"><article><span class="stat-icon blue">&#9672;</span><p>Datum</p><strong>${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}</strong><small>${date.getFullYear()}</small></article><article><span class="stat-icon green">&#10003;</span><p>Zavrseni zadaci</p><strong>${completed}</strong><small>od ${plans.length} planiranih</small></article><article><span class="stat-icon amber">!</span><p>Aktivni zaposleni</p><strong>${activeEmployees.length}</strong><small>dostupni za plan</small></article></section><section class="plan-layout"><article class="plan-panel"><header><div><h2>Dodaj zadatak</h2><p>${dateTitle.charAt(0).toLocaleUpperCase('sr')}${dateTitle.slice(1)}</p></div></header><form id="work-plan-form" class="work-plan-form"><label>Zaposleni<select name="employee" required>${activeEmployees.length ? activeEmployees.map((employee) => `<option value="${employee.id}">${esc(employee.name)} - ${esc(employee.role)}</option>`).join('') : '<option value="">Nema aktivnih zaposlenih</option>'}</select></label><label>Modul<select name="module"><option value="MV">MV</option><option value="MVS">MVS</option><option value="RPP">RPP</option><option value="Ostalo">Ostalo</option></select></label><label class="plan-task-field">Zadatak<input name="task" maxlength="160" required placeholder="npr. Postaviti plywood na MV-01"></label><label>Vreme<input name="time" type="time" value="07:00"></label><button class="primary-btn" ${activeEmployees.length ? '' : 'disabled'}>+ Dodaj u plan</button></form></article><article class="plan-panel plan-list-panel"><header><div><h2>Dnevni plan</h2><p>${plans.length ? `${plans.length} zadataka za danas` : 'Jos nema planiranih zadataka.'}</p></div><span>${completed}/${plans.length} zavrseno</span></header><div id="work-plan-list" class="work-plan-list">${plans.length ? plans.map((plan) => { const employee = state.employees.find((entry) => entry.id === Number(plan.employeeId)); return `<article class="planned-task ${plan.done ? 'done' : ''}" data-plan-id="${plan.id}"><button class="plan-check" data-plan-check="${plan.id}" title="Oznaci kao zavrseno">${plan.done ? '&#10003;' : ''}</button><div><b>${esc(plan.task)}</b><p>${esc(employee?.name || 'Obrisan zaposleni')} <span>${esc(plan.module)}</span> <em>${esc(plan.time || '--:--')}</em></p></div><button class="plan-delete" data-plan-delete="${plan.id}" title="Obrisi zadatak">&times;</button></article>` }).join('') : '<p class="plan-empty">Dodajte prvi zadatak za izabrani dan.</p>'}</div></article></section>`

  document.querySelector('#plan-date').addEventListener('change', (event) => workPlanPage(event.target.value || dateKeyFor()))
  document.querySelectorAll('[data-plan-date]').forEach((button) => button.addEventListener('click', () => workPlanPage(button.dataset.planDate)))
  document.querySelector('#work-plan-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!data.get('task').trim() || !data.get('employee')) return
    if (!state.workPlans[dateKey]) state.workPlans[dateKey] = []
    state.workPlans[dateKey].push({ id: String(Date.now()), employeeId: Number(data.get('employee')), module: data.get('module'), task: data.get('task').trim(), time: data.get('time'), done: false })
    saveWorkPlans()
    workPlanPage(dateKey)
  })
  document.querySelector('#work-plan-list').addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-plan-check]')
    const remove = event.target.closest('[data-plan-delete]')
    if (!toggle && !remove) return
    const planId = (toggle || remove).dataset.planCheck || (toggle || remove).dataset.planDelete
    const plan = (state.workPlans[dateKey] || []).find((entry) => entry.id === planId)
    if (!plan) return
    if (toggle) plan.done = !plan.done
    if (remove) state.workPlans[dateKey] = state.workPlans[dateKey].filter((entry) => entry !== plan)
    saveWorkPlans()
    workPlanPage(dateKey)
  })
}

const workDiaryDriveFolderUrl = 'https://drive.google.com/drive/folders/18rniLSVBoCf_KKT-qhq65F2ZRvJvdEnR'
const workDiaryUploadUrl = 'https://script.google.com/macros/s/AKfycbx3jJEO2SNjFt6f6ZaqhpnPSs9jNk8iFBLCMZYdTeX73YpTIc62Ayu8Ind95RpRLQ0H0Q/exec'
const workDiaryUploadToken = 'tasker-2026-dnevnik-7f3c91'

const loadWorkDiary = () => {
  try { return JSON.parse(localStorage.getItem(diaryStorage) || '{}') || {} } catch { return {} }
}
const saveWorkDiary = (date, text, extra = {}) => {
  const diary = loadWorkDiary()
  diary[date] = { text, ...extra, updatedAt: new Date().toISOString() }
  localStorage.setItem(diaryStorage, JSON.stringify(diary))
}
const loadPdfLibrary = () => new Promise((resolve, reject) => {
  if (window.jspdf?.jsPDF) { resolve(window.jspdf.jsPDF); return }
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  script.onload = () => resolve(window.jspdf.jsPDF)
  script.onerror = () => reject(new Error('PDF biblioteka nije dostupna.'))
  document.head.appendChild(script)
})

const workDiaryDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('tasker-work-diary', 1)
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains('pdfs')) request.result.createObjectStore('pdfs', { keyPath: 'id' })
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})
const storeWorkDiaryPdf = async (entry) => {
  const db = await workDiaryDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pdfs', 'readwrite')
    transaction.objectStore('pdfs').put(entry)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
}
const listWorkDiaryPdfs = async () => {
  const db = await workDiaryDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction('pdfs', 'readonly').objectStore('pdfs').getAll()
    request.onsuccess = () => resolve(request.result.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))))
    request.onerror = () => reject(request.error)
  })
}
const deleteWorkDiaryPdf = async (id) => {
  const db = await workDiaryDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pdfs', 'readwrite')
    transaction.objectStore('pdfs').delete(id)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
}
const renderWorkDiaryArchive = async () => {
  const archive = document.querySelector('#work-diary-archive-list')
  if (!archive) return
  try {
    const entries = await listWorkDiaryPdfs()
    archive.innerHTML = entries.length ? entries.map((entry) => `<article class="work-diary-file" data-diary-id="${esc(entry.id)}"><span class="work-diary-file-icon">PDF</span><div><b>${esc(entry.fileName)}</b><small>Sačuvano ${new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</small></div><div class="work-diary-file-actions"><button type="button" class="diary-share" data-diary-share="${esc(entry.id)}">↗ Pošalji</button><button type="button" data-diary-open="${esc(entry.id)}">Otvori</button><button type="button" class="diary-delete" data-diary-delete="${esc(entry.id)}" aria-label="Obriši PDF">&times;</button></div></article>`).join('') : '<p class="work-diary-empty">Još nema sačuvanih PDF dnevnika.</p>'
  } catch {
    archive.innerHTML = '<p class="work-diary-empty">Lokalna arhiva trenutno nije dostupna.</p>'
  }
}

const loadHtml2Canvas = () => new Promise((resolve, reject) => {
  if (window.html2canvas) { resolve(window.html2canvas); return }
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
  script.onload = () => resolve(window.html2canvas)
  script.onerror = () => reject(new Error('Prikaz PDF stranice nije dostupan.'))
  document.head.appendChild(script)
})

function workDiaryPage(selectedDate = todayInputValue()) {
  const diary = loadWorkDiary()
  const saved = diary[selectedDate] || {}
  const savedText = saved.text || ''
  const savedHtml = saved.html || esc(savedText).replace(/\n/g, '<div><br></div>')
  const defaultDocumentNumber = `DR-${selectedDate.replaceAll('-', '')}-001`
  let lineCount = Math.max(10, Math.min(30, Number(saved.lineCount) || 22))
  content.innerHTML = `<section class="work-diary-page">
    <header class="work-diary-heading">
      <span></span>
      <h1>Dnevnik rada</h1>
      <div class="diary-document-meta">
        <label>Datum<input id="work-diary-date" type="date" value="${esc(selectedDate)}"></label>
        <label>Broj dokumenta<input id="diary-document-number" required maxlength="40" value="${esc(saved.documentNumber || defaultDocumentNumber)}" placeholder="npr. DR-20260725-001"></label>
      </div>
    </header>
    <section class="diary-toolbar" aria-label="Alati za uređivanje teksta">
      <label>Font<select id="diary-font"><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Courier New">Courier</option><option value="Times New Roman">Times</option></select></label>
      <label>Veličina<select id="diary-font-size"><option value="2">Mala</option><option value="3" selected>Normalna</option><option value="4">Velika</option><option value="5">Naslov</option></select></label>
      <button type="button" data-diary-command="bold" title="Podebljano"><b>B</b></button>
      <button type="button" data-diary-command="italic" title="Kurziv"><i>I</i></button>
      <span class="diary-position-tools" aria-label="Položaj slova">
        <button type="button" data-diary-position="super" title="Slova gore">A<sup>↑</sup></button>
        <button type="button" data-diary-position="normal" title="Slova na sredini">A–</button>
        <button type="button" data-diary-position="sub" title="Slova dole">A<sub>↓</sub></button>
      </span>
      <label class="diary-color-label">Boja<input id="diary-color" type="color" value="#172033" title="Boja označenog teksta"></label>
      <div class="diary-line-control"><span>Linije</span><button type="button" id="diary-line-minus">−</button><b id="diary-line-count">${lineCount}</b><button type="button" id="diary-line-plus">+</button></div>
    </section>
    <section class="work-diary-paper">
      <div id="work-diary-text" class="work-diary-editor" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Upišite dnevno izvešće rada..." style="--diary-line-count:${lineCount}">${savedHtml}</div>
    </section>
    <section class="diary-stamp-options">
      <label class="stamp-toggle"><input id="diary-stamp-enabled" type="checkbox" ${saved.stampEnabled ? 'checked' : ''}><span>Dodaj pečat „Pripremio“ na PDF</span></label>
      <label class="stamp-name">Ime na pečatu<input id="diary-prepared-by" value="${esc(saved.preparedBy || state.settings.userName || 'Stefan')}" maxlength="50"></label>
    </section>
    <div class="work-diary-actions">
      <p id="work-diary-status" role="status">Označite reč pa izaberite font ili boju.</p>
      <button id="save-work-diary" class="primary-btn" type="button">Sačuvaj u Tasker</button>
    </div>
    <section class="work-diary-archive">
      <header><span class="work-diary-folder-icon">▰</span><div><h2>Sačuvani dnevnici</h2><p>PDF arhiva na ovom uređaju</p></div></header>
      <div id="work-diary-archive-list" class="work-diary-archive-list"><p class="work-diary-empty">Učitavanje...</p></div>
    </section>
  </section>
  <style id="work-diary-layout">
    #content .work-diary-page{max-width:920px;margin:0 auto}
    #content .work-diary-heading{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:18px;margin-bottom:18px}
    #content .work-diary-heading h1{margin:0;text-align:center;font-size:32px;color:var(--text)}
    #content .diary-document-meta{justify-self:end;display:grid;grid-template-columns:auto auto;gap:10px}
    #content .work-diary-heading label{display:grid;gap:6px;color:var(--muted);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
    #content .work-diary-heading input{padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--panel);color:var(--text);font:inherit;color-scheme:dark}
    #content .diary-toolbar{display:flex;align-items:end;gap:9px;flex-wrap:wrap;padding:12px 14px;border:1px solid #385273;border-bottom:0;border-radius:14px 14px 0 0;background:#15253d}
    #content .diary-toolbar label{display:grid;gap:4px;color:var(--muted);font-size:9px;font-weight:800;text-transform:uppercase}
    #content .diary-toolbar select,#content .diary-toolbar button{height:34px;padding:0 10px;border:1px solid #3b5675;border-radius:7px;background:#1d314e;color:#edf7ff;font:inherit;cursor:pointer}
    #content .diary-toolbar>button{min-width:36px;font-size:15px}#content .diary-position-tools{display:flex;gap:5px;padding-left:8px;border-left:1px solid #3b5675}#content .diary-position-tools button{min-width:38px;font-size:14px}#content .diary-position-tools sup,#content .diary-position-tools sub{font-size:9px}
    #content .diary-color-label input{width:44px;height:34px;padding:3px;border:1px solid #3b5675;border-radius:7px;background:#1d314e}
    #content .diary-line-control{display:flex;align-items:center;gap:7px;margin-left:auto;color:var(--muted);font-size:10px;font-weight:800;text-transform:uppercase}
    #content .diary-line-control button{width:34px;padding:0;font-size:18px}
    #content .diary-line-control b{min-width:24px;color:#fff;text-align:center;font-size:13px}
    #content .work-diary-paper{padding:30px 38px 34px;border:1px solid #385273;border-radius:0 0 16px 16px;background:#f8f4e8;box-shadow:0 16px 40px rgba(0,0,0,.2)}
    #content .work-diary-editor{display:block;width:100%;min-height:calc(var(--diary-line-count) * 38px);box-sizing:border-box;border:0;outline:0;padding:0 8px;color:#172033;background:repeating-linear-gradient(to bottom,transparent 0,transparent 37px,#9db1c7 38px,#9db1c7 39px);font:18px/38px Arial,sans-serif;overflow-wrap:anywhere}
    #content .work-diary-editor:empty:before{content:attr(data-placeholder);color:#7b8795}
    #content .diary-stamp-options{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:14px;padding:13px 16px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
    #content .stamp-toggle{display:flex;align-items:center;gap:9px;color:var(--text);font-size:12px;font-weight:800}
    #content .stamp-toggle input{width:18px;height:18px}
    #content .stamp-name{display:flex;align-items:center;gap:9px;margin-left:auto;color:var(--muted);font-size:11px;font-weight:800}
    #content .stamp-name input{padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#172944;color:var(--text)}
    #content .work-diary-actions{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:16px}
    #content .work-diary-actions p{margin:0;color:var(--muted);font-size:12px}
    #content .work-diary-archive{margin-top:24px;border:1px solid var(--line);border-radius:16px;background:var(--panel);overflow:hidden}
    #content .work-diary-archive>header{display:flex;align-items:center;gap:13px;padding:18px 20px;border-bottom:1px solid var(--line)}
    #content .work-diary-archive h2{margin:0;font-size:17px}
    #content .work-diary-archive header p{margin:4px 0 0;color:var(--muted);font-size:11px}
    #content .work-diary-folder-icon{position:relative;display:grid;place-items:center;width:48px;height:38px;border-radius:7px 10px 10px 10px;background:linear-gradient(145deg,#e0a62d,#b87912);color:#fff3c5;font-size:19px;box-shadow:0 5px 14px rgba(184,121,18,.25)}
    #content .work-diary-folder-icon:before{content:'';position:absolute;left:3px;top:-6px;width:20px;height:8px;border-radius:5px 5px 0 0;background:#d29420}
    #content .work-diary-archive-list{padding:8px 18px}
    #content .work-diary-file{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
    #content .work-diary-file:last-child{border-bottom:0}
    #content .work-diary-file-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:9px;background:#692e3e;color:#ffbac5;font-size:10px;font-weight:900}
    #content .work-diary-file>div:not(.work-diary-file-actions){display:grid;gap:4px;min-width:0}#content .work-diary-file-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    #content .work-diary-file b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
    #content .work-diary-file small{color:var(--muted);font-size:10px}
    #content .work-diary-file button{padding:8px 11px;border:1px solid var(--line);border-radius:8px;background:#172944;color:var(--text);font-weight:800;cursor:pointer}
    #content .work-diary-file .diary-share{border-color:#2e8d69;background:#176044;color:#c4ffe0;box-shadow:0 4px 12px rgba(23,96,68,.25)}#content .work-diary-file .diary-delete{padding:6px 10px;color:#ff9eaa;font-size:18px}
    #content .work-diary-empty{margin:0;padding:22px 2px;color:var(--muted);font-size:12px;text-align:center}
    @media(max-width:650px){#content .work-diary-heading{grid-template-columns:1fr}#content .work-diary-heading>span{display:none}#content .work-diary-heading h1{text-align:left}#content .diary-document-meta{justify-self:stretch;grid-template-columns:1fr}#content .work-diary-heading label{justify-self:stretch}#content .work-diary-paper{padding:22px 14px}#content .diary-line-control{width:100%;margin-left:0}#content .stamp-name{width:100%;margin-left:0;justify-content:space-between}#content .work-diary-actions{align-items:stretch;flex-direction:column}#content .work-diary-actions button{width:100%}#content .work-diary-file{grid-template-columns:auto 1fr}#content .work-diary-file-actions{grid-column:1/-1;justify-content:stretch}#content .work-diary-file-actions button{flex:1}#content .work-diary-file .diary-delete{flex:0 0 42px}}
  </style>`

  const dateInput = document.querySelector('#work-diary-date')
  const editor = document.querySelector('#work-diary-text')
  const status = document.querySelector('#work-diary-status')
  const documentNumber = document.querySelector('#diary-document-number')
  const stampEnabled = document.querySelector('#diary-stamp-enabled')
  const preparedBy = document.querySelector('#diary-prepared-by')
  const lineLabel = document.querySelector('#diary-line-count')
  const applyLineCount = () => {
    lineLabel.textContent = lineCount
    editor.style.setProperty('--diary-line-count', lineCount)
  }
  let savedSelection
  const rememberSelection = () => {
    const selection = window.getSelection()
    if (selection.rangeCount && editor.contains(selection.anchorNode)) savedSelection = selection.getRangeAt(0).cloneRange()
  }
  const restoreSelection = () => {
    editor.focus()
    if (!savedSelection) return
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(savedSelection)
  }
  editor.addEventListener('mouseup', rememberSelection)
  editor.addEventListener('keyup', rememberSelection)
  editor.addEventListener('touchend', () => setTimeout(rememberSelection, 0))
  renderWorkDiaryArchive()

  document.querySelector('#diary-line-minus').addEventListener('click', () => { lineCount = Math.max(10, lineCount - 1); applyLineCount() })
  document.querySelector('#diary-line-plus').addEventListener('click', () => { lineCount = Math.min(30, lineCount + 1); applyLineCount() })
  document.querySelectorAll('[data-diary-command]').forEach((button) => button.addEventListener('mousedown', (event) => {
    event.preventDefault()
    restoreSelection()
    document.execCommand(button.dataset.diaryCommand, false)
    rememberSelection()
  }))
  document.querySelectorAll('[data-diary-position]').forEach((button) => button.addEventListener('mousedown', (event) => {
    event.preventDefault()
    restoreSelection()
    const position = button.dataset.diaryPosition
    if (position === 'super') {
      if (document.queryCommandState('subscript')) document.execCommand('subscript', false)
      if (!document.queryCommandState('superscript')) document.execCommand('superscript', false)
    } else if (position === 'sub') {
      if (document.queryCommandState('superscript')) document.execCommand('superscript', false)
      if (!document.queryCommandState('subscript')) document.execCommand('subscript', false)
    } else {
      if (document.queryCommandState('superscript')) document.execCommand('superscript', false)
      if (document.queryCommandState('subscript')) document.execCommand('subscript', false)
    }
    rememberSelection()
  }))
  document.querySelector('#diary-font').addEventListener('change', (event) => {
    restoreSelection()
    document.execCommand('fontName', false, event.target.value)
    rememberSelection()
  })
  document.querySelector('#diary-font-size').addEventListener('change', (event) => {
    restoreSelection()
    document.execCommand('fontSize', false, event.target.value)
    rememberSelection()
  })
  document.querySelector('#diary-color').addEventListener('input', (event) => {
    restoreSelection()
    document.execCommand('foreColor', false, event.target.value)
    rememberSelection()
  })
  editor.addEventListener('paste', (event) => {
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
  })

  document.querySelector('#work-diary-archive-list').addEventListener('click', async (event) => {
    const shareId = event.target.closest('[data-diary-share]')?.dataset.diaryShare
    const openId = event.target.closest('[data-diary-open]')?.dataset.diaryOpen
    const deleteId = event.target.closest('[data-diary-delete]')?.dataset.diaryDelete
    if (shareId) {
      const entry = (await listWorkDiaryPdfs()).find((item) => item.id === shareId)
      if (!entry) return
      const file = new File([entry.blob], entry.fileName, { type: 'application/pdf' })
      try {
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          await navigator.share({ title: 'Tasker · Dnevnik rada', text: `Dnevnik rada: ${entry.fileName}`, files: [file] })
        } else {
          const url = URL.createObjectURL(entry.blob)
          const link = document.createElement('a')
          link.href = url
          link.download = entry.fileName
          link.click()
          setTimeout(() => URL.revokeObjectURL(url), 60000)
          alert('PDF je preuzet. Dodajte ga ručno u mail ili WhatsApp poruku.')
        }
      } catch (error) {
        if (error?.name !== 'AbortError') alert('Slanje nije uspelo. Pokušajte ponovo.')
      }
      return
    }
    if (openId) {
      const entry = (await listWorkDiaryPdfs()).find((item) => item.id === openId)
      if (!entry) return
      openTaskerPdfViewer(entry, 'Tasker · Dnevnik rada')
    }
    if (deleteId && confirm('Obrisati ovaj PDF dnevnik iz Taskera?')) {
      await deleteWorkDiaryPdf(deleteId)
      renderWorkDiaryArchive()
    }
  })

  const saveDraft = () => saveWorkDiary(dateInput.value, editor.innerText, {
    html: editor.innerHTML,
    lineCount,
    documentNumber: documentNumber.value.trim(),
    stampEnabled: stampEnabled.checked,
    preparedBy: preparedBy.value.trim()
  })
  let saveTimer
  editor.addEventListener('input', () => {
    clearTimeout(saveTimer)
    status.textContent = 'Čuvanje nacrta...'
    saveTimer = setTimeout(() => {
      saveDraft()
      status.textContent = 'Nacrt je sačuvan na ovom uređaju.'
    }, 350)
  })
  ;[documentNumber, stampEnabled, preparedBy].forEach((control) => control.addEventListener('change', saveDraft))
  dateInput.addEventListener('change', () => workDiaryPage(dateInput.value || todayInputValue()))

  document.querySelector('#save-work-diary').addEventListener('click', async (event) => {
    const button = event.currentTarget
    const date = dateInput.value || todayInputValue()
    const report = editor.innerText.trim()
    const documentNo = documentNumber.value.trim()
    if (!documentNo) {
      status.textContent = 'Unesite obavezni broj dokumenta.'
      documentNumber.focus()
      return
    }
    saveDraft()
    button.disabled = true
    button.textContent = 'Pravim PDF...'
    status.textContent = 'Priprema dokumenta.'
    try {
      const [jsPDF, html2canvas] = await Promise.all([loadPdfLibrary(), loadHtml2Canvas()])
      const sheet = document.createElement('section')
      sheet.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;background:#f8fafc;color:#172033;font-family:Arial,sans-serif;box-sizing:border-box;overflow:hidden;'
      const rules = Array.from({ length: lineCount }, () => '<i></i>').join('')
      const stamp = stampEnabled.checked && preparedBy.value.trim() ? `<div style="position:absolute;right:54px;bottom:58px;width:132px;height:82px;border:3px double #275a82;border-radius:50%;display:grid;place-content:center;text-align:center;color:#275a82;transform:rotate(-7deg);font-weight:800;text-transform:uppercase;"><small style="font-size:10px;letter-spacing:1px;">Pripremio</small><b style="max-width:110px;margin-top:5px;font-size:14px;">${esc(preparedBy.value.trim())}</b></div>` : ''
      sheet.innerHTML = `<header style="position:relative;height:128px;background:#163454;color:white;box-sizing:border-box;padding:31px 54px;">
        <div style="position:absolute;left:58px;top:22px;display:flex;flex-direction:column;align-items:center;gap:3px;" aria-label="Tasker logo"><i style="display:block;width:20px;height:7px;border-radius:8px;background:#f05252;"></i><b style="display:grid;place-items:center;width:31px;height:31px;border-radius:11px;background:#3b82f6;color:white;font-size:19px;">T</b><i style="display:block;width:20px;height:7px;border-radius:8px;background:#f5f7fa;"></i></div>
        <div style="text-align:center;"><h1 style="margin:0;font-size:30px;letter-spacing:1px;">DNEVNIK RADA</h1></div>
        <div style="position:absolute;right:54px;top:32px;text-align:right;color:#d8e8f6;font-size:14px;line-height:23px;"><p style="margin:0;">Datum: ${date.split('-').reverse().join('.')}</p><p style="margin:0;font-size:12px;">Broj dokumenta: ${esc(documentNo)}</p></div>
      </header>
      <main style="position:relative;height:920px;padding:54px 54px 0 72px;box-sizing:border-box;">
        <div style="position:absolute;left:72px;right:54px;top:54px;height:${lineCount * 34}px;">${rules}</div>
        <div style="position:absolute;left:92px;right:62px;top:49px;min-height:${lineCount * 34}px;font-size:17px;line-height:34px;overflow:hidden;">${editor.innerHTML}</div>
        <div style="position:absolute;left:84px;top:44px;width:2px;height:${lineCount * 34}px;background:#df7f87;"></div>
        ${stamp}
      </main>
      <footer style="position:absolute;left:54px;right:54px;bottom:24px;display:flex;justify-content:space-between;align-items:center;color:#708096;font-size:11px;"><span>TASKER · Dnevnik rada</span><span>Pripremio: ${esc(preparedBy.value.trim() || 'Stefan Jonić')} &nbsp;·&nbsp; 1</span></footer>
      <style>section i{display:block;height:34px;border-bottom:1px solid #9ebed6;box-sizing:border-box}section font[size="2"]{font-size:13px}section font[size="3"]{font-size:17px}section font[size="4"]{font-size:22px}section font[size="5"]{font-size:28px}</style>`
      document.body.appendChild(sheet)
      const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#f8fafc', useCORS: true })
      sheet.remove()
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
      pdf.addImage(canvas.toDataURL('image/jpeg', .94), 'JPEG', 0, 0, 210, 297)
      const savedAt = new Date()
      const timePart = [savedAt.getHours(), savedAt.getMinutes(), savedAt.getSeconds()].map((value) => String(value).padStart(2, '0')).join('')
      const fileName = `Dnevnik-rada-${date}-${timePart}.pdf`
      const blob = pdf.output('blob')
      status.textContent = 'Čuvam novu PDF verziju u Tasker...'
      await storeWorkDiaryPdf({ id: `${date}-${savedAt.getTime()}`, fileName, blob, text: report, documentNumber: documentNo, createdAt: savedAt.toISOString() })
      await renderWorkDiaryArchive()
      status.innerHTML = `PDF <b>${fileName}</b> je sačuvan u Tasker na ovom uređaju.`
    } catch (error) {
      document.querySelectorAll('body > section').forEach((node) => { if (node.style.left === '-10000px') node.remove() })
      status.textContent = 'PDF nije sačuvan. Pokušajte ponovo.'
    } finally {
      button.disabled = false
      button.textContent = 'Sačuvaj u Tasker'
    }
  })
}
const taskerPhotoDbName='tasker-photo-archive',taskerPhotoStore='photos'
let taskerPhotoRecords=[],taskerPhotoUrls=[]
const openTaskerPhotoDb=()=>new Promise((resolve,reject)=>{const request=indexedDB.open(taskerPhotoDbName,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(taskerPhotoStore))request.result.createObjectStore(taskerPhotoStore,{keyPath:'id'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
const taskerPhotoTransaction=async(mode,action)=>{const db=await openTaskerPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(taskerPhotoStore,mode),request=action(tx.objectStore(taskerPhotoStore));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close()})}
const getTaskerPhotos=async()=>{const photos=await taskerPhotoTransaction('readonly',(store)=>store.getAll());return photos.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}
const saveTaskerPhoto=(record)=>taskerPhotoTransaction('readwrite',(store)=>store.put(record))
const deleteTaskerPhoto=(id)=>taskerPhotoTransaction('readwrite',(store)=>store.delete(id))
const taskerPhotoDate=(iso)=>new Intl.DateTimeFormat('sr-Latn-RS',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(iso))
const taskerPhotoTime=(iso)=>new Intl.DateTimeFormat('sr-Latn-RS',{hour:'2-digit',minute:'2-digit'}).format(new Date(iso))
const clearTaskerPhotoUrls=()=>{taskerPhotoUrls.forEach((url)=>URL.revokeObjectURL(url));taskerPhotoUrls=[]}
const shareTaskerPhoto=async(record)=>{const extension=(record.type||'image/jpeg').split('/')[1]?.replace('jpeg','jpg')||'jpg';const file=new File([record.blob],record.name||`tasker-slika-${record.id}.${extension}`,{type:record.type||record.blob.type||'image/jpeg'});try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'TASKER slika',text:`TASKER fotografija · ${taskerPhotoDate(record.createdAt)}`,files:[file]});return}}catch(error){if(error?.name==='AbortError')return}const url=URL.createObjectURL(record.blob),link=document.createElement('a');link.href=url;link.download=file.name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);alert('Slika je preuzeta. Možete je priložiti u email ili WhatsApp.')}
const renderTaskerPhotoGallery=async()=>{const host=document.querySelector('#tasker-photo-gallery');if(!host)return;clearTaskerPhotoUrls();taskerPhotoRecords=await getTaskerPhotos();if(!taskerPhotoRecords.length){host.innerHTML='<div class="tasker-photo-empty"><span>▧</span><h2>Folder je prazan</h2><p>Snimite prvu fotografiju ili je izaberite sa uređaja.</p></div>';return}const groups={};taskerPhotoRecords.forEach((record)=>{const day=String(record.createdAt).slice(0,10);(groups[day]||(groups[day]=[])).push(record)});host.innerHTML=Object.entries(groups).map(([day,records])=>`<section class="tasker-photo-day"><header><div><span>📅</span><h2>${taskerPhotoDate(records[0].createdAt)}</h2></div><b>${records.length} slika</b></header><div class="tasker-photo-grid">${records.map((record)=>{const url=URL.createObjectURL(record.blob);taskerPhotoUrls.push(url);return `<article class="tasker-photo-card"><button type="button" class="tasker-photo-open" data-photo-open="${record.id}"><img src="${url}" alt="TASKER fotografija"><span>${taskerPhotoTime(record.createdAt)}</span></button><div><small>Slikano ${taskerPhotoDate(record.createdAt)} u ${taskerPhotoTime(record.createdAt)}</small><div><button type="button" data-photo-share="${record.id}">Pošalji mailom / WhatsApp</button><button type="button" class="photo-delete" data-photo-delete="${record.id}">×</button></div></div></article>`}).join('')}</div></section>`).join('')}
const openTaskerPhoto=(record)=>{document.querySelector('#tasker-photo-viewer')?.remove();const url=URL.createObjectURL(record.blob);document.body.insertAdjacentHTML('beforeend',`<div class="tasker-photo-viewer" id="tasker-photo-viewer"><section role="dialog" aria-modal="true"><button type="button" data-photo-view-close>×</button><img src="${url}" alt="TASKER fotografija"><footer><div><b>${taskerPhotoDate(record.createdAt)}</b><small>Slikano u ${taskerPhotoTime(record.createdAt)}</small></div><button type="button" class="primary-btn" id="share-open-photo">Pošalji mailom / WhatsApp</button></footer></section></div>`);const modal=document.querySelector('#tasker-photo-viewer'),close=()=>{URL.revokeObjectURL(url);modal.remove()};modal.querySelector('[data-photo-view-close]').addEventListener('click',close);modal.addEventListener('click',(event)=>{if(event.target===modal)close()});modal.querySelector('#share-open-photo').addEventListener('click',()=>shareTaskerPhoto(record))}
async function photosPage(){content.innerHTML=`<section class="page-heading photos-heading"><div><p class="eyebrow">Foto dokumentacija</p><h1>Slike</h1><p>Sve fotografije su na jednom mestu i automatski označene datumom i vremenom.</p></div><div class="photos-heading-actions"><label class="secondary-btn">📁 Izaberi slike<input id="tasker-photo-files" type="file" accept="image/*" multiple></label><label class="primary-btn">📷 Slikaj sada<input id="tasker-photo-camera" type="file" accept="image/*" capture="environment"></label></div></section><section class="tasker-photo-info"><span>i</span><p>Slike se čuvaju lokalno u TASKER-u na ovom uređaju. Dugme za slanje otvara email, WhatsApp i ostale aplikacije uređaja.</p></section><div id="tasker-photo-gallery"><div class="tasker-photo-loading">Učitavam slike…</div></div>`;const importFiles=async(files)=>{const list=Array.from(files||[]).filter((file)=>file.type.startsWith('image/'));for(let index=0;index<list.length;index+=1){const file=list[index],createdAt=new Date(Date.now()+index).toISOString();await saveTaskerPhoto({id:`${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,name:file.name||`tasker-slika-${createdAt.slice(0,10)}.jpg`,type:file.type,createdAt,blob:file})}await renderTaskerPhotoGallery()};content.querySelector('#tasker-photo-files').addEventListener('change',(event)=>importFiles(event.target.files));content.querySelector('#tasker-photo-camera').addEventListener('change',(event)=>importFiles(event.target.files));content.addEventListener('click',async(event)=>{const openId=event.target.closest('[data-photo-open]')?.dataset.photoOpen,shareId=event.target.closest('[data-photo-share]')?.dataset.photoShare,deleteId=event.target.closest('[data-photo-delete]')?.dataset.photoDelete;if(openId){const record=taskerPhotoRecords.find((item)=>item.id===openId);if(record)openTaskerPhoto(record)}if(shareId){const record=taskerPhotoRecords.find((item)=>item.id===shareId);if(record)await shareTaskerPhoto(record)}if(deleteId&&confirm('Obrisati ovu fotografiju iz TASKER-a?')){await deleteTaskerPhoto(deleteId);await renderTaskerPhotoGallery()}});await renderTaskerPhotoGallery()}

const driveFolderUrl = 'https://drive.google.com/drive/folders/1LrYfOwBzadfWK3stckNvUOfhfc1aossX'

function documentsPage() {
  const folders = [
    { icon: '\u25A7', name: 'Crtezi', text: 'DWG, PDF i tehnicki crtezi', tone: 'blue' },
    { icon: '\u25A4', name: 'Tehnicka dokumentacija', text: 'Specifikacije i uputstva', tone: 'violet' },
    { icon: '\u25A5', name: 'Dnevni izvestaji', text: 'Izvestaji po danima', tone: 'green' },
    { icon: '\u25A3', name: 'Fotografije radova', text: 'Dokumentovanje napretka', tone: 'amber' },
    { icon: '\u25C7', name: 'Narudzbine i ponude', text: 'Ponude, racuni i narudzbine', tone: 'red' },
    { icon: '\u25C8', name: 'Ostalo', text: 'Svi dodatni dokumenti', tone: 'blue' }
  ]
  content.innerHTML = `<section class="page-heading documents-heading"><div><p class="eyebrow">Centralna arhiva</p><h1>Dokumentacija</h1><p>Crtezi i dokumenti su bezbedno sacuvani na Google Drive-u.</p></div><a class="primary-btn drive-open" href="${driveFolderUrl}" target="_blank" rel="noopener">Otvori Google Drive &nearr;</a></section><section class="drive-banner"><span class="drive-logo"><i></i><i></i><i></i></span><div><b>Tasker dokumentacija</b><p>Otvori folder, pregledaj crteze ili dodaj novi dokument direktno sa tableta.</p></div><a href="${driveFolderUrl}" target="_blank" rel="noopener">Otvori folder &rarr;</a></section><section class="document-grid">${folders.map((folder) => `<a class="document-folder ${folder.tone}" href="${driveFolderUrl}" target="_blank" rel="noopener"><span class="folder-icon">${folder.icon}</span><div><h2>${folder.name}</h2><p>${folder.text}</p></div><b>Otvori &rarr;</b></a>`).join('')}</section><section class="document-note"><span>i</span><p>Dokumenti se ne cuvaju u browseru vec u vasem Google Drive folderu. Zato su dostupni na tabletu, telefonu i racunaru.</p></section>`
  content.insertAdjacentHTML('afterbegin', `<style id="documents-layout">#content .documents-heading{display:flex!important;justify-content:space-between!important;align-items:center!important;margin-bottom:22px!important}#content .drive-open{padding:13px 18px!important;border-radius:11px!important;text-decoration:none!important}#content .drive-banner{display:grid!important;grid-template-columns:auto 1fr auto!important;gap:16px!important;align-items:center!important;margin-bottom:20px!important;padding:19px 21px!important;border:1px solid #35698b!important;border-radius:16px!important;background:linear-gradient(120deg,#1a3d5a,#192b46)!important}#content .drive-banner b{display:block!important;font-size:15px!important}#content .drive-banner p{margin:5px 0 0!important;color:#a0b8d3!important;font-size:12px!important}#content .drive-banner>a{padding:10px 13px!important;border:1px solid #487b9d!important;border-radius:9px!important;color:#8de1ff!important;text-decoration:none!important;font-size:12px!important;font-weight:800!important}#content .drive-logo{display:grid!important;place-items:center!important;width:43px!important;height:43px!important;border-radius:12px!important;background:#225979!important;color:#8be0ff!important;font-size:20px!important}#content .drive-logo i{display:none!important}#content .drive-logo:after{content:'G'!important;font-weight:900!important}#content .document-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:17px!important}#content .document-folder{position:relative!important;display:block!important;min-height:144px!important;padding:19px!important;border:1px solid #2b4867!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important;color:#edf7ff!important;text-decoration:none!important;box-sizing:border-box!important}#content .document-folder:hover{border-color:#59c8ef!important;transform:translateY(-2px)!important}#content .folder-icon{display:grid!important;place-items:center!important;width:42px!important;height:37px!important;margin-bottom:15px!important;border-radius:10px!important;background:#225979!important;color:#8ce0ff!important;font-size:20px!important}#content .document-folder h2{margin:0!important;color:#f2f8ff!important;font-size:15px!important}#content .document-folder p{margin:6px 0 0!important;color:#a1b6ce!important;font-size:11px!important}#content .document-folder>b{position:absolute!important;right:18px!important;bottom:16px!important;color:#79dcff!important;font-size:11px!important}#content .document-folder.green .folder-icon{background:#1d6145!important;color:#91f2bc!important}#content .document-folder.amber .folder-icon{background:#695018!important;color:#ffe084!important}#content .document-folder.red .folder-icon{background:#682a42!important;color:#ffafbc!important}#content .document-folder.violet .folder-icon{background:#493873!important;color:#d1b7ff!important}#content .document-note{display:flex!important;align-items:center!important;gap:11px!important;margin-top:18px!important;padding:15px 18px!important;border:1px solid #2c4b69!important;border-radius:13px!important;background:#13243b!important;color:#a2b7cf!important;font-size:12px!important}#content .document-note span{display:grid!important;place-items:center!important;width:22px!important;height:22px!important;border-radius:50%!important;background:#22628c!important;color:#8de2ff!important;font-weight:900!important}#content .document-note p{margin:0!important}@media(max-width:900px){#content .document-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:600px){#content .documents-heading{align-items:flex-start!important;flex-direction:column!important}#content .drive-open{width:100%!important;text-align:center!important;box-sizing:border-box!important}#content .drive-banner{grid-template-columns:auto 1fr!important}#content .drive-banner>a{grid-column:1/-1!important;text-align:center!important}#content .document-grid{grid-template-columns:1fr!important}}</style>`)
}

function showMaterialDetails(id) {
  const item = materials.find((entry) => entry.id === Number(id))
  if (!item) return
  const status = item.stock <= 0 ? ['Nema na stanju', 'empty'] : item.stock <= item.minStock ? ['Pri kraju', 'low'] : ['Na stanju', 'ok']

  document.querySelector('.material-modal')?.remove()
  document.body.insertAdjacentHTML('beforeend', `<div class="material-modal" role="dialog" aria-modal="true"><div class="material-dialog"><button class="modal-close" aria-label="Zatvori">\u00D7</button><p class="eyebrow">Kartica artikla</p><h2>${item.name}</h2><p class="material-standard">${item.standard}</p><div class="detail-stock"><div><span>Na stanju</span><strong>${new Intl.NumberFormat('sr-RS').format(item.stock)} <em>${item.unit}</em></strong></div><span class="status ${status[1]}">${status[0]}</span></div><label class="stock-editor"><span>Nova koli\u010Dina na stanju</span><div><input class="stock-input" type="number" min="0" step="1" value="${item.stock}"><b>${item.unit}</b></div></label><div class="detail-grid"><div><small>Minimalna koli\u010Dina</small><b>${new Intl.NumberFormat('sr-RS').format(item.minStock)} ${item.unit}</b></div><div><small>Lokacija u magacinu</small><b>${item.location}</b></div><div><small>Dobavlja\u010D</small><b>${item.supplier}</b></div><div><small>Kategorija</small><b>${item.category}</b></div></div><div class="detail-actions"><button class="delete-material">Obri\u0161i artikal</button><span></span><button class="secondary-btn modal-close">Zatvori</button><button class="primary-btn save-stock">Sa\u010Duvaj koli\u010Dinu</button></div></div></div>`)

  document.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', () => document.querySelector('.material-modal').remove()))

  document.querySelector('.save-stock').addEventListener('click', () => {
    const value = Number(document.querySelector('.stock-input').value)
    if (!Number.isInteger(value) || value < 0) return
    item.stock = value
    saveInventory()
    document.querySelector('.material-modal').remove()
    categoryPage(state.currentCategory)
  })

  document.querySelector('.delete-material').addEventListener('click', () => {
    if (!confirm(`Da li ste sigurni da \u017Eelite da obri\u0161ete \u201E${item.name}\u201C?`)) return
    materials.splice(materials.indexOf(item), 1)
    saveInventory()
    document.querySelector('.material-modal').remove()
    categoryPage(state.currentCategory)
  })
}

function showAddMaterial() {
  const selected = state.currentCategory || categories[0].id
  document.querySelector('.material-modal')?.remove()
  document.body.insertAdjacentHTML('beforeend', `<div class="material-modal" role="dialog" aria-modal="true"><form class="material-dialog material-form" id="material-form"><button type="button" class="modal-close" aria-label="Zatvori">\u00D7</button><p class="eyebrow">Novi artikal</p><h2>Dodaj materijal</h2><p class="material-standard">Unesite osnovne podatke za novi artikal u magacinu.</p><div class="form-grid"><label>Naziv artikla<input name="name" required placeholder="npr. DIN7500M TX M6\u00D740 Zn"></label><label>Kategorija<select name="category">${categories.map((category) => `<option value="${category.id}" ${category.id === selected ? 'selected' : ''}>${category.name}</option>`).join('')}</select></label><label class="new-category">Nova kategorija <small>(po \u017Eelji)</small><input name="newCategory" placeholder="npr. ALATI"></label><label>Standard / opis<input name="standard" required placeholder="npr. DIN 7500 M"></label><label>Jedinica<input name="unit" required value="kom"></label><label>Koli\u010Dina na stanju<input name="stock" required type="number" min="0" value="0"></label><label>Minimalna koli\u010Dina<input name="minStock" required type="number" min="0" value="${Number(state.settings.defaultMinStock) || 0}"></label><label>Lokacija<input name="location" required placeholder="npr. A-01-02"></label><label>Dobavlja\u010D<input name="supplier" required placeholder="npr. W\u00FCrth"></label></div><div class="detail-actions"><button type="button" class="secondary-btn modal-close">Otka\u017Ei</button><button class="primary-btn">Sa\u010Duvaj materijal</button></div></form></div>`)

  document.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', () => document.querySelector('.material-modal').remove()))

  document.querySelector('#material-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const categoryName = data.get('newCategory').trim()
    let categoryId = data.get('category')

    if (categoryName) {
      const existing = categories.find((category) => category.name.toLocaleLowerCase('sr') === categoryName.toLocaleLowerCase('sr'))
      categoryId = existing?.id || `custom-${Date.now()}`
      if (!existing) {
        categories.push({ id: categoryId, name: categoryName.toLocaleUpperCase('sr'), icon: '\u25C7', unit: data.get('unit').trim() })
        saveCategories()
      }
    }

    materials.push({
      id: Math.max(0, ...materials.map((item) => item.id)) + 1,
      category: categoryId,
      name: data.get('name').trim(),
      standard: data.get('standard').trim(),
      unit: data.get('unit').trim(),
      stock: Number(data.get('stock')),
      minStock: Number(data.get('minStock')),
      location: data.get('location').trim(),
      supplier: data.get('supplier').trim()
    })

    saveInventory()
    document.querySelector('.material-modal').remove()
    categoryPage(categoryId)
  })
}

content.addEventListener('click', (event) => {
  if (event.target.closest('.add-material')) {
    showAddMaterial()
    return
  }

  const button = event.target.closest('.details-btn')
  if (button) {
    const item = button.closest('.inventory-item')
    const title = item?.querySelector('h2')?.textContent
    const material = materials.find((entry) => entry.name === title)
    if (material) showMaterialDetails(material.id)
  }
})



function renderExpandedControlCenter() {
  const todayKey = dateKeyFor()
  const activeEmployees = state.employees.filter((employee) => employee.active !== false)
  const todayAttendance = state.attendance[todayKey] || {}
  const monthPrefix = todayKey.slice(0, 7)
  const monthDays = Object.entries(state.attendance).filter(([key]) => key.startsWith(monthPrefix))
  const lowItems = materials.filter((item) => Number(item.stock) > 0 && Number(item.stock) <= Number(item.minStock || 0))
  const emptyItems = materials.filter((item) => Number(item.stock) <= 0)
  const requestItems = [...emptyItems, ...lowItems]
  const orders = normalizeOrderLines()
  const allUnits = moduleTypes.flatMap((type) => {
    const count = Number(moduleData(type).count) || 0
    return Array.from({ length: count }, (_, index) => ({ type, unit: moduleUnit(type, index + 1) }))
  })
  const minutesNow = new Date().getHours() * 60 + new Date().getMinutes()
  const todoStatus = (todo) => todo.done ? 'done' : (todo.time && notificationMinutes(todo.time) <= minutesNow ? 'expired' : 'active')
  const categoryName = (item) => categories.find((entry) => entry.id === item.category)?.name || item.category || '—'
  const root = document.createElement('section')
  root.className = 'control-details'
  root.innerHTML = `
    <article class="control-detail-section material-detail-section">
      <header><div><span>▦</span><div><p class="eyebrow">KOMPLETNO STANJE</p><h2>Sav materijal na stanju</h2><small>Svaki artikal, količina, minimum i lokacija.</small></div></div><b>${materials.length} artikala</b></header>
      <div class="control-detail-table"><div class="control-table-head"><span>Materijal</span><span>Kategorija / standard</span><span>Lokacija</span><span>Minimum</span><span>Na stanju</span><span>Status</span></div>
      ${materials.length ? materials.map((item) => {
        const status = Number(item.stock) <= 0 ? ['NEMA','bad'] : Number(item.stock) <= Number(item.minStock || 0) ? ['PRI KRAJU','warn'] : ['DOVOLJNO','good']
        return `<div class="control-table-row"><div><b>${esc(item.name)}</b><small>${esc(item.unit || '')}</small></div><div><span>${esc(categoryName(item))}</span><small>${esc(item.standard || '—')}</small></div><span>${esc(item.location || '—')}</span><span>${new Intl.NumberFormat('sr-RS').format(item.minStock || 0)}</span><strong>${new Intl.NumberFormat('sr-RS').format(item.stock || 0)} ${esc(item.unit || '')}</strong><em class="${status[1]}">${status[0]}</em></div>`
      }).join('') : '<p class="control-empty">Nema unetog materijala.</p>'}</div>
    </article>

    <article class="control-detail-section requests-detail-section">
      <header><div><span>!</span><div><p class="eyebrow">ZAHTEVI I NABAVKA</p><h2>Svi zahtevi</h2><small>Materijal za proveru i sve stavke narudžbenice.</small></div></div><b>${requestItems.length + orders.length} zahteva</b></header>
      <div class="control-request-groups">
        <section><h3>Materijal za proveru <b>${requestItems.length}</b></h3><div>${requestItems.length ? requestItems.map((item) => `<article class="${Number(item.stock)<=0?'urgent':''}"><span>${Number(item.stock)<=0?'×':'!'}</span><div><b>${esc(item.name)}</b><small>Trenutno ${item.stock || 0} ${esc(item.unit || '')} · minimum ${item.minStock || 0}</small></div><em>${Number(item.stock)<=0?'Nabaviti':'Proveriti'}</em></article>`).join('') : '<p class="control-empty">Nema zahteva za proveru.</p>'}</div></section>
        <section><h3>Stavke za naručivanje <b>${orders.length}</b></h3><div>${orders.length ? orders.map((line,index) => `<article><span>${index+1}</span><div><b>${esc(line.name)}</b><small>${esc(line.description || line.note || 'Bez napomene')}</small></div><strong>${line.quantity} ${esc(line.unit)}</strong></article>`).join('') : '<p class="control-empty">Narudžbenica je prazna.</p>'}</div></section>
      </div>
    </article>

    <article class="control-detail-section people-detail-section">
      <header><div><span>●</span><div><p class="eyebrow">PRISUTNOST I LJUDI</p><h2>Kompletno brojno stanje</h2><small>Ko je prisutan, ko nije i mesečni izostanci.</small></div></div><b>${activeEmployees.filter((employee)=>todayAttendance[employee.id]!==false).length}/${state.employees.length} prisutno</b></header>
      <div class="control-people-full">${state.employees.map((employee) => {
        const enabled=employee.active!==false, present=enabled && todayAttendance[employee.id]!==false
        const absences=monthDays.filter(([,day])=>day[employee.id]===false).length
        return `<article class="${!enabled?'inactive':present?'present':'absent'}"><span>${employee.name.split(' ').map((part)=>part[0]).slice(0,2).join('').toUpperCase()}</span><div><b>${esc(employee.name)}</b><small>${esc(employee.role || 'Zaposleni')}</small></div><em>${!enabled?'NEAKTIVAN':present?'PRISUTAN':'ODSUTAN'}</em><p>Izostanci ovog meseca <b>${absences}</b></p></article>`
      }).join('') || '<p class="control-empty">Nema zaposlenih.</p>'}</div>
    </article>

    <article class="control-detail-section modules-detail-section">
      <header><div><span>◉</span><div><p class="eyebrow">SVAKI MODUL</p><h2>Detaljan napredak modula</h2><small>Napredak, završene faze i trenutno aktivan rad.</small></div></div><b>${allUnits.length} modula</b></header>
      <div class="control-module-groups">${moduleTypes.map((type) => {
        const units=allUnits.filter((entry)=>entry.type.id===type.id)
        return `<section style="--module-color:${type.color}"><header><div><i></i><h3>${esc(type.label)}</h3><span>${units.length} modula</span></div><b>${typeProgress(type)}% ukupno</b></header><div>${units.length ? units.map(({unit}) => {
          const stages=unit.stages||[], done=stages.filter((stage)=>stage.status==='zavrseno').length
          const running=stages.filter((stage)=>stage.status==='u-toku').map((stage)=>stage.title)
          return `<button data-control-module-type="${type.id}" data-control-module-unit="${unit.id}"><b>${esc(unit.id)}</b><div class="module-line-progress"><i><em style="width:${Number(unit.progress)||0}%"></em></i><strong>${Number(unit.progress)||0}%</strong></div><span><b>${done}/${stages.length}</b> faza</span><span class="module-running">${running.length?esc(running.join(', ')):Number(unit.progress)>=100?'Modul završen':'Nema faze u toku'}</span><small>${unit.work?esc(unit.work):'Nema upisane aktivnosti'}</small></button>`
        }).join('') : '<p class="control-empty">Nema modula u ovoj grupi.</p>'}</div></section>`
      }).join('')}</div>
    </article>

    <article class="control-detail-section tasks-detail-section">
      <header><div><span>✓</span><div><p class="eyebrow">SVE OBAVEZE</p><h2>Aktivne, istekle i završene</h2><small>Sve dnevne obaveze odmah na jednom mestu.</small></div></div><b>${state.todos.length} obaveza</b></header>
      <div class="control-task-summary"><span>Aktivne <b>${state.todos.filter((todo)=>todoStatus(todo)==='active').length}</b></span><span>Istekle <b>${state.todos.filter((todo)=>todoStatus(todo)==='expired').length}</b></span><span>Završene <b>${state.todos.filter((todo)=>todoStatus(todo)==='done').length}</b></span></div>
      <div class="control-task-full">${state.todos.length ? state.todos.slice().sort((a,b)=>['expired','active','done'].indexOf(todoStatus(a))-['expired','active','done'].indexOf(todoStatus(b))).map((todo) => {
        const status=todoStatus(todo)
        return `<article class="${status}"><span>${status==='done'?'✓':status==='expired'?'!':'○'}</span><div><b>${esc(todo.text || todo.title || 'Obaveza')}</b><small>${todo.time?`Vreme ${esc(todo.time)}`:'Bez određenog vremena'}</small></div><em>${status==='done'?'ZAVRŠENO':status==='expired'?'ISTEKLO':'AKTIVNO'}</em></article>`
      }).join('') : '<p class="control-empty">Nema obaveza.</p>'}</div>
    </article>`
  const before = document.querySelector('.control-lower-grid')
  if (before) before.insertAdjacentElement('beforebegin', root)
  root.querySelectorAll('[data-control-module-unit]').forEach((button) => button.addEventListener('click', () => moduleUnitPage(button.dataset.controlModuleType, button.dataset.controlModuleUnit)))
}

function controlCenterPage() {
  const todayKey = dateKeyFor()
  const activeEmployees = state.employees.filter((employee) => employee.active !== false)
  const todayAttendance = state.attendance[todayKey] || {}
  const presentToday = activeEmployees.filter((employee) => todayAttendance[employee.id] !== false)
  const absentToday = activeEmployees.filter((employee) => todayAttendance[employee.id] === false)
  const lowMaterials = materials.filter((item) => Number(item.stock) > 0 && Number(item.stock) <= Number(item.minStock || 0))
  const emptyMaterials = materials.filter((item) => Number(item.stock) <= 0)
  const totalStock = materials.reduce((sum, item) => sum + (Number(item.stock) || 0), 0)
  const openTasks = state.todos.filter((todo) => !todo.done)
  const completedTasks = state.todos.filter((todo) => todo.done)
  const totalModules = moduleTypes.reduce((sum, type) => sum + (Number(moduleData(type).count) || 0), 0)
  const overallProgress = totalModules ? Math.round(moduleTypes.reduce((sum, type) => sum + typeProgress(type) * (Number(moduleData(type).count) || 0), 0) / totalModules) : 0
  const monthPrefix = todayKey.slice(0, 7)
  const monthAttendance = Object.entries(state.attendance).filter(([key]) => key.startsWith(monthPrefix))
  const monthPresent = monthAttendance.reduce((sum, [, day]) => sum + activeEmployees.filter((employee) => day[employee.id] !== false).length, 0)
  const monthAbsent = monthAttendance.reduce((sum, [, day]) => sum + activeEmployees.filter((employee) => day[employee.id] === false).length, 0)
  const weekDays = Array.from({ length: 7 }, (_, offset) => { const date = new Date(); date.setDate(date.getDate() - (6 - offset)); const key = dateKeyFor(date); const day = state.attendance[key]; return { key, label: new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'short' }).format(date).replace('.', ''), value: day ? activeEmployees.filter((employee) => day[employee.id] !== false).length : null } })
  const maxPeople = Math.max(1, activeEmployees.length)
  const activities = readControlActivities().slice(0, 10)
  const alerts = [
    ...emptyMaterials.slice(0, 5).map((item) => ({ level: 'danger', icon: '×', title: item.name, text: 'Nema na stanju', page: 'materials' })),
    ...lowMaterials.slice(0, 5).map((item) => ({ level: 'warning', icon: '!', title: item.name, text: `${new Intl.NumberFormat('sr-RS').format(item.stock)} ${item.unit || 'kom'} · minimum ${new Intl.NumberFormat('sr-RS').format(item.minStock || 0)}`, page: 'materials' })),
    ...absentToday.map((employee) => ({ level: 'people', icon: '●', title: employee.name, text: 'Nije prisutan danas', page: 'daily-report' })),
    ...openTasks.slice(0, 4).map((todo) => ({ level: 'task', icon: '✓', title: todo.text || todo.title || 'Dnevna obaveza', text: todo.time ? `Rok ${todo.time}` : 'Čeka završetak', page: 'dashboard' }))
  ]
  const moduleRings = moduleTypes.map((type) => `<article><div class="control-ring" style="--value:${typeProgress(type)};--ring:${type.color}"><span><b>${typeProgress(type)}%</b><small>${esc(type.label)}</small></span></div><p>${Number(moduleData(type).count) || 0} modula</p></article>`).join('')
  content.innerHTML = `<section class="control-center">
    <header class="control-heading"><div><p class="eyebrow">ŽIVI PREGLED CELE APLIKACIJE</p><h1>Kontrolni centar</h1><p>Svi podaci se automatski preuzimaju iz ostalih TASKER kartica.</p></div><div class="control-live"><i></i><span>Podaci uživo</span><b>${new Intl.DateTimeFormat('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' }).format(new Date())}</b></div></header>
    <section class="control-kpis">
      <button data-control-go="materials" class="cyan"><span>▦</span><p>Materijal na stanju</p><strong>${new Intl.NumberFormat('sr-RS').format(totalStock)}</strong><small>${materials.length} artikala</small></button>
      <button data-control-go="materials" class="red"><span>!</span><p>Zahteva pažnju</p><strong>${lowMaterials.length + emptyMaterials.length}</strong><small>${emptyMaterials.length} bez stanja</small></button>
      <button data-control-go="daily-report" class="green"><span>●</span><p>Prisutni danas</p><strong>${presentToday.length}</strong><small>${absentToday.length} odsutnih</small></button>
      <button data-control-go="modules" class="blue"><span>◉</span><p>Napredak modula</p><strong>${overallProgress}%</strong><small>${totalModules} ukupno</small></button>
      <button data-control-go="orders" class="yellow"><span>▤</span><p>Stavke za naručiti</p><strong>${state.orderLines.length}</strong><small>trenutna narudžbenica</small></button>
      <button data-control-go="dashboard" class="pink"><span>✓</span><p>Aktivne obaveze</p><strong>${openTasks.length}</strong><small>${completedTasks.length} završeno</small></button>
    </section>
    <section class="control-main-grid">
      <article class="control-panel control-modules"><header><div><p class="eyebrow">PROIZVODNJA</p><h2>Napredak modula</h2></div><b>${overallProgress}%</b></header><div class="control-rings">${moduleRings}</div><button data-control-go="modules">Otvori module →</button></article>
      <article class="control-panel control-material"><header><div><p class="eyebrow">MAGACIN</p><h2>Stanje materijala</h2></div><b>${materials.length}</b></header><div class="control-material-bars"><div><span>Na stanju</span><i><em style="width:${materials.length ? Math.max(4,(materials.length-lowMaterials.length-emptyMaterials.length)/materials.length*100) : 0}%"></em></i><b>${Math.max(0,materials.length-lowMaterials.length-emptyMaterials.length)}</b></div><div class="warn"><span>Pri kraju</span><i><em style="width:${materials.length ? Math.max(lowMaterials.length?4:0,lowMaterials.length/materials.length*100) : 0}%"></em></i><b>${lowMaterials.length}</b></div><div class="bad"><span>Nema</span><i><em style="width:${materials.length ? Math.max(emptyMaterials.length?4:0,emptyMaterials.length/materials.length*100) : 0}%"></em></i><b>${emptyMaterials.length}</b></div></div><button data-control-go="materials">Otvori materijal →</button></article>
      <article class="control-panel control-people"><header><div><p class="eyebrow">LJUDI</p><h2>Prisutnost 7 dana</h2></div><b>${presentToday.length}/${state.employees.length}</b></header><div class="control-week">${weekDays.map((day) => `<div><b>${day.value ?? '—'}</b><span><i style="height:${day.value == null ? 4 : Math.max(8,day.value/maxPeople*100)}%"></i></span><small>${day.label}</small></div>`).join('')}</div><footer><span>Ovaj mesec: <b>${monthPresent}</b> prisustva</span><span>Izostanci: <b>${monthAbsent}</b></span></footer><button data-control-go="daily-report">Otvori evidenciju →</button></article>
    </section>
    <section class="control-lower-grid">
      <article class="control-panel control-alerts"><header><div><p class="eyebrow">ZAHTEVA PAŽNJU</p><h2>Upozorenja</h2></div><b>${alerts.length}</b></header><div class="control-alert-list">${alerts.length ? alerts.slice(0,10).map((item) => `<button data-control-go="${item.page}" class="${item.level}"><span>${item.icon}</span><div><b>${esc(item.title)}</b><small>${esc(item.text)}</small></div><em>→</em></button>`).join('') : '<p class="control-empty">✓ Sve je pod kontrolom. Nema aktivnih upozorenja.</p>'}</div></article>
      <article class="control-panel control-activity"><header><div><p class="eyebrow">HRONOLOŠKI PREGLED</p><h2>Poslednje aktivnosti</h2></div><button id="clear-control-activity" type="button">Obriši</button></header><div class="control-activity-list">${activities.length ? activities.map((item) => `<article><span class="${item.kind}">•</span><div><b>${esc(controlActivityLabels[item.kind] || 'TASKER')}</b><p>${esc(item.title)}</p></div><time>${new Intl.DateTimeFormat('sr-Latn-RS', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(item.time))}</time></article>`).join('') : '<p class="control-empty">Ovde će se pojavljivati sve nove promene u aplikaciji.</p>'}</div></article>
    </section>
    <section class="control-documents"><div><span>▣</span><div><b>Sačuvani PDF dokumenti</b><small>Narudžbenice i dnevnici rada sa ovog uređaja</small></div></div><div><button data-control-go="orders">Narudžbenice <b id="control-order-pdfs">…</b></button><button data-control-go="work-diary">Dnevnici <b id="control-diary-pdfs">…</b></button></div></section>
  </section>`
  renderExpandedControlCenter()
  content.querySelectorAll('[data-control-go]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.controlGo)))
  content.querySelector('#clear-control-activity')?.addEventListener('click', () => { localStorage.removeItem(controlActivityStorage); controlCenterPage() })
  Promise.all([listOrderPdfs().catch(() => []), listWorkDiaryPdfs().catch(() => [])]).then(([orders, diaries]) => {
    const orderCount = document.querySelector('#control-order-pdfs')
    const diaryCount = document.querySelector('#control-diary-pdfs')
    if (orderCount) orderCount.textContent = orders.length
    if (diaryCount) diaryCount.textContent = diaries.length
  })
}

function placeholder(title) {
  content.innerHTML = `<section class="empty-page"><p class="eyebrow">U pripremi</p><h1>${title}</h1><p>Ovaj deo sistema bi\u0107e dodat u narednom koraku.</p></section>`
}

function navigate(page) {
  const labels = { dashboard: 'Po\u010Detna', 'control-center': 'Kontrolni centar', materials: 'Materijal', employees: 'Zaposleni', orders: 'Narud\u017Ebine', modules: 'Modul', 'daily-report': 'Dnevni izve\u0161taj rada', 'work-diary': 'Dnevnik rada', 'work-hours': 'Radni sati', 'monthly-hours': 'Mesecni sati', 'work-plan': 'Plan rada', documents: 'Dokumentacija', reports: 'Izve\u0161taji', settings: 'Pode\u0161avanja' }
  document.querySelector('#breadcrumb').textContent = labels[page]
  document.querySelectorAll('.nav-link[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === page))

  if (page === 'dashboard') dashboard()
  else if (page === 'control-center') controlCenterPage()
  else if (page === 'materials') materialsPage()
  else if (page === 'employees') employeesPage()
  else if (page === 'orders') ordersPage()
  else if (page === 'modules') modulesPage()
  else if (page === 'daily-report') dailyReportPage()
  else if (page === 'work-diary') workDiaryPage()
  else if (page === 'work-hours') workHoursPage()
  else if (page === 'monthly-hours') monthlyHoursPage()
  else if (page === 'work-plan') workPlanPage()
  else if (page === 'photos') photosPage()
  else if (page === 'documents') documentsPage()
  else if (page === 'reports') reportsPage()
  else if (page === 'settings') settingsPage()
  else placeholder(labels[page])
}

app.addEventListener('click', (event) => {
  if (event.target.closest('.brand')) {
    event.preventDefault()
    if (projectOpen) navigate('dashboard')
    else projectsHome()
    return
  }
  const button = event.target.closest('[data-page]')
  if (button && projectOpen) navigate(button.dataset.page)
})

document.querySelector('#back-to-projects').addEventListener('click', projectsHome)

projectsHome()


let taskerProfileLoadPromise
function loadTaskerProfilePoster() {
  if (window.__taskerProfileChunks?.length >= 10) return Promise.resolve(window.__taskerProfileChunks.join(''))
  if (!taskerProfileLoadPromise) {
    taskerProfileLoadPromise = Promise.all(Array.from({ length: 10 }, (_, index) => new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `./profile-chunk-v23-${index}.js`
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    }))).then(() => window.__taskerProfileChunks?.join('') || '')
  }
  return taskerProfileLoadPromise
}

async function openProfilePoster() {
  let modal = document.querySelector('#profile-poster-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'profile-poster-modal'
    modal.className = 'profile-poster-modal'
    modal.hidden = true
    const posterSource = './profile-stefan.svg'
    modal.innerHTML = `<div class="profile-poster-dialog" role="dialog" aria-modal="true" aria-label="Tasker profil Stefana Jonića"><button type="button" class="profile-poster-close" aria-label="Zatvori">&times;</button><section class="profile-poster-message"><p>Svaki uspešan posao počinje jasnim planom. Kada su zadaci evidentirani, materijal pod kontrolom i dokumentacija uredno sačuvana, nema nepotrebnog čekanja i iznenađenja.</p><p>TASKER je napravljen da svakog dana znaš šta je završeno, šta još treba uraditi i koji je sledeći korak. Jer dobra organizacija ne znači više administracije — ona znači manje problema, sigurniji rad i više vremena za posao koji je zaista važan.</p><strong>Planiraj jasno.<br>Prati precizno.<br>Završi sigurno.</strong></section><section class="profile-poster-visual"><img src="${posterSource}" alt="Tasker profil Stefana Jonića"><footer><b>Stefan Jonić</b><span>TASKER · Sve pod kontrolom.</span></footer></section></div>`
    document.body.appendChild(modal)
    const style = document.createElement('style')
    style.textContent = `
      .profile-poster-modal{position:fixed;z-index:10000;inset:0;display:grid;place-items:center;padding:22px;background:rgba(3,9,18,.9);backdrop-filter:blur(10px)}
      .profile-poster-modal[hidden]{display:none}
      .profile-poster-dialog{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(290px,440px) minmax(390px,820px);width:min(96vw,1280px);max-height:94vh;border:1px solid rgba(255,211,94,.48);border-radius:20px;background:linear-gradient(145deg,#101a29,#07111f);box-shadow:0 28px 80px rgba(0,0,0,.76),0 0 34px rgba(255,190,40,.22),inset 0 0 22px rgba(255,218,100,.05)}
      .profile-poster-message{position:relative;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:46px 38px;overflow:hidden;border-right:1px solid rgba(255,211,94,.24);background:radial-gradient(circle at 20% 25%,rgba(255,201,66,.12),transparent 42%),linear-gradient(155deg,#111c2c,#081321)}
      .profile-poster-message:before{content:'';position:absolute;inset:-70% -45%;pointer-events:none;background:linear-gradient(115deg,transparent 42%,rgba(255,247,190,.18) 49%,rgba(255,211,80,.32) 50%,transparent 58%);animation:tasker-gold-shine 5.5s ease-in-out infinite}
      .profile-poster-message .gold-kicker{position:relative;color:#ffe794;font:700 16px Georgia,serif;letter-spacing:.18em;text-transform:uppercase;text-shadow:0 0 7px #ffcb35,0 0 18px rgba(255,184,23,.9),0 0 34px rgba(255,160,0,.65)}
      .profile-poster-message p{position:relative;margin:0;color:#ffe7a3;font:italic 600 22px/1.48 "Segoe Print","Bradley Hand","Comic Sans MS",cursive;-webkit-text-stroke:1px #050301;paint-order:stroke fill;text-shadow:-1px -1px 0 #050301,1px -1px 0 #050301,-1px 1px 0 #050301,1px 1px 0 #050301,0 0 6px rgba(255,229,145,.95),0 0 15px rgba(255,188,36,.72),0 0 30px rgba(255,150,0,.45)}
      .profile-poster-message strong{position:relative;margin-top:7px;color:#fff2a8;font:italic 800 27px/1.42 "Segoe Print","Bradley Hand","Comic Sans MS",cursive;letter-spacing:.02em;-webkit-text-stroke:1.25px #050301;paint-order:stroke fill;text-shadow:-1px -1px 0 #050301,1px -1px 0 #050301,-1px 1px 0 #050301,1px 1px 0 #050301,0 0 5px #fff8cf,0 0 12px #ffd34d,0 0 25px #ff9f00,0 0 45px rgba(255,153,0,.8)}
      .profile-poster-visual{min-width:0;background:#07111f}
      .profile-poster-visual img{display:block;width:100%;max-height:82vh;object-fit:contain;background:#07111f}
      .profile-poster-visual footer{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:13px 18px;color:#edf7ff}
      .profile-poster-visual footer b{font-size:14px}
      .profile-poster-visual footer span{color:#70bfff;font-size:11px;font-weight:800}
      @keyframes tasker-gold-shine{0%,52%{transform:translateX(-38%);opacity:0}65%{opacity:1}88%,100%{transform:translateX(42%);opacity:0}}
      .profile-poster-close{position:absolute;z-index:2;right:12px;top:12px;display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,255,255,.35);border-radius:50%;background:rgba(5,14,26,.82);color:white;font-size:25px;cursor:pointer;box-shadow:0 5px 18px rgba(0,0,0,.4)}
      .profile-poster-close:hover{border-color:#68d5ff;color:#8ee4ff}
      @media(max-width:960px){.profile-poster-dialog{grid-template-columns:minmax(245px,36%) minmax(0,1fr)}.profile-poster-message{gap:13px;padding:30px 25px}.profile-poster-message p{font-size:17px}.profile-poster-message strong{font-size:21px}}
      @media(max-width:700px){.profile-poster-modal{padding:10px;overflow:auto}.profile-poster-dialog{display:block;width:96vw;max-height:none;border-radius:14px}.profile-poster-message{padding:31px 24px;border-right:0;border-bottom:1px solid rgba(255,211,94,.24)}.profile-poster-message p{font-size:16px}.profile-poster-message strong{font-size:20px}.profile-poster-visual img{max-height:none}.profile-poster-visual footer{padding:10px 13px}.profile-poster-visual footer span{display:none}}
    `
    document.head.appendChild(style)
    const closePoster = () => { modal.hidden = true }
    modal.querySelector('.profile-poster-close').addEventListener('click', closePoster)
    modal.addEventListener('click', (event) => { if (event.target === modal) closePoster() })
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closePoster() })
  }
  modal.hidden = false
  const posterImage = modal.querySelector('.profile-poster-visual img')
  if (posterImage && !posterImage.dataset.fullLoaded) {
    posterImage.dataset.fullLoaded = 'loading'
    try {
      const posterData = await loadTaskerProfilePoster()
      if (posterData) {
        posterImage.src = `data:image/jpeg;base64,${posterData}`
        posterImage.dataset.fullLoaded = 'true'
      }
    } catch {
      posterImage.dataset.fullLoaded = 'fallback'
    }
  }
}

const profileNameStyle = document.createElement('style')
profileNameStyle.textContent = `
  #profile-name{cursor:pointer;color:#eaf6ff;transition:color .18s,text-shadow .18s}
  #profile-name:hover{color:#80dcff;text-shadow:0 0 9px rgba(80,205,255,.55)}
`
document.head.appendChild(profileNameStyle)
document.addEventListener('click', (event) => {
  const name = event.target.closest('#profile-name')
  if (!name) return
  event.preventDefault()
  event.stopImmediatePropagation()
  openProfilePoster()
}, true)

/* Profil meni u gornjem desnom uglu. */
(() => {
  const profileButton = document.querySelector('.profile')
  if (!profileButton) return

  const profileMenu = document.createElement('section')
  profileMenu.className = 'profile-menu'
  profileMenu.hidden = true
  profileMenu.setAttribute('aria-label', 'Profil korisnika')
  profileMenu.innerHTML = `<div class="profile-menu-head"><span class="profile-menu-avatar" id="profile-menu-initials">SJ</span><div><strong id="profile-menu-name">${esc(state.settings.userName)}</strong><small>Administrator</small></div></div><div class="profile-menu-actions"><button type="button" data-profile-action="settings"><span aria-hidden="true">&#9881;</span>Podešavanja</button><button type="button" data-profile-action="projects"><span aria-hidden="true">&#8962;</span>Promeni projekat</button><button type="button" class="profile-menu-logout" data-profile-action="logout"><span aria-hidden="true">&#8618;</span>Odjavi se</button></div><p class="profile-menu-note">Tasker portal projekata</p>`
  profileButton.insertAdjacentElement('afterend', profileMenu)
  profileButton.setAttribute('aria-expanded', 'false')

  const getInitials = () => (state.settings.userName || 'SJ').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const closeMenu = () => {
    profileMenu.hidden = true
    profileButton.setAttribute('aria-expanded', 'false')
  }
  const openMenu = () => {
    profileMenu.querySelector('#profile-menu-name').textContent = state.settings.userName || 'Korisnik'
    profileMenu.querySelector('#profile-menu-initials').textContent = getInitials()
    profileMenu.hidden = false
    profileButton.setAttribute('aria-expanded', 'true')
  }

  profileButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (profileMenu.hidden) openMenu()
    else closeMenu()
  })

  profileMenu.addEventListener('click', (event) => {
    const action = event.target.closest('[data-profile-action]')?.dataset.profileAction
    if (!action) return
    closeMenu()
    if (action === 'settings') {
      if (projectOpen) navigate('settings')
      else projectsHome()
    }
    if (action === 'projects') projectsHome()
    if (action === 'logout' && confirm('Želite da se odjavite?')) projectsHome()
  })

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.profile') && !event.target.closest('.profile-menu')) closeMenu()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu()
  })
})()

/* Pouzdan profil meni: radi i kada se zaglavlje ponovo iscrta. */
(() => {
  let menu
  let openButton
  const initials = () => (state.settings.userName || 'SJ').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const close = () => {
    if (menu) menu.hidden = true
    if (openButton) openButton.setAttribute('aria-expanded', 'false')
    openButton = null
  }
  const getMenu = () => {
    if (menu) return menu
    menu = document.createElement('section')
    menu.id = 'tasker-profile-menu'
    menu.className = 'profile-menu'
    menu.hidden = true
    menu.setAttribute('aria-label', 'Profil korisnika')
    menu.innerHTML = `<div class="profile-menu-head"><span class="profile-menu-avatar" id="profile-menu-initials">SJ</span><div><strong id="profile-menu-name"></strong><small>Administrator</small></div></div><div class="profile-menu-actions"><button type="button" data-profile-action="settings"><span aria-hidden="true">&#9881;</span>Pode&scaron;avanja</button><button type="button" data-profile-action="projects"><span aria-hidden="true">&#8962;</span>Promeni projekat</button><button type="button" class="profile-menu-logout" data-profile-action="logout"><span aria-hidden="true">&#8618;</span>Odjavi se</button></div><p class="profile-menu-note">Tasker portal projekata</p>`
    document.body.appendChild(menu)
    return menu
  }
  const open = (button) => {
    const box = button.getBoundingClientRect()
    const panel = getMenu()
    panel.querySelector('#profile-menu-name').textContent = state.settings.userName || 'Korisnik'
    panel.querySelector('#profile-menu-initials').textContent = initials()
    panel.hidden = false
    panel.style.top = `${box.bottom + 10}px`
    panel.style.left = `${Math.max(16, Math.min(box.right - 278, window.innerWidth - 294))}px`
    button.setAttribute('aria-expanded', 'true')
    openButton = button
  }
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.profile')
    if (!button) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (event.target.closest('#profile-name')) {
      if (menu && !menu.hidden) close()
      openProfilePoster()
      return
    }
    if (menu && !menu.hidden) close()
    else open(button)
  }, true)
  document.addEventListener('click', (event) => {
    const action = event.target.closest('#tasker-profile-menu [data-profile-action]')?.dataset.profileAction
    if (action) {
      close()
      if (action === 'settings') projectOpen ? navigate('settings') : projectsHome()
      if (action === 'projects') projectsHome()
      if (action === 'logout' && confirm('Zelite da se odjavite?')) projectsHome()
      return
    }
    if (!event.target.closest('#tasker-profile-menu') && !event.target.closest('.profile')) close()
  })
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close() })
})()
