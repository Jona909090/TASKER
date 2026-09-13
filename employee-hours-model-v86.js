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
    for(const d of Object.values(s.days))for(const value of Object.values(d.overrides||{}))if(!Number.isInteger(value)||value<0||value>1440)throw Error('Neispravni pojedinačni sati.')
    for(const e of s.employees)if(e.endDate&&!validDate(e.endDate))throw Error('Neispravan posljednji radni dan.')
    return s
  }
  const active = (e,date) => !e.endDate || date<=e.endDate
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
      case 'status':if(!n.employees.some(e=>e.id===action.id&&active(e,n.date))||!['present','absent'].includes(action.value))throw Error('Zaposleni nije pronađen.');ensureDay(n).statuses[action.id]=action.value;if(action.value==='absent'&&ensureDay(n).overrides)delete ensureDay(n).overrides[action.id];break
      case 'all':if(!['present','absent'].includes(action.value))throw Error('Neispravan status.');for(const e of n.employees.filter(e=>active(e,n.date))){ensureDay(n).statuses[e.id]=action.value;if(action.value==='absent'&&ensureDay(n).overrides)delete ensureDay(n).overrides[e.id]}break
      case 'cell':{
        if(!validDate(action.date)||!n.employees.some(e=>e.id===action.id&&active(e,action.date)))throw Error('Neispravan dan ili zaposleni.')
        const value=String(action.value).trim()
        const amount=['','-','–','—'].includes(value)?0:minutes(value)
        const d=n.days[action.date]||(n.days[action.date]={minutes:480,statuses:{}})
        d.statuses[action.id]=amount>0?'present':'absent'
        d.overrides=d.overrides||{}
        if(amount>0)d.overrides[action.id]=amount
        else delete d.overrides[action.id]
        break
      }
      case 'employee':{
        const e={id:action.id,first:String(action.first||'').trim(),last:String(action.last||'').trim(),role:String(action.role||'Radnik').trim()||'Radnik'}
        if(!e.id||!e.first||!e.last)throw Error('Upišite ime i prezime.')
        const i=n.employees.findIndex(x=>x.id===e.id);e.endDate=action.endDate===undefined?(n.employees[i]?.endDate||''):String(action.endDate);if(e.endDate&&!validDate(e.endDate))throw Error('Odaberite ispravan posljednji radni dan.');if(i<0)n.employees.push(e);else n.employees[i]=e;break
      }
      case 'remove':{const e=n.employees.find(e=>e.id===action.id);if(!e||!validDate(action.endDate))throw Error('Odaberite posljednji radni dan.');e.endDate=action.endDate;break}
      case 'move':{const people=n.employees.filter(e=>active(e,n.date)),i=people.findIndex(e=>e.id===action.id),j=i+action.delta;if(i>=0&&j>=0&&j<people.length){const a=n.employees.indexOf(people[i]),b=n.employees.indexOf(people[j]);[n.employees[a],n.employees[b]]=[n.employees[b],n.employees[a]]}break}
      default:throw Error('Nepoznata radnja.')
    }
    return validate(n)
  }
  function month(s){
    const [y,m]=s.month.split('-').map(Number),count=new Date(y,m,0).getDate()
    const dates=Array.from({length:count},(_,i)=>({date:`${s.month}-${String(i+1).padStart(2,'0')}`,weekend:[0,6].includes(new Date(y,m-1,i+1).getDay())}))
    const rows=s.employees.map(e=>{const cells=dates.map(({date})=>{const d=s.days[date],status=d?.statuses[e.id];if(!active(e,date))return null;return status==='present'?(d.overrides?.[e.id]??d.minutes):status==='absent'?0:null});return {employee:e,cells,total:cells.reduce((a,b)=>a+(b||0),0)}})
    return {dates,rows,total:rows.reduce((a,r)=>a+r.total,0)}
  }
  const api={active,today,create,validate,day,minutes,change,month}
  if(typeof module==='object'&&module.exports)module.exports=api
  else root.TaskerHoursModel=api
})(typeof window==='object'?window:globalThis)





