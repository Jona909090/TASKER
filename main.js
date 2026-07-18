import { categories, materials, renderCategory, renderItems, renderMaterials } from './materials.js'

const storage = 'tasker.todos'; const filterStorage = 'tasker.filter'; const inventoryStorage = 'tasker.inventory'; const categoryStorage = 'tasker.categories'; const orderStorage = 'tasker.order-lines'; const moduleStorage = 'tasker.module-progress'; const moduleDetailStorage = 'tasker.module-details'; const employeeStorage = 'tasker.employees'; const attendanceStorage = 'tasker.daily-attendance'; const workPlanStorage = 'tasker.work-plans'; const settingsStorage = 'tasker.settings'
try { const savedCategories = JSON.parse(localStorage.getItem(categoryStorage) || 'null'); if (Array.isArray(savedCategories)) categories.splice(0, categories.length, ...savedCategories) } catch {}
const saveCategories = () => localStorage.setItem(categoryStorage, JSON.stringify(categories))
try { const savedInventory = JSON.parse(localStorage.getItem(inventoryStorage) || 'null'); if (Array.isArray(savedInventory)) materials.splice(0, materials.length, ...savedInventory) } catch {}
const saveInventory = () => localStorage.setItem(inventoryStorage, JSON.stringify(materials))
const defaultSettings = { userName: 'Stefan Jonić', companyName: 'TASKER', defaultMinStock: 0, theme: 'dark' }
let savedSettings = {}
try { savedSettings = JSON.parse(localStorage.getItem(settingsStorage) || '{}') || {} } catch {}
const state = { todos: JSON.parse(localStorage.getItem(storage) || '[]'), filter: localStorage.getItem(filterStorage) || 'all', currentCategory: null, orderLines: JSON.parse(localStorage.getItem(orderStorage) || '[]'), moduleProgress: JSON.parse(localStorage.getItem(moduleStorage) || '{"mv":0,"mvs":0,"rpp":0}'), moduleDetails: JSON.parse(localStorage.getItem(moduleDetailStorage) || '{}'), attendance: JSON.parse(localStorage.getItem(attendanceStorage) || '{}'), workPlans: JSON.parse(localStorage.getItem(workPlanStorage) || '{}'), settings: { ...defaultSettings, ...savedSettings } }
const defaultEmployees = [{ id: 1, name: 'Stefan Jonic', role: 'Vodja gradilista', phone: '---', active: true }, { id: 2, name: 'Marko Petrovic', role: 'Nadzor', phone: '---', active: true }, { id: 3, name: 'Nikola Ilic', role: 'Radnik', phone: '---', active: true }, { id: 4, name: 'Milan Jovanovic', role: 'Radnik', phone: '---', active: true }, { id: 5, name: 'Dejan Markovic', role: 'Radnik', phone: '---', active: true }, { id: 6, name: 'Aleksandar Nikolic', role: 'Pomocni radnik', phone: '---', active: true }]
try { const savedEmployees = JSON.parse(localStorage.getItem(employeeStorage) || 'null'); state.employees = Array.isArray(savedEmployees) ? savedEmployees : defaultEmployees } catch { state.employees = defaultEmployees }
const saveEmployees = () => localStorage.setItem(employeeStorage, JSON.stringify(state.employees))
const saveAttendance = () => localStorage.setItem(attendanceStorage, JSON.stringify(state.attendance))
const saveWorkPlans = () => localStorage.setItem(workPlanStorage, JSON.stringify(state.workPlans))
const saveSettings = () => localStorage.setItem(settingsStorage, JSON.stringify(state.settings))
const applyTheme = () => document.documentElement.dataset.theme = state.settings.theme
applyTheme()
const app = document.querySelector('#app'); const low = materials.filter((item) => item.stock > 0 && item.stock <= item.minStock).length; const noStock = materials.filter((item) => item.stock <= 0).length
const esc = (text) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const save = () => { localStorage.setItem(storage, JSON.stringify(state.todos)); localStorage.setItem(filterStorage, state.filter) }
const saveOrder = () => localStorage.setItem(orderStorage, JSON.stringify(state.orderLines))
const saveModuleProgress = () => localStorage.setItem(moduleStorage, JSON.stringify(state.moduleProgress))
const saveModuleDetails = () => localStorage.setItem(moduleDetailStorage, JSON.stringify(state.moduleDetails))

