// TASKER v68: dorada projektnog dnevnog izvjestaja.
(() => {
  const DRAFTS = 'tasker.project-diary-drafts'
  const $ = (s, r = document) => r.querySelector(s)
  const readAll = () => { try { return JSON.parse(localStorage.getItem(DRAFTS) || '{}') || {} } catch { return {} } }
  const dateKey = page => $('[data-project-field="date"]', page)?.value || new Date().toISOString().slice(0, 10)
  const readDraft = page => readAll()[dateKey(page)] || {}
  const saveAll = page => {
    const all = readAll(), key = dateKey(page), data = {}
    page.querySelectorAll('[data-project-field]').forEach(el => data[el.dataset.projectField] = el.value)
    all[key] = { ...(all[key] || {}), ...data, updatedAt: new Date().toISOString() }
    try { localStorage.setItem(DRAFTS, JSON.stringify(all)) } catch { alert('Logo je prevelik. Izaberite manju sliku.') }
    const status = $('#project-diary-status'); if (status) status.textContent = 'Nacrt je sačuvan.'
  }

  const style = document.createElement('style')
  style.textContent = `
  .project-diary-sheet{--activity-lines:15;--notes-lines:5}
  .project-diary-logo-row{height:88px!important;grid-template-columns:38% 62%!important}.project-diary-logo{position:relative;gap:11px!important;padding:9px 18px!important}.project-diary-logo img{width:52px!important;height:52px!important;object-fit:contain}.project-diary-logo b{font-size:25px!important;letter-spacing:.16em!important}
  .project-logo-change{position:absolute;right:8px;bottom:6px;padding:4px 7px;border:1px solid #8aa0b2;border-radius:5px;background:#f2f5f7;color:#1d2b37;font-size:8px;font-weight:800;cursor:pointer}.project-logo-file{display:none!important}
  .project-diary-title{padding:7px 15px 6px!important}.project-diary-title h1{font-size:23px!important}.project-diary-title label{margin-top:5px!important;font-size:12px!important}.project-diary-title label input{height:19px!important}
  .project-diary-meta{grid-template-columns:18% 43% 39%!important}.project-diary-meta>div{min-height:27px!important}.project-meta-check{grid-column:3;grid-row:1 / span 2;display:grid!important;grid-template-columns:38% 62%;grid-template-rows:1fr 1fr;padding:0!important;border-right:0!important}.project-meta-check label{display:flex;align-items:center;padding:4px 7px;border-right:1px solid #111;border-bottom:1px dotted #666;font-weight:800}.project-meta-check input{height:auto!important;padding:3px 5px}.project-meta-check>*:nth-child(-n+2){border-bottom:1px dotted #666}
  .project-diary-workers{grid-template-columns:18% 43% 39%!important}.project-diary-workers>div{min-height:58px!important;padding:5px 8px!important}.project-diary-workers>div:last-child{border-right:0}.project-diary-workers b{font-size:14px!important}.project-diary-workers input{height:28px!important;margin-top:3px!important;font-size:20px!important}
  .project-diary-staff .head{min-height:39px!important}.project-shift-title{font-weight:800}.project-shift-time{display:flex;align-items:center;justify-content:center;gap:3px;margin-top:2px;font-size:8px;font-style:normal;font-weight:700}.project-shift-time input{width:45px!important;padding:1px!important;border-bottom:1px solid #777!important;font-size:8px!important}
  .project-diary-section-title{height:25px!important;padding:3px 7px!important}.project-rich-wrap{position:relative;background:#fff}.project-rich-toolbar{display:flex;align-items:center;gap:4px;padding:5px 7px;border-bottom:1px solid #999;background:#e9eef2}.project-rich-toolbar select,.project-rich-toolbar button,.project-rich-toolbar label{height:25px;border:1px solid #98a6b2;border-radius:4px;background:#fff;color:#111;font-size:10px;font-weight:800}.project-rich-toolbar select{width:105px;padding:2px}.project-rich-toolbar button{min-width:27px;padding:2px 6px;cursor:pointer}.project-rich-toolbar label{display:flex;align-items:center;gap:3px;padding:2px 5px}.project-rich-toolbar input[type=color]{width:19px;height:19px;padding:0;border:0}.project-rich-toolbar .grow{flex:1}.project-rich-source,.project-rich-data{display:none!important}
  .project-rich-editor{width:100%;padding:3px 11px;outline:0;overflow:hidden;color:#080808;line-height:29px;background-color:#fff;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 28px,#777 28px,#777 29px);background-size:100% 29px}.project-rich-editor:focus{box-shadow:inset 0 0 0 2px #1ca6e0}.project-rich-activity{height:calc(var(--activity-lines) * 29px)}.project-rich-notes{height:calc(var(--notes-lines) * 29px);border-bottom:2px solid #111}.project-diary-disclaimer{min-height:42px!important;padding:6px 28px!important}
  .project-diary-sheet.pdf-mode{height:1123px!important}.project-diary-sheet.pdf-mode .project-pdf-hide{display:none!important}.project-diary-sheet.pdf-mode .project-rich-editor{overflow:hidden!important}.project-diary-sheet.pdf-mode .project-diary-logo-row{height:88px!important}
  @media(max-width:720px){.project-diary-logo-row{height:70px!important}.project-diary-logo img{width:40px!important;height:40px!important}.project-diary-logo b{font-size:17px!important}.project-logo-change{font-size:7px}.project-diary-title h1{font-size:18px!important}.project-diary-meta{grid-template-columns:22% 38% 40%!important}.project-diary-workers{grid-template-columns:22% 38% 40%!important}.project-rich-toolbar{flex-wrap:wrap}.project-rich-toolbar .grow{display:none}.project-rich-editor{font-size:11px}}
  `
  document.head.appendChild(style)

  const hidden = (page, key, value = '') => {
    let el = $(`[data-project-field="${key}"]`, page)
    if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.className = 'project-rich-data'; el.dataset.projectField = key; page.appendChild(el) }
    el.value = value ?? ''; return el
  }
  const compactMeta = page => {
    const meta = $('.project-diary-meta', page); if (!meta) return
    const contractor = $('[data-project-field="contractor"]', meta), location = $('[data-project-field="location"]', meta), date = $('[data-project-field="date"]', meta), checked = $('[data-project-field="checkedBy"]', meta)
    const cell = (label, input) => { const a = document.createElement('div'), b = document.createElement('div'); a.className = 'project-diary-label'; a.innerHTML = `<b>${label}</b>`; b.appendChild(input); return [a,b] }
    const right = document.createElement('div'); right.className = 'project-meta-check'; right.innerHTML = '<label>Datum:</label><span></span><label>Checked by:</label><span></span>'
    right.children[1].appendChild(date); right.children[3].appendChild(checked)
    meta.replaceChildren(...cell('Izvođač:', contractor), ...cell('Lokacija:', location), right)
  }
  const compactWorkers = page => {
    const row = $('.project-diary-workers', page), input = $('[data-project-field="workerCount"]', row); if (!row || !input) return
    row.innerHTML = '<div><b>Ukupan broj<br>radnika</b></div><div></div><div></div>'; row.children[1].appendChild(input)
  }
  const addTimes = (page, saved) => {
    const heads = page.querySelectorAll('.project-diary-staff .head'); if (heads.length < 4) return
    ;[['day','Dnevni rad'],['night','Noćni rad']].forEach(([key,title], i) => {
      const h = heads[i + 2], from = hidden(page, `${key}From`, saved[`${key}From`] || ''), to = hidden(page, `${key}To`, saved[`${key}To`] || '')
      from.type = to.type = 'time'; from.className = to.className = ''; h.innerHTML = `<div class="project-shift-title">${title}</div><div class="project-shift-time"><span>od</span><span></span><span>do</span><span></span></div>`
      h.querySelectorAll('.project-shift-time span')[1].appendChild(from); h.querySelectorAll('.project-shift-time span')[3].appendChild(to)
      from.addEventListener('input', () => saveAll(page)); to.addEventListener('input', () => saveAll(page))
    })
  }
  const command = (editor, cmd, value = null) => { editor.focus(); document.execCommand(cmd, false, value) }
  const richArea = (page, key, saved, defaultLines) => {
    const source = $(`[data-project-field="${key}"]`, page); if (!source || source.dataset.rich) return
    source.dataset.rich = '1'; source.classList.add('project-rich-source')
    const html = hidden(page, `${key}Html`, saved[`${key}Html`] || ''), lines = hidden(page, `${key}Lines`, saved[`${key}Lines`] || defaultLines)
    const wrap = document.createElement('div'); wrap.className = 'project-rich-wrap'
    const toolbar = document.createElement('div'); toolbar.className = 'project-rich-toolbar project-pdf-hide'; toolbar.innerHTML = `<select title="Font"><option>Arial</option><option>Verdana</option><option>Georgia</option><option>Tahoma</option><option>Times New Roman</option><option>Courier New</option></select><button data-cmd="bold" title="Podebljano"><b>B</b></button><button data-cmd="italic" title="Iskošeno"><i>I</i></button><button data-cmd="underline" title="Podvučeno"><u>U</u></button><label title="Boja slova">A <input type="color" value="#111111" data-color="foreColor"></label><label title="Boja pozadine teksta">▰ <input type="color" value="#fff176" data-color="hiliteColor"></label><span class="grow"></span><button data-lines="-1" title="Obriši red">− red</button><button data-lines="1" title="Dodaj red">+ red</button>`
    const editor = document.createElement('div'); editor.className = `project-rich-editor project-rich-${key}`; editor.contentEditable = 'true'; editor.dataset.placeholder = key === 'activity' ? 'Upišite dnevne aktivnosti...' : 'Upišite bilješku...'; editor.innerHTML = html.value || source.value.replace(/\n/g,'<br>')
    wrap.append(toolbar, editor); source.after(wrap)
    const lineCount = () => Math.max(3, Math.min(25, Number(lines.value) || defaultLines))
    const setLines = n => { lines.value = n; $('.project-diary-sheet',page)?.style.setProperty(`--${key}-lines`, n); saveAll(page) }; setLines(lineCount())
    const sync = () => { html.value = editor.innerHTML; source.value = editor.innerText.replace(/\n\n+/g,'\n'); source.dispatchEvent(new Event('input',{bubbles:true})); saveAll(page) }
    editor.addEventListener('input', sync)
    toolbar.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault() })
    toolbar.addEventListener('click', e => { const b=e.target.closest('button'); if(!b)return; if(b.dataset.cmd){command(editor,b.dataset.cmd);sync()} if(b.dataset.lines)setLines(lineCount()+Number(b.dataset.lines)) })
    toolbar.querySelector('select').addEventListener('change', e => { command(editor,'fontName',e.target.value);sync() })
    toolbar.querySelectorAll('[data-color]').forEach(c => c.addEventListener('input', e => { command(editor,e.target.dataset.color,e.target.value);sync() }))
  }
  const logo = (page, saved) => {
    const box = $('.project-diary-logo', page), img = $('img', box); if (!box || !img) return
    const data = hidden(page, 'logoData', saved.logoData || ''); if (data.value) img.src = data.value
    const button = document.createElement('button'); button.type='button'; button.className='project-logo-change project-pdf-hide'; button.textContent='Promijeni logo'
    const file = document.createElement('input'); file.type='file'; file.accept='image/*'; file.className='project-logo-file project-pdf-hide'; box.append(button,file); button.onclick=()=>file.click()
    file.onchange = () => { const f=file.files?.[0]; if(!f)return; const reader=new FileReader(); reader.onload=()=>{ const probe=new Image(); probe.onload=()=>{ const scale=Math.min(1,500/probe.width,220/probe.height), canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(probe.width*scale));canvas.height=Math.max(1,Math.round(probe.height*scale));canvas.getContext('2d').drawImage(probe,0,0,canvas.width,canvas.height);data.value=canvas.toDataURL('image/jpeg',.86);img.src=data.value;saveAll(page)};probe.src=reader.result };reader.readAsDataURL(f) }
  }
  const upgrade = () => {
    const page = $('.project-diary-page'); if (!page || page.dataset.v68) return
    page.dataset.v68='1'; const saved=readDraft(page)
    compactMeta(page); compactWorkers(page); addTimes(page,saved); logo(page,saved); richArea(page,'activity',saved,15); richArea(page,'notes',saved,5)
  }
  new MutationObserver(upgrade).observe(document.body,{childList:true,subtree:true})
  window.addEventListener('load',upgrade); upgrade()
})()

