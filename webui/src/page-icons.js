let assetRev=0;
async function uploadFile(file,dir,name,onProgress){
  const url=dir.startsWith('/api/')?dir:'/api/v1/files?dir='+encodeURIComponent(dir);
  const x=await xhrPost(url,'file',file,name,onProgress);
  if(x.status>=300)throw new Error('HTTP '+x.status);
  assetRev++;
}
async function delFile(path){
  await api('/api/v1/files?path='+encodeURIComponent(path),{method:'DELETE'});
  assetRev++;
}
function viewIcons(view){
  const iconsGrid=el('div',{class:'grid-icons'});
  const storSlot=el('div',{class:'wide'});
  async function reload(){
    try{
      const{data}=await api('/api/v1/files?dir='+encodeURIComponent('/ICONS'),{cache:'no-store'});
      const files=(data.files||[]).sort((a,b)=>a.name.localeCompare(b.name));
      storSlot.replaceChildren(storageCard(data));
      iconsGrid.replaceChildren(...files.map(f=>iconTile(f)));
      if(!files.length)iconsGrid.replaceChildren(el('div',{class:'empty'},t('nofiles')));
    }catch(e){toast(e.message,false);}
  }
  function iconTile(f){
    const base=f.name.replace(/\.[^.]+$/,'');
    const img=el('img',{src:'/ICONS/'+encodeURIComponent(f.name)+'?v='+f.size+'.'+assetRev,alt:f.name,loading:'lazy'});
    const pv=el('button',{title:t('preview'),'aria-label':t('preview')},icon('eye'));
    pv.addEventListener('click',async()=>{
      try{await post('/api/v1/notifications',{icon:base,text:' '+base,durationMs:3000});toast(t('shown'));}
      catch(e){toast(e.message,false);}
    });
    const ed=el('button',{title:t('edit'),'aria-label':t('edit')},icon('pen'));
    ed.addEventListener('click',()=>{pendingEditIcon=f.name;location.hash='#/editor';});
    const del=armable(el('button',{class:'danger',title:t('del'),'aria-label':t('del')},icon('trash')),async()=>{
      try{await delFile('/ICONS/'+f.name);toast(t('deleted'));reload();}catch(e){toast(e.message,false);}
    });
    return el('div',{class:'tile'},
      el('div',{class:'pw'},img,el('div',{class:'acts'},pv,ed,del)),
      el('div',{class:'ft'},el('span',{class:'nm',title:f.name},base),
        el('span',{class:'sz'},fmtBytes(f.size))));
  }
  view.append(storSlot);
  view.append(el('div',{class:'card wide'},
    el('h2',null,t('icons')),el('div',{class:'ghelp'},t('iconshelp')),
    uploadZone('/ICONS','.png,.jpg,.jpeg,.gif','⬆ '+t('upload')+' (.png / .jpg / .gif, 8×8)',reload,true),
    lametricCard(reload),
    iconsGrid));
  reload();
}
function lametricCard(onDone){
  const idIn=el('input',{type:'text',placeholder:t('lamid'),inputmode:'numeric'});
  const getBtn=el('button',null,t('fetch'));
  const saveBtn=el('button',{class:'pri',disabled:true},t('lamsave'));
  const prev=el('img',{class:'prev',style:'display:none'});
  const note=el('div',{class:'help'},navigator.onLine===false?t('lamneed'):'');
  let blob=null,ext='jpg';
  getBtn.addEventListener('click',async()=>{
    const id=idIn.value.trim().replace(/\D/g,'');
    if(!id)return;
    getBtn.disabled=true;saveBtn.disabled=true;
    try{
      const r=await fetch('https://developer.lametric.com/content/apps/icon_thumbs/'+encodeURIComponent(id));
      if(!r.ok)throw new Error('HTTP '+r.status);
      const raw=await r.blob();
      ext='gif';
      if(raw.type==='image/gif')blob=raw;
      else{
        const bmp=await createImageBitmap(raw);
        const big=bmp.width>ICON_MAX||bmp.height>ICON_MAX;
        blob=await imgToGif(bmp,big?8:0,big?8:0);
      }
      prev.src=URL.createObjectURL(blob);prev.style.display='';
      saveBtn.disabled=false;
    }catch(e){toast(e.message,false);}
    getBtn.disabled=false;
  });
  saveBtn.addEventListener('click',async()=>{
    const id=idIn.value.trim().replace(/\D/g,'');
    saveBtn.disabled=true;
    try{
      await uploadFile(blob,'/ICONS',id+'.'+ext,null);
      await dropStale('/ICONS',id+'.jpg',id+'.'+ext);
      toast(id+'.'+ext+' '+t('uploaded'));onDone();
    }catch(e){toast(e.message,false);saveBtn.disabled=false;}
  });
  if(navigator.onLine===false){idIn.disabled=true;getBtn.disabled=true;}
  idIn.classList.add('grow');
  return el('div',{class:'lam'},
    el('div',{class:'orsep'},el('span',null,t('lametric'))),
    el('div',{class:'ghelp'},t('lamhelp')),
    el('div',{class:'row'},idIn,getBtn,prev,saveBtn),note);
}
