(function(){
  'use strict'
  const UNKNOWN='Neodređeno',DB='tasker-module-photos-v1',LIMIT=500*1024*1024
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  function detect(text,confidence=100){
    const normalized=String(text).toUpperCase().replace(/[–—−]/g,'-')
    const found=[...normalized.matchAll(/\b(M\s*V\s*S|M\s*V)\s*-?\s*(\d{1,3})(?![\dA-Z])/g)].map(m=>m[1].replace(/\s/g,'')+'-'+m[2].padStart(2,'0'))
    const unique=[...new Set(found)];return confidence>=55&&unique.length===1?unique[0]:UNKNOWN
  }
  const safe=s=>String(s).replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/^\.+/,'_').slice(0,160)||'slika'
  const table=Uint32Array.from({length:256},(_,i)=>{for(let n=0;n<8;n++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0})
  function crc(data){let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
  async function zip(rows,progress=()=>{}){
    if(!rows.length)throw Error('Nema slika za ZIP.')
    if(rows.reduce((n,r)=>n+r.file.size,0)>LIMIT)throw Error('ZIP je prevelik za ovu obradu. Pripremite pojedinačne foldere (do 500 MB).')
    const body=[],directory=[],enc=new TextEncoder();let offset=0,index=0
    for(const r of rows){
      const bytes=new Uint8Array(await r.file.arrayBuffer()),name=enc.encode(safe(r.group)+'/'+String(++index).padStart(3,'0')+'-'+safe(r.name)),checksum=crc(bytes)
      const head=new Uint8Array(30+name.length),h=new DataView(head.buffer)
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,checksum,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);h.setUint16(26,name.length,true);head.set(name,30)
      const central=new Uint8Array(46+name.length),c=new DataView(central.buffer)
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,checksum,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);central.set(name,46)
      body.push(head,r.file);directory.push(central);offset+=head.length+bytes.length;progress(index,rows.length)
    }
    const size=directory.reduce((n,r)=>n+r.length,0),end=new Uint8Array(22),e=new DataView(end.buffer)
    e.setUint32(0,0x06054b50,true);e.setUint16(8,rows.length,true);e.setUint16(10,rows.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true)
    return new Blob([...body,...directory,end],{type:'application/zip'})
  }
  if(typeof module==='object'&&module.exports){module.exports={detect,zip,crc,safe};return}
  let dbPromise,records=[],batch='',folder='',page=0,busy=false,cancel=false,prepared=null,worker=null,urls=[]
  const $=id=>document.getElementById(id),msg=t=>{if($('mp-message'))$('mp-message').textContent=t}
  function db(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}).catch(e=>{dbPromise=null;throw e}))}
  async function request(mode,action){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('photos',mode),r=action(tx.objectStore('photos'));tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Čuvanje nije uspelo.'))})}
  const put=r=>request('readwrite',s=>s.put(r))
  async function load(){records=await request('readonly',s=>s.getAll());records.sort((a,b)=>b.created-a.created||a.order-b.order);if(!records.some(r=>r.batch===batch))batch=records[0]?.batch||''}
  function clearURLs(){urls.forEach(u=>URL.revokeObjectURL(u));urls=[]}
  function render(){
    const d=$('mp-dialog');if(!d)return
    clearURLs()
    const batches=[...new Set(records.map(r=>r.batch))],items=records.filter(r=>r.batch===batch),groups=[...new Set(items.map(r=>r.group))].sort()
    if(folder&&!groups.includes(folder))folder=''
    const filtered=items.filter(r=>!folder||r.group===folder);page=Math.max(0,Math.min(page,Math.ceil(filtered.length/20)-1))
    d.innerHTML=`<header><div><h2>Filter slika</h2><small>Fotografije se čuvaju na ovom uređaju. Nisu deo sinhronizacije radnih sati i modula.</small></div><button data-mp="close" aria-label="Zatvori">×</button></header><p>Dodaj do 100 slika (ukupno do 500 MB), zatim klikni „Razvrstaj slike“. Oznake MV / MVS se čitaju sa slike. Nejasne oznake idu u Neodređeno. Originali ostaju neizmenjeni.</p><div class="mp-tools"><label class="mp-button">+ Dodaj slike<input id="mp-files" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple ${busy?'disabled':''}></label><button data-mp="sort" ${busy||!items.length?'disabled':''}>Razvrstaj slike</button><button data-mp="stop" ${busy?'':'hidden'}>Zaustavi</button><label>Uvoz <select id="mp-batch" ${busy?'disabled':''}>${batches.map(b=>`<option value="${esc(b)}" ${b===batch?'selected':''}>${esc(records.find(r=>r.batch===b).label)} (${records.filter(r=>r.batch===b).length})</option>`).join('')}</select></label></div><p id="mp-message" role="status">${busy?'Obrada je u toku…':'OCR prvi put preuzima alat za čitanje teksta sa interneta. Fotografije se ne šalju OCR serveru.'}</p><div class="mp-folders"><button data-folder="" ${!folder?'aria-pressed="true"':''}>Sve slike (${items.length})</button>${groups.map(g=>`<button data-folder="${esc(g)}" aria-pressed="${folder===g}">📁 ${esc(g)} (${items.filter(r=>r.group===g).length})</button>`).join('')}</div><div class="mp-tools"><button data-mp="zip" ${busy||!filtered.length?'disabled':''}>Pripremi ZIP — ${esc(folder||'svi folderi')}</button>${prepared?'<button data-mp="download">Preuzmi ZIP</button><button class="mp-share" data-mp="share">WhatsApp / pošalji ZIP</button>':''}</div>${prepared?`<p>Spreman: ${esc(prepared.name)} · ${(prepared.size/1048576).toFixed(1)} MB. U prozoru za deljenje izaberi WhatsApp. Ako deljenje ZIP-a nije podržano, preuzmi ga i u WhatsAppu izaberi Spajalica → Dokument.</p>`:''}<div class="mp-grid">${filtered.slice(page*20,page*20+20).map(r=>{let src='';if(r.thumb){src=URL.createObjectURL(r.thumb);urls.push(src)}return `<article>${src?`<img loading="lazy" src="${src}" alt="${esc(r.name)}">`:'<div class="mp-no-preview">Pregled nije dostupan</div>'}<b>${esc(r.name)}</b><small>${esc(r.note||'Nije obrađeno')}</small><label>Folder<input data-photo="${esc(r.id)}" value="${esc(r.group)}" placeholder="MV-08 ili MVS-01" ${busy?'disabled':''}></label></article>`}).join('')}</div>${filtered.length>20?`<div class="mp-tools"><button data-mp="prev" ${page===0?'disabled':''}>←</button><span>Strana ${page+1} / ${Math.ceil(filtered.length/20)}</span><button data-mp="next" ${(page+1)*20>=filtered.length?'disabled':''}>→</button></div>`:''}<p class="mp-foot">Pre slanja proveri foldere. Automatsko prepoznavanje može pogrešiti. Sačuvaj ZIP izvan aplikacije kao rezervnu kopiju.</p>`
  }
  async function bitmap(blob){const img=new Image(),u=URL.createObjectURL(blob);try{img.src=u;await img.decode();return img}finally{URL.revokeObjectURL(u)}}
  async function thumbnail(blob){try{const img=await bitmap(blob),c=document.createElement('canvas');c.width=280;c.height=Math.max(1,Math.round(img.height*280/img.width));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.72))}catch{return null}}
  function timeout(p,ms){let t;return Promise.race([p,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error('Čitanje je predugo trajalo. Pokušaj ponovo.')),ms)})]).finally(()=>clearTimeout(t))}
  async function makeWorker(){
    if(!window.Tesseract)await timeout(new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('Nije moguće učitati OCR. Proveri internet.'))};document.head.append(s)}),45000)
    let expired=false
    const pending=Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',langPath:'https://tessdata.projectnaptha.com/4.0.0'}).then(w=>{if(expired)w.terminate();return w})
    try{return await timeout(pending,90000)}catch(e){expired=true;throw e}
  }
  async function recognize(blob){
    const img=await bitmap(blob),c=document.createElement('canvas'),readings=[]
    // Isolate the white module caption, then fall back to a wider area and full image.
    for(const mode of ['caption','caption-raw','caption-high','caption-low','corner','full']){
      const caption=mode.startsWith('caption'),crop=mode!=='full',sx=img.width*(caption?.72:crop?.5:0),sy=caption?img.height*.058:0,sw=img.width-sx,sh=img.height*(caption?.045:crop?.16:1),scale=Math.min(crop?3:1,2200/sw)
      c.width=Math.round(sw*scale);c.height=Math.round(sh*scale);const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height)
      if(caption&&mode!=='caption-raw'){const pixels=ctx.getImageData(0,0,c.width,c.height),threshold=mode==='caption-high'?235:mode==='caption-low'?180:205;for(let i=0;i<pixels.data.length;i+=4){const white=Math.min(pixels.data[i],pixels.data[i+1],pixels.data[i+2])>threshold?0:255;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=white}ctx.putImageData(pixels,0,0)}
      await worker.setParameters({tessedit_pageseg_mode:caption?'7':'11'})
      const {data}=await timeout(worker.recognize(c),90000),group=detect(data.text,data.confidence)
      readings.push(Math.round(data.confidence||0)+'%: '+data.text.trim().slice(0,180))
      if(group!==UNKNOWN)return {group,note:'Pročitano: '+group}
    }
    return {group:UNKNOWN,note:'Proveri ručno. Pročitani tekst: '+readings.join(' / ')}
  }
  async function add(files){
    if(busy)return
    files=[...files];if(!files.length)return
    if(files.length>100||files.reduce((n,f)=>n+f.size,0)>LIMIT){msg('Dodaj najviše 100 slika i ukupno do 500 MB po uvozu.');return}
    if(files.some(f=>!/^image\//.test(f.type)&&! /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name))){msg('Izaberi samo fotografije.');return}
    busy=true;prepared=null;cancel=false;batch=crypto.randomUUID();folder='';page=0;render();const now=Date.now(),label=new Date(now).toLocaleString('hr-HR');let failure=''
    try{for(let i=0;i<files.length;i++){if(cancel)break;msg(`Čuvam sliku ${i+1} / ${files.length}…`);const file=files[i];await put({id:crypto.randomUUID(),batch,label,created:now,order:i,name:file.name,file,thumb:await thumbnail(file),group:UNKNOWN,note:'Nije obrađeno',manual:false})}}catch{failure='Nema dovoljno prostora ili čuvanje nije uspelo. Prikazane su samo uspešno sačuvane slike. Originali na uređaju nisu obrisani.'}
    finally{busy=false;await load();render();msg(failure||'Sačuvane slike su prikazane. Klikni „Razvrstaj slike“.')}
  }
  async function sort(){
    if(busy)return
    const list=records.filter(r=>r.batch===batch&&!r.manual);if(!list.length){msg('Nema slika za automatsko čitanje.');return}
    busy=true;cancel=false;prepared=null;render();let failure='',done=0
    try{msg('Učitavam alat za čitanje oznaka…');worker=await makeWorker();await worker.setParameters({tessedit_pageseg_mode:'11'});
      for(const r of list){if(cancel)break;msg(`Čitam oznaku ${done+1} / ${list.length}: ${r.name}`);try{Object.assign(r,await recognize(r.file))}catch(e){r.group=UNKNOWN;r.note='Čitanje nije uspelo — proveri ručno.';if(e.message.includes('predugo'))throw e}await put(r);done++}
    }catch(e){failure=e.message||'OCR nije dostupan.'}finally{await worker?.terminate().catch(()=>{});worker=null;busy=false;await load();render();msg(failure||`${cancel?'Zaustavljeno.':'Razvrstavanje završeno.'} Obrađeno ${done} / ${list.length}. Proveri foldere i pripremi ZIP.`)}
  }
  function download(){if(!prepared)return;const u=URL.createObjectURL(prepared),a=document.createElement('a');a.href=u;a.download=prepared.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),60000)}
  async function prepare(){
    if(busy)return;busy=true;cancel=false;prepared=null;render()
    try{const rows=records.filter(r=>r.batch===batch&&(!folder||r.group===folder)),blob=await zip(rows,(i,n)=>{if(cancel)throw Error('Priprema ZIP-a je zaustavljena.');msg(`Pakujem originalne slike ${i} / ${n}…`)});prepared=new File([blob],`TASKER-${safe(folder||'Svi-moduli')}-${new Date(records.find(r=>r.batch===batch).created).toISOString().slice(0,10)}.zip`,{type:'application/zip'});busy=false;render();msg('ZIP je spreman. Klikni WhatsApp / pošalji ZIP ili Preuzmi ZIP.')}catch(e){busy=false;render();msg(e.message)}
  }
  async function share(){
    if(!prepared)return
    if(!navigator.share||!navigator.canShare?.({files:[prepared]})){download();msg('Ovaj uređaj ne podržava direktno deljenje ZIP-a. ZIP je pripremljen za preuzimanje. U WhatsAppu izaberi Spajalica → Dokument i priloži ga.');return}
    try{await navigator.share({files:[prepared],title:prepared.name});msg('Otvoren je sistemski prozor za deljenje ZIP-a.')}catch(e){msg(e.name==='AbortError'?'Deljenje je otkazano. ZIP je i dalje spreman.':'Deljenje nije uspelo. Klikni Preuzmi ZIP i priloži ga kao Dokument u WhatsAppu.')}
  }
  async function open(){
    let d=$('mp-dialog');if(!d){d=document.createElement('dialog');d.id='mp-dialog';d.setAttribute('aria-label','Filter slika');document.body.append(d);d.addEventListener('close',clearURLs);
      d.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=b.dataset.mp;if(action==='close')d.close();if(action==='stop'){cancel=true;msg('Zaustavljam nakon trenutne slike…')}if(action==='sort')sort();if(action==='zip')prepare();if(action==='download')download();if(action==='share')share();if(action==='prev'){page--;render()}if(action==='next'){page++;render()}if(b.hasAttribute('data-folder')&&!busy){folder=b.dataset.folder;page=0;prepared=null;render()}})
      d.addEventListener('change',async e=>{try{if(e.target.id==='mp-files')await add(e.target.files);if(e.target.id==='mp-batch'&&!busy){batch=e.target.value;folder='';page=0;prepared=null;render()}if(e.target.dataset.photo&&!busy){const r=records.find(r=>r.id===e.target.dataset.photo),value=e.target.value.trim(),group=value.toLowerCase()===UNKNOWN.toLowerCase()?UNKNOWN:detect(value);if(group===UNKNOWN&&value.toLowerCase()!==UNKNOWN.toLowerCase()){e.target.value=r.group;msg('Unesi npr. MV-08, MVS-01 ili Neodređeno.');return}await put({...r,group,manual:true,note:'Ručno odabran folder'});prepared=null;await load();render()}}catch(e){msg('Promena nije sačuvana: '+e.message)}})
    }
    if(!d.open)d.showModal();if(busy){render();return}try{await load();render()}catch{d.innerHTML='<h2>Filter slika</h2><p>Nije moguće otvoriti lokalno spremište fotografija. Proveri da preglednik dozvoljava čuvanje podataka.</p><button data-mp="close">Zatvori</button>'}
  }
  const style=document.createElement('style');style.textContent=`#mp-dialog{box-sizing:border-box;width:min(1100px,96vw);max-height:92vh;overflow:auto;background:#10273d;color:#eaf4ff;border:1px solid #477693;border-radius:16px;padding:22px;font:14px Arial}#mp-dialog::backdrop{background:#000b}#mp-dialog header{display:flex;justify-content:space-between;gap:20px}#mp-dialog h2{margin:0 0 8px}#mp-dialog p{line-height:1.5;color:#b5cfe2}#mp-dialog button,#mp-dialog .mp-button,#mp-dialog select{background:#193d57;color:#e8f6ff;border:1px solid #3e708d;border-radius:8px;padding:10px;cursor:pointer;font:inherit}#mp-dialog button:disabled{opacity:.45;cursor:default}#mp-dialog [hidden]{display:none!important}#mp-dialog .mp-tools,#mp-dialog .mp-folders{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:15px 0}#mp-dialog .mp-button input{display:block;max-width:240px;margin-top:8px}#mp-dialog [aria-pressed=true]{border-color:#58dfff;background:#205c76}#mp-dialog .mp-share{background:#146b43}#mp-dialog .mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}#mp-dialog article{padding:10px;border:1px solid #31516b;border-radius:10px;display:grid;gap:8px;min-width:0}#mp-dialog article img{width:100%;height:135px;object-fit:contain;background:#081725}#mp-dialog article b{overflow-wrap:anywhere;font-size:12px}#mp-dialog small{color:#9ebbd0}#mp-dialog article label{display:grid;gap:5px}#mp-dialog article input{box-sizing:border-box;width:100%;background:#071b2d;border:1px solid #466b84;color:white;padding:9px;border-radius:6px}#mp-message{color:#7ae6c0!important}#mp-dialog .mp-no-preview{height:135px;display:grid;place-items:center}#mp-dialog .mp-foot{font-size:12px}`;document.head.append(style)
  function install(){const host=document.querySelector('#module-status .ms-header .ms-actions');if(host&&!$('mp-open')){const b=document.createElement('button');b.id='mp-open';b.className='ms-button';b.textContent='📁 Filter slika';b.onclick=open;host.append(b)}}
  new MutationObserver(install).observe(document.body,{childList:true,subtree:true});install()
  window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue=''}})
})()

