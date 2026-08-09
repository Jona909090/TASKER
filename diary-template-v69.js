// TASKER v69: zavrsno poravnanje projektnog dnevnog izvjestaja.
(() => {
  const $=(s,r=document)=>r.querySelector(s)
  const style=document.createElement('style')
  style.textContent=`
  .project-diary-logo-row{display:flex!important;align-items:center!important;justify-content:center!important;grid-template-columns:none!important}
  .project-diary-logo-row>div:last-child{display:none!important}.project-diary-logo{width:100%!important;height:100%!important;justify-content:center!important;border-right:0!important;padding:7px 18px!important}.project-diary-logo .project-logo-change{right:14px!important;bottom:8px!important}
  .project-diary-title{min-height:48px!important;display:flex;align-items:center;justify-content:center;padding:5px 14px!important}.project-diary-title label{display:none!important}.project-diary-title h1{margin:0!important}
  .project-diary-meta{border-bottom:2px solid #111!important}.project-diary-meta>div:nth-child(1),.project-diary-meta>div:nth-child(2){border-bottom:1.5px solid #111!important}.project-meta-check{border-left:1.5px solid #111!important}.project-meta-check>*:nth-child(-n+2){border-bottom:1.5px solid #111!important}.project-meta-check label{border-right:1.5px solid #111!important}
  .v69-date-source{display:none!important}.v69-date-display{width:100%;height:100%!important;padding:3px 5px!important;text-align:center!important}
  .project-shift-time{gap:5px!important}.project-shift-time .v69-time-word{display:none!important}.project-shift-time .v69-time-separator{display:inline!important;font-size:10px;font-weight:900}.project-shift-time input{width:52px!important}
  .project-diary-workers input[data-project-field="workerCount"]{pointer-events:none;background:#f3f3f3!important}
  .project-diary-sheet.pdf-mode .project-diary-logo .project-logo-change{display:none!important}
  `
  document.head.appendChild(style)

  const formatDate=iso=>{const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}.${m[2]}.${m[1]}`:iso}
  const parseDate=value=>{const m=String(value||'').match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\.?$/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:''}
  const fixDate=page=>{
    const source=$('[data-project-field="date"]',page);if(!source||source.classList.contains('v69-date-source'))return
    source.classList.add('v69-date-source')
    const display=document.createElement('input');display.type='text';display.className='v69-date-display';display.value=formatDate(source.value);display.placeholder='dd.mm.gggg';display.inputMode='numeric';source.after(display)
    display.addEventListener('change',()=>{const iso=parseDate(display.value);if(!iso){display.value=formatDate(source.value);return}source.value=iso;source.dispatchEvent(new Event('change',{bubbles:true}))})
  }
  const fixTimes=page=>{
    page.querySelectorAll('.project-shift-time').forEach(row=>{
      if(row.dataset.v69)return;row.dataset.v69='1'
      const spans=row.querySelectorAll(':scope>span');if(spans.length<4)return
      spans[0].classList.add('v69-time-word');spans[2].classList.add('v69-time-word')
      const sep=document.createElement('span');sep.className='v69-time-separator';sep.textContent='–';spans[1].after(sep)
    })
  }
  const autoWorkers=page=>{
    const total=$('[data-project-field="workerCount"]',page),supervisor=$('[data-project-field="supervisorTotal"]',page),workers=$('[data-project-field="workerTotal"]',page);if(!total||!supervisor||!workers)return
    total.readOnly=true
    const update=()=>{total.value=(Number(supervisor.value)||0)+(Number(workers.value)||0);total.dispatchEvent(new Event('input',{bubbles:true}))}
    if(!supervisor.dataset.v69){supervisor.dataset.v69=workers.dataset.v69='1';supervisor.addEventListener('input',update);workers.addEventListener('input',update)}
    update()
  }
  let retry
  const upgrade=()=>{
    const page=$('.project-diary-page');
    if(!page){clearTimeout(retry);retry=setTimeout(upgrade,120);return}
    if(page.dataset.v69)return
    if(!$('.project-meta-check',page)||!$('.project-shift-time',page)){clearTimeout(retry);retry=setTimeout(upgrade,80);return}
    page.dataset.v69='1';fixDate(page);fixTimes(page);autoWorkers(page)
  }
  new MutationObserver(upgrade).observe(document.body,{childList:true,subtree:true})
  document.addEventListener('click',e=>{if(e.target.closest('[data-diary-template="project"]'))setTimeout(upgrade,100)})
  window.addEventListener('load',()=>setTimeout(upgrade,100));upgrade()
})()

