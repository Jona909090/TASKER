(function(root){
  'use strict'
  const statuses={new:{label:'Nije započeto',color:'#738394',icon:'○'},active:{label:'U radu',color:'#1681ff',icon:'⚙'},waiting:{label:'Čeka materijal',color:'#f49a22',icon:'◷'},blocked:{label:'Blokiran',color:'#ee5367',icon:'!'},ready:{label:'Spreman za otpremu',color:'#a16bff',icon:'➜'},done:{label:'Završen',color:'#27bf83',icon:'✓'}}
  const phaseNames=['Parna brana ispod poda','Podni lim','Vuna u podu','Plywood','Cetris ploče','Vuna u zidovima i stropu','Vuna u stropu','Stropni paneli','Panel holderi','Promat oko vrata','Zidni paneli','Prodori','Pregradni zid','Demontažni zid unutarnji','Lajsne','Unutarnji opšavi','Vanjski opšavi']
  const legacyPhaseNames=['Cetris ploče','Vuna u podu','Plywood','Podni lim','Vuna u zidovima i stropu','Zidni paneli','Stropni paneli','Promat','Panel holderi','Prodori','Unutarnji opšavi','Vanjski opšavi','Lajsne','Silikoniranje','Završna kontrola','Spreman za otpremu']
  const phaseAliases={'Promat oko vrata':['Promat']}
  const clone=x=>JSON.parse(JSON.stringify(x))
  const today=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)
  const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s
  const clean=(v,max=120)=>String(v??'').trim().slice(0,max)
  const progress=m=>m.phases.length?Math.round(100*m.phases.filter(p=>p.status==='done').length/m.phases.length):0
  function create(){return {version:1,phaseTemplateVersion:1,revision:0,halls:[{id:'main',name:'Proizvodna hala',positions:Array.from({length:10},(_,i)=>({id:'p'+(i+1),label:String(i+1),side:i<5?'left':'right',order:i%5+1}))}],locations:[{id:'dupliko',name:'DUPLIKO'},{id:'shipped',name:'Otpremljeni'},{id:'finished',name:'Završeni'}],modules:[]}}
  function migrate(source,time=new Date().toISOString()){
    validate(source)
    const s=clone(source),aliases=s.locations.filter(l=>l.id==='kalinovica'||/^kalinovica$/i.test(l.name.trim())).map(l=>l.id)
    let changed=false
    let target=s.locations.find(l=>l.id==='dupliko')
    if(!target){target={id:'dupliko',name:'DUPLIKO'};s.locations.push(target);changed=true}
    if(target.name!=='DUPLIKO'){target.name='DUPLIKO';changed=true}
    for(const m of s.modules)if(m.place.kind==='external'&&aliases.includes(m.place.locationId)){
      m.place.locationId='dupliko'
      m.history.push({at:time,type:'location-merge',text:'Kalinovica i Dupliko objedinjeni pod nazivom DUPLIKO; faze i ranija istorija sačuvane.'})
      changed=true
    }
    if(aliases.length){s.locations=s.locations.filter(l=>!aliases.includes(l.id));changed=true}
    if(s.phaseTemplateVersion!==1){
      const legacyDefaults=new Set(legacyPhaseNames)
      for(const m of s.modules){
        const before=JSON.stringify(m.phases),used=new Set(),ids=new Set(m.phases.map(p=>p.id))
        const next=phaseNames.map((name,i)=>{
          let p=m.phases.find(p=>!used.has(p.id)&&p.name===name)
          if(!p)for(const alias of phaseAliases[name]||[]){p=m.phases.find(x=>!used.has(x.id)&&x.name===alias);if(p)break}
          if(p){used.add(p.id);return {...p,name}}
          let id=m.id+'-phase-standard-'+i
          while(ids.has(id))id+='-x'
          ids.add(id)
          return {id,name,status:'new',completedAt:null}
        })
        for(const p of m.phases){
          if(used.has(p.id)||legacyDefaults.has(p.name))continue
          next.push(p)
        }
        if(JSON.stringify(next)!==before){m.phases=next;changed=true}
      }
      s.phaseTemplateVersion=1
      changed=true
    }
    if(changed)s.revision++
    return {state:validate(s),changed}
  }
  const unfinished=m=>m.phases.filter(p=>p.status!=='done')
  function recordRemaining(mod,data,time){
    const work=clean(data.remainingWork,4000),quantity=clean(data.remainingQuantity,1000)
    if(unfinished(mod).length&&(!work||!quantity))throw Error('Za DUPLIKO upišite šta je ostalo da se odradi i koliko.')
    if(work||quantity){
      if(!work||!quantity)throw Error('Popunite i opis preostalih radova i količinu.')
      const entry={at:time,work,quantity,phases:unfinished(mod).map(p=>({id:p.id,name:p.name,status:p.status}))}
      ;(mod.handoffs||=[]).push(entry)
      mod.history.push({at:time,type:'remaining-work',text:'DUPLIKO — preostalo: '+work+' | Količina / obim: '+quantity})
    }
  }
  function locationName(s,place){if(place.kind==='external')return s.locations.find(l=>l.id===place.locationId)?.name||'Nepoznata lokacija';const h=s.halls.find(h=>h.id===place.hallId);return (h?.name||'Hala')+' · pozicija '+(h?.positions.find(p=>p.id===place.positionId)?.label||'?')}
  function checkPlace(s,place,id){
    if(place?.kind==='hall'){
      if(!s.halls.some(h=>h.id===place.hallId&&h.positions.some(p=>p.id===place.positionId)))throw Error('Odaberite postojeću poziciju u hali.')
      if(s.modules.some(m=>m.id!==id&&m.place.kind==='hall'&&m.place.hallId===place.hallId&&m.place.positionId===place.positionId))throw Error('Pozicija je zauzeta. Odaberite slobodnu poziciju.')
    }else if(place?.kind!=='external'||!s.locations.some(l=>l.id===place.locationId))throw Error('Odaberite lokaciju.')
  }
  function validate(s){
    if(!s||s.version!==1||!Number.isInteger(s.revision)||!Array.isArray(s.halls)||!s.halls.length||!Array.isArray(s.locations)||!Array.isArray(s.modules))throw Error('Neispravni podaci Statusa modula. Podaci nisu promijenjeni.')
    const unique=list=>{const ids=new Set();for(const x of list){if(!x.id||ids.has(x.id))throw Error('Ponovljena ili neispravna oznaka.');ids.add(x.id)}}
    unique(s.halls);unique(s.locations);unique(s.modules)
    for(const h of s.halls){if(!h.name||!Array.isArray(h.positions))throw Error('Neispravna hala.');unique(h.positions);for(const p of h.positions)if(!['left','right'].includes(p.side)||!Number.isFinite(p.order))throw Error('Neispravna pozicija.')}
    for(const l of s.locations)if(!l.name)throw Error('Neispravna lokacija.')
    const names=new Set()
    for(const m of s.modules){
      if(!m.name||names.has(m.name.toLowerCase())||!['MV','MVS'].includes(m.type)||!statuses[m.status]||!date(m.arrival)||m.dispatch&&!date(m.dispatch)||!Array.isArray(m.phases)||!Array.isArray(m.history))throw Error('Neispravan modul ili ponovljen naziv.')
      names.add(m.name.toLowerCase());checkPlace(s,m.place,m.id);unique(m.phases)
      for(const dim of ['length','width','height'])if(!Number.isFinite(m[dim])||m[dim]<=0||m[dim]>100)throw Error('Dimenzije moraju biti između 0 i 100 metara.')
      for(const p of m.phases)if(!p.name||!['new','active','waiting','blocked','done'].includes(p.status)||(p.status==='done'&&!p.completedAt))throw Error('Neispravna faza.')
      if(m.photo&&!/^data:image\/(jpeg|png|webp);base64,/.test(m.photo))throw Error('Neispravna fotografija.')
    }
    return s
  }
  function change(source,a,time=new Date().toISOString()){
    validate(source);if(isNaN(Date.parse(time)))throw Error('Neispravno vrijeme.')
    const s=clone(source),m=s.modules.find(x=>x.id===a.id)
    const log=(mod,type,text)=>mod.history.push({at:time,type,text})
    const requireModule=()=>{if(!m)throw Error('Modul nije pronađen.')}
    const setStatus=(mod,value)=>{if(!statuses[value])throw Error('Odaberite status.');if(mod.status===value)return;log(mod,value==='waiting'?'waiting':'status','Status: '+statuses[mod.status].label+' → '+statuses[value].label);mod.status=value;if(value==='done'){mod.completedAt=time;log(mod,'completed','Modul završen')}else delete mod.completedAt}
    const move=(mod,place)=>{checkPlace(s,place,mod.id);if(JSON.stringify(mod.place)===JSON.stringify(place))return;const from=locationName(s,mod.place);if(mod.place.kind==='hall'&&place.kind==='external')mod.departure=today(new Date(time));mod.place=clone(place);log(mod,place.kind==='hall'?'position':place.locationId==='shipped'?'shipped':'move',from+' → '+locationName(s,place))}
    switch(a.type){
      case 'create':{
        if(!a.id||m)throw Error('Modul već postoji.')
        const data=a.data||{},mod={id:a.id,name:clean(data.name),type:data.type,length:Number(data.length),width:Number(data.width),height:Number(data.height),arrival:data.arrival,dispatch:data.dispatch||'',note:clean(data.note,4000),status:data.status||'new',place:clone(data.place),phases:phaseNames.map((name,i)=>({id:a.id+'-phase-'+i,name,status:'new',completedAt:null})),history:[]}
        checkPlace(s,mod.place,mod.id);if(mod.place.kind==='external'&&mod.place.locationId==='dupliko')recordRemaining(mod,data,time);log(mod,'created','Kreiran modul '+mod.name);log(mod,mod.place.kind==='hall'?'entered':'move','Početna lokacija: '+locationName(s,mod.place));if(mod.status==='done'){mod.completedAt=time;log(mod,'completed','Modul kreiran kao završen')}
        s.modules.push(mod);break
      }
      case 'edit':{requireModule();const data=a.data||{};const before=JSON.stringify(m);for(const k of ['name','note'])if(data[k]!==undefined)m[k]=clean(data[k],k==='note'?4000:120);for(const k of ['type','arrival','dispatch'])if(data[k]!==undefined)m[k]=data[k];for(const k of ['length','width','height'])if(data[k]!==undefined)m[k]=Number(data[k]);if(data.status)setStatus(m,data.status);if(JSON.stringify(m)!==before)log(m,'edited','Izmijenjeni podaci modula');break}
      case 'dates':{
        requireModule()
        for(const key of ['arrival','departure','dispatch']){
          if(a[key]===undefined)continue
          const value=a[key]
          if((key==='arrival'||value)&&!date(value))throw Error('Upišite ispravan datum.')
          const before=m[key]||''
          if(before!==value){m[key]=value;log(m,'date-correction',({arrival:'Datum dolaska',departure:'Datum odlaska',dispatch:'Planirana otprema'})[key]+': '+(before||'—')+' → '+(value||'—'))}
        }
        break
      }
      case 'phase-date':{
        requireModule();const p=m.phases.find(p=>p.id===a.phaseId)
        if(!p||p.status!=='done'||!date(a.value))throw Error('Datum se može mijenjati samo za završenu fazu.')
        const before=p.completedOn||today(new Date(p.completedAt))
        if(before!==a.value){p.completedOn=a.value;log(m,'date-correction','Datum završetka faze '+p.name+': '+before+' → '+a.value)}
        break
      }
      case 'event-date':{
        requireModule();const e=m.history[a.index]
        if(!Number.isInteger(a.index)||!e||!date(a.value))throw Error('Neispravan događaj ili datum.')
        const before=e.occurredOn||today(new Date(e.at))
        if(before!==a.value){e.occurredOn=a.value;log(m,'date-correction','Datum događaja „'+e.text+'”: '+before+' → '+a.value)}
        break
      }
      case 'status':requireModule();setStatus(m,a.value);break
      case 'move':requireModule();if(a.place?.kind==='external'&&a.place.locationId==='dupliko')recordRemaining(m,a,time);move(m,a.place);break
      case 'finish':{
        requireModule();for(const p of m.phases)if(p.status!=='done'){p.status='done';p.completedAt=time;delete p.completedOn;log(m,'phase-done','Završena faza: '+p.name)}
        setStatus(m,'done');move(m,{kind:'external',locationId:'finished'});break
      }
      case 'phase':{
        requireModule();const p=m.phases.find(p=>p.id===a.phaseId);if(!p||!['new','active','waiting','blocked','done'].includes(a.value))throw Error('Neispravna faza ili status.')
        if(p.status!==a.value){p.status=a.value;p.completedAt=a.value==='done'?time:null;delete p.completedOn;log(m,a.value==='done'?'phase-done':a.value==='waiting'?'waiting':'phase','Faza '+p.name+': '+(a.value==='done'?'Završeno':statuses[a.value].label));if(m.status==='done'&&a.value!=='done')setStatus(m,'active')}
        break
      }
      case 'add-phase':requireModule();if(!a.phaseId||!clean(a.name))throw Error('Upišite naziv faze.');m.phases.push({id:a.phaseId,name:clean(a.name),status:'new',completedAt:null});log(m,'phase-added','Dodana faza: '+clean(a.name));if(m.status==='done')setStatus(m,'active');break
      case 'delete-phase':{requireModule();const p=m.phases.find(p=>p.id===a.phaseId);if(!p)throw Error('Faza nije pronađena.');m.phases=m.phases.filter(p=>p.id!==a.phaseId);log(m,'phase-deleted','Obrisana faza: '+p.name);break}
      case 'reorder-phase':{requireModule();const i=m.phases.findIndex(p=>p.id===a.phaseId),j=i+Number(a.delta);if(i<0||![-1,1].includes(a.delta)||j<0||j>=m.phases.length)throw Error('Neispravan redoslijed.');[m.phases[i],m.phases[j]]=[m.phases[j],m.phases[i]];log(m,'phase-order','Promijenjen redoslijed faza');break}
      case 'add-location':{const name=clean(a.name);if(/^kalinovica$/i.test(name))throw Error('Kalinovica je ista lokacija kao DUPLIKO. Odaberite DUPLIKO.');if(!a.locationId||!name||s.locations.some(l=>l.name.toLowerCase()===name.toLowerCase()))throw Error('Upišite novi, jedinstven naziv lokacije.');s.locations.push({id:a.locationId,name});break}
      case 'photo':requireModule();m.photo=a.value||'';log(m,'photo',a.value?'Dodana fotografija modula':'Uklonjena fotografija modula');break
      default:throw Error('Nepoznata radnja.')
    }
    s.revision++;return validate(s)
  }
  function stats(s,day=today()){return {hall:s.modules.filter(m=>m.place.kind==='hall').length,active:s.modules.filter(m=>m.status==='active').length,waiting:s.modules.filter(m=>m.status==='waiting').length,ready:s.modules.filter(m=>m.status==='ready').length,completed:s.modules.filter(m=>m.completedAt&&today(new Date(m.completedAt))===day).length}}
  const api={statuses,phaseNames,create,validate,change,progress,stats,locationName,today,migrate,unfinished}
  if(typeof module==='object'&&module.exports)module.exports=api;else root.TaskerModuleStatusModel=api
})(typeof window==='object'?window:globalThis)