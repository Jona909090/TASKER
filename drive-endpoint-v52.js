// TASKER v56: Drive veza, zaštita projekta 02 i kontrolni panel računa.
(() => {
  const previousEndpoint = 'https://script.google.com/macros/s/AKfycbzF2SfEXGL137WzWsbhV6ElBEdqcVBbr5AFooCXWdtmuef-3pqaw2HCGnyUlFjoooTRHQ/exec'
  const activeEndpoint = 'https://script.google.com/macros/s/AKfycbxg35McxrxumR3uX15gbGlrhkiRRhDTUzTWVbqeKwMOskm2DI47U_-OqwY64FfQwrFUSw/exec'
  const nativeFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    if (typeof input === 'string') input = input.replace(previousEndpoint, activeEndpoint)
    else if (input instanceof Request && input.url.includes(previousEndpoint)) input = new Request(input.url.replace(previousEndpoint, activeEndpoint), input)
    return nativeFetch(input, init)
  }

  const accessKey = 'tasker.project-access.receipts-v55'
  const openReceiptPassword = (card) => {
    document.querySelector('.project-password-modal')?.remove()
    document.body.insertAdjacentHTML('beforeend', `<div class="project-password-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-password-title"><form class="project-password-dialog" id="receipt-project-password-form"><button type="button" class="project-password-close" aria-label="Zatvori">&times;</button><span class="project-password-icon" aria-hidden="true">&#128274;</span><p class="eyebrow">ZAŠTIĆENI PRISTUP</p><h2 id="receipt-password-title">Računi i troškovi</h2><p>Za otvaranje projekta 02 unesite šifru.</p><label>Šifra<input id="receipt-project-password-input" type="password" inputmode="numeric" maxlength="4" required autofocus placeholder="****"></label><p class="project-password-error" role="alert" hidden>Pogrešna šifra. Pokušajte ponovo.</p><div class="project-password-actions"><button type="button" class="secondary-btn project-password-close">Odustani</button><button type="submit" class="primary-btn">Otključaj projekat</button></div></form></div>`)
    const modal = document.querySelector('.project-password-modal')
    const input = modal.querySelector('#receipt-project-password-input')
    const close = () => modal.remove()
    modal.querySelectorAll('.project-password-close').forEach((button) => button.addEventListener('click', close))
    modal.addEventListener('click', (event) => { if (event.target === modal) close() })
    modal.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault()
      if (input.value !== '7071') {
        modal.querySelector('.project-password-error').hidden = false
        input.value = ''
        input.focus()
        return
      }
      sessionStorage.setItem(accessKey, 'granted')
      close()
      card.click()
    })
    setTimeout(() => input.focus(), 0)
  }

  document.addEventListener('click', (event) => {
    const card = event.target.closest('#open-receipts-project')
    if (!card || sessionStorage.getItem(accessKey) === 'granted') return
    event.preventDefault()
    event.stopImmediatePropagation()
    openReceiptPassword(card)
  }, true)

  const money = (value) => new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0)
  const safe = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
  const readReceipts = () => {
    try {
      const data = JSON.parse(localStorage.getItem('tasker.receipts') || '[]')
      return Array.isArray(data) ? data : []
    } catch { return [] }
  }

  const style = document.createElement('style')
  style.textContent = `
    .receipt-all-control{margin-top:20px;padding:24px;border:1px solid #315477;border-radius:18px;background:linear-gradient(145deg,#172c45,#101f34);box-shadow:0 18px 38px rgba(0,0,0,.2),inset 0 1px rgba(255,255,255,.025)}
    .receipt-all-control>header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:18px;border-bottom:1px solid #29435f}
    .receipt-all-control>header p{margin:0 0 5px;color:#43d9ff;font-size:10px;font-weight:900;letter-spacing:.16em}.receipt-all-control>header h2{margin:0;color:#f4f8ff;font-size:23px}.receipt-all-control>header span{color:#7695b5;font-size:12px}
    .receipt-all-control>header button{padding:11px 16px;border:1px solid #3d6b8f;border-radius:11px;background:#173652;color:#75e2ff;font-weight:900;cursor:pointer}.receipt-all-control>header button:hover{border-color:#55ff88;color:#83ffa7;box-shadow:0 0 14px rgba(64,255,126,.2)}
    .receipt-control-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.receipt-control-kpis article{position:relative;overflow:hidden;padding:17px;border:1px solid #2c4864;border-radius:14px;background:#112238}.receipt-control-kpis article:before{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:var(--accent);box-shadow:0 0 13px var(--accent)}.receipt-control-kpis span{display:block;color:#819db8;font-size:11px}.receipt-control-kpis strong{display:block;margin-top:7px;color:var(--accent);font-size:22px;text-shadow:0 0 11px color-mix(in srgb,var(--accent),transparent 65%)}
    .receipt-control-bottom{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:18px}.receipt-control-stores{display:grid;gap:10px}.receipt-control-store{display:grid;grid-template-columns:minmax(100px,180px) 1fr auto;align-items:center;gap:12px}.receipt-control-store>span{overflow:hidden;color:#dceaff;font-size:12px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.receipt-control-store>i{height:8px;overflow:hidden;border-radius:99px;background:#0a192b}.receipt-control-store>i b{display:block;height:100%;border-radius:inherit;background:var(--bar);box-shadow:0 0 10px var(--bar)}.receipt-control-store>strong{min-width:85px;color:#d9e8f7;font-size:12px;text-align:right}
    .receipt-control-latest{padding:16px;border:1px solid #2b4662;border-radius:14px;background:#0e1d31}.receipt-control-latest>span{color:#6e8aa7;font-size:10px;font-weight:800;letter-spacing:.1em}.receipt-control-latest h3{margin:7px 0 5px;color:#fff;font-size:17px}.receipt-control-latest strong{display:block;color:#58ff88;font-size:24px}.receipt-control-latest small{display:block;margin-top:8px;color:#89a4bd}
    .receipt-control-empty{grid-column:1/-1;margin:4px 0;color:#7896b2;text-align:center}
    @media(max-width:850px){.receipt-control-kpis{grid-template-columns:repeat(2,1fr)}.receipt-control-bottom{grid-template-columns:1fr}.receipt-all-control>header{align-items:flex-start;flex-direction:column}.receipt-all-control>header button{width:100%}}
    @media(max-width:520px){.receipt-all-control{padding:17px}.receipt-control-kpis{grid-template-columns:1fr 1fr}.receipt-control-kpis strong{font-size:17px}.receipt-control-store{grid-template-columns:90px 1fr}.receipt-control-store>strong{grid-column:2;text-align:left}}
  `
  document.head.appendChild(style)

  const renderReceiptControl = () => {
    const grid = document.querySelector('.receipt-project .receipt-overview-grid')
    if (!grid || document.querySelector('#receipt-all-control')) return
    const receipts = readReceipts()
    const total = receipts.reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0)
    const average = receipts.length ? total / receipts.length : 0
    const largest = receipts.reduce((best, receipt) => Number(receipt.amount) > Number(best?.amount || 0) ? receipt : best, null)
    const month = new Date().toISOString().slice(0, 7)
    const monthReceipts = receipts.filter((receipt) => String(receipt.date || '').startsWith(month))
    const monthTotal = monthReceipts.reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0)
    const stores = new Map()
    receipts.forEach((receipt) => {
      const name = String(receipt.store || 'Ostalo').trim() || 'Ostalo'
      const current = stores.get(name) || { name, count: 0, total: 0 }
      current.count += 1
      current.total += Number(receipt.amount) || 0
      stores.set(name, current)
    })
    const storeList = Array.from(stores.values()).sort((a, b) => b.total - a.total)
    const maxStore = Math.max(1, ...storeList.map((store) => store.total))
    const colors = ['#55ff88','#35d8ff','#ffd33d','#ff55bd','#8877ff','#ff633d']
    grid.insertAdjacentHTML('afterend', `<section class="receipt-all-control" id="receipt-all-control"><header><div><p>KONTROLNI CENTAR TROŠKOVA</p><h2>Kontrolni panel svih računa</h2><span>Automatski pregled svih sačuvanih računa i prodavnica.</span></div><button type="button" id="receipt-control-open-all">Otvori sve račune →</button></header><div class="receipt-control-kpis"><article style="--accent:#55ff88"><span>Ukupno računa</span><strong>${receipts.length}</strong></article><article style="--accent:#35d8ff"><span>Ukupan trošak</span><strong>${money(total)}</strong></article><article style="--accent:#ffd33d"><span>Prosečan račun</span><strong>${money(average)}</strong></article><article style="--accent:#ff55bd"><span>Ovaj mesec</span><strong>${money(monthTotal)}</strong></article></div><div class="receipt-control-bottom"><div class="receipt-control-stores">${storeList.length ? storeList.slice(0, 8).map((store, index) => `<div class="receipt-control-store" style="--bar:${colors[index % colors.length]}"><span>${safe(store.name)} · ${store.count}</span><i><b style="width:${Math.max(4, store.total / maxStore * 100)}%"></b></i><strong>${money(store.total)}</strong></div>`).join('') : '<p class="receipt-control-empty">Kontrolni panel će se popuniti nakon prvog računa.</p>'}</div><aside class="receipt-control-latest"><span>NAJVEĆI RAČUN</span><h3>${largest ? safe(largest.store || 'Ostalo') : 'Nema podataka'}</h3><strong>${money(largest?.amount || 0)}</strong><small>${largest?.date ? String(largest.date).split('-').reverse().join('.') : 'Datum nije dostupan'}</small></aside></div></section>`)
    document.querySelector('#receipt-control-open-all')?.addEventListener('click', () => document.querySelector('[data-receipt-view="table"]')?.click())
  }

  new MutationObserver(renderReceiptControl).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('load', renderReceiptControl)
})()
