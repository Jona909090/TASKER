// TASKER v52: preusmerava Drive zahteve na trenutno aktivno Apps Script raspoređivanje.
(() => {
  const previousEndpoint = 'https://script.google.com/macros/s/AKfycbzF2SfEXGL137WzWsbhV6ElBEdqcVBbr5AFooCXWdtmuef-3pqaw2HCGnyUlFjoooTRHQ/exec'
  const activeEndpoint = 'https://script.google.com/macros/s/AKfycbxg35McxrxumR3uX15gbGlrhkiRRhDTUzTWVbqeKwMOskm2DI47U_-OqwY64FfQwrFUSw/exec'
  const nativeFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    if (typeof input === 'string') input = input.replace(previousEndpoint, activeEndpoint)
    else if (input instanceof Request && input.url.includes(previousEndpoint)) input = new Request(input.url.replace(previousEndpoint, activeEndpoint), input)
    return nativeFetch(input, init)
  }
})()
