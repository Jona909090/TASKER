(function(){
  'use strict'
  const base=new URL('.',document.currentScript.src)
  let loading=null
  function library(){
    if(window.html2canvas)return Promise.resolve(window.html2canvas)
    if(!loading)loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('vendor/html2canvas-1.4.1.min.js',base).href;s.onload=()=>resolve(window.html2canvas);s.onerror=()=>{loading=null;s.remove();reject(Error('Priprema slike nije dostupna. Povežite uređaj s internetom i pokušajte ponovo.'))};document.head.append(s)})
    return loading
  }
  async function open(source,name){
    if(!source)return
    const root=document.getElementById('module-status'),d=document.createElement('dialog');d.id='ms-snapshot-dialog';d.className='ms-dialog ms-snapshot'
    d.innerHTML='<h2>Snimak pregleda modula</h2><p>Na slici povuci prstom ili mišem okvir oko dijela koji želiš poslati. Možeš poslati i cijeli pregled.</p><p class="ms-shot-status" role="status">Pripremam sliku…</p><div class="ms-shot-stage"></div><div class="ms-actions"><button class="ms-button" data-shot-full disabled>Cijeli pregled</button><button class="ms-button" data-shot-download disabled>Preuzmi PNG</button><button class="ms-button primary" data-shot-share disabled>Podijeli sliku / WhatsApp</button><button class="ms-button" data-shot-close>Zatvori</button></div><p class="ms-hint">U prozoru za dijeljenje izaberi WhatsApp. Ako dijeljenje datoteka nije podržano, preuzmi PNG i priloži ga u razgovoru.</p>'
    root.append(d);d.showModal()
    const status=d.querySelector('.ms-shot-status'),stage=d.querySelector('.ms-shot-stage'),download=d.querySelector('[data-shot-download]'),share=d.querySelector('[data-shot-share]'),full=d.querySelector('[data-shot-full]')
    let file=null,url='',canvas=null,selection=null,start=null,version=0
    function cleanup(){version++;if(url)URL.revokeObjectURL(url);d.remove()}
    d.addEventListener('close',cleanup,{once:true});d.querySelector('[data-shot-close]').onclick=()=>d.close()
    const filename='Status-modula-'+name.replace(/[^a-zA-Z0-9ČĆŠĐŽčćšđž_-]+/g,'-')+'-'+new Date().toISOString().slice(0,10)+'.png'
    async function prepare(rect){
      const token=++version;download.disabled=true;share.disabled=true;file=null
      const crop=document.createElement('canvas');crop.width=rect.w;crop.height=rect.h;crop.getContext('2d').drawImage(canvas,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h)
      const blob=await new Promise(resolve=>crop.toBlob(resolve,'image/png'))
      if(token!==version||!d.isConnected)return
      if(!blob){status.textContent='Sliku nije moguće pripremiti. Pokušaj s manjim dijelom.';return}
      if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);file=new File([blob],filename,{type:'image/png'})
      download.disabled=false;share.disabled=false;status.textContent='Spremno: '+rect.w+' × '+rect.h+' px · '+Math.ceil(blob.size/1024)+' KB. Dijeli se samo označeni dio.'
    }
    download.onclick=()=>{if(!file)return;const a=document.createElement('a');a.href=url;a.download=filename;d.append(a);a.click();a.remove();status.textContent='Preuzeta je slika '+filename+'. Priloži je u WhatsApp razgovoru.'}
    share.onclick=async()=>{
      if(!file)return
      if(!navigator.canShare?.({files:[file]})){status.textContent='Ovaj preglednik ne podržava direktno slanje datoteke. Klikni Preuzmi PNG, pa sliku priloži u WhatsAppu.';return}
      try{await navigator.share({files:[file],title:'Status modula '+name});status.textContent='Slika je predana sistemskom prozoru za dijeljenje.'}catch(e){status.textContent=e.name==='AbortError'?'Dijeljenje je otkazano; slika je i dalje spremna.':'Dijeljenje nije uspjelo. Preuzmi PNG i priloži ga ručno.'}
    }
    let clone
    try{
      const render=await library();await document.fonts.ready
      clone=document.createElement('div');clone.className='ms-snapshot-source';clone.style.cssText='position:absolute;left:-12000px;top:0;width:'+Math.max(340,source.clientWidth)+'px;padding:24px;background:#11283f;color:#e5f4ff;font-family:Arial,sans-serif;'
      clone.innerHTML=source.innerHTML;clone.querySelectorAll('button,input,select,textarea').forEach(e=>e.remove());clone.querySelectorAll('.ms-badge').forEach(e=>{e.style.background='#20415d'})
      root.append(clone)
      canvas=await render(clone,{backgroundColor:'#11283f',scale:Math.min(2,16000/Math.max(1,clone.scrollHeight)),logging:false,useCORS:false})
      if(!d.isConnected)return
      const wrap=document.createElement('div');wrap.className='ms-shot-wrap';canvas.setAttribute('aria-label','Povuci okvir za odabir dijela slike');canvas.style.cssText='display:block;width:100%;height:auto;touch-action:none;'
      selection=document.createElement('div');selection.className='ms-shot-selection';selection.hidden=true;wrap.append(canvas,selection);stage.append(wrap)
      function coords(e){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(canvas.width,Math.round((e.clientX-r.left)*canvas.width/r.width))),y:Math.max(0,Math.min(canvas.height,Math.round((e.clientY-r.top)*canvas.height/r.height)))}}
      function rect(end){return {x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),w:Math.abs(start.x-end.x),h:Math.abs(start.y-end.y)}}
      function draw(r){selection.hidden=false;selection.style.cssText='left:'+r.x/canvas.width*100+'%;top:'+r.y/canvas.height*100+'%;width:'+r.w/canvas.width*100+'%;height:'+r.h/canvas.height*100+'%'}
      canvas.onpointerdown=e=>{start=coords(e);canvas.setPointerCapture(e.pointerId);version++;file=null;download.disabled=true;share.disabled=true;draw({x:start.x,y:start.y,w:0,h:0});e.preventDefault()}
      canvas.onpointermove=e=>{if(start){draw(rect(coords(e)));e.preventDefault()}}
      canvas.onpointerup=e=>{if(!start)return;const r=rect(coords(e));start=null;if(r.w<12||r.h<12){status.textContent='Označi veći dio slike ili klikni Cijeli pregled.';return}prepare(r)}
      canvas.onpointercancel=()=>{start=null;status.textContent='Odabir je prekinut. Označi dio ponovo ili klikni Cijeli pregled.'}
      full.disabled=false;full.onclick=()=>{start=null;selection.hidden=true;prepare({x:0,y:0,w:canvas.width,h:canvas.height})}
      await prepare({x:0,y:0,w:canvas.width,h:canvas.height})
    }catch(e){status.textContent='Snimak nije napravljen: '+e.message}finally{clone?.remove()}
  }
  window.TaskerModuleSnapshot={open}
})()