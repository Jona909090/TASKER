(function(root){
 'use strict';
 const M=root.TaskerModuleStatusModel,T=root.TaskerBoqTemplates,base={migrate:M.migrate,change:M.change},copy=x=>JSON.parse(JSON.stringify(x));
 const KEY='tasker.module-status.v1',today=()=>M.today(),day=x=>x?M.today(new Date(x)):today();
 const direct={'A|1.1|Instalacija parne brane':'Parna brana u podu','A|1.2':'Podni lim','A|1.3':'Vuna u pod 200 mm','A|1.4':'Postavljanje plywooda','A|1.5':'Postavljanje Cetris ploča','A|1.6':'Postavljanje bakrene trake na pod','B|2.1':'Postavljanje vune u strop 80/100 mm','B|2.2':'Postavljanje parne brane','B|2.3':'Postavljanje stropnih panela','C|3.3':'Postavljanje zidnih panela','E|6.6':'Silikoniranje modula'};
 const expected=i=>direct[i.section[0]+'|'+i.boq+'|'+i.name]||direct[i.section[0]+'|'+i.boq]||'';
 function init(s){if(!s.costing)s.costing={version:1,mappings:{},prices:{},events:[],reports:[]};return s.costing}
 function track(c,m,p,on,at,percent){c.events.push({moduleId:m.id,phaseId:p.id,name:p.name,status:p.status,percent:percent===undefined?(p.status==='done'?100:p.status==='new'?0:null):percent,on,at})}
 function restore(source,backup){
  const s=copy(source),c=init(s);if(!s.boq||c.restored)return s;
  c.previousBoq=copy(s.boq);c.previousModules=copy(s.modules);c.restored=true;for(const t of s.boq.templates||[])for(const i of t.items)if(i.unitPrice!==null)c.prices[i.id]=i.unitPrice;
  for(const m of s.modules){
   const before=backup?.modules?.find(x=>x.id===m.id),old=m.phases;
   if(before){const ids=new Set(before.phases.map(p=>p.id));m.phases=before.phases.map(p=>{const now=old.find(x=>x.id===p.id);return now?{...now,name:p.name}:copy(p)});m.phases.push(...old.filter(p=>!ids.has(p.id)&&!p.boqItemId));}
   else {m.phases=old.filter(p=>!p.boqItemId||p.mapping==='matched');for(const name of M.phaseNames)if(!m.phases.some(p=>(p.previousName||p.name)===name)){const item=T.find(t=>t.type===m.type)?.items.find(i=>expected(i)===name),prior=item&&old.find(p=>p.boqItemId===item.id);m.phases.push(prior?{...prior,name}:{id:m.id+'-restored-'+m.phases.length,name,status:'new',completedAt:null})}}
   for(const p of m.phases){if(p.previousName)p.name=p.previousName;if(p.boqItemId)c.mappings[p.boqItemId]=p.name;if(p.status==='na'){p.status='new';p.completedAt=null}if(p.events?.length){for(const e of p.events.filter(e=>!e.voided))track(c,m,{...p,status:e.status},e.effectiveOn,e.at,e.percent)}delete p.boqItemId;delete p.mapping;delete p.previousName;delete p.events;delete p.percent;delete p.reviewDate}
   delete m.boqTemplateId;delete m.boqTemplateRevision;
  }
  delete s.boq;s.revision++;return s;
 }
 function align(s){
  const c=init(s);
  for(const m of s.modules){
   const t=T.find(t=>t.type===m.type);if(!t||m.costingPhaseLayout==='editable-v2-'+m.type)continue;
   if(!m.costingPhaseBackup)m.costingPhaseBackup=copy(m.phases);
   const old=m.phases,used=new Set();
   m.phases=t.items.filter(i=>!/^Dobava ravnog vanjskog lima/i.test(i.name)).map(i=>{
    const name=c.mappings[i.id]||expected(i);
    let p=old.find(p=>!used.has(p.id)&&p.costItemId===i.id)||old.find(p=>!used.has(p.id)&&!p.costItemId&&name&&p.name===name);
    if(!p)p={id:m.id+'-cost-'+i.id,name:i.name,status:'new',completedAt:null};
    used.add(p.id);return {...p,costItemId:i.id,name:i.boq+' '+i.name};
   });
   const removed=old.filter(p=>!used.has(p.id));
   if(removed.length){m.costingRemovedPhases||=[];for(const p of removed)if(!m.costingRemovedPhases.some(x=>x.id===p.id))m.costingRemovedPhases.push(copy(p))}
   m.costingPhaseLayout='editable-v2-'+m.type;
  }
  return s;
 }
 function ensure(source,backup){const s=align(restore(source,backup)),c=init(s);for(const m of s.modules)for(const p of m.phases)if(!c.events.some(e=>e.moduleId===m.id&&e.phaseId===p.id))track(c,m,p,p.status==='new'?(m.arrival||today()):(p.completedOn||day(p.completedAt)),new Date().toISOString());return s}
 M.migrate=function(source,at){let backup;try{backup=JSON.parse(root.localStorage?.getItem(KEY+'.before-boq-v1')||'null');if(source.boq&&!root.localStorage?.getItem(KEY+'.before-simple-costing'))root.localStorage?.setItem(KEY+'.before-simple-costing',JSON.stringify(source))}catch(e){throw Error('Rezervna kopija nije sačuvana: '+e.message)}const s=ensure(source,backup),r=base.migrate(s,at);return {state:r.state,changed:r.changed||JSON.stringify(source)!==JSON.stringify(r.state)}};
 M.change=function(source,a,at=new Date().toISOString()){
  if(a.type==='cost-month')return saveMonth(source,a,at);
  const s=ensure(source),c=s.costing;
  if(a.type==='cost-exclude'){const mod=s.modules.find(m=>m.id===a.moduleId),item=T.find(t=>t.type===mod?.type)?.items.find(i=>i.id===a.itemId);if(!item)throw Error('Stavka nije pronađena.');c.excluded||={};c.excluded[a.moduleId]||={};c.excluded[a.moduleId][a.itemId]=!!a.value;s.revision++;return M.validate(s)}
  if(a.type==='cost-settings'){const t=T.find(t=>t.type===a.scope);if(!t)throw Error('Odaberite tip.');for(const i of t.items){const v=a.values[i.id];if(!v)continue;const price=v.price===''?null:Number(String(v.price).replace(',','.'));if(price!==null&&(!Number.isFinite(price)||price<0))throw Error('Cena mora biti pozitivan broj.');c.prices[i.id]=price;c.mappings[i.id]=String(v.phase||'')}s.revision++;return M.validate(s)}
  if(a.type==='cost-report'){const report=calculate(s,a.month,a.scope,a.moduleId);report.version=c.reports.filter(r=>r.month===a.month&&r.scope===a.scope&&r.moduleId===a.moduleId).length+1;report.at=at;c.reports.push(report);s.revision++;return M.validate(s)}
  const next=align(base.change(s,a,at)),nc=next.costing;
  for(const m of next.modules)for(const p of m.phases){const prior=s.modules.find(x=>x.id===m.id)?.phases.find(x=>x.id===p.id);if(!prior||prior.status!==p.status||prior.name!==p.name||prior.completedOn!==p.completedOn||prior.completedAt!==p.completedAt){if(a.type==='phase-date')for(const e of nc.events)if(e.moduleId===m.id&&e.phaseId===p.id)e.superseded=true;track(nc,m,p,p.completedOn||day(at),at)}}return next;
 };
 function at(c,m,p,cutoff){return c.events.filter(e=>!e.superseded&&e.moduleId===m.id&&e.phaseId===p.id&&e.on<=cutoff).sort((a,b)=>a.on.localeCompare(b.on)||a.at.localeCompare(b.at)).at(-1)}
 const round=x=>Math.round(x*1e6)/1e6;
 function calculate(state,month,scope='ALL',moduleId=null){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Odaberite mesec.');const s=ensure(state),c=s.costing;
  const chosen=moduleId?s.modules.find(m=>m.id===moduleId):null;if(moduleId&&!chosen)throw Error('Modul nije pronađen.');if(chosen)scope=chosen.type;
  const groups=T.filter(t=>scope==='ALL'||t.type===scope).map(t=>({type:t.type,rows:t.items.map(i=>{
   const name=Object.hasOwn(c.mappings,i.id)?c.mappings[i.id]:expected(i),mods=s.modules.filter(m=>m.type===t.type&&(!moduleId||m.id===moduleId)),proof=mods.map(m=>{const p=m.phases.find(p=>p.costItemId===i.id)||m.phases.find(p=>p.name===name),prev=p&&at(c,m,p,month+'-00'),cur=p&&at(c,m,p,month+'-31');const previous=round(i.quantity*(prev?.percent||0)/100),total=round(i.quantity*(cur?.percent||0)/100);return {touched:!!p&&c.events.some(e=>!e.superseded&&e.moduleId===m.id&&e.phaseId===p.id&&e.on<=month+'-31'&&e.status!=='new'),module:m.name,previous,total,current:round(total-previous),status:cur?.status||'new',review:!p||cur?.percent===null}}),sum=k=>round(proof.reduce((n,p)=>n+p[k],0)),total=sum('total'),quantity=round(i.quantity*mods.length),price=Object.hasOwn(c.prices,i.id)?c.prices[i.id]:null;
   return {...i,phase:name,quantity,previous:sum('previous'),current:sum('current'),total,remaining:round(quantity-total),price,value:price===null?null:round(sum('current')*price),proof,status:proof.some(p=>['waiting','blocked'].includes(p.status))?'waiting':quantity>0&&total===quantity?'done':proof.some(p=>p.status==='active')||total>0?'active':'new'}
  })}));if(moduleId)for(const g of groups)for(const row of g.rows){row.excluded=!!c.excluded?.[moduleId]?.[row.id];row.untouched=!row.proof.some(p=>p.touched);if(row.untouched||row.excluded){for(const k of ['quantity','previous','current','total','remaining','price','value'])row[k]=null;row.unit='';row.status=row.excluded?'excluded':'untouched'}}if(moduleId)for(const g of groups)g.rows=g.rows.map(row=>ledgerRow(s,row,month,moduleId));return {month,scope,moduleId,moduleName:chosen?.name||'',groups};
 }

 function ledgerRow(state,row,month,moduleId){
  const book=state.costing?.monthly?.[moduleId]?.[row.id];if(!book)return row;
  const keys=Object.keys(book.entries).sort(),first=keys[0];if(!first||month<first)return row;
  const previous=round(book.baseline+keys.filter(k=>k<month).reduce((n,k)=>n+book.entries[k].quantity,0));
  const current=book.entries[month]?.quantity||0,total=round(previous+current);
  const priceKey=keys.filter(k=>k<=month).at(-1),price=priceKey?book.entries[priceKey].price:row.price;
  if(row.excluded)return row;
  const item=T.flatMap(t=>t.items).find(i=>i.id===row.id);
  return {...row,manual:true,untouched:false,unit:item.unit,quantity:item.quantity,previous,current,total,remaining:round(item.quantity-total),price,value:price===null?null:round(current*price),status:total>=item.quantity?'done':total>0?'active':'new'};
 }
 function saveMonth(source,a,stamp){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(a.month))throw Error('Izaberite mesec.');
  const s=copy(source),m=s.modules.find(m=>m.id===a.moduleId),item=T.find(t=>t.type===m?.type)?.items.find(i=>i.id===a.itemId);
  if(!item)throw Error('Stavka nije pronađena.');
  const parse=v=>{const str=String(v??'').trim().replace(',','.');if(!/^\d+(\.\d+)?$/.test(str))throw Error('Unesite ispravan pozitivan broj ili nulu.');return Number(str)};
  const quantity=parse(a.quantity),price=String(a.price??'').trim()===''?null:parse(a.price);
  if(!Number.isFinite(quantity)||price!==null&&!Number.isFinite(price))throw Error('Neispravan iznos.');
  const c=init(s);if(c.excluded?.[m.id]?.[item.id])throw Error('Stavka je označena kao Ne radimo.');
  c.monthly||={};c.monthly[m.id]||={};
  let book=c.monthly[m.id][item.id];
  if(!book){
   const row=calculate(s,a.month,m.type,m.id).groups[0].rows.find(i=>i.id===item.id);
   book={baseline:row.previous||0,entries:{}};
   c.monthly[m.id][item.id]=book;
  }
  const keys=Object.keys(book.entries).sort();
  if(keys.length&&a.month<keys[0])throw Error('Ručni obračun ove stavke počinje od '+keys[0]+'. Raniji obračuni ostaju nepromenjeni.');
  const sum=round(book.baseline+quantity+Object.entries(book.entries).filter(([k])=>k!==a.month).reduce((n,[,v])=>n+v.quantity,0));
  if(sum>item.quantity+0.000001)throw Error('Ukupna količina ne može preći '+item.quantity+' '+item.unit+'. Prethodno i ostali meseci: '+round(sum-quantity)+'.');
  c.monthlyHistory||=[];c.monthlyHistory.push({moduleId:m.id,itemId:item.id,month:a.month,before:copy(book.entries[a.month]||null),at:stamp});
  book.entries[a.month]={quantity,price,at:stamp};s.revision++;return s;
 }

 root.TaskerCosting={ensure,restore,calculate,expected};
 if(!root.document)return;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),num=x=>x===null?'—':new Intl.NumberFormat('sr-Latn-RS',{maximumFractionDigits:3}).format(x);
 let state,raw,report,month=today().slice(0,7),scope='ALL',moduleId=null,viewingSaved=false,selectedDate=today();
 function read(){raw=localStorage.getItem(KEY);state=raw?M.migrate(JSON.parse(raw)).state:ensure(M.create())}
 function write(a){if(a.type==='cost-month'&&!localStorage.getItem(KEY+'.before-monthly-v1091'))localStorage.setItem(KEY+'.before-monthly-v1091',raw);if(localStorage.getItem(KEY)!==raw)throw Error('Podaci su u međuvremenu promenjeni. Zatvorite i ponovo otvorite troškovnik.');state=M.change(state,a);raw=JSON.stringify(state);localStorage.setItem(KEY,raw);root.dispatchEvent(new StorageEvent('storage',{key:KEY,newValue:raw}))}
 function dialog(){let d=document.getElementById('tc-dialog');if(!d){d=document.createElement('dialog');d.id='tc-dialog';document.body.append(d)}return d}
 function html(r){return r.groups.map(g=>'<h3>'+esc(r.moduleName||g.type)+' · '+esc(g.type)+' troškovnik</h3><div class="tc-scroll"><table><thead><tr><th>Stavka</th><th>Status</th><th>JM</th><th>Ugovoreno</th><th>Prethodno</th><th>Mesec</th><th>Ukupno</th><th>Preostalo</th><th>Cena €</th><th>Iznos meseca €</th></tr></thead><tbody>'+g.rows.map(i=>'<tr class="tc-row-'+i.status+'"><td><details><summary>'+esc(i.boq)+' · '+esc(i.name)+'</summary><p>'+esc(i.description)+'</p><small>Prati: '+esc(i.phase||'Nije povezano')+'</small>'+(!viewingSaved?'<p><button type="button" data-tc-exclude="'+esc(i.id)+'" data-value="'+(!i.excluded)+'">'+(i.excluded?'Vrati — radimo ovu stavku':'Ne radimo ovu stavku')+'</button></p>':'')+'</details></td><td>'+(i.excluded?'<span class="tc-status excluded">Ne radimo</span>':i.untouched?'—':'<span class="tc-status '+i.status+'">'+({done:'Završeno',active:'U toku',waiting:'Čeka / blokirano',new:'Nije završeno'}[i.status]||'—')+'</span>')+'</td><td>'+esc(i.unit||'—')+'</td>'+['quantity','previous','current','total','remaining','price','value'].map(k=>'<td>'+cell(i,k)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p>Ukupno ovog meseca: '+(g.rows.filter(i=>!i.untouched&&!i.excluded).length&&g.rows.filter(i=>!i.untouched&&!i.excluded&&i.current!==0).every(i=>i.price!==null)?num(g.rows.filter(i=>!i.untouched&&!i.excluded).reduce((n,i)=>n+i.value,0))+' €':'—')+'</p>').join('')}

 function cell(i,k){
  if(!viewingSaved&&!i.excluded&&(k==='current'||k==='price')){
   const label=k==='current'?'Količina ovog meseca':'Cena po jedinici';
   return '<input class="tc-inline" inputmode="decimal" aria-label="'+label+' '+esc(i.boq)+' '+esc(i.name)+'" data-tc-field="'+k+'" data-item="'+esc(i.id)+'" value="'+(i[k]===null?'':i[k])+'" placeholder="—">'+(k==='current'?'<button class="tc-row-save" data-tc-row="'+esc(i.id)+'">Sačuvaj red</button>':'');
  }
  return num(i[k]);
 }
 function settings(){const c=init(state);return '<details class="tc-settings"><summary>⚙ Unesi cene (opcionalno)</summary><p>Svaka stavka automatski prati istoimenu fazu. Cena se unosi po originalnoj jedinici mere.</p>'+T.filter(t=>t.type===scope).map(t=>'<form data-tc-settings="'+t.type+'"><div class="tc-scroll"><table><thead><tr><th>Stavka</th><th>Cena €/JM</th></tr></thead><tbody>'+t.items.map(i=>'<tr><td>'+esc(i.boq)+' '+esc(i.name)+'<small>'+num(i.quantity)+' '+esc(i.unit)+' po modulu</small></td><td><input name="price-'+i.id+'" type="number" min="0" step="0.01" placeholder="Opcionalno" value="'+(c.prices[i.id]??'')+'"></td></tr>').join('')+'</tbody></table></div><button>Sačuvaj cene</button></form>').join('')+'</details>'}
 function render(){const d=dialog();viewingSaved=false;if(!state.modules.length){d.innerHTML='<h2>Troškovnik</h2><p>Prvo dodaj modul u Statusu modula.</p><button data-tc-close>Zatvori</button>';if(!d.open)d.showModal();return}if(!state.modules.some(m=>m.id===moduleId))moduleId=state.modules[0].id;scope=state.modules.find(m=>m.id===moduleId).type;report=calculate(state,month,scope,moduleId);d.innerHTML='<header><h2>Troškovnik · '+esc(report.moduleName)+'</h2><button type="button" data-tc-close>✕ Zatvori</button></header><form id="tc-filter"><label>Modul <select name="moduleId">'+state.modules.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name)+'</option>').join('')+'</select></label><label>Datum obračuna <input name="date" type="date" value="'+selectedDate+'" required></label><strong>'+new Intl.DateTimeFormat("sr-Latn-RS",{month:"long",year:"numeric"}).format(new Date(month+"-01T12:00:00"))+'</strong><button>Prikaži</button></form><p>Izaberi datum iz željenog meseca. U kolonu Mesec upiši urađenu količinu, unesi cenu po jedinici i klikni Sačuvaj red. Iznos = količina ovog meseca × cena. Od prvog ručnog unosa ta stavka prati mesečne količine; naredni mesec počinje sa 0. Status modula i datumi faza se ne menjaju.</p><div class="tc-actions"><button data-tc-save>Sačuvaj mesečni obračun</button><button data-tc-export>Preuzmi PDF</button><button data-tc-backup>Rezervna kopija</button></div><p id="tc-msg" role="status"></p>'+html(report)+settings()+'<details><summary>Sačuvani obračuni ovog modula</summary>'+state.costing.reports.map((r,n)=>r.moduleId===moduleId?'<button data-tc-old="'+n+'">'+esc(r.month)+' · '+esc(r.moduleName)+' · v'+r.version+'</button>':'').join('')+'</details>';d.querySelector('[name=moduleId]').value=moduleId;if(!d.open)d.showModal()}
 function file(data,name,type){const u=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),60000)}
 const fail=e=>{const x=document.getElementById('tc-msg');if(x)x.textContent=e.message};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-tc-row],[data-tc-exclude],[data-tc-open],[data-tc-close],[data-tc-save],[data-tc-export],[data-tc-old],[data-tc-backup]');if(!b)return;try{if(b.hasAttribute('data-tc-row')){const tr=b.closest('tr'),quantity=tr.querySelector('[data-tc-field=current]').value,price=tr.querySelector('[data-tc-field=price]').value;write({type:'cost-month',moduleId,itemId:b.dataset.tcRow,month,quantity,price});render();document.getElementById('tc-msg').textContent='✓ Sačuvana količina i cena za izabrani mesec. Status modula nije promenjen.';return}if(b.hasAttribute('data-tc-exclude')){write({type:'cost-exclude',moduleId,itemId:b.dataset.tcExclude,value:b.dataset.value==='true'});render();return}if(b.hasAttribute('data-tc-open')){read();moduleId=document.querySelector('#module-status [data-ms-module][aria-pressed="true"]')?.dataset.msModule||state.modules.find(m=>m.name===document.querySelector('#ms-detail .ms-detail-title h2')?.textContent)?.id||moduleId;render()}if(b.hasAttribute('data-tc-close'))dialog().close();if(b.hasAttribute('data-tc-save')){write({type:'cost-report',month,scope,moduleId});render();document.getElementById('tc-msg').textContent='✓ Mesečni obračun je sačuvan.'}if(b.hasAttribute('data-tc-old')){viewingSaved=true;report=state.costing.reports[Number(b.dataset.tcOld)];dialog().innerHTML='<header><h2>'+esc(report.month)+' · v'+report.version+'</h2><button data-tc-close>✕ Zatvori</button></header><button data-tc-export>Preuzmi PDF</button>'+html(report)}if(b.hasAttribute('data-tc-export')){if(!viewingSaved){read();report=calculate(state,month,scope,moduleId)}root.TaskerCostingPDF.download(report)};if(b.hasAttribute('data-tc-backup'))file(JSON.stringify(state),'Status-modula-kopija.json','application/json')}catch(err){fail(err)}});
 document.addEventListener('submit',e=>{const f=e.target;if(f.id!=='tc-filter'&&!f.dataset.tcSettings)return;e.preventDefault();try{const v=Object.fromEntries(new FormData(f));if(f.id==='tc-filter'){selectedDate=v.date;month=selectedDate.slice(0,7);moduleId=v.moduleId;render()}else{const t=T.find(t=>t.type===f.dataset.tcSettings),values=Object.fromEntries(t.items.map(i=>[i.id,{phase:v['phase-'+i.id],price:v['price-'+i.id]}]));write({type:'cost-settings',scope:t.type,values});render();document.getElementById('tc-msg').textContent='✓ Sačuvano. Postojeći Status modula nije promenjen.'}}catch(err){fail(err)}});
 document.addEventListener('change',e=>{if(e.target.closest('#tc-filter')){const f=e.target.closest('form');selectedDate=f.elements.date.value;month=selectedDate.slice(0,7);moduleId=f.elements.moduleId.value;try{render()}catch(err){fail(err)}}});
 root.addEventListener('storage',e=>{if(e.key===KEY&&document.getElementById('tc-dialog')?.open&&!viewingSaved){read();render()}});
 function install(){const bar=document.querySelector('#module-status .ms-actions');if(bar&&!bar.querySelector('[data-tc-open]')){const b=document.createElement('button');b.type='button';b.className='ms-button';b.dataset.tcOpen='';b.textContent='📁 Troškovnik';bar.append(b)}}new MutationObserver(install).observe(document.body,{childList:true,subtree:true});install();
})(typeof window==='object'?window:globalThis);

