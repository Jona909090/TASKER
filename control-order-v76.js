(function () {
  'use strict'

  const STYLE_ID = 'tasker-control-order-v76-style'
  let busy = false

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .control-length-flow{display:grid;grid-template-columns:1fr;gap:22px;margin-top:24px}
    .control-length-flow>.control-detail-section,
    .control-length-flow>.control-panel,
    .control-length-flow>.control-documents,
    .control-length-flow>.control-kpis{width:100%;margin:0}
    .control-length-flow>.control-panel{min-height:unset}
    .control-length-flow>.control-kpis{order:999}
    .control-length-flow>.control-documents{order:998}
    .control-length-flow .control-rings{justify-content:flex-start;gap:34px}
    .control-length-flow .control-week{max-width:920px}
    .control-length-flow .control-alert-list,
    .control-length-flow .control-activity-list{max-height:none}
    .control-order-marker{display:flex;align-items:center;gap:12px;margin:22px 0 2px;color:#5bd8ff;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
    .control-order-marker::before,.control-order-marker::after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(57,200,255,.35),transparent)}
    @media(max-width:760px){.control-length-flow{gap:14px}.control-order-marker{margin-top:16px}}
  `
  document.head.appendChild(style)

  function contentScore (node) {
    const rows = node.querySelectorAll('.control-table-row,.control-people-full>article,.control-module-groups button,.control-request-groups article,.control-task-full>article,.control-alert-list>button,.control-activity-list>article').length
    const groups = node.querySelectorAll('section,article,button').length
    const text = (node.textContent || '').trim().length
    return rows * 10000 + groups * 250 + text
  }

  function reorderControlCenter () {
    if (busy) return
    const center = document.querySelector('#content .control-center')
    if (!center || center.dataset.lengthOrdered === 'yes') return
    const details = center.querySelector('.control-details')
    const main = center.querySelector('.control-main-grid')
    const lower = center.querySelector('.control-lower-grid')
    const documents = center.querySelector('.control-documents')
    const kpis = center.querySelector('.control-kpis')
    if (!details || !main || !lower || !documents || !kpis) return

    busy = true
    const cards = [
      ...details.querySelectorAll(':scope > article'),
      ...lower.querySelectorAll(':scope > article'),
      ...main.querySelectorAll(':scope > article')
    ]
    cards.sort((a, b) => contentScore(b) - contentScore(a))

    const marker = document.createElement('div')
    marker.className = 'control-order-marker'
    marker.textContent = 'Kompletan pregled · od najopsežnijeg prema kraćem'
    const flow = document.createElement('section')
    flow.className = 'control-length-flow'
    flow.setAttribute('aria-label', 'Sve kartice kontrolnog centra')
    cards.forEach(card => flow.appendChild(card))
    flow.appendChild(documents)
    flow.appendChild(kpis)

    const heading = center.querySelector('.control-heading')
    heading.insertAdjacentElement('afterend', marker)
    marker.insertAdjacentElement('afterend', flow)
    details.remove()
    main.remove()
    lower.remove()
    center.dataset.lengthOrdered = 'yes'
    busy = false
  }

  const observer = new MutationObserver(reorderControlCenter)
  observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reorderControlCenter)
  else reorderControlCenter()
})()

