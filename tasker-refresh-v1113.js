(() => {
  'use strict';
  const button = document.createElement('button');
  button.id = 'tasker-refresh';
  button.type = 'button';
  button.textContent = '↻ Osveži';
  button.title = 'Ponovo učitaj aplikaciju kao F5. Sačuvani podaci ostaju.';
  const style = document.createElement('style');
  style.textContent = '#tasker-refresh{position:fixed;right:12px;bottom:calc(68px + env(safe-area-inset-bottom));z-index:9000;min-height:44px;padding:10px 18px;border:2px solid #59d9ff;border-radius:12px;background:#17354b;color:#eafaff;font:bold 15px Arial;cursor:pointer}#tasker-refresh:focus-visible{outline:3px solid #ffe39a;outline-offset:3px}';
  document.head.append(style);
  document.body.append(button);
  button.onclick = () => {
    if (window.confirm('Osvežiti aplikaciju? Sačuvani podaci ostaju. Nesаčuvane izmene u otvorenim poljima mogu biti izgubljene.')) {
      window.location.reload();
    }
  };
})();
