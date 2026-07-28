// TASKER v54: aktivna Drive veza i posebna lozinka za projekat 02.
(() => {
  const previousEndpoint = 'https://script.google.com/macros/s/AKfycbzF2SfEXGL137WzWsbhV6ElBEdqcVBbr5AFooCXWdtmuef-3pqaw2HCGnyUlFjoooTRHQ/exec'
  const activeEndpoint = 'https://script.google.com/macros/s/AKfycbxg35McxrxumR3uX15gbGlrhkiRRhDTUzTWVbqeKwMOskm2DI47U_-OqwY64FfQwrFUSw/exec'
  const nativeFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    if (typeof input === 'string') input = input.replace(previousEndpoint, activeEndpoint)
    else if (input instanceof Request && input.url.includes(previousEndpoint)) input = new Request(input.url.replace(previousEndpoint, activeEndpoint), input)
    return nativeFetch(input, init)
  }

  if (!sessionStorage.getItem('tasker.project-access-reset.v54')) {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('tasker.project-access.')) sessionStorage.removeItem(key)
    })
    sessionStorage.setItem('tasker.project-access-reset.v54', '1')
  }

  let receiptProjectUnlock = false
  document.addEventListener('click', (event) => {
    if (event.target.closest('#open-receipts-project')) receiptProjectUnlock = true
    else if (event.target.closest('.project-card')) receiptProjectUnlock = false
  }, true)
  document.addEventListener('submit', (event) => {
    if (!receiptProjectUnlock || event.target.id !== 'project-password-form') return
    const input = event.target.querySelector('#project-password-input')
    if (input && input.value === '7071') input.value = '7070'
  }, true)
})()
