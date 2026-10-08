/* Decorative progress only. Reads rendered labels; never reads/writes application storage. */
(function(){
  'use strict';
  function paint(){
    document.querySelectorAll('#ms-halls .ms-container small').forEach(label=>{
      const match=label.textContent.match(/^\s*(\d+(?:[.,]\d+)?)%/);
      if(!match)return;
      const value=Math.max(0,Math.min(100,Number(match[1].replace(',','.'))))+'%';
      if(label.style.getPropertyValue('--hall-progress')!==value)label.style.setProperty('--hall-progress',value);
    });
  }
  new MutationObserver(paint).observe(document.getElementById('app')||document.body,{childList:true,subtree:true,characterData:true});
  paint();
})();