app.innerHTML = `<div class="shell"><aside class="sidebar"><a class="brand" href="#"><span class="brand-mark"><i></i><b>T</b><i></i></span><span><strong id="brand-company">${esc(state.settings.companyName)}</strong><small>Upravljanje materijalom</small></span></a><nav><button class="nav-link active" data-page="dashboard"><span>\u2302</span> Po\u010Detna</button><button class="nav-link" data-page="materials"><span>\u25A6</span> Materijal <b>${materials.length}</b></button><button class="nav-link" data-page="employees"><span>\u263B</span> Zaposleni</button><button class="nav-link" data-page="orders"><span>\u25A4</span> Narud\u017Ebine</button><button class="nav-link" data-page="reports"><span>\u25A5</span> Izve\u0161taji</button></nav><div class="sidebar-footer"><button class="nav-link" data-page="settings"><span>\u2699</span> Pode\u0161avanja</button><p>Tasker v2.0</p></div></aside><div class="workspace"><header class="topbar"><div><strong id="breadcrumb">Po\u010Detna</strong><small>Petak, 17. jul 2026.</small></div><button type="button" class="profile" aria-label="Otvori profil" style="border:0;background:transparent;color:inherit;cursor:pointer;"><span id="profile-initials">SJ</span><b id="profile-name">${esc(state.settings.userName)}</b></button></header><main id="content" class="content"></main></div></div>`

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

const content = document.querySelector('#content')
const breadcrumb = document.querySelector('#breadcrumb')
const topbarMeta = document.querySelector('.topbar > div:first-child')
const greetingFor = (date) => date.getHours() < 12 ? 'Dobro jutro' : date.getHours() < 18 ? 'Dobar dan' : 'Dobro ve\u010De'
const firstName = () => state.settings.userName.trim().split(/\s+/)[0] || 'Korisniče'
const initialsFor = (name) => name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'T'

const updateClock = () => {
  const now = new Date()
  const date = new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  const time = new Intl.DateTimeFormat('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now)
  topbarMeta.innerHTML = `<strong id="breadcrumb">Po\u010Detna</strong><small><span>${date.charAt(0).toLocaleUpperCase('sr')}${date.slice(1)}.</span><b>${time}</b></small>`
  const greeting = document.querySelector('#greeting')
  if (greeting) greeting.textContent = `${greetingFor(now)}, ${firstName()}.`
}

updateClock()
setInterval(updateClock, 1000)

function dashboard() {
  const done = state.todos.filter((todo) => todo.done).length
  const activeEmployees = state.employees.filter((employee) => employee.active !== false).length
  const inactiveEmployees = state.employees.length - activeEmployees
  content.innerHTML = `<section class="welcome"><div><p class="eyebrow">Kontrolna tabla</p><h1 id="greeting">${greetingFor(new Date())}, ${esc(firstName())}.</h1><p>Ovo je pregled stanja magacina i dana\u0161njih obaveza.</p></div><button class="primary-btn" data-page="materials">Pregledaj materijal \u2192</button></section><section class="stat-grid"><article><span class="stat-icon blue">\u25A6</span><p>Ukupno artikala</p><strong>${materials.length}</strong><small>u 12 kategorija</small></article><article><span class="stat-icon amber">!</span><p>Materijal pri kraju</p><strong>${low}</strong><small>zahteva proveru</small></article><article><span class="stat-icon red">\u00D7</span><p>Nema na stanju</p><strong>${noStock}</strong><small>potrebna narud\u017Ebina</small></article><article><span class="stat-icon green">\u25A4</span><p>Aktivne narud\u017Ebine</p><strong>0</strong><small>nema otvorenih</small></article><button class="employee-overview" data-page="employees" title="Otvori zaposlene"><span class="stat-icon employee-icon">\u263B</span><p>Zaposleni danas</p><strong>${activeEmployees}</strong><small><b>${activeEmployees} aktivnih</b><i>${inactiveEmployees} neaktivnih</i></small><em>Otvori pregled \u2192</em></button></section><section class="dashboard-grid"><article class="panel"><header class="panel-heading"><div><h2>Dnevne obaveze</h2><p>Organizujte zadatke za danas.</p></div><span>${done}/${state.todos.length} zavr\u0161eno</span></header><form id="add-form" class="add-form"><input id="new-todo" maxlength="200" placeholder="Dodajte novu obavezu\u2026"><button>+</button></form><div class="filters" id="filters"><button data-filter="all">Sve</button><button data-filter="active">Aktivne</button><button data-filter="done">Zavr\u0161ene</button></div><ul class="todo-list" id="todo-list"></ul><button id="clear-done" class="clear-btn">Obri\u0161i zavr\u0161ene</button></article><article class="panel"><header class="panel-heading"><div><h2>Brzi pregled</h2><p>Najva\u017Enije informacije iz magacina.</p></div></header><div class="activity"><span class="blue">\u25A6</span><div><b>\u0160rafovska roba</b><p>3.220 komada na stanju</p></div></div><div class="activity"><span class="amber">!</span><div><b>Zakovice pri kraju</b><p>850 kom \u00B7 minimum 1.000</p></div></div><div class="activity"><span class="green">\u2713</span><div><b>Plywood 18 mm</b><p>152 plo\u010De na stanju</p></div></div></article></section>`
  bindTodos()
}

function showTodos() {
  const list = document.querySelector('#todo-list')
  const data = state.filter === 'active' ? state.todos.filter((todo) => !todo.done) : state.filter === 'done' ? state.todos.filter((todo) => todo.done) : state.todos
  document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === state.filter))
  list.innerHTML = data.length ? data.map((todo) => `<li data-id="${todo.id}" class="todo ${todo.done ? 'done' : ''}"><button class="check">${todo.done ? '\u2713' : ''}</button><span>${esc(todo.text)}</span><button class="delete">\u00D7</button></li>`).join('') : '<li class="task-empty">Nema obaveza za ovaj prikaz.</li>'
}

