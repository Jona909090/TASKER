(function(root){
 'use strict';
 const M=root.TaskerModuleStatusModel,T=root.TaskerBoqTemplates;
 if(!M||!T)throw Error('BOQ: nedostaje model ili troškovnik.');
 const base={create:M.create,validate:M.validate,migrate:M.migrate,change:M.change},copy=x=>JSON.parse(JSON.stringify(x));
 const day=t=>M.today(new Date(t)),validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
 const uid=()=>root.crypto?.randomUUID?.()||'boq-'+Date.now()+'-'+Math.random().toString(36).slice(2);
 const direct={'A|1.1|Instalacija parne brane':'Parna brana u podu','A|1.2':'Podni lim','A|1.3':'Vuna u pod 200 mm','A|1.4':'Postavljanje plywooda','A|1.5':'Postavljanje Cetris ploča','A|1.6':'Postavljanje bakrene trake na pod','B|2.1':'Postavljanje vune u strop 80/100 mm','B|2.2':'Postavljanje parne brane','B|2.3':'Postavljanje stropnih panela','C|3.3':'Postavljanje zidnih panela','E|6.6':'Silikoniranje modula'};
 function expected(item){return direct[item.section[0]+'|'+item.boq+'|'+item.name]||direct[item.section[0]+'|'+item.boq]||null}
 function templates(s){return s.boq?.templates||T}
 function template(s,m){return templates(s).find(t=>t.id===m.boqTemplateId)}
 function phase(m,item){return m.phases.find(p=>p.boqItemId===item.id)}
 function append(m,p,before,at,effectiveOn,kind='boq-progress'){
  m.history.push({id:uid(),at,occurredOn:effectiveOn,type:kind,phaseId:p.id,boqItemId:p.boqItemId,before,after:{status:p.status,percent:p.percent},text:p.name+': '+(before?.status||'—')+' '+(before?.percent??'?')+'% → '+p.status+' '+(p.percent??'?')+'%'});
 }
 function attach(s,m,at){
  if(m.boqTemplateId)return;
  const t=templates(s).find(t=>t.type===m.type);if(!t)throw Error('Nema troškovnika za tip '+m.type);
  m.boqTemplateId=t.id;m.boqTemplateRevision=t.revision;
  for(const item of t.items){
   const name=expected(item);let p=name?m.phases.find(p=>p.name===name&&!p.boqItemId):null;
   const reused=!!p;
   if(!p){p={id:uid(),name:item.name,status:'new',completedAt:null};m.phases.push(p)}
   p.boqItemId=item.id;p.mapping=reused?'matched':'new';p.percent=p.status==='done'?100:p.status==='new'?0:null;
   if(item.boq==='2.1'&&reused){p.previousName=p.name;p.name='Postavljanje vune u strop 140 mm'}
   p.events=[];
   if(reused&&p.status==='done'){
    const on=p.completedOn|| (p.completedAt&&!isNaN(Date.parse(p.completedAt))?day(p.completedAt):null);
    if(on) p.events.push({id:uid(),at,effectiveOn:on,status:'done',percent:100,source:'legacy-completion'});
    else p.reviewDate=true;
   }else if(reused&&p.status!=='new')p.reviewDate=true;
  }
  m.history.push({id:uid(),at,type:'boq-migration',text:'Povezan '+t.id+'. Postojeće faze i istorija sačuvane. Delimična stara izvedenost nije pretpostavljena.'});
 }
 function upgrade(source,at=new Date().toISOString()){
  const s=copy(source);let changed=false;
  if(!s.boq){s.boq={version:1,templates:copy(T),reports:[]};changed=true}
  for(const m of s.modules)if(!m.boqTemplateId){attach(s,m,at);changed=true}
  if(changed)s.revision++;
  return {state:s,changed};
 }
 M.statuses.new={label:'Nije započeto',color:'#ef5350',icon:'○'};
 M.statuses.active={label:'U toku',color:'#f4d64d',icon:'⚙'};
 M.statuses.waiting={label:'Čeka materijal',color:'#ff982f',icon:'◷'};
 M.statuses.blocked={label:'Blokiran',color:'#ff982f',icon:'!'};
 M.statuses.na={label:'Nije primenjivo',color:'#88939d',icon:'—'};
 M.create=()=>upgrade(base.create()).state;
 M.validate=function(s){
  if(!s.boq)return base.validate(s);
  if(s.boq.version!==1||!Array.isArray(s.boq.templates)||!Array.isArray(s.boq.reports))throw Error('Neispravna BOQ evidencija.');
  const ids=new Set(),types=new Set();
  for(const t of s.boq.templates){if(!t.id||ids.has(t.id)||!t.type||types.has(t.type)||!Array.isArray(t.items)||!t.items.length)throw Error('Neispravan ili ponovljen troškovnik.');ids.add(t.id);types.add(t.type);const items=new Set();for(const i of t.items){if(!i.id||items.has(i.id)||!i.boq||!i.name||!i.unit||!Number.isFinite(i.quantity)||i.quantity<0||i.unitPrice!==null&&(!Number.isFinite(i.unitPrice)||i.unitPrice<0))throw Error('Neispravna BOQ stavka.');items.add(i.id)}}
  const check=copy(s);
  for(const m of check.modules){const t=template(s,m);if(!t||t.type!==m.type)throw Error('Tip modula i troškovnik se ne slažu.');m.type='MV';if(m.status==='na')m.status='new';const mapped=new Set();for(const p of m.phases){if(p.status==='na')p.status='new';if(p.boqItemId){if(!t.items.some(i=>i.id===p.boqItemId)||mapped.has(p.boqItemId))throw Error('Neispravno BOQ povezivanje.');mapped.add(p.boqItemId);if(p.percent!==null&&(!Number.isFinite(p.percent)||p.percent<0||p.percent>100))throw Error('Procenat mora biti 0–100.');for(const e of p.events||[])if(!validDate(e.effectiveOn)||!Number.isFinite(e.percent)||e.percent<0||e.percent>100)throw Error('Neispravna istorija izvedenosti.')}}}
  base.validate(check);return s;
 };
 M.migrate=function(source,at){if(source.boq)return {state:M.validate(source),changed:false};const old=base.migrate(source,at);const next=upgrade(old.state,at);return {state:M.validate(next.state),changed:old.changed||next.changed}};
 M.progress=m=>{const list=m.phases.filter(p=>(!m.boqTemplateId||p.boqItemId)&&p.status!=='na');return list.length?Math.round(list.reduce((sum,p)=>sum+(p.percent??(p.status==='done'?100:0)),0)/list.length):0};
 M.unfinished=m=>m.phases.filter(p=>p.status!=='done'&&p.status!=='na');
 function setProgress(s,a,at){
  const m=s.modules.find(m=>m.id===a.id),p=m?.phases.find(p=>p.id===a.phaseId);if(!p)throw Error('Faza nije pronađena.');
  const status=a.value||p.status;if(!['new','active','waiting','blocked','done','na'].includes(status))throw Error('Neispravan status.');
  const percent=status==='done'?100:status==='new'||status==='na'?0:a.percent===undefined?(p.percent??0):Number(a.percent);
  if(!Number.isFinite(percent)||percent<0||percent>100||status==='active'&&percent>=100)throw Error('Unesite procenat 0–99 ili izaberite Završeno.');
  const on=a.effectiveOn||day(at);if(!validDate(on)||on>day(at))throw Error('Datum izvedenosti ne može biti u budućnosti.');
  if(a.startedOn&&(!validDate(a.startedOn)||a.startedOn>on))throw Error('Datum početka nije ispravan.');
  const before={status:p.status,percent:p.percent??null};
  if(a.note!==undefined)p.note=String(a.note).slice(0,4000);if(a.reason!==undefined)p.reason=String(a.reason).slice(0,1000);
  if(a.startedOn!==undefined)p.startedOn=a.startedOn;
  if(!p.startedOn&&percent>0)p.startedOn=on;
  const latest=(p.events||[]).filter(e=>!e.voided).reduce((v,e)=>e.effectiveOn>v?e.effectiveOn:v,'');
  if(on<latest)throw Error('Datum je pre poslednje evidentirane izvedenosti ('+latest+'). Unesite korekciju na taj ili kasniji datum.');
  p.status=status;p.percent=percent;p.completedAt=status==='done'?at:null;p.completedOn=status==='done'?on:null;p.reviewDate=false;p.mapping='confirmed';
  if(p.boqItemId){(p.events||=[]).push({id:uid(),at,effectiveOn:on,status,percent});}
  append(m,p,before,at,on);
  if(m.status==='done'&&status!=='done'&&status!=='na'){m.status='active';delete m.completedAt}
 }
 M.change=function(source,a,at=new Date().toISOString()){
  M.validate(source);if(isNaN(Date.parse(at)))throw Error('Neispravno vreme.');
  let s=source.boq?copy(source):upgrade(source,at).state;
  if(['phase','boq-progress'].includes(a.type)){setProgress(s,a,at);s.revision++;return M.validate(s)}
  if(a.type==='phase-date'){
   const p=s.modules.find(m=>m.id===a.id)?.phases.find(p=>p.id===a.phaseId);if(p?.boqItemId){if(p.status!=='done')throw Error('Faza nije završena.');if(s.boq.reports.length)throw Error('Za korekciju datuma već obračunatih radova koristite novi zapis izvedenosti i novu verziju obračuna.');p.events=(p.events||[]).map(e=>({...e,voided:true}));setProgress(s,{...a,value:'done',effectiveOn:a.value},at);s.revision++;return M.validate(s)}
  }
  if(a.type==='finish'){const m=s.modules.find(m=>m.id===a.id);if(!m)throw Error('Modul nije pronađen.');for(const p of m.phases)if(p.status!=='done'&&p.status!=='na')setProgress(s,{id:m.id,phaseId:p.id,value:'done'},at)}
  if(a.type==='delete-phase'&&s.modules.find(m=>m.id===a.id)?.phases.some(p=>p.id===a.phaseId&&p.boqItemId))throw Error('BOQ fazu ne brišite. Označite Nije primenjivo uz napomenu.');
  if(a.type==='edit'&&a.data?.type){const m=s.modules.find(m=>m.id===a.id);if(m&&m.type!==a.data.type)throw Error('Tip povezanog modula je zaključan radi očuvanja obračuna.');}
  if(a.type==='boq-map'){
   const m=s.modules.find(m=>m.id===a.id),current=m?.phases.find(p=>p.boqItemId===a.itemId),target=m?.phases.find(p=>p.id===a.phaseId);if(!current||!target||target.boqItemId&&target!==current)throw Error('Odaberite slobodnu fazu.');
   if((current.events||[]).length)throw Error('Stavka već ima evidentiranu izvedenost; povezivanje je zaključano.');
   if(current!==target){delete current.boqItemId;target.boqItemId=a.itemId;target.percent=target.status==='done'?100:target.status==='new'?0:null;target.events=[];target.reviewDate=target.status!=='new';}
   target.mapping='confirmed';m.history.push({id:uid(),at,type:'boq-mapping',text:'Potvrđeno povezivanje '+a.itemId+' → '+target.name});s.revision++;return M.validate(s);
  }
  if(a.type==='boq-price'){const i=templates(s).find(t=>t.id===a.templateId)?.items.find(i=>i.id===a.itemId);if(!i)throw Error('Stavka nije pronađena.');i.unitPrice=a.price===''||a.price===null?null:Number(String(a.price).replace(',','.'));s.revision++;return M.validate(s)}
  if(a.type==='boq-template'){const t=copy(a.template);if(templates(s).some(x=>x.id===t.id||x.type===t.type))throw Error('Tip već postoji.');s.boq.templates.push(t);s.revision++;return M.validate(s)}
  if(a.type==='boq-evidence'){const m=s.modules.find(m=>m.id===a.id),p=m?.phases.find(p=>p.id===a.phaseId);if(!p||!p.boqItemId||!/^data:image\/(png|jpeg|webp);base64,/.test(a.image||'')||a.image.length>700000)throw Error('Neispravna ili prevelika slika.');(p.evidence||=[]).push({id:uid(),at,image:a.image,caption:String(a.caption||'').slice(0,500)});m.history.push({id:uid(),at,type:'boq-evidence',text:'Dodat dokaz: '+p.name});s.revision++;return M.validate(s)}
  if(a.type==='boq-report'){const report=monthly(s,a.month,a.scope);report.id=uid();report.createdAt=at;report.version=s.boq.reports.filter(r=>r.month===a.month&&r.scope===a.scope).length+1;s.boq.reports.push(report);s.revision++;return M.validate(s)}
  // Delegate existing hall/location behavior, allowing registered future types and N/A phases.
  const types=new Map(s.modules.map(m=>[m.id,m.type])),na=[];
  for(const m of s.modules){m.type='MV';for(const p of m.phases)if(p.status==='na'){na.push(p.id);p.status='new'}}
  let action=copy(a);if(a.type==='create')action.data.type='MV';
  s=base.change(s,action,at);
  for(const m of s.modules){m.type=types.get(m.id)||(m.id===a.id?a.data?.type:m.type);for(const p of m.phases)if(na.includes(p.id))p.status='na'}
  if(a.type==='create'){const m=s.modules.find(m=>m.id===a.id);m.phases=[];attach(s,m,at);for(const p of m.phases)p.mapping='confirmed'}
  return M.validate(s);
 };
 function atPercent(p,date){let value=0;for(const e of (p?.events||[]).filter(e=>!e.voided&&e.effectiveOn<=date).map((e,i)=>({...e,index:i})).sort((a,b)=>a.effectiveOn.localeCompare(b.effectiveOn)||a.index-b.index))value=e.percent;return value}
 const round=n=>Math.round(n*1000000)/1000000;
 function monthly(s,month,scope='ALL'){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Odaberite mesec.');
  const start=month+'-01',end=month+'-31';
  const groups=templates(s).filter(t=>scope==='ALL'||scope===t.type).map(t=>{
   const mods=s.modules.filter(m=>m.boqTemplateId===t.id);
   return {templateId:t.id,type:t.type,revision:t.revision,source:t.source,rows:t.items.map(item=>{
    const proof=mods.map(m=>{const p=phase(m,item);const previous=round(item.quantity*atPercent(p,start.slice(0,7)+'-00')/100),total=round(item.quantity*atPercent(p,end)/100);const event=(p?.events||[]).filter(e=>!e.voided&&e.effectiveOn<=end).sort((a,b)=>a.effectiveOn.localeCompare(b.effectiveOn)).at(-1);return {status:event?.status||'new',moduleId:m.id,module:m.name,contracted:item.quantity,previous,current:round(total-previous),total,remaining:round(item.quantity-total),review:!p||!!p.reviewDate||p.percent===null||p.mapping==='new',note:p?.note||''}});
    const sum=key=>round(proof.reduce((s,x)=>s+x[key],0));const previous=sum('previous'),current=sum('current'),total=sum('total');
    return {...copy(item),contracted:sum('contracted'),previous,current,total,remaining:sum('remaining'),proof,values:item.unitPrice===null?null:{previous:round(previous*item.unitPrice),current:round(current*item.unitPrice),total:round(total*item.unitPrice),remaining:round(sum('remaining')*item.unitPrice)}};
   })};
  });return {month,scope,groups};
 }
 function rows(s,m){return template(s,m).items.map(i=>{const p=phase(m,i),percent=p?.percent??null,done=percent===null?null:round(i.quantity*percent/100);return {...i,phase:p,percent,done,remaining:done===null?null:round(i.quantity-done)}})}
 root.TaskerBoq={templates,template,phase,rows,monthly,atPercent,expected};
 if(typeof module==='object'&&module.exports)module.exports=root.TaskerBoq;
})(typeof window==='object'?window:globalThis);

