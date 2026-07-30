// TASKER v66: odobrena i proverena autorska slika prikazana direktno u aplikaciji.
(() => {
  const style = document.createElement('style')
  style.textContent = `
    .tasker-about-image-page{position:relative;max-width:1640px;margin:0 auto;padding:24px 0 44px;isolation:isolate}
    .tasker-about-image-shell{position:relative;overflow:hidden;border:1px solid rgba(61,190,245,.38);border-radius:22px;background:#03111f;box-shadow:0 30px 75px rgba(0,0,0,.48),0 0 34px rgba(28,172,235,.14),inset 0 0 0 5px rgba(4,25,43,.92)}
    .tasker-about-image-shell:before{content:'';position:absolute;z-index:2;inset:0;pointer-events:none;border-radius:inherit;box-shadow:inset 0 0 42px rgba(33,174,232,.13),inset 0 0 0 1px rgba(102,215,255,.18)}
    .tasker-about-image-shell:after{content:'';position:absolute;z-index:3;top:-35%;bottom:-35%;left:-30%;width:26%;pointer-events:none;background:linear-gradient(105deg,transparent,rgba(109,221,255,.08),rgba(255,220,129,.05),transparent);filter:blur(12px);transform:skewX(-14deg);animation:tasker-about-photo-shine 9s ease-in-out infinite}
    .tasker-about-image{display:block;width:100%;height:auto;object-fit:contain;background:#03111f;filter:saturate(1.03) contrast(1.025) brightness(.98);transform:translateZ(0)}
    .tasker-about-image-glow{position:absolute;z-index:-1;inset:5% 4% -1%;border-radius:45%;background:radial-gradient(ellipse,rgba(22,174,237,.19),transparent 67%);filter:blur(32px);pointer-events:none}
    .tasker-about-image-link{position:absolute;z-index:4;left:74.5%;top:51%;width:13.5%;height:29%;border-radius:14px;cursor:pointer}
    .tasker-about-image-link:hover{box-shadow:0 0 0 2px rgba(82,218,255,.7),0 0 24px rgba(51,198,255,.3)}
    @keyframes tasker-about-photo-shine{0%,18%{left:-32%;opacity:0}40%{opacity:1}62%,100%{left:112%;opacity:0}}
    @media(max-width:900px){.tasker-about-image-page{padding:10px 0 28px}.tasker-about-image-shell{border-radius:15px}.tasker-about-image-shell:after{animation-duration:11s}}
    @media(prefers-reduced-motion:reduce){.tasker-about-image-shell:after{animation:none}}
  `
  document.head.appendChild(style)

  const showApprovedImage = () => {
    const page = document.querySelector('.tasker-about-page')
    if (!page || page.dataset.approvedImage === '1') return
    page.dataset.approvedImage = '1'
    page.className = 'tasker-about-image-page'
    page.innerHTML = `<div class="tasker-about-image-glow"></div><figure class="tasker-about-image-shell"><img class="tasker-about-image" src="./tasker-about-v66.jpg" alt="O aplikaciji TASKER — originalni sistem Stefana Jonića"><a class="tasker-about-image-link" href="https://jona909090.github.io/TASKER/" target="_blank" rel="noopener" aria-label="Proveri original TASKER"></a></figure>`
  }

  new MutationObserver(showApprovedImage).observe(document.body,{childList:true,subtree:true})
  window.addEventListener('load',showApprovedImage)
})()
