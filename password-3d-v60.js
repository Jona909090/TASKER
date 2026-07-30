// TASKER v60: animirani 3D unos šifre za projekte.
(() => {
  const style = document.createElement('style')
  style.textContent = `
    .project-password-modal{perspective:1100px;background:radial-gradient(circle at 50% 38%,rgba(28,78,105,.28),rgba(2,9,18,.94) 56%)!important;backdrop-filter:blur(12px)!important}
    .project-password-dialog.tasker-pin-dialog{position:relative;overflow:hidden;width:min(92vw,600px)!important;padding:39px 42px 35px!important;border:1px solid rgba(80,205,255,.46)!important;border-radius:26px!important;background:linear-gradient(145deg,#193655,#0d2036 64%,#0a192b)!important;box-shadow:0 32px 90px rgba(0,0,0,.68),0 0 38px rgba(52,196,255,.12),inset 0 1px rgba(255,255,255,.07)!important;transform-origin:50% 0;animation:tasker-pin-panel-in .64s cubic-bezier(.18,.9,.25,1.22)}
    .tasker-pin-dialog:before{content:'';position:absolute;inset:-130% -50%;pointer-events:none;background:linear-gradient(115deg,transparent 44%,rgba(77,220,255,.08) 49%,rgba(255,223,77,.11) 51%,transparent 57%);animation:tasker-pin-scan 5s linear infinite}.tasker-pin-dialog>*{position:relative;z-index:1}
    .tasker-pin-dialog .project-password-icon{display:grid!important;place-items:center;width:70px!important;height:70px!important;border:1px solid rgba(255,210,56,.62)!important;border-radius:21px!important;background:linear-gradient(145deg,#304a5a,#172d42)!important;font-size:31px!important;box-shadow:0 12px 26px rgba(0,0,0,.25),0 0 20px rgba(255,199,44,.13);animation:tasker-lock-float 2.8s ease-in-out infinite}
    .tasker-pin-dialog .eyebrow{margin-top:24px!important;color:#ffd34b!important;letter-spacing:.17em!important}.tasker-pin-dialog h2{margin:10px 0 7px!important;font-size:38px!important}.tasker-pin-dialog>p:not(.eyebrow):not(.project-password-error){color:#9eb9d4!important}
    .tasker-pin-dialog label{display:block;margin-top:26px;color:#bed4e8!important;font-size:12px!important;font-weight:900!important;letter-spacing:.12em;text-transform:uppercase}.tasker-pin-dialog label>.tasker-pin-label{display:block;margin-bottom:11px}
    .tasker-pin-original{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
    .tasker-pin-boxes{display:grid;grid-template-columns:repeat(4,72px);justify-content:center;gap:16px;margin:8px 0 2px;perspective:700px;cursor:text}
    .tasker-pin-cube{position:relative;display:grid;place-items:center;width:72px;height:76px;border:1px solid #355873;border-radius:17px;background:linear-gradient(145deg,#17334e,#0c1d31);color:#d9efff;font-size:30px;font-weight:1000;box-shadow:0 13px 22px rgba(0,0,0,.3),inset 0 1px rgba(255,255,255,.06);transform-style:preserve-3d;transition:.23s cubic-bezier(.2,.85,.25,1.3)}
    .tasker-pin-cube:before{content:'';position:absolute;inset:7px;border-radius:11px;border:1px solid rgba(255,255,255,.025)}.tasker-pin-cube:after{content:'';position:absolute;left:16%;right:16%;bottom:-10px;height:12px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(5px);transition:.25s}
    .tasker-pin-cube.filled{border-color:var(--pin-color);color:var(--pin-color);background:linear-gradient(145deg,color-mix(in srgb,var(--pin-color),#16304a 82%),#0d2136);box-shadow:0 15px 25px rgba(0,0,0,.32),0 0 17px color-mix(in srgb,var(--pin-color),transparent 55%),inset 0 0 14px color-mix(in srgb,var(--pin-color),transparent 82%);animation:tasker-pin-cube-drop .44s cubic-bezier(.18,.88,.35,1.35)}
    .tasker-pin-cube.filled:after{transform:scale(.7);opacity:.55}.tasker-pin-cube:nth-child(1){--pin-color:#3fd7ff}.tasker-pin-cube:nth-child(2){--pin-color:#ffd33f}.tasker-pin-cube:nth-child(3){--pin-color:#ff62bd}.tasker-pin-cube:nth-child(4){--pin-color:#7c73ff}
    .tasker-pin-dialog.pin-success{border-color:#56ff87!important;box-shadow:0 32px 90px rgba(0,0,0,.62),0 0 44px rgba(70,255,126,.38),inset 0 0 26px rgba(70,255,126,.08)!important}.tasker-pin-dialog.pin-success .tasker-pin-cube{--pin-color:#5cff8b!important;border-color:#5cff8b;color:#5cff8b;background:#123d2c;box-shadow:0 0 24px rgba(71,255,130,.78),inset 0 0 18px rgba(71,255,130,.18);animation:tasker-pin-unlock .55s ease both}.tasker-pin-dialog.pin-success .tasker-pin-cube:nth-child(2){animation-delay:.08s}.tasker-pin-dialog.pin-success .tasker-pin-cube:nth-child(3){animation-delay:.16s}.tasker-pin-dialog.pin-success .tasker-pin-cube:nth-child(4){animation-delay:.24s}.tasker-pin-dialog.pin-success .project-password-icon{border-color:#5cff8b!important;color:#5cff8b;box-shadow:0 0 26px rgba(71,255,130,.56)}
    .tasker-pin-success-text{display:none;margin:16px 0 0;color:#5cff8b;font-size:13px;font-weight:1000;letter-spacing:.12em;text-align:center;text-shadow:0 0 12px rgba(71,255,130,.65)}.pin-success .tasker-pin-success-text{display:block;animation:tasker-pin-success-text .4s ease both}
    .tasker-pin-dialog.pin-error .tasker-pin-boxes{animation:tasker-pin-error .42s ease}.tasker-pin-dialog.pin-error .tasker-pin-cube{border-color:#ff4d68;color:#ff5d74;box-shadow:0 0 15px rgba(255,55,85,.28)}
    .tasker-pin-dialog .project-password-actions{margin-top:27px!important}.tasker-pin-dialog .project-password-actions .primary-btn{background:linear-gradient(135deg,#3fd1ff,#36b9ed)!important}.tasker-pin-dialog.pin-success .project-password-actions{opacity:.35;pointer-events:none}
    @keyframes tasker-pin-panel-in{0%{opacity:0;transform:translateY(-90px) rotateX(-22deg) scale(.92)}100%{opacity:1;transform:none}}
    @keyframes tasker-pin-scan{0%{transform:translateX(-28%)}100%{transform:translateX(28%)}}
    @keyframes tasker-lock-float{0%,100%{transform:translateY(0) rotateY(0)}50%{transform:translateY(-6px) rotateY(8deg)}}
    @keyframes tasker-pin-cube-drop{0%{opacity:.2;transform:translateY(-42px) rotateX(-35deg) scale(.78)}65%{transform:translateY(5px) rotateX(5deg) scale(1.06)}100%{opacity:1;transform:none}}
    @keyframes tasker-pin-unlock{0%{transform:translateY(0) rotateY(0)}45%{transform:translateY(-15px) rotateY(180deg) scale(1.08)}100%{transform:translateY(0) rotateY(360deg)}}
    @keyframes tasker-pin-success-text{0%{opacity:0;transform:translateY(9px)}100%{opacity:1;transform:none}}
    @keyframes tasker-pin-error{0%,100%{transform:translateX(0)}20%{transform:translateX(-13px)}40%{transform:translateX(11px)}60%{transform:translateX(-8px)}80%{transform:translateX(5px)}}
    @media(max-width:600px){.project-password-dialog.tasker-pin-dialog{padding:31px 22px 27px!important}.tasker-pin-dialog h2{font-size:30px!important}.tasker-pin-boxes{grid-template-columns:repeat(4,58px);gap:10px}.tasker-pin-cube{width:58px;height:63px;border-radius:14px;font-size:25px}}
  `
  document.head.appendChild(style)

  const enhance = () => {
    document.querySelectorAll('.project-password-dialog:not(.tasker-pin-dialog)').forEach((dialog) => {
      const input = dialog.querySelector('input[type="password"]')
      const form = input?.closest('form')
      if (!input || !form) return
      dialog.classList.add('tasker-pin-dialog')
      input.classList.add('tasker-pin-original')
      input.maxLength = 4
      input.inputMode = 'numeric'
      const label = input.closest('label')
      const text = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE)
      if (text) text.textContent = ''
      label.insertAdjacentHTML('afterbegin', '<span class="tasker-pin-label">PIN kod</span>')
      input.insertAdjacentHTML('beforebegin', `<div class="tasker-pin-boxes" role="group" aria-label="Četvorocifreni PIN"><span class="tasker-pin-cube"></span><span class="tasker-pin-cube"></span><span class="tasker-pin-cube"></span><span class="tasker-pin-cube"></span></div><p class="tasker-pin-success-text">✓ PRISTUP ODOBREN</p>`)
      const boxes = Array.from(dialog.querySelectorAll('.tasker-pin-cube'))
      const update = () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 4)
        boxes.forEach((box, index) => {
          const filled = index < input.value.length
          box.textContent = filled ? '•' : ''
          box.classList.toggle('filled', filled)
        })
        dialog.classList.remove('pin-error')
      }
      dialog.querySelector('.tasker-pin-boxes').addEventListener('click', () => input.focus())
      input.addEventListener('input', update)
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && input.value.length < 4) event.preventDefault()
      })
      form.addEventListener('submit', (event) => {
        if (form.dataset.pinBypass === '1') { delete form.dataset.pinBypass; return }
        const receiptProject = form.id === 'receipt-project-password-form'
        const correct = receiptProject ? input.value === '7071' : input.value === '7070'
        if (!correct) {
          dialog.classList.remove('pin-error')
          void dialog.offsetWidth
          dialog.classList.add('pin-error')
          setTimeout(update, 40)
          return
        }
        event.preventDefault()
        event.stopImmediatePropagation()
        dialog.classList.add('pin-success')
        boxes.forEach((box) => { box.textContent = '✓'; box.classList.add('filled') })
        setTimeout(() => {
          form.dataset.pinBypass = '1'
          form.requestSubmit()
        }, 900)
      }, true)
      update()
      setTimeout(() => input.focus(), 80)
    })
  }

  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('load', enhance)
})()
