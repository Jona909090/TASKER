(function(root){
 'use strict';
 const START='2026-10-01';
 const seeds=[['food','Hrana','🍽','#ff9b45'],['fuel','Gorivo','⛽','#ff657b'],['cafe','Kafići / restorani','☕','#39a5ff'],['shopping','Kupovina','🛍','#ba8bff'],['car','Auto','🚗','#6ac6de'],['bills','Računi','🧾','#f1c65d'],['fun','Zabava','🎬','#ed7fc5'],['travel','Putovanja','✈','#66d4b3'],['online','Online kupovina','📦','#30c995'],['other','Ostalo','◈','#899bb4']];
 const payments=['Gotovina','Kartica','Revolut','Bankovni račun','Ostalo'];
 const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 const money=n=>new Intl.NumberFormat('hr-HR',{style:'currency',currency:'EUR'}).format(n/100);
 function dateValid(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v}
 function cents(value,zero=false){const s=String(value).trim().replace(',','.');if(!/^\d+(?:\.\d{1,2})?$/.test(s))throw Error('Unesite iznos s najviše dvije decimale (npr. 42,35).');const [a,b='']=s.split('.'),n=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>100000000000||n<(zero?0:1))throw Error('Iznos mora biti pozitivan i manji od 1 milijarde EUR.');return n}
 const initial=()=>({version:1,categories:seeds.map(([id,name,icon,color])=>({id,name,icon,color})),expenses:[],budgets:{},categoryBudgets:{}});
 const monthValid=m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(m)&&m>='2026-10';
 function validate(s){
  if(!s||s.version!==1||!Array.isArray(s.categories)||!Array.isArray(s.expenses)||!s.budgets||!s.categoryBudgets)throw Error('Neispravna evidencija privatnih troškova.');
  const ids=new Set();for(const c of s.categories){if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>80||typeof c.icon!=='string'||c.icon.length>12||!/^#[0-9a-f]{6}$/i.test(c.color))throw Error('Neispravna kategorija.');ids.add(c.id)}if(!ids.has('other'))throw Error('Nedostaje kategorija Ostalo.');
  const seen=new Set();for(const e of s.expenses){if(!e||typeof e.id!=='string'||seen.has(e.id)||!ids.has(e.category)||!Number.isSafeInteger(e.amount)||e.amount<=0||e.amount>100000000000||!dateValid(e.date)||e.date<START||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)||!payments.includes(e.payment)||typeof e.place!=='string'||e.place.length>160||typeof e.description!=='string'||e.description.length>2000)throw Error('Neispravan trošak.');if(e.photo&&(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(e.photo)||e.photo.length>2000000))throw Error('Neispravna ili prevelika fotografija.');seen.add(e.id)}
  for(const [m,n]of Object.entries(s.budgets)){if(!monthValid(m)||!Number.isSafeInteger(n)||n<0)throw Error('Neispravan budžet.')}
  for(const [m,limits]of Object.entries(s.categoryBudgets)){if(!monthValid(m)||!limits||typeof limits!=='object')throw Error('Neispravni limiti.');for(const [id,n]of Object.entries(limits))if(!ids.has(id)||!Number.isSafeInteger(n)||n<0)throw Error('Neispravan limit kategorije.')}
  return s;
 }
 const sum=rows=>rows.reduce((n,e)=>n+e.amount,0);
 const sorted=rows=>[...rows].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)||b.id.localeCompare(a.id));
 function summary(s,month,now=today()){
  const rows=s.expenses.filter(e=>e.date.startsWith(month)),total=sum(rows),days=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
  const elapsed=month<now.slice(0,7)?days:month===now.slice(0,7)?Number(now.slice(8)):0;
  const d=new Date(now+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);const start=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);const end=d.toISOString().slice(0,10);
  return {rows:sorted(rows),total,days,elapsed,average:elapsed?Math.round(total/elapsed):0,today:sum(s.expenses.filter(e=>e.date===now)),week:sum(s.expenses.filter(e=>e.date>=start&&e.date<=end)),max:rows.length?Math.max(...rows.map(e=>e.amount)):0,budget:s.budgets[month]??null,categories:s.categories.map(c=>({...c,total:sum(rows.filter(e=>e.category===c.id)),limit:s.categoryBudgets[month]?.[c.id]??null})),daily:Array.from({length:days},(_,i)=>({label:String(i+1),total:sum(rows.filter(e=>Number(e.date.slice(8))===i+1))}))};
 }
 function filter(s,f={}){return sorted(s.expenses.filter(e=>{const cat=s.categories.find(c=>c.id===e.category);return (!f.from||e.date>=f.from)&&(!f.to||e.date<=f.to)&&(!f.category||e.category===f.category)&&(!f.payment||e.payment===f.payment)&&(!f.place||e.place.toLocaleLowerCase().includes(f.place.toLocaleLowerCase()))&&(!f.search||[e.place,e.description,cat?.name,e.payment].join(' ').toLocaleLowerCase().includes(f.search.toLocaleLowerCase()))&&(f.min==null||e.amount>=f.min)&&(f.max==null||e.amount<=f.max)}))}
 function saveExpense(s,e){const next=structuredClone(s),i=next.expenses.findIndex(x=>x.id===e.id);if(i<0)next.expenses.push(e);else next.expenses[i]=e;return validate(next)}
 function removeCategory(s,id){if(id==='other')throw Error('Kategorija Ostalo mora ostati za nerazvrstane troškove.');const n=structuredClone(s);n.categories=n.categories.filter(c=>c.id!==id);n.expenses.forEach(e=>{if(e.category===id)e.category='other'});for(const limits of Object.values(n.categoryBudgets))delete limits[id];return validate(n)}
 const api={START,seeds,payments,today,money,dateValid,cents,initial,validate,sum,sorted,monthValid,summary,filter,saveExpense,removeCategory};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TaskerPrivateExpenses=api;
})(typeof window==='object'?window:globalThis);