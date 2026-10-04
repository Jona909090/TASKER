(function(){
 'use strict';
 const KEY='tasker.module-status.v1';
 function decorate(){
  const box=document.querySelector('#ms-detail');if(!box)return;
  let s;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch{return}if(!s)return;
  const phaseNodes=box.querySelectorAll('[data-ms-phase]');let extra=false;
  for(const select of phaseNodes){const m=s.modules.find(m=>m.phases.some(p=>p.id===select.dataset.msPhase));const p=m?.phases.find(p=>p.id===select.dataset.msPhase);if(!p)continue;
   const row=select.closest('.ms-phase'),item=window.TaskerBoqTemplates.find(t=>t.type===m.type)?.items.find(i=>i.id===p.costItemId);
   if(item){const badge=row.querySelector('.ms-phase-number');if(badge&&badge.textContent!==item.boq)badge.textContent=item.boq;const b=row.querySelector('b');if(b&&b.textContent!==item.name)b.textContent=item.name;
    const excluded=!!s.costing?.excluded?.[m.id]?.[item.id];row.classList.toggle('tc-not-working',excluded);let note=row.querySelector('.tc-phase-note');if(excluded&&!note){note=document.createElement('small');note.className='tc-phase-note';note.textContent='Ne radimo — označeno u troškovniku';select.after(note)}if(!excluded&&note)note.remove();
   }else if(!extra){extra=true;if(!row.previousElementSibling?.classList.contains('tc-extra-title')){const h=document.createElement('h4');h.className='tc-extra-title';h.textContent='Dodatne ranije faze — sačuvani unosi';row.before(h)}}
  }
 }
 new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',decorate);decorate();
})();