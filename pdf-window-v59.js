// TASKER v59: promenljiva veličina PDF prozora.
(() => {
  const style = document.createElement('style')
  style.textContent = `
    .tasker-resizable-pdf-dialog{position:relative!important;width:min(76vw,1320px)!important;height:min(82vh,1050px)!important;min-width:520px!important;min-height:420px!important;max-width:96vw!important;max-height:94vh!important;resize:both!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}
    .tasker-resizable-pdf-dialog .tasker-pdf-viewer-content{flex:1!important;min-height:0!important;height:auto!important}
    .tasker-resizable-pdf-dialog .tasker-pdf-viewer-content iframe,.tasker-resizable-pdf-dialog .tasker-pdf-viewer-content embed,.tasker-resizable-pdf-dialog .tasker-pdf-viewer-content object{width:100%!important;height:100%!important}
    .tasker-pdf-window-controls{position:absolute;z-index:20;right:72px;top:15px;display:flex;gap:7px}.tasker-pdf-window-controls button{display:grid;place-items:center;width:42px;height:42px;padding:0;border:1px solid #365b7a;border-radius:11px;background:#17324d;color:#eaf6ff;font-size:21px;font-weight:900;cursor:pointer}.tasker-pdf-window-controls button:hover{border-color:#58d9ff;color:#70e3ff;box-shadow:0 0 13px rgba(54,206,255,.2)}
    .tasker-resizable-pdf-dialog.tasker-pdf-fullscreen{width:96vw!important;height:94vh!important;max-width:96vw!important;max-height:94vh!important;resize:none!important}
    .tasker-resizable-pdf-dialog.tasker-pdf-minimized{width:min(540px,90vw)!important;height:92px!important;min-width:320px!important;min-height:92px!important;resize:none!important}.tasker-resizable-pdf-dialog.tasker-pdf-minimized .tasker-pdf-viewer-content,.tasker-resizable-pdf-dialog.tasker-pdf-minimized .tasker-pdf-actions{display:none!important}.tasker-resizable-pdf-dialog.tasker-pdf-minimized .tasker-pdf-window-controls{right:70px}
    @media(max-width:700px){.tasker-resizable-pdf-dialog{width:96vw!important;height:90vh!important;min-width:0!important;min-height:340px!important;resize:none!important}.tasker-pdf-window-controls{right:59px;top:12px}.tasker-pdf-window-controls button{width:37px;height:37px}.tasker-pdf-window-controls button:first-child{display:none}}
  `
  document.head.appendChild(style)

  const enhancePdfWindow = () => {
    const downloadButton = Array.from(document.querySelectorAll('button,a')).find((item) => /Preuzmi PDF/i.test(item.textContent || ''))
    if (!downloadButton) return
    let dialog = downloadButton.parentElement
    while (dialog && dialog !== document.body) {
      if (dialog.querySelector('iframe,embed,object') && /Pošalji/i.test(dialog.textContent || '')) break
      dialog = dialog.parentElement
    }
    if (!dialog || dialog === document.body || dialog.classList.contains('tasker-resizable-pdf-dialog')) return
    const viewer = dialog.querySelector('iframe,embed,object')
    let viewerContent = viewer
    while (viewerContent?.parentElement && viewerContent.parentElement !== dialog) {
      const parent = viewerContent.parentElement
      if (parent.contains(downloadButton)) break
      viewerContent = parent
    }
    viewerContent?.classList.add('tasker-pdf-viewer-content')
    downloadButton.parentElement?.classList.add('tasker-pdf-actions')
    dialog.classList.add('tasker-resizable-pdf-dialog')
    dialog.insertAdjacentHTML('afterbegin', `<div class="tasker-pdf-window-controls" aria-label="Veličina PDF prozora"><button type="button" data-pdf-minimize title="Smanji prozor">−</button><button type="button" data-pdf-maximize title="Povećaj prozor">□</button></div>`)
    const minimize = dialog.querySelector('[data-pdf-minimize]')
    const maximize = dialog.querySelector('[data-pdf-maximize]')
    minimize.addEventListener('click', (event) => {
      event.preventDefault();event.stopPropagation()
      const minimized = dialog.classList.toggle('tasker-pdf-minimized')
      if (minimized) dialog.classList.remove('tasker-pdf-fullscreen')
      minimize.textContent = minimized ? '＋' : '−'
      minimize.title = minimized ? 'Vrati prozor' : 'Smanji prozor'
    })
    maximize.addEventListener('click', (event) => {
      event.preventDefault();event.stopPropagation()
      dialog.classList.remove('tasker-pdf-minimized')
      minimize.textContent = '−'
      const fullscreen = dialog.classList.toggle('tasker-pdf-fullscreen')
      maximize.textContent = fullscreen ? '❐' : '□'
      maximize.title = fullscreen ? 'Vrati veličinu' : 'Povećaj prozor'
    })
  }

  new MutationObserver(enhancePdfWindow).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('load', enhancePdfWindow)
})()
