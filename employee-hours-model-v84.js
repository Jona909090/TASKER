(function (root) {
  'use strict'
  const today = () => { const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10) }
  const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s
  const validMonth = s => /^\d{4}-(0[1-9]|1[0-2])$/.test(s)
  const create = () => ({version:1,date:today(),month:today().slice(0,7),site:'',employees:[],days:{}})
  function validate(s){
    if(!s || s.version!==1 || !validDate(s.date) || !validMonth(s.month) || typeof s.site!=='string' || !Array.isArray(s.employees) || !s.days || typeof s.days!=='object')throw Error('Neispravni spremljeni podaci.')
    const ids=new Set()
    for(const e of s.employees){if(!e.id||ids.has(e.id)||typeof e.first!=='string'||typeof e.last!=='string'||typeof e.role!=='string')throw Error('Neispravan popis zaposlenih.');ids.add(e.id)}
    for(const [date,d] of Object.entries(s.days)){if(!validDate(date)||!Number.isInteger(d.minutes)||d.minutes<0||d.minutes>1440||!d.statuses)throw Error('Neispravna dnevna evidencija.');for(const v of Object.values(d.statuses))if(!['present','absent'].includes(v))throw Error('Neispravna prisutnost.')}
    return s
  }
  const day = (s,date=s.date) => s.days[date] || {minutes:480,statuses:{}}
  const ensureDay = s => s.days[s.date] || (s.days[s.date]={minutes:480,statuses:{}})
  function minutes(value){const str=String(value).trim().replace(',','.');if(!/^\d+(\.\d{1,2})?$/.test(str))throw Error('Upišite broj sati između 0 i 24.');const n=Number(str);if(n>24)throw Error('Broj sati mora biti između 0 i 24.');return Math.round(n*60)}
  function change(s,action){
    const n=JSON.parse(JSON.stringify(s))
    switch(action.type){
      case 'date':if(!validDate(action.value))throw Error('Odaberite ispravan datum.');n.date=action.value;n.month=action.value.slice(0,7);break
      case 'month':if(!validMonth(action.value))throw Error('Odaberite mjesec i godinu.');n.month=action.value;break
      case 'site':n.site=String(action.value);break
      case 'hours':ensureDay(n).minutes=minutes(action.value);break
      case 'status':if(!n.employees.some(e=>e.id===action.id)||!['present','absent'].includes(action.value))throw Error('Zaposleni nije pronađen.');ensureDay(n).statuses[action.id]=action.value;break
      case 'all':if(!['present','absent'].includes(action.value))throw Error('Neispravan status.');for(const e of n.employees)ensureDay(n).statuses[e.id]=action.value;break
      case 'employee':{
        const e={id:action.id,first:String(action.first||'').trim(),last:String(action.last||'').trim(),role:String(action.role||'Radnik').trim()||'Radnik'}
        if(!e.id||!e.first||!e.last)throw Error('Upišite ime i prezime.')
        const i=n.employees.findIndex(x=>x.id===e.id);if(i<0)n.employees.push(e);else n.employees[i]=e;break
      }
      case 'remove':n.employees=n.employees.filter(e=>e.id!==action.id);for(const d of Object.values(n.days))delete d.statuses[action.id];break
      case 'move':{const i=n.employees.findIndex(e=>e.id===action.id),j=i+action.delta;if(i>=0&&j>=0&&j<n.employees.length)[n.employees[i],n.employees[j]]=[n.employees[j],n.employees[i]];break}
      default:throw Error('Nepoznata radnja.')
    }
    return validate(n)
  }
  function month(s){
    const [y,m]=s.month.split('-').map(Number),count=new Date(y,m,0).getDate()
    const dates=Array.from({length:count},(_,i)=>({date:`${s.month}-${String(i+1).padStart(2,'0')}`,weekend:[0,6].includes(new Date(y,m-1,i+1).getDay())}))
    const rows=s.employees.map(e=>{const cells=dates.map(({date})=>{const d=s.days[date],status=d?.statuses[e.id];return status==='present'?d.minutes:status==='absent'?0:null});return {employee:e,cells,total:cells.reduce((a,b)=>a+(b||0),0)}})
    return {dates,rows,total:rows.reduce((a,r)=>a+r.total,0)}
  }
  const api={today,create,validate,day,minutes,change,month}
  if(typeof module==='object'&&module.exports)module.exports=api
  else root.TaskerHoursModel=api
})(typeof window==='object'?window:globalThis)

