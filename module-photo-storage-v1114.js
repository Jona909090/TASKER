(function(){
  'use strict';
  const KEY='tasker.module-status.v1',DB='tasker-module-photo-storage-v1',PREFIX='tasker-photo:';
  const cache=new Map(),reverse=new Map();
  let connection;
  function db(){return connection||(connection=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore('photos');r.result.createObjectStore('backups')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Zatvorite druge prozore Taskera.'))}))}
  async function request(store,mode,action){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(store,mode),r=action(tx.objectStore(store));tx.oncomplete=()=>resolve(r.result);tx.onerror=tx.onabort=()=>reject(tx.error||Error('Spremište nije dostupno.'))})}
  async function save(data){
    if(!data||!data.startsWith('data:image/'))return data;
    if(reverse.has(data))return reverse.get(data);
    const id=PREFIX+crypto.randomUUID();
    await request('photos','readwrite',s=>s.put(data,id));
    if(await request('photos','readonly',s=>s.get(id))!==data)throw Error('Provera fotografije nije uspela. Original ostaje sačuvan.');
    cache.set(id,data);reverse.set(data,id);return id;
  }
  async function load(state){for(const m of state.modules||[]){if(m.photo?.startsWith(PREFIX)&&!cache.has(m.photo)){const data=await request('photos','readonly',s=>s.get(m.photo));if(typeof data!=='string'||!data.startsWith('data:image/'))throw Error('Fotografija nije dostupna. Ne brišite podatke; vratite rezervnu kopiju.');cache.set(m.photo,data);reverse.set(data,m.photo)}}return state}
  function hydrate(state){const copy=JSON.parse(JSON.stringify(state));for(const m of copy.modules||[])if(m.photo?.startsWith(PREFIX)){if(!cache.has(m.photo))throw Error('Fotografije se još učitavaju.');m.photo=cache.get(m.photo)}return copy}
  function pack(state){const copy=JSON.parse(JSON.stringify(state));for(const m of copy.modules||[])if(reverse.has(m.photo))m.photo=reverse.get(m.photo);return copy}
  async function prepare(state){await load(state);for(const m of state.modules||[])if(m.photo?.startsWith('data:image/'))await save(m.photo);return pack(state)}
  async function repair(){
    const original=localStorage.getItem(KEY);if(!original)throw Error('Ovde nema modula. Otvorite aplikaciju preko ikonice koja ima podatke.');
    const state=JSON.parse(original);if(!Array.isArray(state.modules))throw Error('Neispravni podaci modula.');
    // A complete, verified pre-migration snapshot is retained separately, including all original images.
    const backupId='before-photo-move-'+crypto.randomUUID();
    await request('backups','readwrite',s=>s.put(original,backupId));
    if(await request('backups','readonly',s=>s.get(backupId))!==original)throw Error('Provera rezervne kopije nije uspela.');
    const packed=await prepare(state),text=JSON.stringify(packed);
    if(JSON.stringify(hydrate(packed))!==JSON.stringify(state))throw Error('Provera podataka nije uspela. Original nije promenjen.');
    if(localStorage.getItem(KEY)!==original)throw Error('Podaci su u međuvremenu promenjeni. Ponovite postupak.');
    localStorage.setItem(KEY,text);
    return Math.max(0,original.length-text.length)*2;
  }
  const ready=(async()=>{const raw=localStorage.getItem(KEY);if(raw)await load(JSON.parse(raw))})();
  ready.catch(()=>{});
  window.TaskerModulePhotos={ready,save,load,hydrate,pack,prepare,repair};
  const panel=document.getElementById('tasker-rescue');
  if(panel){const button=document.createElement('button'),result=document.createElement('p');button.type='button';button.textContent='3. Popravi puno spremište';result.setAttribute('role','status');panel.querySelector('section').append(button,result);
    button.onclick=async()=>{if(!confirm('Sačuvali ste osnovnu kopiju? Fotografije će biti premeštene u zasebno spremište ovog uređaja. Moduli, faze i sati ostaju isti. Posle uspeha aplikacija se ponovo učitava.'))return;button.disabled=true;result.textContent='Čuvam i proveravam fotografije. Sačekajte…';try{const bytes=await repair();result.textContent='Provereno. Oslobođeno '+(bytes/1048576).toFixed(2)+' MB. Ponovo otvaram aplikaciju…';setTimeout(()=>location.reload(),1500)}catch(e){result.textContent='Postupak nije završen: '+e.message;button.disabled=false}};
  }
})();
