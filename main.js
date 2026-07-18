import { categories, materials, renderCategory, renderItems, renderMaterials } from './materials.js'

const storage = 'tasker.todos'; const filterStorage = 'tasker.filter'; const inventoryStorage = 'tasker.inventory'; const categoryStorage = 'tasker.categories'; const orderStorage = 'tasker.order-lines'; const moduleStorage = 'tasker.module-progress'; const employeeStorage = 'tasker.employees'; const attendanceStorage = 'tasker.daily-attendance'
try { const savedCategories = JSON.parse(localStorage.getItem(categoryStorage) || 'null'); if (Array.isArray(savedCategories)) categories.splice(0, categories.length, ...savedCategories) } catch {}
const saveCategories = () => localStorage.setItem(categoryStorage, JSON.stringify(categories))
try { const savedInventory = JSON.parse(localStorage.getItem(inventoryStorage) || 'null'); if (Array.isArray(savedInventory)) materials.splice(0, materials.length, ...savedInventory) } catch {}
const saveInventory = () => localStorage.setItem(inventoryStorage, JSON.stringify(materials))
const state = { todos: JSON.parse(localStorage.getItem(storage) || '[]'), filter: localStorage.getItem(filterStorage) || 'all', currentCategory: null, orderLines: JSON.parse(localStorage.getItem(orderStorage) || '[]'), moduleProgress: JSON.parse(localStorage.getItem(moduleStorage) || '{"mv":0,"mvs":0,"rpp":0}'), attendance: JSON.parse(localStorage.getItem(attendanceStorage) || '{}') }
const defaultEmployees = [{ id: 1, name: 'Stefan Jonic', role: 'Vodja gradilista', phone: '---', active: true }, { id: 2, name: 'Marko Petrovic', role: 'Nadzor', phone: '---', active: true }, { id: 3, name: 'Nikola Ilic', role: 'Radnik', phone: '---', active: true }, { id: 4, name: 'Milan Jovanovic', role: 'Radnik', phone: '---', active: true }, { id: 5, name: 'Dejan Markovic', role: 'Radnik', phone: '---', active: true }, { id: 6, name: 'Aleksandar Nikolic', role: 'Pomocni radnik', phone: '---', active: true }]
try { const savedEmployees = JSON.parse(localStorage.getItem(employeeStorage) || 'null'); state.employees = Array.isArray(savedEmployees) ? savedEmployees : defaultEmployees } catch { state.employees = defaultEmployees }
const saveEmployees = () => localStorage.setItem(employeeStorage, JSON.stringify(state.employees))
const saveAttendance = () => localStorage.setItem(attendanceStorage, JSON.stringify(state.attendance))
const app = document.querySelector('#app'); const low = materials.filter((item) => item.stock > 0 && item.stock <= item.minStock).length; const noStock = materials.filter((item) => item.stock <= 0).length
const esc = (text) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const save = () => { localStorage.setItem(storage, JSON.stringify(state.todos)); localStorage.setItem(filterStorage, state.filter) }
const saveOrder = () => localStorage.setItem(orderStorage, JSON.stringify(state.orderLines))
const saveModuleProgress = () => localStorage.setItem(moduleStorage, JSON.stringify(state.moduleProgress))

app.innerHTML = `<div class="shell"><aside class="sidebar"><a class="brand" href="#"><span class="brand-mark"><i></i><b>T</b><i></i></span><span><strong>TASKER</strong><small>Upravljanje materijalom</small></span></a><nav><button class="nav-link active" data-page="dashboard"><span>\u2302</span> Po\u010Detna</button><button class="nav-link" data-page="materials"><span>\u25A6</span> Materijal <b>${materials.length}</b></button><button class="nav-link" data-page="employees"><span>\u263B</span> Zaposleni</button><button class="nav-link" data-page="orders"><span>\u25A4</span> Narud\u017Ebine</button><button class="nav-link" data-page="reports"><span>\u25A5</span> Izve\u0161taji</button></nav><div class="sidebar-footer"><button class="nav-link" data-page="settings"><span>\u2699</span> Pode\u0161avanja</button><p>Tasker v2.0</p></div></aside><div class="workspace"><header class="topbar"><div><strong id="breadcrumb">Po\u010Detna</strong><small>Petak, 17. jul 2026.</small></div><button type="button" class="profile" aria-label="Otvori profil" style="border:0;background:transparent;color:inherit;cursor:pointer;"><span>SJ</span><b>Stefan Joni\u0107</b></button></header><main id="content" class="content"></main></div></div>`

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

