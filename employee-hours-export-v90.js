(function(root){
  'use strict'
  const mimeXlsx='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const title='Mjesečna evidencija radnih sati'
  const number=m=>new Intl.NumberFormat('hr-HR',{maximumFractionDigits:2}).format(m/60)
  const monthName=s=>new Intl.DateTimeFormat('hr-HR',{month:'long',year:'numeric'}).format(new Date(s.month+'-15T12:00:00'))
  function color(s,r,i,column,date,value){
    if(column==='identity'&&r.employee.endDate&&r.employee.endDate.slice(0,7)<=s.month)return 'A92F3B'
    if(column==='day'&&r.employee.endDate&&date.date>r.employee.endDate)return 'A92F3B'
    if(column==='day'&&value>0)return 'FFE34F'
    if(column==='total')return 'D7EEDB'
    if(column==='day'&&date.weekend)return i%2===0?'E0D8EA':'EFEAF5'
    return i%2===0?'DDE4EA':'FFFFFF'
  }
  function workbook(ExcelJS,s,m){
    const w=new ExcelJS.Workbook();w.creator='TASKER';w.created=new Date();w.calcProperties.fullCalcOnLoad=true
    const last=m.dates.length+4,sh=w.addWorksheet('Radni sati',{views:[{state:'frozen',xSplit:3,ySplit:5}],pageSetup:{orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,showGridLines:false,printTitlesRow:'1:5',margins:{left:.2,right:.2,top:.3,bottom:.3,header:.1,footer:.1}}})
    for(let row=1;row<=4;row++)sh.mergeCells(row,1,row,last)
    sh.getCell(1,1).value=title.toLocaleUpperCase('hr-HR');sh.getCell(2,1).value=s.site||'Projekt / Gradilište nije upisano';sh.getCell(3,1).value=monthName(s).toLocaleUpperCase('hr-HR');sh.getCell(4,1).value='Žuto: odrađeni sati | –: bez sati | Crveno: prestanak rada | Ljubičasto: vikend'
    for(let row=1;row<=4;row++){sh.getRow(row).height=row===1?28:23;sh.getCell(row,1).font={name:'Arial',size:row===1?16:11,bold:row<4};sh.getCell(row,1).alignment={vertical:'middle',wrapText:true}}
    const headers=['R.br.','Ime','Prezime',...m.dates.map((d,i)=>i+1),'UKUPNO'];sh.getRow(5).values=headers;sh.getRow(5).height=25
    headers.forEach((v,i)=>{const c=sh.getCell(5,i+1);c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF19354B'}};c.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};c.alignment={horizontal:'center',vertical:'middle'}})
    sh.getColumn(1).width=5;sh.getColumn(2).width=17;sh.getColumn(3).width=20;for(let c=4;c<last;c++)sh.getColumn(c).width=4.5;sh.getColumn(last).width=11
    const numFmt='General;General;"–"'
    m.rows.forEach((r,i)=>{
      const rn=i+6,row=sh.getRow(rn)
      row.height=32
      row.values=[i+1,r.employee.first,r.employee.last,...r.cells.map(v=>(v||0)/60),{formula:`SUM(D${rn}:${sh.getColumn(last-1).letter}${rn})`,result:r.total/60}]
      for(let c=1;c<=last;c++){
        const cell=sh.getCell(rn,c),kind=c<=3?'identity':c===last?'total':'day',bg=color(s,r,i,kind,m.dates[c-4],r.cells[c-4])
        cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+bg}};cell.font={name:'Arial',size:10,bold:c===last,color:{argb:bg==='A92F3B'?'FFFFFFFF':'FF111111'}}
        cell.alignment={vertical:'middle',horizontal:c===2||c===3?'left':'center',wrapText:true}
        cell.border={top:{style:'thin',color:{argb:'FF9DA9B3'}},bottom:{style:'thin',color:{argb:'FF9DA9B3'}},left:{style:'thin',color:{argb:'FF9DA9B3'}},right:{style:'thin',color:{argb:'FF9DA9B3'}}}
        if(c>=4)cell.numFmt=numFmt
      }
    })
    const totalRow=m.rows.length+6;sh.mergeCells(totalRow,1,totalRow,last-1);sh.getCell(totalRow,1).value='UKUPNO SVIH SATI'
    sh.getCell(totalRow,last).value=m.rows.length?{formula:`SUM(${sh.getColumn(last).letter}6:${sh.getColumn(last).letter}${totalRow-1})`,result:m.total/60}:0
    sh.getCell(totalRow,last).numFmt=numFmt;sh.getRow(totalRow).height=28
    for(let c=1;c<=last;c++){sh.getCell(totalRow,c).font={name:'Arial',size:11,bold:true};sh.getCell(totalRow,c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFD7EEDB'}}}
    sh.pageSetup.printArea=`A1:${sh.getColumn(last).letter}${totalRow}`
    sh.headerFooter.oddFooter='TASKER | &P / &N'
    return w
  }
  function paintPdf(PDF,document,s,m){
    const pdf=new PDF({orientation:'landscape',unit:'mm',format:'a4',compress:true})
    const canvas=document.createElement('canvas');canvas.width=2380;canvas.height=1684
    const ctx=canvas.getContext('2d'),left=64,width=2252,dayW=(width-48-165-195-100)/m.dates.length
    const widths=[48,165,195,...m.dates.map(()=>dayW),100]
    let y=0,page=0
    const wrap=(text,max)=>{const lines=[];let line='';for(const word of String(text).split(/\s+/)){for(const ch of (line?' ':'')+word){if(ctx.measureText(line+ch).width>max){lines.push(line);line=''}line+=ch}}if(line)lines.push(line);return lines.length?lines:['']}
    function box(text,x,yy,w,h,bg,fg,bold=false,align='center'){
      ctx.fillStyle='#'+bg;ctx.fillRect(x,yy,w,h);ctx.strokeStyle='#8998A5';ctx.lineWidth=1;ctx.strokeRect(x,yy,w,h)
      ctx.fillStyle='#'+fg;ctx.font=(bold?'bold ':'')+'23px Arial';ctx.textAlign=align;ctx.textBaseline='middle'
      const lines=wrap(text,w-10),start=yy+h/2-(lines.length-1)*13
      lines.forEach((line,i)=>ctx.fillText(line,align==='left'?x+5:x+w/2,start+i*26))
    }
    function start(){ctx.fillStyle='#fff';ctx.fillRect(0,0,2380,1684);ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle='#19354B';ctx.font='bold 38px Arial';ctx.fillText(title.toLocaleUpperCase('hr-HR'),left,64);ctx.font='bold 29px Arial';ctx.fillText(s.site||'Projekt / Gradilište nije upisano',left,110,width);ctx.font='26px Arial';ctx.fillText(monthName(s).toLocaleUpperCase('hr-HR'),left,152);ctx.font='21px Arial';ctx.fillText('Žuto: odrađeni sati   |   –: bez sati   |   Crveno: prestanak rada   |   Ljubičasto: vikend',left,187);y=212;let x=left;['R.br.','Ime','Prezime',...m.dates.map((d,i)=>i+1),'UKUPNO'].forEach((text,i)=>{box(text,x,y,widths[i],52,'19354B','FFFFFF',true);x+=widths[i]});y+=52}
    function finish(){ctx.font='20px Arial';ctx.fillStyle='#42576B';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(`TASKER · ${s.month} · Stranica ${page+1}`,left,1645);if(page++)pdf.addPage();pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,297,210,undefined,'FAST')}
    start()
    m.rows.forEach((r,i)=>{
      ctx.font='23px Arial';const height=Math.max(42,Math.max(wrap(r.employee.first,155).length,wrap(r.employee.last,185).length)*26+12)
      if(y+height>1530){finish();start()}
      const values=[i+1,r.employee.first,r.employee.last,...r.cells.map(v=>v>0?number(v):'–'),r.total>0?number(r.total):'–'];let x=left
      values.forEach((text,j)=>{const kind=j<3?'identity':j===values.length-1?'total':'day',bg=color(s,r,i,kind,m.dates[j-3],r.cells[j-3]);box(text,x,y,widths[j],height,bg,bg==='A92F3B'?'FFFFFF':'111111',kind==='total',j===1||j===2?'left':'center');x+=widths[j]});y+=height
    })
    if(y+62>1560){finish();start()}
    box('UKUPNO SVIH SATI',left,y,width-150,56,'D7EEDB','111111',true,'left');box(number(m.total),left+width-150,y,150,56,'D7EEDB','111111',true)
    finish();return pdf.output('blob')
  }
  const api={workbook,paintPdf,color,monthName}
  if(typeof module==='object'&&module.exports){module.exports=api;return}
  let busy=false,prepared=null
  const loading={}
  function library(key,url,test){if(test())return Promise.resolve(test());if(!loading[key])loading[key]=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=()=>{if(test())resolve(test());else{delete loading[key];reject(Error('Dodatak za izvoz nije dostupan.'))}};script.onerror=()=>{delete loading[key];script.remove();reject(Error('Provjerite internet i ponovite izvoz.'))};document.head.append(script)});return loading[key]}
  function download(file){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
  const el=id=>document.getElementById(id)
  function status(text){if(el('eh-export-status'))el('eh-export-status').textContent=text}
  function modal(){
    el('eh-share-dialog')?.remove();const dialog=document.createElement('dialog');dialog.id='eh-share-dialog'
    dialog.innerHTML='<h2>Dokument je spreman</h2><p id="eh-share-name"></p><p id="eh-share-help"></p><div class="eh-share-buttons"><button id="eh-native-share">Podijeli dokument</button><button id="eh-share-download">Preuzmi dokument</button><button id="eh-share-fallback">Otvori poruku</button><button id="eh-share-close">Zatvori</button></div><p id="eh-share-result" role="status"></p>'
    document.body.append(dialog);el('eh-share-name').textContent=prepared.file.name
    let can=false;try{can=!!navigator.canShare?.({files:[prepared.file]})}catch{}
    el('eh-native-share').hidden=!can
    el('eh-share-help').textContent=can?'Kliknite Podijeli dokument i odaberite '+(prepared.channel==='whatsapp'?'WhatsApp':'aplikaciju za e-mail')+'.':'Preuzmite dokument, otvorite poruku i dodajte preuzetu datoteku kao prilog.'
    el('eh-share-fallback').textContent=prepared.channel==='whatsapp'?'Otvori WhatsApp':'Otvori e-mail'
    dialog.showModal()
  }
  document.addEventListener('tasker-hours-export',async event=>{
    if(busy)return
    busy=true;status('Pripremam dokument…')
    try{
      const {state:s,action,format}=event.detail,m=root.TaskerHoursModel.month(s)
      if(!m.rows.length)throw Error('Prvo dodajte zaposlene za izvoz evidencije.')
      const type=action==='excel'?'xlsx':action==='pdf'?'pdf':format==='xlsx'?'xlsx':'pdf'
      let blob
      if(type==='xlsx'){const Excel=await library('excel','https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',()=>root.ExcelJS);const w=workbook(Excel,s,m);blob=new Blob([await w.xlsx.writeBuffer()],{type:mimeXlsx})}
      else{const PDF=await library('pdf','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>root.jspdf?.jsPDF);blob=paintPdf(PDF,document,s,m)}
      const site=(s.site||'Gradiliste').replace(/[^\p{L}\p{N}-]+/gu,'-').slice(0,65),file=new File([blob],`Radni-sati-${s.month}-${site}.${type}`,{type:blob.type})
      prepared={file,channel:action,subject:`Radni sati – ${s.site||'Gradilište'} – ${monthName(s)}`,text:`Mjesečna evidencija radnih sati\n${s.site||'Gradilište'}\n${monthName(s)}\nUkupno svih sati: ${number(m.total)} h`}
      if(action==='excel'||action==='pdf'){download(file);status('Dokument je pripremljen za preuzimanje: '+file.name)}else{modal();status('Dokument je spreman za dijeljenje.')}
    }catch(e){status('Izvoz nije uspio: '+e.message)}finally{busy=false}
  })
  document.addEventListener('click',async event=>{
    if(!event.target.closest('#eh-share-dialog'))return
    if(event.target.closest('#eh-share-close')){el('eh-share-dialog').close();return}
    if(!prepared)return
    if(event.target.closest('#eh-share-download'))download(prepared.file)
    if(event.target.closest('#eh-share-fallback')){const url=prepared.channel==='whatsapp'?'https://wa.me/?text='+encodeURIComponent(prepared.text):'mailto:?subject='+encodeURIComponent(prepared.subject)+'&body='+encodeURIComponent(prepared.text);if(prepared.channel==='whatsapp')window.open(url,'_blank','noopener');else window.location.href=url;el('eh-share-result').textContent='U poruku dodajte preuzeti dokument kao prilog.'}
    if(event.target.closest('#eh-native-share')){try{await navigator.share({files:[prepared.file],title:prepared.subject});el('eh-share-result').textContent='Dokument je predan aplikaciji za dijeljenje.'}catch(e){el('eh-share-result').textContent=e.name==='AbortError'?'Dijeljenje je otkazano.':'Dijeljenje nije dostupno. Preuzmite dokument i dodajte ga poruci.'}}
  })
  const style=document.createElement('style');style.textContent='#eh-share-dialog{max-width:520px;width:calc(100% - 40px);box-sizing:border-box;background:#142b44;color:#e7f4ff;border:1px solid #4c90aa;border-radius:16px;padding:24px}#eh-share-dialog::backdrop{background:#03101dd9}#eh-share-dialog p{line-height:1.5;overflow-wrap:anywhere}#eh-share-dialog .eh-share-buttons{display:flex;gap:10px;flex-wrap:wrap}#eh-share-dialog button{padding:12px;border:1px solid #54b7d1;border-radius:9px;background:#174762;color:white;cursor:pointer}#eh-share-dialog button[hidden]{display:none}#employee-hours-project #eh-export-format{background:#10273e;color:#fff;border:1px solid #3a6683;border-radius:8px;padding:10px}#employee-hours-project #eh-export-status{font-size:13px;color:#9cedcf}'
  document.head.append(style)
})(typeof window==='object'?window:globalThis)

