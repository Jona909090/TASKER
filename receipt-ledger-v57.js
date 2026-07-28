// TASKER v58: redni pregled svih računa bez stare Drive trake.
(() => {
  const money = (value) => new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0)
  const safe = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
  const readReceipts = () => {
    try {
      const data = JSON.parse(localStorage.getItem('tasker.receipts') || '[]')
      return Array.isArray(data) ? data : []
    } catch { return [] }
  }
  const dateLabel = (value) => {
    const parts = String(value || '').split('-')
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : 'Datum nije unet'
  }

  const style = document.createElement('style')
  style.textContent = `
    .receipt-project .receipt-drive-banner{display:none!important}
    .receipt-control-ledger{margin-top:20px;padding-top:19px;border-top:1px solid #29435f}
    .receipt-control-ledger>header{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:12px}.receipt-control-ledger>header p{margin:0 0 4px;color:#55ff88;font-size:9px;font-weight:900;letter-spacing:.15em}.receipt-control-ledger>header h3{margin:0;color:#f3f8ff;font-size:18px}.receipt-control-ledger>header span{color:#7795b1;font-size:11px}
    .receipt-ledger-list{display:grid;gap:8px;max-height:520px;overflow:auto;padding-right:4px}.receipt-ledger-row{display:grid;grid-template-columns:42px minmax(150px,1.4fr) minmax(105px,.55fr) minmax(125px,.65fr);align-items:center;gap:13px;padding:12px 14px;border:1px solid #29445f;border-radius:12px;background:linear-gradient(100deg,#11243a,#0e1e32);transition:.16s}.receipt-ledger-row:hover{border-color:#3e7898;transform:translateX(2px);box-shadow:0 7px 17px rgba(0,0,0,.15)}.receipt-ledger-row>span:first-child{display:grid;place-items:center;width:31px;height:31px;border-radius:9px;background:#173b54;color:#65ddff;font-size:11px;font-weight:900}.receipt-ledger-store{display:grid;gap:3px;min-width:0}.receipt-ledger-store b{overflow:hidden;color:#f1f7ff;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.receipt-ledger-store small{color:#708daa;font-size:10px}.receipt-ledger-row>strong{color:#5bff8c;font-size:15px;text-align:right;text-shadow:0 0 9px rgba(69,255,127,.22)}.receipt-ledger-date{display:grid;gap:3px;text-align:right}.receipt-ledger-date b{color:#cbdced;font-size:12px}.receipt-ledger-date small{color:#55cfff;font-size:10px}.receipt-ledger-empty{margin:0;padding:22px;border:1px dashed #31516c;border-radius:12px;color:#7593ad;text-align:center}
    @media(max-width:650px){.receipt-control-ledger>header{align-items:flex-start;flex-direction:column}.receipt-ledger-row{grid-template-columns:35px 1fr auto}.receipt-ledger-row>strong{grid-column:3}.receipt-ledger-date{grid-column:2/4;grid-row:2;display:flex;gap:8px;text-align:left}.receipt-ledger-date small:before{content:'· ';}.receipt-ledger-list{max-height:none}}
  `
  document.head.appendChild(style)

  const renderLedger = () => {
    const panel = document.querySelector('#receipt-all-control')
    if (!panel || panel.querySelector('#receipt-control-ledger')) return
    const receipts = readReceipts().slice().sort((a, b) => {
      const first = `${a.date || ''}T${a.time || '00:00'}${a.createdAt || ''}`
      const second = `${b.date || ''}T${b.time || '00:00'}${b.createdAt || ''}`
      return second.localeCompare(first)
    })
    panel.insertAdjacentHTML('beforeend', `<section class="receipt-control-ledger" id="receipt-control-ledger"><header><div><p>HRONOLOŠKA EVIDENCIJA</p><h3>Svi računi redom</h3></div><span>${receipts.length} ${receipts.length === 1 ? 'račun' : 'računa'}</span></header><div class="receipt-ledger-list">${receipts.length ? receipts.map((receipt, index) => `<article class="receipt-ledger-row"><span>${index + 1}</span><div class="receipt-ledger-store"><b>${safe(receipt.store || 'Ostalo')}</b><small>${safe(receipt.receiptNumber || 'Bez broja računa')}</small></div><strong>${money(receipt.amount)}</strong><div class="receipt-ledger-date"><b>${dateLabel(receipt.date)}</b><small>${safe(receipt.time || 'Vreme nije uneto')}</small></div></article>`).join('') : '<p class="receipt-ledger-empty">Ovde će se pojaviti računi nakon prvog unosa.</p>'}</div></section>`)
  }

  new MutationObserver(renderLedger).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('load', renderLedger)
})()