const content = document.querySelector('#content')
const breadcrumb = document.querySelector('#breadcrumb')
const topbarMeta = document.querySelector('.topbar > div:first-child')
const greetingFor = (date) => date.getHours() < 12 ? 'Dobro jutro' : date.getHours() < 18 ? 'Dobar dan' : 'Dobro ve\u010De'

const updateClock = () => {
  const now = new Date()
  const date = new Intl.DateTimeFormat('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  const time = new Intl.DateTimeFormat('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now)
  topbarMeta.innerHTML = `<strong id="breadcrumb">Po\u010Detna</strong><small><span>${date.charAt(0).toLocaleUpperCase('sr')}${date.slice(1)}.</span><b>${time}</b></small>`
  const greeting = document.querySelector('#greeting')
  if (greeting) greeting.textContent = `${greetingFor(now)}, Stefane.`
}

updateClock()
setInterval(updateClock, 1000)

function dashboard() {
  const done = state.todos.filter((todo) => todo.done).length
  const activeEmployees = state.employees.filter((employee) => employee.active !== false).length
  const inactiveEmployees = state.employees.length - activeEmployees
  content.innerHTML = `<section class="welcome"><div><p class="eyebrow">Kontrolna tabla</p><h1 id="greeting">${greetingFor(new Date())}, Stefane.</h1><p>Ovo je pregled stanja magacina i dana\u0161njih obaveza.</p></div><button class="primary-btn" data-page="materials">Pregledaj materijal \u2192</button></section><section class="stat-grid"><article><span class="stat-icon blue">\u25A6</span><p>Ukupno artikala</p><strong>${materials.length}</strong><small>u 12 kategorija</small></article><article><span class="stat-icon amber">!</span><p>Materijal pri kraju</p><strong>${low}</strong><small>zahteva proveru</small></article><article><span class="stat-icon red">\u00D7</span><p>Nema na stanju</p><strong>${noStock}</strong><small>potrebna narud\u017Ebina</small></article><article><span class="stat-icon green">\u25A4</span><p>Aktivne narud\u017Ebine</p><strong>0</strong><small>nema otvorenih</small></article><button class="employee-overview" data-page="employees" title="Otvori zaposlene"><span class="stat-icon employee-icon">\u263B</span><p>Zaposleni danas</p><strong>${activeEmployees}</strong><small><b>${activeEmployees} aktivnih</b><i>${inactiveEmployees} neaktivnih</i></small><em>Otvori pregled \u2192</em></button></section><section class="dashboard-grid"><article class="panel"><header class="panel-heading"><div><h2>Dnevne obaveze</h2><p>Organizujte zadatke za danas.</p></div><span>${done}/${state.todos.length} zavr\u0161eno</span></header><form id="add-form" class="add-form"><input id="new-todo" maxlength="200" placeholder="Dodajte novu obavezu\u2026"><button>+</button></form><div class="filters" id="filters"><button data-filter="all">Sve</button><button data-filter="active">Aktivne</button><button data-filter="done">Zavr\u0161ene</button></div><ul class="todo-list" id="todo-list"></ul><button id="clear-done" class="clear-btn">Obri\u0161i zavr\u0161ene</button></article><article class="panel"><header class="panel-heading"><div><h2>Brzi pregled</h2><p>Najva\u017Enije informacije iz magacina.</p></div></header><div class="activity"><span class="blue">\u25A6</span><div><b>\u0160rafovska roba</b><p>3.220 komada na stanju</p></div></div><div class="activity"><span class="amber">!</span><div><b>Zakovice pri kraju</b><p>850 kom \u00B7 minimum 1.000</p></div></div><div class="activity"><span class="green">\u2713</span><div><b>Plywood 18 mm</b><p>152 plo\u010De na stanju</p></div></div></article></section>`
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

function modulesPage() {
  const modules = [{ id: 'mv', label: 'MV', name: 'MV moduli', color: '#43c5f6' }, { id: 'mvs', label: 'MVS', name: 'MVS moduli', color: '#a78bfa' }, { id: 'rpp', label: 'RPP', name: 'RPP moduli', color: '#5de18e' }]
  content.innerHTML = `<section class="page-heading"><div><p class="eyebrow">Planiranje proizvodnje</p><h1>Modul</h1><p>Pratite napredak zavr\u0161enog posla po tipu modula.</p></div></section><section class="module-grid">${modules.map((module) => {
    const progress = Math.max(0, Math.min(100, Number(state.moduleProgress[module.id]) || 0))
    return `<article class="module-card"><div><p class="eyebrow">Modul</p><h2>${module.label}</h2><p>${module.name}</p></div><div class="progress-ring" style="--progress:${progress};--ring:${module.color}"><div><strong>${progress}%</strong><small>zavr\u0161eno</small></div></div><label>Zavr\u0161en posao (%)<input class="module-progress-input" data-module="${module.id}" type="number" min="0" max="100" value="${progress}"></label></article>`
  }).join('')}</section>`

  document.querySelectorAll('.module-progress-input').forEach((input) => input.addEventListener('change', () => {
    state.moduleProgress[input.dataset.module] = Math.max(0, Math.min(100, Number(input.value) || 0))
    saveModuleProgress()
    modulesPage()
  }))
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
  document.body.insertAdjacentHTML('beforeend', `<div class="material-modal" role="dialog" aria-modal="true"><form class="material-dialog material-form" id="material-form"><button type="button" class="modal-close" aria-label="Zatvori">\u00D7</button><p class="eyebrow">Novi artikal</p><h2>Dodaj materijal</h2><p class="material-standard">Unesite osnovne podatke za novi artikal u magacinu.</p><div class="form-grid"><label>Naziv artikla<input name="name" required placeholder="npr. DIN7500M TX M6\u00D740 Zn"></label><label>Kategorija<select name="category">${categories.map((category) => `<option value="${category.id}" ${category.id === selected ? 'selected' : ''}>${category.name}</option>`).join('')}</select></label><label class="new-category">Nova kategorija <small>(po \u017Eelji)</small><input name="newCategory" placeholder="npr. ALATI"></label><label>Standard / opis<input name="standard" required placeholder="npr. DIN 7500 M"></label><label>Jedinica<input name="unit" required value="kom"></label><label>Koli\u010Dina na stanju<input name="stock" required type="number" min="0" value="0"></label><label>Minimalna koli\u010Dina<input name="minStock" required type="number" min="0" value="0"></label><label>Lokacija<input name="location" required placeholder="npr. A-01-02"></label><label>Dobavlja\u010D<input name="supplier" required placeholder="npr. W\u00FCrth"></label></div><div class="detail-actions"><button type="button" class="secondary-btn modal-close">Otka\u017Ei</button><button class="primary-btn">Sa\u010Duvaj materijal</button></div></form></div>`)

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
  const labels = { dashboard: 'Po\u010Detna', materials: 'Materijal', employees: 'Zaposleni', orders: 'Narud\u017Ebine', modules: 'Modul', 'daily-report': 'Dnevni izve\u0161taj rada', reports: 'Izve\u0161taji', settings: 'Pode\u0161avanja' }
  document.querySelector('#breadcrumb').textContent = labels[page]
  document.querySelectorAll('.nav-link[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === page))

  if (page === 'dashboard') dashboard()
  else if (page === 'materials') materialsPage()
  else if (page === 'employees') employeesPage()
  else if (page === 'orders') ordersPage()
  else if (page === 'modules') modulesPage()
  else if (page === 'daily-report') dailyReportPage()
  else if (page === 'reports') reportsPage()
  else placeholder(labels[page])
}

app.addEventListener('click', (event) => {
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