function bindTodos() {
  showTodos()
  document.querySelector('#add-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const input = document.querySelector('#new-todo')
    if (!input.value.trim()) return
    state.todos.unshift({ id: String(Date.now()), text: input.value.trim(), done: false })
    input.value = ''
    save()
    showTodos()
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

function ordersPage() {
  content.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Nabavka</p><h1>Narud\u017Ebine</h1><p>Dodajte materijale koje treba naru\u010Diti i proverite raspolo\u017Eivo stanje.</p></div><button class="secondary-btn clear-order" ${state.orderLines.length ? '' : 'disabled'}>Obri\u0161i listu</button></section><section class="order-panel"><h2>Dodaj stavku za narud\u017Ebinu</h2><form class="order-form" id="order-form"><label>Materijal<select id="order-material">${materials.map((item) => `<option value="${item.id}">${item.name} \u00B7 ${item.stock} ${item.unit} na stanju</option>`).join('')}</select></label><label>Potrebna koli\u010Dina<input id="order-quantity" type="number" min="1" required value="1"></label><button class="primary-btn">\uFF0B Dodaj u listu</button></form></section><section class="order-list"><header><h2>Lista za naru\u010Divanje</h2><span>${state.orderLines.length} stavki</span></header>${renderOrderLines()}</section>`

  document.querySelector('#order-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const materialId = Number(document.querySelector('#order-material').value)
    const quantity = Number(document.querySelector('#order-quantity').value)
    const existing = state.orderLines.find((line) => line.materialId === materialId)
    if (existing) existing.quantity += quantity
    else state.orderLines.push({ id: Date.now(), materialId, quantity })
    saveOrder()
    ordersPage()
  })

  document.querySelector('.clear-order').addEventListener('click', () => {
    if (state.orderLines.length && confirm('Da li \u017Eelite da obri\u0161ete celu listu narud\u017Ebine?')) {
      state.orderLines = []
      saveOrder()
      ordersPage()
    }
  })

  document.querySelector('.order-list').addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-order]')
    if (!remove) return
    state.orderLines = state.orderLines.filter((line) => line.id !== Number(remove.dataset.removeOrder))
    saveOrder()
    ordersPage()
  })
}

function renderOrderLines() {
  if (!state.orderLines.length) return '<div class="order-empty"><b>Lista je prazna.</b><span>Dodajte materijal i potrebnu koli\u010Dinu iznad.</span></div>'

  return `<div class="order-table"><div class="order-row order-labels"><span>Materijal</span><span>Potrebno</span><span>Na stanju</span><span>Nedostaje</span><span></span></div>${state.orderLines.map((line) => {
    const item = materials.find((entry) => entry.id === line.materialId)
    if (!item) return ''
    const missing = Math.max(0, line.quantity - item.stock)
    return `<div class="order-row"><div><b>${item.name}</b><small>${item.standard}</small></div><strong>${new Intl.NumberFormat('sr-RS').format(line.quantity)} ${item.unit}</strong><span>${new Intl.NumberFormat('sr-RS').format(item.stock)} ${item.unit}</span><span class="order-status ${missing ? 'missing' : 'ready'}">${missing ? `Nedostaje ${new Intl.NumberFormat('sr-RS').format(missing)}` : 'Dovoljno na stanju'}</span><button class="remove-order" data-remove-order="${line.id}" aria-label="Ukloni stavku">\u00D7</button></div>`
  }).join('')}</div>`
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
  content.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Administracija sistema</p><h1>Podešavanja</h1><p>Upravljajte profilom, podacima i izgledom aplikacije.</p></div><a class="secondary-btn settings-back" href="./">← Nazad na početnu</a></section><section class="settings-grid"><article class="settings-card"><header><span class="stat-icon blue">◉</span><div><h2>Korisnik i firma</h2><p>Podaci koji se prikazuju u aplikaciji.</p></div></header><form id="profile-settings" class="settings-form"><label>Ime korisnika<input name="userName" required value="${esc(state.settings.userName)}"></label><label>Naziv firme / aplikacije<input name="companyName" required value="${esc(state.settings.companyName)}"></label><button type="submit" class="primary-btn">Sačuvaj podatke</button><button type="button" class="secondary-btn" id="quick-change-profile">Promeni kroz prozor</button></form></article><article class="settings-card"><header><span class="stat-icon amber">◐</span><div><h2>Izgled aplikacije</h2><p>Izaberite temu koja vam odgovara.</p></div></header><div class="theme-options"><button type="button" class="theme-option ${state.settings.theme === 'dark' ? 'selected' : ''}" data-theme="dark"><b>● Tamna tema</b><small>Prijatna za rad uveče.</small></button><button type="button" class="theme-option ${state.settings.theme === 'light' ? 'selected' : ''}" data-theme="light"><b>○ Svetla tema</b><small>Preglednija pri dnevnom svetlu.</small></button></div></article><article class="settings-card"><header><span class="stat-icon green">⌚</span><div><h2>Datum i vreme</h2><p>Aplikacija koristi vreme vašeg uređaja.</p></div></header><div class="settings-info"><b>${now}</b><small>Za promenu vremena podesite datum i sat na računaru ili telefonu.</small></div></article><article class="settings-card"><header><span class="stat-icon blue">▣</span><div><h2>Magacin</h2><p>Podrazumevana minimalna količina za nove artikle.</p></div></header><form id="warehouse-settings" class="settings-form inline-form"><label>Minimalna količina<input name="defaultMinStock" type="number" min="0" value="${Number(state.settings.defaultMinStock) || 0}"></label><button type="submit" class="secondary-btn">Sačuvaj</button></form></article><article class="settings-card settings-card-wide"><header><span class="stat-icon green">⇩</span><div><h2>Rezervna kopija podataka</h2><p>Sačuvajte kompletno stanje aplikacije na računaru ili vratite ranije sačuvanu kopiju.</p></div></header><div class="settings-actions"><button type="button" class="primary-btn" id="backup-data">Preuzmi rezervnu kopiju</button><label class="secondary-btn restore-label">Učitaj rezervnu kopiju<input id="restore-data" type="file" accept="application/json,.json"></label><button type="button" class="secondary-btn" id="settings-export-csv">Izvezi materijal u CSV</button></div></article><article class="settings-card danger-card settings-card-wide"><header><span class="stat-icon red">!</span><div><h2>Brisanje podataka</h2><p>Ove radnje se ne mogu vratiti bez prethodno preuzete rezervne kopije.</p></div></header><div class="settings-actions"><button type="button" class="danger-btn" id="clear-attendance">Obriši dnevnu evidenciju</button><button type="button" class="danger-btn" id="reset-app">Obriši sve probne podatke</button></div></article><article class="settings-card settings-card-wide about-card"><header><span class="stat-icon blue">i</span><div><h2>O aplikaciji</h2><p><b>Tasker v2.0</b> · Sistem za materijal, zaposlene, narudžbine i evidenciju rada.</p></div></header></article></section>`

  document.querySelector('#profile-settings').addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    state.settings.userName = data.get('userName').trim()
    state.settings.companyName = data.get('companyName').trim().toLocaleUpperCase('sr')
    saveSettings()
    document.querySelector('#brand-company').textContent = state.settings.companyName
    document.querySelector('#profile-name').textContent = state.settings.userName
    document.querySelector('#profile-initials').textContent = initialsFor(state.settings.userName)
    settingsPage()
    alert('Ime i naziv firme su sačuvani.')
  })

  document.querySelector('#quick-change-profile').addEventListener('click', () => {
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
    settingsPage()
    alert('Ime i naziv firme su sačuvani.')
  })

  document.querySelectorAll('[data-theme]').forEach((button) => button.addEventListener('click', () => {
    state.settings.theme = button.dataset.theme
    saveSettings()
    applyTheme()
    settingsPage()
  }))

  document.querySelector('#warehouse-settings').addEventListener('submit', (event) => {
    event.preventDefault()
    state.settings.defaultMinStock = Math.max(0, Number(new FormData(event.currentTarget).get('defaultMinStock')) || 0)
    saveSettings()
    alert('Podrazumevana minimalna količina je sačuvana.')
  })

  document.querySelector('#backup-data').addEventListener('click', () => {
    const backup = { version: 'Tasker v2.0', createdAt: new Date().toISOString(), data: { todos: state.todos, filter: state.filter, inventory: materials, categories, orderLines: state.orderLines, moduleProgress: state.moduleProgress, moduleDetails: state.moduleDetails, employees: state.employees, attendance: state.attendance, workPlans: state.workPlans, settings: state.settings } }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    link.download = `tasker-rezervna-kopija-${dateKeyFor()}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  })

  document.querySelector('#restore-data').addEventListener('change', (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result)
        const data = backup.data
        if (!data || !Array.isArray(data.inventory) || !Array.isArray(data.categories) || !Array.isArray(data.employees)) throw new Error('Neispravan fajl')
        if (!confirm('Da li želite da vratite ovu rezervnu kopiju? Trenutni podaci biće zamenjeni.')) return
        localStorage.setItem(storage, JSON.stringify(data.todos || [])); localStorage.setItem(filterStorage, data.filter || 'all'); localStorage.setItem(inventoryStorage, JSON.stringify(data.inventory)); localStorage.setItem(categoryStorage, JSON.stringify(data.categories)); localStorage.setItem(orderStorage, JSON.stringify(data.orderLines || [])); localStorage.setItem(moduleStorage, JSON.stringify(data.moduleProgress || { mv: 0, mvs: 0, rpp: 0 })); localStorage.setItem(moduleDetailStorage, JSON.stringify(data.moduleDetails || {})); localStorage.setItem(employeeStorage, JSON.stringify(data.employees)); localStorage.setItem(attendanceStorage, JSON.stringify(data.attendance || {})); localStorage.setItem(workPlanStorage, JSON.stringify(data.workPlans || {})); localStorage.setItem(settingsStorage, JSON.stringify({ ...defaultSettings, ...(data.settings || {}) }))
        location.reload()
      } catch { alert('Ovaj fajl nije ispravna Tasker rezervna kopija.') }
    }
    reader.readAsText(file)
  })

  document.querySelector('#settings-export-csv').addEventListener('click', exportCsv)
  document.querySelector('#clear-attendance').addEventListener('click', () => {
    if (!confirm('Da li želite da obrišete svu dnevnu evidenciju rada?')) return
    state.attendance = {}
    saveAttendance()
    alert('Dnevna evidencija je obrisana.')
  })
  document.querySelector('#reset-app').addEventListener('click', () => {
    if (!confirm('Ovo briše sve unete materijale, zaposlene, narudžbine i evidenciju. Da li ste sigurni?')) return
    ;[storage, filterStorage, inventoryStorage, categoryStorage, orderStorage, moduleStorage, moduleDetailStorage, employeeStorage, attendanceStorage, workPlanStorage, settingsStorage].forEach((key) => localStorage.removeItem(key))
    location.reload()
  })
}

const moduleTypes = [{ id: 'mv', label: 'MV', name: 'MV moduli', color: '#43c5f6', defaultCount: 16 }, { id: 'mvs', label: 'MVS', name: 'MVS moduli', color: '#a78bfa', defaultCount: 0 }, { id: 'rpp', label: 'RPP', name: 'RPP moduli', color: '#5de18e', defaultCount: 0 }]

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
  return data.units[id]
}

function typeProgress(type) {
  const data = moduleData(type)
  const count = Number(data.count) || 0
  if (!count) return 0
  return Math.round(Array.from({ length: count }, (_, index) => moduleUnit(type, index + 1).progress).reduce((sum, value) => sum + Number(value || 0), 0) / count)
}

function modulesPage() {
  content.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Planiranje proizvodnje</p><h1>Modul</h1><p>Otvorite tip modula i pratite zavrsetak svakog pojedinacno.</p></div></section><section class="module-grid">${moduleTypes.map((type) => { const data = moduleData(type); const progress = typeProgress(type); return `<button class="module-card module-open" data-open-module="${type.id}"><div><p class="eyebrow">Modul</p><h2>${type.label}</h2><p>${data.count ? `${data.count} modula` : 'Nema dodatih modula'}</p><span>Otvori pregled &rarr;</span></div><div class="progress-ring" style="--progress:${progress};--ring:${type.color}"><div><strong>${progress}%</strong><small>zavrseno</small></div></div></button>` }).join('')}</section>`
  document.querySelectorAll('[data-open-module]').forEach((button) => button.addEventListener('click', () => moduleDetailPage(button.dataset.openModule)))
}

function moduleDetailPage(typeId) {
  const type = moduleTypes.find((entry) => entry.id === typeId)
  if (!type) return modulesPage()
  const data = moduleData(type)
  const count = Math.max(0, Math.min(100, Number(data.count) || 0))
  const progress = typeProgress(type)
  content.innerHTML = `<section class="page-heading module-detail-heading"><div><button class="back-link" id="back-modules">&larr; Svi moduli</button><p class="eyebrow">${type.label} moduli</p><h1>${type.label}</h1><p>Pregled pojedinacnih modula i njihovog napretka.</p></div><div class="module-total"><span>Ukupno zavrseno</span><b>${progress}%</b></div></section><section class="module-controls"><label>Broj ${type.label} modula<input id="module-count" type="number" min="0" max="100" value="${count}"></label><button class="primary-btn" id="save-module-count">Sacuvaj broj modula</button></section><section class="individual-module-grid">${count ? Array.from({ length: count }, (_, index) => { const unit = moduleUnit(type, index + 1); return `<button class="individual-module" data-open-unit="${unit.id}"><div><p>MODUL</p><h2>${unit.id}</h2></div><div class="mini-progress" style="--progress:${unit.progress};--ring:${type.color}"><b>${unit.progress}%</b></div><label><span>${unit.work ? esc(unit.work) : 'Dodajte sta je uradjeno'}</span></label></button>` }).join('') : '<p class="plan-empty">Unesite broj modula da bi se pojavile pojedinacne kartice.</p>'}</section>`
  document.querySelector('#back-modules').addEventListener('click', modulesPage)
  document.querySelector('#save-module-count').addEventListener('click', () => { data.count = Math.max(0, Math.min(100, Number(document.querySelector('#module-count').value) || 0)); saveModuleDetails(); moduleDetailPage(typeId) })
  document.querySelectorAll('[data-open-unit]').forEach((button) => button.addEventListener('click', () => moduleUnitPage(typeId, button.dataset.openUnit)))
}

function moduleUnitPage(typeId, unitId) {
  const type = moduleTypes.find((entry) => entry.id === typeId)
  const unit = Object.values(moduleData(type).units).find((entry) => entry.id === unitId)
  if (!type || !unit) return moduleDetailPage(typeId)
  if (!Array.isArray(unit.consumption)) unit.consumption = []
  const today = new Intl.DateTimeFormat('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
  content.innerHTML = `<section class="page-heading module-detail-heading"><div><button class="back-link" id="back-module-type">&larr; Nazad na ${type.label}</button><p class="eyebrow">Detalji modula</p><h1>${unit.id}</h1><p>Vodite evidenciju radova i fotografija za ovaj modul.</p></div><div class="module-total"><span>Napredak</span><b>${unit.progress}%</b></div></section><section class="unit-detail-grid"><article class="plan-panel"><h2>Stanje radova</h2><form id="module-unit-form" class="unit-form"><label>Procenat zavrsenosti<input name="progress" type="number" min="0" max="100" value="${unit.progress}"></label><label>Sta je uradjeno<input name="work" maxlength="180" value="${esc(unit.work)}" placeholder="npr. Postavljen plywood i cetris"></label><label>Beleška<textarea name="note" maxlength="1000" placeholder="Upisite napomenu za ovaj modul...">${esc(unit.note)}</textarea></label><button class="primary-btn">Sacuvaj promene</button></form></article><article class="plan-panel gallery-panel"><header><div><h2>Fotografije modula</h2><p>${today} - najvise 3 manje fotografije.</p></div></header><label class="photo-upload"><span>+ Dodaj fotografiju</span><input id="module-photo-input" type="file" accept="image/*" multiple></label><p class="photo-help">Fotografije se trenutno cuvaju u ovom browseru. Za trajno cuvanje na svim uredjajima kasnije dodajemo Drive ili bazu.</p><div id="module-gallery" class="module-gallery">${unit.photos.length ? unit.photos.map((photo, index) => `<figure><img src="${photo.data}" alt="Fotografija ${index + 1}"><figcaption>${photo.date}<button data-delete-photo="${index}" title="Obrisi fotografiju">&times;</button></figcaption></figure>`).join('') : '<p class="plan-empty">Jos nema fotografija za ovaj modul.</p>'}</div></article></section>`
  content.insertAdjacentHTML('beforeend', `<section class="plan-panel consumption-panel"><header><div><h2>Potrosnja materijala</h2><p>Materijal se automatski skida sa stanja magacina.</p></div><span>${unit.consumption.length} stavki</span></header><form id="consumption-form" class="consumption-form"><label>Materijal<select name="material" required>${materials.map((item) => `<option value="${item.id}">${esc(item.name)} - ${new Intl.NumberFormat('sr-RS').format(item.stock)} ${esc(item.unit)}</option>`).join('')}</select></label><label>Kolicina<input name="quantity" type="number" min="1" required value="1"></label><button class="primary-btn" ${materials.length ? '' : 'disabled'}>Skini sa stanja</button></form><div id="consumption-list" class="consumption-list">${unit.consumption.length ? unit.consumption.slice().reverse().map((entry) => `<article><div><b>${esc(entry.name)}</b><p>${entry.date} &middot; ${entry.quantity} ${esc(entry.unit)} skinuto sa stanja</p></div><strong>-${entry.quantity} ${esc(entry.unit)}</strong><button data-undo-consumption="${entry.id}" title="Vrati materijal na stanje">&crarr;</button></article>`).join('') : '<p class="plan-empty">Jos nije evidentirana potrosnja materijala za ovaj modul.</p>'}</div></section>`)
  content.insertAdjacentHTML('beforeend', `<style>#content .consumption-panel{margin-top:18px!important;padding:21px!important;border:1px solid #2c4d6b!important;border-radius:16px!important;background:linear-gradient(145deg,#1d2c45,#152139)!important}#content .consumption-panel header{display:flex!important;justify-content:space-between!important;gap:12px!important;align-items:flex-start!important;margin-bottom:16px!important}#content .consumption-panel h2{margin:0!important;font-size:18px!important}#content .consumption-panel header p{margin:5px 0 0!important;color:#9cafc5!important;font-size:12px!important}#content .consumption-panel header>span{color:#82ddff!important;font-size:11px!important;font-weight:800!important}.consumption-form{display:grid!important;grid-template-columns:minmax(240px,1fr) 150px auto!important;gap:12px!important;align-items:end!important;padding-bottom:17px!important;border-bottom:1px solid #2d4b68!important}.consumption-form label{display:grid!important;gap:6px!important;color:#a4b8cf!important;font-size:11px!important;font-weight:800!important}.consumption-form select,.consumption-form input{height:43px!important;padding:0 11px!important;border:1px solid #365b7b!important;border-radius:9px!important;outline:0!important;background:#102039!important;color:#f0f8ff!important}.consumption-list article{display:grid!important;grid-template-columns:1fr auto 30px!important;gap:14px!important;align-items:center!important;padding:13px 4px!important;border-bottom:1px solid #294762!important}.consumption-list article b{font-size:13px!important}.consumption-list article p{margin:4px 0 0!important;color:#99aec6!important;font-size:11px!important}.consumption-list article strong{color:#ffadba!important;font-size:13px!important}.consumption-list article button{width:28px!important;height:28px!important;border:1px solid #3c6988!important;border-radius:8px!important;background:#1b4564!important;color:#8bdefc!important;font-size:17px!important;cursor:pointer!important}@media(max-width:620px){.consumption-form{grid-template-columns:1fr!important}.consumption-form .primary-btn{width:100%!important}.consumption-list article{grid-template-columns:1fr auto!important}.consumption-list article button{grid-column:2!important}}</style>`)
  document.querySelector('#back-module-type').addEventListener('click', () => moduleDetailPage(typeId))
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

function placeholder(title) {
  content.innerHTML = `<section class="empty-page"><p class="eyebrow">U pripremi</p><h1>${title}</h1><p>Ovaj deo sistema bi\u0107e dodat u narednom koraku.</p></section>`
}

function navigate(page) {
  const labels = { dashboard: 'Po\u010Detna', materials: 'Materijal', employees: 'Zaposleni', orders: 'Narud\u017Ebine', modules: 'Modul', 'daily-report': 'Dnevni izve\u0161taj rada', 'work-plan': 'Plan rada', documents: 'Dokumentacija', reports: 'Izve\u0161taji', settings: 'Pode\u0161avanja' }
  document.querySelector('#breadcrumb').textContent = labels[page]
  document.querySelectorAll('.nav-link[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === page))

  if (page === 'dashboard') dashboard()
  else if (page === 'materials') materialsPage()
  else if (page === 'employees') employeesPage()
  else if (page === 'orders') ordersPage()
  else if (page === 'modules') modulesPage()
  else if (page === 'daily-report') dailyReportPage()
  else if (page === 'work-plan') workPlanPage()
  else if (page === 'documents') documentsPage()
  else if (page === 'reports') reportsPage()
  else if (page === 'settings') settingsPage()
  else placeholder(labels[page])
}

app.addEventListener('click', (event) => {
  if (event.target.closest('.brand')) {
    event.preventDefault()
    navigate('dashboard')
    return
  }
  const button = event.target.closest('[data-page]')
  if (button) navigate(button.dataset.page)
})

navigate('dashboard')

/* Profilna slika - klik na Stefan Jonic */
(() => {
  const imagePath = './profil-tasker.jpg'

  function openProfile() {
    if (document.querySelector('#tasker-profile-modal')) return

    const modal = document.createElement('div')
    modal.id = 'tasker-profile-modal'
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:rgba(4,12,26,.78);backdrop-filter:blur(8px);'

    modal.innerHTML = `<section style="position:relative;width:min(760px,100%);max-height:90vh;overflow:auto;border:1px solid #4ac9ff;border-radius:22px;background:#142744;box-shadow:0 24px 80px rgba(0,0,0,.55);"><button type="button" data-close-profile style="position:absolute;top:14px;right:14px;width:42px;height:42px;border:0;border-radius:12px;cursor:pointer;color:#fff;background:#28476d;font-size:28px;line-height:1;">&times;</button><img src="${imagePath}" alt="Tasker profil" style="display:block;width:100%;height:auto;"><div style="padding:18px 22px 22px;color:#fff;"><div style="color:#61dcff;font-size:12px;font-weight:800;letter-spacing:1px;">TASKER</div><h2 style="margin:6px 0 0;font-size:26px;">Stefan Joni\u0107</h2><p style="margin:6px 0 0;color:#a9bdd8;">Upravljanje materijalom i radom.</p></div></section>`

    const closeProfile = () => {
      document.body.style.overflow = ''
      modal.remove()
    }

    modal.querySelector('[data-close-profile]').addEventListener('click', closeProfile)
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeProfile()
    })

    document.body.appendChild(modal)
    document.body.style.overflow = 'hidden'
  }

  const profileButton = document.querySelector('.profile')

  if (profileButton) {
    profileButton.style.cursor = 'pointer'
    profileButton.title = 'Otvori profil'
    profileButton.setAttribute('role', 'button')
    profileButton.setAttribute('tabindex', '0')

    profileButton.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      openProfile()
    })

    profileButton.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') openProfile()
    })
  }
})()
