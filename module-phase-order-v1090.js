(function(){
 'use strict';
 const KEY='tasker.module-status.v1';
 function decorate(){
  const box=document.querySelector('#ms-detail');if(!box)return;
  let s;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch{return}if(!s)return;
  let number=0;
  for(const select of box.querySelectorAll('[data-ms-phase]')){
   const m=s.modules.find(m=>m.phases.some(p=>p.id===select.dataset.msPhase)),p=m?.phases.find(p=>p.id===select.dataset.msPhase);if(!p)continue;
   const row=select.closest('.ms-phase'),badge=row.querySelector('.ms-phase-number');
   const value=String(++number);if(badge&&badge.textContent!==value)badge.textContent=value;
   const b=row.querySelector('b');if(b&&b.textContent!==p.name)b.textContent=p.name;
   const excluded=!!s.costing?.excluded?.[m.id]?.[p.costItemId];row.classList.toggle('tc-not-working',excluded);
   let note=row.querySelector('.tc-phase-note');if(excluded&&!note){note=document.createElement('small');note.className='tc-phase-note';note.textContent='Ne radimo — označeno u troškovniku';select.after(note)}if(!excluded&&note)note.remove();
  }
 }
 new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',decorate);decorate();
})();

