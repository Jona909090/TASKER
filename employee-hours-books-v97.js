(function(root){
  'use strict'
  const clone=s=>JSON.parse(JSON.stringify(s))
  function records(s){
    const base=clone(s);delete base.hourBooks
    return [{id:'base',state:base},...(s.hourBooks||[]).map(clone)]
  }
  function validate(s,M){
    M.validate(s)
    const ids=new Set(['base'])
    if(s.hourBooks!==undefined&&!Array.isArray(s.hourBooks))throw Error('Neispravan popis gradilišta.')
    for(const b of s.hourBooks||[]){if(!b.id||ids.has(b.id)||!b.start||!/^\d{4}-\d{2}-\d{2}$/.test(b.start))throw Error('Neispravno gradilište.');ids.add(b.id);M.validate(b.state)}
    return s
  }
  function save(s,id,state){
    const n=clone(s)
    if(id==='base'){const books=n.hourBooks;Object.assign(n,clone(state));if(books)n.hourBooks=books}
    else{const b=n.hourBooks?.find(x=>x.id===id);if(!b)throw Error('Gradilište nije pronađeno.');b.state=clone(state);delete b.state.hourBooks}
    return n
  }
  function add(s,id,name,start,M,employees=s.employees){
    const n=clone(s),label=String(name).trim()
    if(!label||records(s).some(b=>b.id===id||b.state.site.trim().toLowerCase()===label.toLowerCase()))throw Error('Upišite jedinstven naziv gradilišta.')
    const fresh=M.change(M.create(),{type:'date',value:start})
    fresh.site=label
    fresh.employees=clone(employees)
    n.hourBooks=n.hourBooks||[]
    n.hourBooks.push({id,start,state:fresh})
    return validate(n,M)
  }
  function change(s,id,action,M){
    const b=records(s).find(x=>x.id===id);if(!b)throw Error('Gradilište nije pronađeno.')
    const date=action.type==='cell'?action.date:b.state.date
    if(b.start&&date<b.start&&['hours','status','all','cell'].includes(action.type))throw Error('Sati ovog gradilišta počinju od '+b.start+'.')
    const next=M.change(b.state,action)
    if(['status','all','cell'].includes(action.type)){
      const d=next.days[date]
      for(const e of next.employees){
        if(d?.statuses[e.id]!=='present'||!M.active(e,date))continue
        if(records(s).some(other=>other.id!==id&&other.state.days[date]?.statuses[e.id]==='present'&&other.state.employees.some(x=>x.id===e.id&&M.active(x,date))))throw Error(e.first+' '+e.last+' već je prisutan na drugom gradilištu tog dana. Tamo ga prvo označite odsutnim.')
      }
    }
    return save(s,id,next)
  }
  const api={records,validate,save,add,change}
  if(typeof module==='object'&&module.exports)module.exports=api
  else root.TaskerHoursBooks=api
})(typeof window==='object'?window:globalThis)
