(function(){
  'use strict'
  const M=window.TaskerModuleStatusModel,KEY='tasker.module-status.v1'
  const el=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const date=s=>s?s.split('-').reverse().join('.')+'.':'—',time=s=>new Date(s).toLocaleString('hr-HR'),uid=()=>crypto.randomUUID()
  let state,raw=null,error='',selected='',locationFilter='',dragged=''
  let activeHall='',stopDelivery=()=>{},hallView='top'
  const currentHall=()=>state.halls.find(h=>h.id===activeHall)||state.halls[0]
  function read(){
    const text=localStorage.getItem(KEY),result=text?M.migrate(JSON.parse(text)):{state:M.create(),changed:false}
    if(result.changed){
      if(!localStorage.getItem(KEY+'.before-dupliko-merge'))localStorage.setItem(KEY+'.before-dupliko-merge',text)
      const updated=JSON.stringify(result.state);localStorage.setItem(KEY,updated);raw=updated
    }else raw=text
    state=result.state
  }
  try{read()}catch(e){error=e.message}
  function notice(message){const target=document.querySelector('#ms-dialog[open] .ms-error')||el('ms-toast');if(target)target.textContent=message}
  function commit(action){
    try{
      if(localStorage.getItem(KEY)!==raw){read();refresh();throw Error('Podaci su promijenjeni u drugoj kartici. Prikazan je novi zapis; ponovite radnju.')}
      const next=M.change(state,action),text=JSON.stringify(next);localStorage.setItem(KEY,text);state=next;raw=text;refresh();notice('✓ Sačuvano na ovom uređaju.');return true
    }catch(e){notice('Nije sačuvano: '+e.message);return false}
  }
  const options=(value,phase=false)=>Object.entries(M.statuses).filter(([k])=>!phase||k!=='ready').map(([key,v])=>`<option value="${key}" ${key===value?'selected':''}>${phase&&key==='done'?'Završeno':v.label}</option>`).join('')
  const badge=m=>`<span class="ms-badge" style="--status:${M.statuses[m.status].color}">${M.statuses[m.status].icon} ${M.statuses[m.status].label}</span>`
  function places(current){
    let html=''
    for(const h of state.halls)html+=`<optgroup label="${esc(h.name)}">${h.positions.map(p=>{const owner=state.modules.find(m=>m.place.kind==='hall'&&m.place.hallId===h.id&&m.place.positionId===p.id),key='hall:'+h.id+':'+p.id;return `<option value="${key}" ${owner&&owner.id!==current?.id?'disabled':''} ${current?.place.kind==='hall'&&current.place.hallId===h.id&&current.place.positionId===p.id?'selected':''}>Pozicija ${esc(p.label)}${owner?' · '+esc(owner.name):' · slobodna'}</option>`}).join('')}</optgroup>`
    html+=`<optgroup label="Van hale">${state.locations.map(l=>`<option value="external:${l.id}" ${current?.place.kind==='external'&&current.place.locationId===l.id?'selected':''}>${esc(l.name)}</option>`).join('')}</optgroup>`
    return html
  }
  function parsePlace(value){const [kind,id,positionId]=value.split(':');return kind==='hall'?{kind,hallId:id,positionId}:{kind,locationId:id}}
  function open(){
    try{read();error=''}catch(e){error=e.message}
    const content=el('content');if(!content)return
    document.querySelector('.shell')?.classList.remove('project-home')
    document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.id==='open-module-status'))
    if(el('breadcrumb'))el('breadcrumb').textContent='Status modula'
    if(error){content.innerHTML=`<section id="module-status"><h1>Status modula</h1><p role="alert">Spremište nije moguće otvoriti. Postojeći podaci nisu prepisani. ${esc(error)}</p></section>`;return}
    content.innerHTML=`<section id="module-status"><header class="ms-header"><div><p class="ms-eyebrow">TASKER / PROIZVODNJA</p><div class="ms-title-line"><h1>Status modula</h1><form id="ms-hall-name-form" data-hall-id="${esc(state.halls[0].id)}"><label>Naziv hale<input name="hallName" aria-label="Naziv hale" required maxlength="120" placeholder="npr. BAJKMONT / VERTIV" value="${esc(state.halls[0].name)}"></label><button class="ms-button" type="submit">Sačuvaj naziv</button></form></div><p>Raspored hale, proizvodne faze i kretanje svakog modula.</p></div><div class="ms-actions"><button class="ms-button" data-ms-action="location">+ Dodaj lokaciju</button><button class="ms-button primary" data-ms-action="add">+ Dodaj modul</button></div></header><p id="ms-toast" role="status">Podaci se čuvaju na ovom uređaju. Statusi su ručni; napredak se računa iz završenih faza.</p><div id="ms-stats" class="ms-stats"></div><div class="ms-workspace"><div class="ms-map-column"><div class="ms-map-head"><h2>Proizvodna hala</h2><div class="ms-actions" aria-label="Prikaz hale"><button type="button" class="ms-button" data-ms-view="top">Pogled odozgo</button><button type="button" class="ms-button" data-ms-view="inside">Pogled iz hale</button></div></div><p class="ms-hint">Klikni modul za detalje ili slobodnu poziciju za dodavanje. Na računalu možeš povući modul na slobodnu poziciju; na tabletu koristi Premjesti.</p><div id="ms-halls"></div><div class="ms-legend">${Object.entries(M.statuses).map(([k,s])=>`<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div><section class="ms-panel"><h2>DUPLIKO</h2><div id="ms-locations" class="ms-locations"></div><div id="ms-location-list"></div></section></div><aside id="ms-detail" class="ms-detail ms-panel" aria-label="Detalji modula"></aside></div><dialog id="ms-overview" class="ms-dialog ms-overview" aria-label="Pregled modula bez izmjena"></dialog><dialog id="ms-dialog" class="ms-dialog"></dialog><input id="ms-photo-file" type="file" accept="image/*" hidden></section>`
    el('ms-stats').insertAdjacentHTML('beforebegin','<div class="ms-actions" style="margin:16px 0"><label>Hale <select id="ms-hall-choice" aria-label="Odaberi halu"></select></label><button type="button" class="ms-button primary" data-ms-action="add-hall">+ Dodaj halu</button></div>')
    refresh()
    el('module-status').insertAdjacentHTML('afterbegin','<button type="button" class="ms-button ms-back" data-ms-back>← Projekti</button>')
    window.scrollTo({top:0,behavior:'instant'})
  }
  function refresh(){
    if(!el('ms-stats'))return
    stopDelivery()
    const hall=currentHall();activeHall=hall.id
    const s=M.stats({...state,modules:state.modules.filter(m=>m.place.kind==='hall'&&m.place.hallId===hall.id)})
    const choice=el('ms-hall-choice')
    if(choice)choice.innerHTML=state.halls.map(h=>`<option value="${esc(h.id)}" ${h.id===hall.id?'selected':''}>${esc(h.name)}</option>`).join('')
    const nameForm=el('ms-hall-name-form')
    if(nameForm){nameForm.dataset.hallId=hall.id;nameForm.elements.hallName.value=hall.name}
    const mapHeading=document.querySelector('#module-status .ms-map-head h2')
    if(mapHeading)mapHeading.textContent=hall.name
    const visibleLocations=state.locations.filter(l=>!['shipped','finished'].includes(l.id)&&!['bajkmontvertiv','vertivbajkmont'].includes(l.name.toLowerCase().replace(/[^a-z]/g,'')))
    if(locationFilter&&!visibleLocations.some(l=>l.id===locationFilter))locationFilter=''
    el('ms-stats').innerHTML=[['hall','◫','Modula u hali'],['active','⚙','U radu'],['waiting','◷','Čekaju materijal'],['ready','➜','Spremna za otpremu'],['completed','✓','Završena danas']].map(([key,icon,label])=>`<article class="ms-stat ms-${key}"><span>${icon}</span><div><b>${s[key]}</b><small>${label}</small></div></article>`).join('')
    el('ms-halls').innerHTML=[hall].map(h=>{
      const members=state.modules.filter(m=>m.place.kind==='hall'&&m.place.hallId===h.id),max=Math.max(12,...members.map(m=>m.length))
      const row=side=>h.positions.filter(p=>p.side===side).sort((a,b)=>b.order-a.order).map(p=>{
        const m=members.find(m=>m.place.positionId===p.id)
        return `<div class="ms-bay ${side}" data-ms-drop="${esc(p.id)}" data-ms-hall="${esc(h.id)}"><span class="ms-position">${esc(p.label)}</span>${m?`<button type="button" draggable="true" data-ms-module="${esc(m.id)}" class="ms-container ${selected===m.id?'selected':''}" aria-pressed="${selected===m.id}" style="--status:${M.statuses[m.status].color};height:${Math.max(58,Math.round(m.length/max*152))}px" title="${esc(m.name)} · ${m.length} m · ${M.statuses[m.status].label}"><span class="ms-frame" aria-hidden="true"></span><span class="ms-container-icon">${M.statuses[m.status].icon}</span><strong>${esc(m.name)}</strong><small>${M.progress(m)}% · ${m.length} m</small></button>`:`<button class="ms-free" data-ms-add-position="${esc(p.id)}" data-ms-hall="${esc(h.id)}" aria-label="Dodaj modul na poziciju ${esc(p.label)}"><span>+</span>Slobodno</button>`}</div>`
      }).join('')
      return `<div class="ms-map-scroll"><section class="ms-hall" aria-label="${esc(h.name)}"><div class="ms-gate"><span></span><b>ULAZ ↑</b><span></span></div><div class="ms-floor"><div class="ms-row">${row('left')}</div><div class="ms-safe-zone" aria-label="Radna zona"></div><div class="ms-aisle"><div class="ms-forklift-route" aria-hidden="true"><svg class="ms-forklift" viewBox="0 0 60 100" focusable="false"><defs><linearGradient id="ms-forklift-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff5ae" stop-opacity=".65"/><stop offset="1" stop-color="#fff5ae" stop-opacity="0"/></linearGradient><radialGradient id="ms-forklift-amber"><stop stop-color="#fff7bb" stop-opacity=".95"/><stop offset=".3" stop-color="#ffba35" stop-opacity=".8"/><stop offset="1" stop-color="#ff8a00" stop-opacity="0"/></radialGradient></defs><g class="ms-forklift-headlights"><path d="M17 39L-14 -56H44L23 39Z" fill="url(#ms-forklift-beam)"/><path d="M37 39L16 -56H74L43 39Z" fill="url(#ms-forklift-beam)"/></g><ellipse cx="31" cy="60" rx="25" ry="32" fill="#000" opacity=".28"/><path d="M17 29V3h5v26m16 0V3h5v26" fill="#bbc5cb" stroke="#394550" stroke-width="2"/><g class="ms-forklift-cargo"><rect x="13" y="5" width="34" height="20" rx="2" fill="#b98440" stroke="#543b21" stroke-width="2"/><path d="M15 10h30M15 19h30M22 6v18M38 6v18" stroke="#e7bc72" stroke-width="2"/></g><g fill="#111c25" stroke="#67717a"><rect x="5" y="34" width="10" height="21" rx="3"/><rect x="45" y="34" width="10" height="21" rx="3"/><rect x="7" y="72" width="9" height="17" rx="3"/><rect x="44" y="72" width="9" height="17" rx="3"/></g><rect x="14" y="30" width="32" height="59" rx="8" fill="#f2b529" stroke="#805714" stroke-width="2"/><path d="M18 76h24v9H18z" fill="#d68b14"/><rect x="15" y="30" width="30" height="7" rx="1" fill="#596771" stroke="#141e26" stroke-width="2"/><rect x="18" y="43" width="24" height="29" rx="3" fill="#183b4d" stroke="#0c1720" stroke-width="3"/><path d="M20 45l19 23M40 45L21 68" stroke="#8baab6" stroke-width="2"/><path d="M19 43v29M41 43v29" stroke="#c1cbd0" stroke-width="3"/><rect x="17" y="37" width="6" height="4" fill="#fff4b0"/><rect x="37" y="37" width="6" height="4" fill="#fff4b0"/><circle class="ms-forklift-beacon" cx="30" cy="77" r="17" fill="url(#ms-forklift-amber)"/><g class="ms-forklift-rotor"><path d="M30 77L-5 65Q-11 77-5 89Z" fill="url(#ms-forklift-amber)"/><path d="M30 77L65 65Q71 77 65 89Z" fill="url(#ms-forklift-amber)"/></g><circle cx="30" cy="77" r="4" fill="#ffb329" stroke="#fff3a0" stroke-width="1.5"/></svg></div><span>CENTRALNI PROLAZ</span><i>↑</i><b>${esc(h.name)}</b><i>↓</i></div><div class="ms-safe-zone" aria-label="Radna zona"></div><div class="ms-row">${row('right')}</div></div><div class="ms-gate"><span></span><b>VRATA / IZLAZ ↓</b><span></span></div></section></div>`
    }).join('')
    el('ms-locations').innerHTML=visibleLocations.map(l=>`<button class="ms-location ${locationFilter===l.id?'selected':''}" data-ms-location="${esc(l.id)}"><span>⌖</span><b>${esc(l.name)}</b><small>${state.modules.filter(m=>m.place.kind==='external'&&m.place.locationId===l.id).length} modula</small></button>`).join('')
    const loc=state.locations.find(l=>l.id===locationFilter),list=state.modules.filter(m=>m.place.kind==='external'&&m.place.locationId===locationFilter)
    el('ms-location-list').innerHTML=loc?`<h3>${esc(loc.name)}</h3>${list.map(m=>`<button class="ms-list-module ${selected===m.id?'selected':''}" data-ms-module="${esc(m.id)}"><strong>${esc(m.name)}</strong>${badge(m)}<span>${M.progress(m)}%</span></button>`).join('')||'<p class="ms-hint">Nema modula na ovoj lokaciji.</p>'}`:''
    document.querySelectorAll('[data-ms-view]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.msView===hallView));b.classList.toggle('primary',b.dataset.msView===hallView)})
    if(hallView==='inside')el('ms-halls').innerHTML=insideHallHTML(hall)
    renderDetail()
    if(hallView==='inside')startInsideMotion();else startDelivery()
  }

  function insideHallHTML(h){
    const project=(x,y,z)=>{const s=700/(700+z);return [450+x*s,190+(390-y)*s]}
    const points=vertices=>vertices.map(v=>project(...v).join(',')).join(' ')
    const poly=(v,fill,stroke='#8295a1')=>`<polygon points="${points(v)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
    const line=(a,b,color='#738693')=>`<polyline points="${points([a,b])}" fill="none" stroke="${color}" stroke-width="2"/>`
    const label=(x,y,z,text,size=16)=>{const p=project(x,y,z);return `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" fill="#eff8ff" font-size="${size}" font-weight="700" paint-order="stroke" stroke="#102333" stroke-width="3">${esc(text)}</text>`}
    let scene=poly([[-440,0,0],[440,0,0],[440,0,2400],[-440,0,2400]],'#364650')
      +poly([[-440,0,0],[-440,320,0],[-440,320,2400],[-440,0,2400]],'#253c4b')
      +poly([[440,0,0],[440,320,0],[440,320,2400],[440,0,2400]],'#253c4b')
      +poly([[-440,320,0],[440,320,0],[440,320,2400],[-440,320,2400]],'#152b3b')
      +poly([[-440,0,2400],[440,0,2400],[440,320,2400],[-440,320,2400]],'#344e5e')
      +poly([[-100,0,2390],[100,0,2390],[100,180,2390],[-100,180,2390]],'#708891')
      +label(0,200,2390,'VRATA / IZLAZ',12)
    for(let z=0;z<=2400;z+=300){
      scene+=line([-440,0,z],[-440,320,z])+line([440,0,z],[440,320,z])+line([-440,320,z],[440,320,z])
      scene+=line([-250,305,z],[250,305,z],'#c9f2ff')
      scene+=line([-440,0,z],[440,0,z],'#60717a')
    }
    for(const x of [-155,155])scene+=line([x,1,0],[x,1,2400],'#ffd454')
    const positions=[...h.positions].sort((a,b)=>a.order-b.order)
    const maxOrder=Math.max(1,...positions.map(p=>p.order))
    for(const p of positions){
      const m=state.modules.find(m=>m.place.kind==='hall'&&m.place.hallId===h.id&&m.place.positionId===p.id)
      const z=100+(maxOrder-p.order)*360,x=p.side==='left'?-385:195,w=Math.min(175,m?m.width*48:150),height=m?Math.min(220,m.height*48):0,len=m?Math.min(320,Math.max(90,m.length*24)):270
      const attrs=m?`data-ms-module="${esc(m.id)}" aria-label="${esc(m.name)} · ${esc(M.statuses[m.status].label)}"`:`data-ms-add-position="${esc(p.id)}" data-ms-hall="${esc(h.id)}" aria-label="Dodaj modul na poziciju ${esc(p.label)}"`
      scene+=`<g role="button" tabindex="0" ${attrs} class="ms-inside-module">`
      if(m){
        const c=M.statuses[m.status].color,stroke=selected===m.id?'#b7f8ff':'#9dadb5'
        scene+=poly([[x,0,z],[x+w,0,z],[x+w,height,z],[x,height,z]],c,stroke)
        scene+=poly([[x+w,0,z],[x+w,0,z+len],[x+w,height,z+len],[x+w,height,z]],c,stroke)
        scene+=poly([[x,0,z],[x,0,z+len],[x,height,z+len],[x,height,z]],c,stroke)
        scene+=poly([[x,height,z],[x+w,height,z],[x+w,height,z+len],[x,height,z+len]],'#607b8e',stroke)
        for(let i=1;i<6;i++)scene+=line([x+w*i/6,0,z],[x+w*i/6,height,z],'#b6c9d077')
        scene+=label(x+w/2,height*.55,z-1,m.name,Math.max(10,18*700/(700+z)))
        scene+=label(x+w/2,height*.26,z-1,M.progress(m)+'%',11)
      }else scene+=poly([[x,1,z],[x+w,1,z],[x+w,1,z+len],[x,1,z+len]],'#243b4988','#7b929d')
      scene+=label(x+w/2,5,z-30,p.label+(m?'':' · Slobodno'),12)+'</g>'
    }
    scene+='<g id="ms-inside-trucks" aria-hidden="true"></g>'
    return `<section class="ms-inside"><div class="ms-inside-caption">ULAZ · pogled prema izlazu <small>Klikni modul za detalje</small></div><svg viewBox="0 180 900 440" role="group" aria-label="Pogled iz hale ${esc(h.name)}">${scene}</svg><p class="ms-hint">Fiksni perspektivni prikaz · Za prevlačenje modula koristi pogled odozgo.</p></section>`
  }
  function startInsideMotion(){
    const host=el('ms-inside-trucks');if(!host)return
    let frame=0,stopped=false;const begin=performance.now(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const draw=now=>{
      if(stopped||!host.isConnected)return
      host.innerHTML=[0,1].map(i=>{
        const phase=((now-begin)/(i?30000:26000))%1,z=phase*2400,s=700/(700+z),x=450+(i?85:-85)*s,y=190+390*s
        return `<g transform="translate(${x} ${y}) scale(${s*(i?1.18:1)})"><path d="M-15 0L-38 -105H38L15 0" fill="#f4fbff" opacity=".14"/><rect x="-22" y="-38" width="44" height="33" rx="5" fill="#e5aa27" stroke="#172935" stroke-width="3"/><rect x="-17" y="-72" width="34" height="37" fill="#15394e" stroke="#a5bfcd" stroke-width="3"/><rect x="-28" y="-19" width="10" height="24" fill="#101b23"/><rect x="18" y="-19" width="10" height="24" fill="#101b23"/><rect x="-20" y="-7" width="40" height="12" fill="${i?'#9bafbd':'#b88b48'}" stroke="#e3d4af"/><circle cy="-78" r="7" fill="${i?['#59adff','#ffd24b','#ff685e'][Math.floor(now/700)%3]:'#ffc743'}" style="filter:drop-shadow(0 0 8px #fff0aa)"/></g>`
      }).join('')
      if(!reduced)frame=requestAnimationFrame(draw)
    }
    draw(begin);stopDelivery=()=>{stopped=true;cancelAnimationFrame(frame)}
  }

  function startDelivery(){
    const floor=document.querySelector('#ms-halls .ms-floor'),aisle=floor?.querySelector('.ms-aisle')
    let truck=floor?.querySelector('.ms-forklift')
    if(!truck||!aisle||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const bays=[...floor.querySelectorAll('.ms-bay')].filter(b=>b.querySelector('[data-ms-module]'))
    if(!bays.length){truck.style.display='none';return}
    const small=truck,heavy=truck.cloneNode(true)
    heavy.classList.add('ms-forklift-heavy')
    heavy.innerHTML=heavy.innerHTML.replaceAll('ms-forklift-beam','ms-heavy-beam').replaceAll('ms-forklift-amber','ms-heavy-amber').replaceAll('#fff5ae','#ffffff').replace('stop-opacity=".65"','stop-opacity=".95"').replaceAll('L-14 -56H44','L-32 -96H54').replaceAll('L16 -56H74','L6 -96H92')
    small.parentElement.append(heavy)
    const fleet=[small,heavy];fleet.forEach(t=>{t.style.animation='none';t.style.opacity='0'})
    let stopped=false
    const pallets=[],animations=new Set()
    stopDelivery=()=>{stopped=true;animations.forEach(a=>a.cancel());pallets.forEach(p=>p.remove());heavy.remove();small.style.opacity='0'}
    small.parentElement.style.inset='0'
    const alive=()=>!stopped&&small.isConnected
    const pose=(x,y,a)=>({left:x+'px',top:y+'px',transform:`translate(-50%,-50%) rotate(${a}deg)`})
    async function animate(node,frames,options){
      if(!alive())return false
      const animation=node.animate(frames,options);animations.add(animation)
      try{await animation.finished;return alive()}catch{return false}
      finally{animations.delete(animation);animation.cancel()}
    }
    async function run(truck,index){
      const left=index===0,cargo=truck.querySelector('.ms-forklift-cargo')
      // Disjoint lanes and service zones: neither vehicle crosses the centre line.
      const lane=()=>aisle.clientWidth*(left?.22:.78)
      let x=lane(),y=-150,angle=180
      const targets=bays.filter(b=>b.classList.contains('left')===left).map(bay=>{
        const pallet=document.createElement('div');pallet.className='ms-delivered-pallet'+(index?' ms-pallet-heavy':'');pallet.setAttribute('aria-hidden','true');floor.append(pallet);pallets.push(pallet)
        return {bay,pallet}
      })
      async function travel(nx,ny,na,duration){
        const end=pose(nx,ny,na)
        if(!await animate(truck,[pose(x,y,angle),end],{duration:duration??Math.max(500,Math.hypot(nx-x,ny-y)/(index?70:80)*1000),easing:'ease-in-out',fill:'forwards'}))return false
        Object.assign(truck.style,end);x=nx;y=ny;angle=na;return true
      }
      while(alive())for(const collecting of [false,true])for(const target of (targets.length?targets:[null])){
        if(!alive())return
        x=lane();y=-150;angle=180;Object.assign(truck.style,pose(x,y,angle));truck.style.opacity='1'
        if(cargo)cargo.style.opacity=target&&!collecting?'1':'0'
        if(target){
          const {bay,pallet}=target,ar=aisle.getBoundingClientRect(),br=bay.getBoundingClientRect(),fr=floor.getBoundingClientRect()
          const ty=br.top+br.height/2-ar.top,edge=left?25:ar.width-25,turn=left?270:90
          if(!await travel(lane(),ty,180)||!await travel(lane(),ty,turn,450)||!await travel(edge,ty,turn,900))return
          const px=left?br.right-fr.left-18:br.left-fr.left+18,py=br.top-fr.top+br.height/2
          pallet.style.left=px+'px';pallet.style.top=py+'px';pallet.style.opacity='1'
          const dx=ar.left+edge-fr.left-px+(left?-28:28),dy=ar.top+ty-fr.top-py
          const onFork={transform:`translate(-50%,-50%) translate(${dx}px,${dy}px)`,opacity:.5},onFloor={transform:'translate(-50%,-50%)',opacity:1}
          if(cargo)cargo.style.opacity='0'
          if(!await animate(pallet,collecting?[onFloor,onFork]:[onFork,onFloor],{duration:850,easing:'ease-in-out'}))return
          pallet.style.opacity=collecting?'0':'1';if(cargo)cargo.style.opacity=collecting?'1':'0'
          if(!await travel(lane(),ty,turn,800)||!await travel(lane(),ty,180,450))return
        }
        if(!await travel(lane(),aisle.clientHeight+150,180))return
        truck.style.opacity='0'
        if(!await animate(truck,[{opacity:0},{opacity:0}],{duration:900}))return
      }
    }
    Promise.all(fleet.map(run)).catch(()=>stopDelivery())
  }

  function remainingHTML(m,editable=false){
    const pending=M.unfinished(m)
    return '<section class="ms-remaining"><h2>'+esc(m.name)+'</h2><h3>Aktuelni zapis preostalih radova</h3>'+
      (pending.length?'<ol>'+pending.map(p=>'<li><b>'+esc(p.name)+'</b></li>').join('')+'</ol>':'<p>Svi radovi su završeni.</p>')+
      (editable?'<button type="button" class="ms-button" data-ms-action="remaining">Uredi / dodaj preostale radove</button>':'')+'</section>'
  }
  const phaseDate=p=>p.completedOn||M.today(new Date(p.completedAt))
  function remainingDialog(){
    const m=state.modules.find(m=>m.id===selected);if(!m)return
    const d=el('ms-dialog')
    d.innerHTML=`<form id="ms-remaining-form" data-id="${esc(m.id)}"><h2>Preostali radovi · ${esc(m.name)}</h2><p>Svaki novi rad postaje faza. Kada ga dole označite kao Završeno, automatski nestaje iz preostalih radova.</p>${M.unfinished(m).map(p=>`<label style="display:grid;margin:10px 0">Naziv rada<input data-remaining-phase="${esc(p.id)}" required maxlength="120" value="${esc(p.name)}"></label>`).join('')}<label style="display:grid;margin:12px 0">Dodaj nove radove — svaki u novom redu<textarea name="newWorks" rows="4" placeholder="Novi rad…"></textarea></label><p class="ms-error" role="alert"></p><div class="ms-actions"><button type="button" class="ms-button" data-ms-cancel>Odustani</button><button type="submit" class="ms-button primary">Sačuvaj radove</button></div></form>`
    d.showModal()
  }
  const eventDate=e=>e.occurredOn||M.today(new Date(e.at))
  function datesDialog(){
    const m=state.modules.find(m=>m.id===selected);if(!m)return
    const d=el('ms-dialog')
    d.innerHTML='<form id="ms-dates-form" data-id="'+esc(m.id)+'"><h2>Datumi modula</h2><p>Ovdje mijenjaš stvarne datume rada. Vrijeme unosa i svaka ispravka ostaju u istoriji.</p>'+
      [['arrival','Datum dolaska'],['departure','Datum odlaska iz hale'],['dispatch','Planirana otprema']].map(([key,label])=>'<label>'+label+'<input type="date" name="'+key+'" value="'+esc(m[key]||'')+'" '+(key==='arrival'?'required':'')+'></label>').join('')+
      '<p class="ms-error" role="alert"></p><div class="ms-actions"><button type="button" class="ms-button" data-ms-cancel>Odustani</button><button class="ms-button primary">Sačuvaj datume</button></div></form>'
    d.showModal()
  }
  function overview(){
    const m=state.modules.find(m=>m.id===selected);if(!m)return
    const d=el('ms-overview')
    d.innerHTML='<div class="ms-actions ms-shot-tools"><button class="ms-button primary" data-ms-screenshot>Snimi dio pregleda</button></div><div id="ms-overview-content"><header class="ms-detail-title"><div><small>SAMO PREGLED · BEZ IZMJENA</small><h2>'+esc(m.name)+'</h2></div><button class="ms-icon-button" data-ms-overview-close aria-label="Zatvori pregled">×</button></header>'+badge(m)+
      (m.photo?'<img class="ms-overview-photo" src="'+m.photo+'" alt="Fotografija modula">':'')+
      '<dl class="ms-data"><div><dt>Trenutna lokacija / pozicija</dt><dd>'+esc(M.locationName(state,m.place))+'</dd></div><div><dt>Tip</dt><dd>'+m.type+'</dd></div><div><dt>Dimenzije D × Š × V</dt><dd>'+m.length+' × '+m.width+' × '+m.height+' m</dd></div><div><dt>Datum ulaska</dt><dd>'+date(m.arrival)+'</dd></div><div><dt>Datum odlaska iz hale</dt><dd>'+date(m.departure)+'</dd></div><div><dt>Planirana otprema</dt><dd>'+date(m.dispatch)+'</dd></div><div><dt>Napredak</dt><dd>'+M.progress(m)+'%</dd></div></dl>'+
      (m.note?'<p class="ms-note">'+esc(m.note)+'</p>':'')+remainingHTML(m)+
      '<h3>Sve proizvodne faze</h3><ol class="ms-read-phases">'+m.phases.map(p=>'<li><b>'+esc(p.name)+'</b><span>'+esc(p.status==='done'?'Završeno':M.statuses[p.status].label)+'</span>'+(p.completedAt?'<small>Datum završetka: '+date(phaseDate(p))+'</small>':'')+'</li>').join('')+'</ol>'+
      '</div><button class="ms-button" data-ms-overview-close>Zatvori pregled</button>'
    d.showModal()
  }
  function transferFields(){
    const f=el('ms-edit-form');if(!f)return
    const target=f.querySelector('[name="place"]'),group=f.querySelector('.ms-transfer-fields')
    if(!target||!group)return
    const needed=target.value==='external:dupliko'
    group.hidden=!needed
    const m=state.modules.find(m=>m.id===f.dataset.id)
    const required=needed&&(!m||M.unfinished(m).length>0)
    group.querySelectorAll('textarea,input').forEach(input=>{input.disabled=!needed;input.required=required})
  }
  function renderDetail(){
    const box=el('ms-detail'),m=state.modules.find(m=>m.id===selected)
    if(!m){box.innerHTML='<div class="ms-empty"><span>◫</span><h2>Detalji modula</h2><p>Odaberi modul na mapi ili u lokacijama van hale.</p><button class="ms-button primary" data-ms-action="add">+ Dodaj prvi modul</button></div>';return}
    const old=box.querySelector('.ms-phases')?.scrollTop||0,progress=M.progress(m)
    box.innerHTML=`<header class="ms-detail-title"><div><small>ODABRANI MODUL</small><h2>${esc(m.name)}</h2></div><button class="ms-icon-button" data-ms-action="close" aria-label="Zatvori detalje">×</button></header>${badge(m)}<div class="ms-photo">${m.photo?`<img src="${m.photo}" alt="Fotografija ${esc(m.name)}">`:'<div class="ms-steel-preview" aria-hidden="true"><i></i><i></i><i></i></div><small>Nema fotografije modula</small>'}</div><div class="ms-actions"><button class="ms-link" data-ms-action="photo">${m.photo?'Zamijeni':'Dodaj'} fotografiju</button>${m.photo?'<button class="ms-link" data-ms-action="remove-photo">Ukloni fotografiju</button>':''}</div><dl class="ms-data"><div><dt>Tip</dt><dd>${m.type}</dd></div><div><dt>Pozicija u hali</dt><dd>${m.place.kind==='hall'?esc(state.halls.find(h=>h.id===m.place.hallId).positions.find(p=>p.id===m.place.positionId).label):'—'}</dd></div><div><dt>Datum ulaska</dt><dd>${date(m.arrival)}</dd></div><div><dt>Datum odlaska iz hale</dt><dd>${date(m.departure)}</dd></div><div><dt>Planirana otprema</dt><dd>${date(m.dispatch)}</dd></div><div><dt>Trenutna lokacija</dt><dd>${esc(M.locationName(state,m.place))}</dd></div><div><dt>Dimenzije D × Š × V</dt><dd>${m.length} × ${m.width} × ${m.height} m</dd></div></dl><label class="ms-status-label">Status modula<select data-ms-status="${esc(m.id)}">${options(m.status)}</select></label><div class="ms-progress-label"><b>Ukupan napredak</b><strong>${progress}%</strong></div><div class="ms-progress" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Napredak modula"><i style="width:${progress}%"></i></div><p class="ms-hint">${m.phases.filter(p=>p.status==='done').length} / ${m.phases.length} završenih faza</p>${m.note?`<p class="ms-note">${esc(m.note)}</p>`:''}<h3>Faze izrade</h3><div class="ms-phases">${m.phases.map((p,i)=>`<div class="ms-phase"><span class="ms-phase-number">${i+1}</span><div><b>${esc(p.name)}</b><select aria-label="Status faze ${esc(p.name)}" data-ms-phase="${esc(p.id)}">${options(p.status,true)}</select>${p.completedAt?`<label class="ms-phase-date">Datum završetka<input type="date" data-ms-phase-date="${esc(p.id)}" value="${phaseDate(p)}" required></label><small>Zabilježeno: ${time(p.completedAt)}</small>`:''}</div><div class="ms-phase-tools"><button data-ms-phase-up="${esc(p.id)}" ${i===0?'disabled':''} aria-label="Pomakni fazu gore">↑</button><button data-ms-phase-down="${esc(p.id)}" ${i===m.phases.length-1?'disabled':''} aria-label="Pomakni fazu dolje">↓</button><button data-ms-phase-delete="${esc(p.id)}" aria-label="Obriši fazu ${esc(p.name)}">×</button></div></div>`).join('')||'<p>Nema faza. Dodaj prvu fazu ispod.</p>'}</div><form id="ms-phase-form" class="ms-actions"><input name="phase" placeholder="Nova faza…" aria-label="Naziv nove faze" required maxlength="120"><button class="ms-button" type="submit">+ Dodaj</button></form><div class="ms-detail-actions"><button class="ms-button" data-ms-action="edit">Uredi</button><button class="ms-button" data-ms-action="move">Premjesti</button><button class="ms-button primary" data-ms-action="finish" ${m.status==='done'&&m.place.kind==='external'&&m.place.locationId==='finished'?'disabled':''}>✓ Završi modul</button></div>`
    box.querySelector('h3').insertAdjacentHTML('beforebegin','<div class="ms-actions"><button class="ms-button" data-ms-action="overview">Pregled bez izmjena</button><button class="ms-button" data-ms-action="dates">Uredi datume</button></div>'+remainingHTML(m,true))
    box.querySelector('.ms-phases').scrollTop=old
    box.querySelector('.ms-data').insertAdjacentHTML('afterend','<button type="button" class="ms-button" data-ms-action="dimensions">Podešavanja</button>')
  }
  function dimensionsDialog(){
    const m=state.modules.find(m=>m.id===selected);if(!m)return
    const d=el('ms-dialog')
    d.innerHTML=`<form id="ms-dimensions-form" data-id="${esc(m.id)}"><h2>Podešavanja · ${esc(m.name)}</h2><p>Izmenite dimenzije i datume modula.</p><div class="ms-form-grid">${[['length','Dužina'],['width','Širina'],['height','Visina']].map(([key,label])=>`<label>${label} (m)<input name="${key}" type="number" min="0.1" max="100" step="0.01" required value="${m[key]}"></label>`).join('')}${[['arrival','Datum ulaska u halu'],['departure','Datum izlaska iz hale']].map(([key,label])=>`<label>${label}<input name="${key}" type="date" ${key==='arrival'?'required':''} value="${esc(m[key]||'')}"></label>`).join('')}</div><p class="ms-error" role="alert"></p><div class="ms-actions"><button type="button" class="ms-button" onclick="this.closest('dialog').close()">Odustani</button><button type="submit" class="ms-button primary">Sačuvaj podešavanja</button></div></form>`
    d.showModal();d.querySelector('input').focus()
  }
  function addHallDialog(){
    const d=el('ms-dialog')
    d.innerHTML='<form id="ms-add-hall-form"><h2>Dodaj novu halu</h2><label>Naziv hale<input name="name" required maxlength="120" placeholder="npr. MONTING / VERTIV"></label><p>Nova hala će biti prazna, sa 10 slobodnih pozicija. Postojeći moduli ostaju u svojoj hali.</p><p class="ms-error" role="alert"></p><div class="ms-actions"><button type="button" class="ms-button" data-ms-cancel>Odustani</button><button type="submit" class="ms-button primary">Dodaj halu</button></div></form>'
    d.showModal();d.querySelector('input').focus()
  }
  function dialog(kind,place){
    const d=el('ms-dialog'),m=state.modules.find(m=>m.id===selected),editing=kind==='edit'
    let body=''
    if(kind==='add'||editing){
      if(editing&&!m)return
      body=`<h2>${editing?'Uredi modul':'Dodaj modul'}</h2><div class="ms-form-grid"><label>Naziv modula<input name="name" required maxlength="120" placeholder="MV-12" value="${esc(editing?m.name:'')}"></label><label>Tip<select name="type"><option value="MV">MV</option><option value="MVS" ${editing&&m.type==='MVS'?'selected':''}>MVS</option></select></label>${[['length','Dužina',12],['width','Širina',3],['height','Visina',3.2]].map(([key,label,value])=>`<label>${label} (m)<input name="${key}" type="number" min="0.1" max="100" step="0.01" required value="${editing?m[key]:value}"></label>`).join('')}<label>Status<select name="status">${options(editing?m.status:'new')}</select></label><label>Datum ulaska<input type="date" name="arrival" required value="${editing?m.arrival:M.today()}"></label><label>Planirana otprema<input type="date" name="dispatch" value="${editing?m.dispatch:''}"></label>${editing?'':`<label class="ms-span">Pozicija / lokacija<select name="place" required>${places(null)}</select></label>`}<label class="ms-span">Napomena<textarea name="note" rows="3" maxlength="4000">${esc(editing?m.note:'')}</textarea></label></div>`
    }else if(kind==='move'){if(!m)return;body=`<h2>Premjesti ${esc(m.name)}</h2><p>Trenutno: ${esc(M.locationName(state,m.place))}</p><label>Nova pozicija / lokacija<select name="place" required>${places(m)}</select></label><p>Stara pozicija se oslobađa. Faze, fotografija i istorija ostaju sačuvane.</p>`}
    else body='<h2>Dodaj lokaciju</h2><label>Naziv lokacije<input name="name" required maxlength="120" placeholder="Naziv nove lokacije"></label>'
    if(kind==='add'||kind==='move')body+='<div class="ms-transfer-fields" hidden><h3>Preostali radovi za DUPLIKO</h3><p>Nezavršen modul može napustiti halu. Obavezno zapišite šta i koliko je ostalo; faze se neće označiti kao završene.</p><label>Šta je ostalo da se odradi<textarea name="remainingWork" rows="3" maxlength="4000" placeholder="npr. Unutarnji opšavi, silikoniranje…"></textarea></label><label>Koliko / količina / obim<input name="remainingQuantity" maxlength="1000" placeholder="npr. 6 opšava i 12 m spojeva"></label></div>'
    d.innerHTML=`<form id="ms-edit-form" data-kind="${kind}" data-id="${editing||kind==='move'?esc(m.id):''}">${body}<p class="ms-error" role="alert"></p><div class="ms-actions"><button type="button" class="ms-button" data-ms-cancel>Odustani</button><button class="ms-button primary" type="submit">${kind==='move'?'Premjesti':'Sačuvaj'}</button></div></form>`
    if(kind==='add'&&!place){const h=currentHall(),p=h.positions.find(p=>!state.modules.some(m=>m.place.kind==='hall'&&m.place.hallId===h.id&&m.place.positionId===p.id));if(p)place={hallId:h.id,positionId:p.id};else d.querySelector('[name="place"]').selectedIndex=-1}
    if(place&&d.querySelector('[name="place"]'))d.querySelector('[name="place"]').value='hall:'+place.hallId+':'+place.positionId
    transferFields();d.showModal();d.querySelector('input,select')?.focus()
  }
  let pendingAction=null
  function ask(message,action){
    pendingAction=action
    const d=el('ms-dialog')
    d.innerHTML=`<h2>Potvrdi radnju</h2><p>${esc(message)}</p><p class="ms-error" role="alert"></p><div class="ms-actions"><button class="ms-button" data-ms-cancel>Odustani</button><button class="ms-button primary" data-ms-confirm>Potvrdi</button></div>`
    d.showModal()
  }
  document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.ms-inside-module')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}})
  window.addEventListener('click',event=>{
    const t=event.target
    if(t.closest('#open-module-status')||t.closest('#module-status-card')){event.preventDefault();event.stopImmediatePropagation();open();return}
    if(!t.closest('#module-status'))return
    if(t.closest('[data-ms-back]')){event.preventDefault();event.stopImmediatePropagation();el('back-to-projects')?.click();return}
    let b
    if((b=t.closest('[data-ms-view]'))){hallView=b.dataset.msView;refresh();return}
    if(t.closest('[data-ms-screenshot]')){window.TaskerModuleSnapshot?.open(el('ms-overview-content'),state.modules.find(m=>m.id===selected)?.name||'Modul');return}
    if(t.closest('[data-ms-overview-close]')){el('ms-overview').close();return}
    if(t.closest('[data-ms-cancel]')){el('ms-dialog').close();return}
    if(t.closest('[data-ms-confirm]')){if(pendingAction&&commit(pendingAction)){if(pendingAction.type==='finish')locationFilter='finished';pendingAction=null;el('ms-dialog').close();refresh()}return}
    if((b=t.closest('[data-ms-module]'))){selected=b.dataset.msModule;refresh();overview();return}
    if((b=t.closest('[data-ms-add-position]'))){dialog('add',{hallId:b.dataset.msHall,positionId:b.dataset.msAddPosition});return}
    if((b=t.closest('[data-ms-location]'))){locationFilter=b.dataset.msLocation;refresh();return}
    if((b=t.closest('[data-ms-phase-up]')))commit({type:'reorder-phase',id:selected,phaseId:b.dataset.msPhaseUp,delta:-1})
    if((b=t.closest('[data-ms-phase-down]')))commit({type:'reorder-phase',id:selected,phaseId:b.dataset.msPhaseDown,delta:1})
    if((b=t.closest('[data-ms-phase-delete]'))){const p=state.modules.find(m=>m.id===selected)?.phases.find(p=>p.id===b.dataset.msPhaseDelete);if(p)ask('Obrisati fazu „'+p.name+'”? Napredak će se ponovno izračunati.',{type:'delete-phase',id:selected,phaseId:p.id});return}
    if((b=t.closest('[data-ms-action]'))){const action=b.dataset.msAction
      if(['add','edit','move','location'].includes(action))dialog(action)
      if(action==='overview')overview()
      if(action==='dates')datesDialog()
      if(action==='dimensions')dimensionsDialog()
      if(action==='remaining')remainingDialog()
      if(action==='add-hall')addHallDialog()
      if(action==='close'){selected='';refresh()}
      if(action==='finish')ask('Završiti modul, označiti sve njegove faze završenima i premjestiti ga u Završeni? Pozicija u hali bit će slobodna.',{type:'finish',id:selected})
      if(action==='photo'){el('ms-photo-file').dataset.moduleId=selected;el('ms-photo-file').click()}
      if(action==='remove-photo')ask('Ukloniti fotografiju ovog modula?',{type:'photo',id:selected,value:''})
    }
  },true)
  document.addEventListener('submit',event=>{
    const form=event.target;if(!form.closest('#module-status'))return
    event.preventDefault();const values=Object.fromEntries(new FormData(form))
    if(form.id==='ms-remaining-form'){
      const phases=[...form.querySelectorAll('[data-remaining-phase]')].map(n=>({id:n.dataset.remainingPhase,name:n.value}))
      const additions=values.newWorks.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(name=>({id:uid(),name}))
      const notes=state.modules.find(m=>m.id===form.dataset.id)?.remainingNotes||{}
      if(commit({type:'remaining-edit',id:form.dataset.id,phases,additions,work:notes.work||'',quantity:notes.quantity||''}))el('ms-dialog').close()
      return
    }
    if(form.id==='ms-add-hall-form'){const hallId=uid();if(commit({type:'add-hall',hallId,name:values.name})){activeHall=hallId;selected='';locationFilter='';el('ms-dialog').close();refresh()}return}
    if(form.id==='ms-hall-name-form'){commit({type:'hall-name',hallId:form.dataset.hallId,name:values.hallName});return}
    if(form.id==='ms-dates-form'){if(commit({type:'dates',id:form.dataset.id,...values}))el('ms-dialog').close();return}
    if(form.id==='ms-dimensions-form'){if(commit({type:'edit',id:form.dataset.id,data:values}))el('ms-dialog').close();return}
    if(form.id==='ms-phase-form'){if(commit({type:'add-phase',id:selected,phaseId:uid(),name:values.phase}))form.reset();return}
    if(form.id!=='ms-edit-form')return
    const kind=form.dataset.kind,id=form.dataset.id||uid()
    let action
    if(kind==='location')action={type:'add-location',locationId:uid(),name:values.name}
    else if(kind==='move')action={type:'move',id,place:parsePlace(values.place),remainingWork:values.remainingWork,remainingQuantity:values.remainingQuantity}
    else action={type:kind==='edit'?'edit':'create',id,data:{...values,...(kind==='add'?{place:parsePlace(values.place)}:{})}}
    if(commit(action)){if(kind==='add')selected=id;el('ms-dialog').close();refresh();if(kind==='add')overview()}
  })
  document.addEventListener('change',event=>{
    const t=event.target;if(!t.closest('#module-status'))return
    if(t.id==='ms-hall-choice'){activeHall=t.value;selected='';locationFilter='';refresh();return}
    if(t.matches('#ms-edit-form [name="place"]'))transferFields()
    if(t.dataset.msPhaseDate){commit({type:'phase-date',id:selected,phaseId:t.dataset.msPhaseDate,value:t.value});return}
    if(t.dataset.msEventDate!==undefined){commit({type:'event-date',id:selected,index:Number(t.dataset.msEventDate),value:t.value});return}
    if(t.dataset.msStatus)commit({type:'status',id:t.dataset.msStatus,value:t.value})
    if(t.dataset.msPhase)commit({type:'phase',id:selected,phaseId:t.dataset.msPhase,value:t.value})
    if(t.id==='ms-photo-file'&&t.files?.[0]){
      const file=t.files[0],id=t.dataset.moduleId,url=URL.createObjectURL(file),img=new Image()
      notice('Pripremam fotografiju…')
      img.onload=()=>{try{const scale=Math.min(1,800/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);commit({type:'photo',id,value:canvas.toDataURL('image/jpeg',.72)})}catch(e){notice('Fotografija nije spremljena: '+e.message)}finally{URL.revokeObjectURL(url);t.value=''}}
      img.onerror=()=>{URL.revokeObjectURL(url);t.value='';notice('Uređaj ne može otvoriti taj format slike. Odaberite JPG, PNG ili WebP.')};img.src=url
    }
  })
  document.addEventListener('dragstart',event=>{const b=event.target.closest('#module-status [data-ms-module][draggable]');if(!b)return;dragged=b.dataset.msModule;event.dataTransfer.setData('text/plain',dragged);event.dataTransfer.effectAllowed='move'})
  document.addEventListener('dragover',event=>{if(dragged&&event.target.closest('#module-status [data-ms-drop]')){event.preventDefault();event.dataTransfer.dropEffect='move'}})
  document.addEventListener('drop',event=>{const bay=event.target.closest('#module-status [data-ms-drop]');if(!bay||!dragged)return;event.preventDefault();const id=dragged;dragged='';if(commit({type:'move',id,place:{kind:'hall',hallId:bay.dataset.msHall,positionId:bay.dataset.msDrop}})){selected=id;refresh()}})
  document.addEventListener('dragend',()=>{dragged=''})
  window.addEventListener('storage',event=>{if(event.key!==KEY)return;try{read();if(!el('ms-dialog')?.open)refresh();notice('Evidencija je osvježena iz druge kartice.')}catch(e){notice(e.message)}})
  function install(){
    for(const node of document.querySelectorAll('#open-module-status,#module-status-card'))node.onclick=event=>{event.preventDefault();event.stopImmediatePropagation();open()}
    const nav=document.querySelector('.sidebar nav')
    if(nav&&!el('open-module-status')){const b=document.createElement('button');b.id='open-module-status';b.className='nav-link';b.type='button';b.dataset.page='module-status';b.innerHTML='<span>◫</span> Status modula';nav.append(b)}
    const grid=document.querySelector('#content .project-grid')
    if(grid&&!el('module-status-card'))grid.insertAdjacentHTML('beforeend','<button type="button" class="project-card" id="module-status-card"><div class="project-card-top"><span class="project-symbol">◫</span><span class="project-status">PROIZVODNJA</span></div><p class="project-label">ZASEBNA EVIDENCIJA</p><h2>Status modula</h2><p class="project-description">Interaktivna hala, proizvodne faze, lokacije i istorija modula.</p><div class="project-card-footer"><span>MV · MVS</span><strong>Otvori halu →</strong></div></button>')
  }
  new MutationObserver(install).observe(el('app')||document.body,{childList:true,subtree:true});install()
})()

