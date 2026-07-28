// TASKER v55: aktivna Drive veza i direktna zaštita projekta 02.
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
})()
