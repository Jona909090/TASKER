import { renderMaterials } from "./materials.js";
const STORAGE_KEY = 'tasker.todos'
const FILTER_KEY = 'tasker.filter'

const FILTERS = ['all', 'active', 'done']

const loadTodos = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
} 

const saveTodos = (todos) => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))

const loadFilter = () => {
  const f = localStorage.getItem(FILTER_KEY)
  return FILTERS.includes(f) ? f : 'all'
}

const state = {
  todos: loadTodos(),
  filter: loadFilter(),
}

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="app-header">
 <div class="brand">

    <div class="logo-stack">
        <div class="logo-red"></div>

        <div class="logo-blue">
            <span>T</span>
        </div>

        <div class="logo-white"></div>
    </div>

    <div class="brand-text">
        <h1>TASKER</h1>
    </div>

</div>
   <p class="tagline">Stay organized. One task at a time.</p>
<p class="author">Stefan Jonić</p>
  </header>
<div class="layout">

    <aside class="sidebar">

        <button class="side-btn active">
            🏠 Home
        </button>

        <button class="side-btn">
            📦 Materials
        </button>

        <button class="side-btn">
            🛒 Orders
        </button>

        <button class="side-btn">
            📊 Reports
        </button>

        <button class="side-btn">
            ⚙ Settings
        </button>

    </aside>

    <main class="content">
  <form class="add-form" id="add-form" autocomplete="off">
    <input type="text" id="new-todo" placeholder="What needs to be done?" maxlength="200" />
    <button type="submit">Add</button>
  </form>

  <div class="toolbar">
    <div class="filters" id="filters">
      <button data-filter="all">All</button>
      <button data-filter="active">Active</button>
      <button data-filter="done">Done</button>
    </div>
    <button class="clear-btn" id="clear-done">Clear completed</button>
  </div>

  <ul class="todo-list" id="todo-list"></ul>

  <div class="stats" id="stats"></div>
</main>

</div>
`;

const form = app.querySelector('#add-form')
const input = app.querySelector('#new-todo')
const listEl = app.querySelector('#todo-list')
const filtersEl = app.querySelector('#filters')
const clearBtn = app.querySelector('#clear-done')
const statsEl = app.querySelector('#stats')

const escapeHtml = (str) =>
  str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))

const visibleTodos = () => {
  if (state.filter === 'active') return state.todos.filter((t) => !t.done)
  if (state.filter === 'done') return state.todos.filter((t) => t.done)
  return state.todos
}

const renderFilters = () => {
  filtersEl.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === state.filter)
  })
}

const renderStats = () => {
  const total = state.todos.length
  const done = state.todos.filter((t) => t.done).length
  const active = total - done
  statsEl.innerHTML = `
    <span><strong>${active}</strong> active</span>
    <span><strong>${done}</strong> done of <strong>${total}</strong></span>
  `
}

const renderList = () => {
  const items = visibleTodos()

  if (items.length === 0) {
    const msg =
      state.filter === 'done'
        ? 'No completed tasks yet.'
        : state.filter === 'active'
          ? 'Nothing left to do. Nice!'
          : 'No tasks yet. Add one above to get started.'
    listEl.innerHTML = `
      <div class="empty">
        <div class="empty-icon">✦</div>
        <p>${msg}</p>
      </div>
    `
    return
  }

  listEl.innerHTML = items
    .map(
      (t) => `
      <li class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <button class="check ${t.done ? 'done' : ''}" aria-label="Toggle complete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <span class="todo-text">${escapeHtml(t.text)}</span>
        <button class="del-btn" aria-label="Delete task">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </li>
    `,
    )
    .join('')
}

const render = () => {
  renderFilters()
  renderList()
  renderStats()
}

const persist = () => {
  saveTodos(state.todos)
  localStorage.setItem(FILTER_KEY, state.filter)
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  const text = input.value.trim()
  if (!text) return
  state.todos.unshift({ id: Date.now() + Math.random().toString(16).slice(2), text, done: false })
  input.value = ''
  persist()
  render()
})

filtersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]')
  if (!btn) return
  state.filter = btn.dataset.filter
  persist()
  render()
})

listEl.addEventListener('click', (e) => {
  const item = e.target.closest('.todo-item')
  if (!item) return
  const id = item.dataset.id
  const todo = state.todos.find((t) => t.id === id)
  if (!todo) return

  if (e.target.closest('.check')) {
    todo.done = !todo.done
    persist()
    render()
  } else if (e.target.closest('.del-btn')) {
    item.classList.add('removing')
    setTimeout(() => {
      state.todos = state.todos.filter((t) => t.id !== id)
      persist()
      render()
    }, 160)
  }
})

clearBtn.addEventListener('click', () => {
  state.todos = state.todos.filter((t) => !t.done)
  persist()
  render()
})

render()
input.focus() 
const materialBtn = document.querySelector(".side-btn:nth-child(2)");

materialBtn.addEventListener("click", () => {
    document.querySelector(".content").innerHTML = renderMaterials();
});
