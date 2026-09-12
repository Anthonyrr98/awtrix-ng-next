function cfgDef(f){
  const d={w:f.type==='bool'?'toggle':f.type,l:f.label||f.key,h:f.help||'',plain:1,
    min:f.min,max:f.max,step:f.step,unit:f.unit,dflt:f.default};
  if(f.type==='select')d.opt=(f.options||[]).map(o=>[o,o]);
  return d;
}
const warnBadge=w=>el('div',{class:'badge bad',title:t('cfgWarnH')},w);
const errText=(name,e)=>'ERR:'+name+(e.line?' ('+t('scrline')+' '+e.line+')':'')+' - '+e.message;
const errBadge=(name,e)=>el('div',{class:'badge bad'},errText(name,e));
const metaBits=m=>[m.desc||null,m.author?'by '+m.author:null,m.version?'v'+m.version:null];
function editBtn(a){
  const b=el('button',{class:'icon',title:t('edit')},'✎');
  b.addEventListener('click',()=>{scrPending={name:a.name,error:a.error||null};location.hash='#/scripts';});
  return b;
}
async function fillConfigPanel(name,box,saveError){
  box.replaceChildren(el('div',{class:'mono'},t('cfgLoading')));
  let d;
  try{({data:d}=await api('/api/v1/apps/'+encodeURIComponent(name)+'/config'));}
  catch(e){
    box.replaceChildren(el('div',{class:'badge bad'},e.message));
    return false;
  }

  const fields=(d&&Array.isArray(d.fields))?d.fields:[];
  const warnings=(d&&Array.isArray(d.warnings))?d.warnings:[];
  if(!fields.length){
    box.replaceChildren(...warnings.map(warnBadge),el('div',{class:'mono'},t('cfgNone')));
    return true;
  }
  const rows=fields.map(f=>mkField(f.key,cfgDef(f),f.value,paint));
  const save=el('button',{class:'pri'},t('save'));
  const disc=el('button',null,t('discard'));
  const defs=el('button',{title:t('cfgDefaults')},'↺');
  const err=el('div',{class:'badge bad'});
  err.hidden=!saveError;
  if(saveError)err.replaceChildren(errText(name,saveError));
  const bar=el('div',{class:'cfgbar'},defs,el('span',{class:'grow'}),disc,save);
  function paint(){
    const dirty=rows.some(m=>m.dirty());
    save.disabled=!dirty;disc.disabled=!dirty;
  }
  save.addEventListener('click',async()=>{
    const body={};
    rows.forEach(m=>{if(m.dirty())body[m.key]=m.get();});
    if(!Object.keys(body).length)return;
    save.disabled=true;
    try{
      const{data}=await req('PATCH','/api/v1/apps/'+encodeURIComponent(name)+'/config',body);
      if(!(data&&data.error))toast(t('cfgSaved'));
      await fillConfigPanel(name,box,data&&data.error);
      return;
    }catch(e){toast(e.message,false);}
    paint();
  });
  disc.addEventListener('click',()=>{rows.forEach(m=>m.revert());paint();});
  defs.addEventListener('click',()=>{
    rows.forEach(m=>{if(m.def.dflt!==undefined)m.fill(m.def.dflt);});
    paint();
  });

  box.replaceChildren(...warnings.map(warnBadge),...rows.map(m=>m.row),err,bar);
  paint();
  return true;
}

async function fillGifGalleryPanel(box){
  box.replaceChildren(el('div',{class:'mono'},t('cfgLoading')));
  try{
    const [settings,files]=await Promise.all([
      api('/api/v1/settings'),
      api('/api/v1/files?dir='+encodeURIComponent('/ICONS'),{cache:'no-store'}),
    ]);
    const ids=(files.data.files||[]).filter(f=>/\.gif$/i.test(f.name))
      .map(f=>f.name.replace(/\.[^.]+$/,'')).sort((a,b)=>a.localeCompare(b));
    let mode=settings.data.gifGalleryMode||'rotation';
    let initialIcons=settings.data.gifGalleryIcons||'';
    let selected=initialIcons
      ?initialIcons.split(',').map(x=>x.trim()).filter(x=>ids.includes(x))
      :ids.slice();
    let initialSelection=selected.join(',');
    const availableBox=el('div',{style:'display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end'});
    const selectedBox=el('div',{style:'display:grid;gap:6px;min-width:240px'});
    const selectAll=el('button',{type:'button'},t('gifSelectAll'));
    const clearAll=el('button',{type:'button'},t('gifClearAll'));
    selectAll.addEventListener('click',()=>{selected=ids.slice();paintIcons();});
    clearAll.addEventListener('click',()=>{selected=[];paintIcons();});
    const choices=[
      ['rotation','gifModeRotation','gifModeRotationH'],
      ['continuous','gifModeContinuous','gifModeContinuousH'],
    ].map(([value,label,help])=>{
      const input=el('input',{type:'radio',name:'gifGalleryMode',value,checked:mode===value});
      return{value,input,node:el('label',{class:'frow'},
        el('div',{class:'lab'},el('div',{class:'l1'},el('b',null,t(label))),
          el('div',{class:'help'},t(help))),el('div',{class:'ctl'},input))};
    });
    const save=el('button',{class:'pri'},t('save'));
    save.disabled=true;
    const serialized=()=>selected.join(',');
    const dirty=()=>mode!==(settings.data.gifGalleryMode||'rotation')||serialized()!==initialSelection;
    function paintIcons(){
      availableBox.replaceChildren(...ids.map(id=>{
        const on=selected.includes(id);
        const b=el('button',{type:'button',class:on?'pri':'',title:on?t('gifRemove'):t('gifAdd')},
          (on?'✓ ':'＋ ')+id);
        b.addEventListener('click',()=>{
          selected=on?selected.filter(x=>x!==id):[...selected,id];paintIcons();
        });
        return b;
      }));
      if(!ids.length)availableBox.replaceChildren(el('span',{class:'mono'},t('gifNoIds')));
      selectedBox.replaceChildren(...selected.map((id,i)=>{
        const up=el('button',{type:'button',disabled:i===0,title:t('gifUp')},'↑');
        const down=el('button',{type:'button',disabled:i===selected.length-1,title:t('gifDown')},'↓');
        const remove=el('button',{type:'button',class:'danger',title:t('gifRemove')},'×');
        up.addEventListener('click',()=>{[selected[i-1],selected[i]]=[selected[i],selected[i-1]];paintIcons();});
        down.addEventListener('click',()=>{[selected[i],selected[i+1]]=[selected[i+1],selected[i]];paintIcons();});
        remove.addEventListener('click',()=>{selected.splice(i,1);paintIcons();});
        return el('div',{class:'row',style:'gap:6px'},el('span',{class:'mono grow'},(i+1)+'. '+id),up,down,remove);
      }));
      if(!selected.length)selectedBox.replaceChildren(el('span',{class:'mono'},t('gifNoneSelected')));
      save.disabled=!dirty();
    }
    choices.forEach(c=>c.input.addEventListener('change',()=>{
      mode=c.value;save.disabled=!dirty();
    }));
    save.addEventListener('click',async()=>{
      save.disabled=true;
      try{
        const iconsValue=serialized()===initialSelection?initialIcons:serialized();
        await req('PATCH','/api/v1/settings',{
          gifGalleryMode:mode,gifGalleryIcons:iconsValue});
        settings.data.gifGalleryMode=mode;initialIcons=iconsValue;initialSelection=serialized();toast(t('cfgSaved'));
      }catch(e){toast(e.message,false);save.disabled=false;}
    });
    box.replaceChildren(
      el('div',{class:'frow'},
        el('div',{class:'lab'},el('div',{class:'l1'},el('b',null,t('gifIconIds'))),
          el('div',{class:'help'},t('gifIconIdsH'))),
        el('div',{class:'ctl',style:'display:grid;gap:8px'},
          el('div',{class:'row',style:'justify-content:flex-end'},selectAll,clearAll),availableBox)),
      el('div',{class:'frow'},
        el('div',{class:'lab'},el('div',{class:'l1'},el('b',null,t('gifPlayOrder'))),
          el('div',{class:'help'},t('gifPlayOrderH'))),
        el('div',{class:'ctl'},selectedBox)),
      ...choices.map(c=>c.node),
      el('div',{class:'cfgbar'},el('span',{class:'grow'}),save));
    paintIcons();
    return true;
  }catch(e){
    box.replaceChildren(el('div',{class:'badge bad'},e.message));
    return false;
  }
}
async function viewApps(view){
  let loop=[],background=[],disabled=[],modules=[],scenes=[],activeScene='',orig='[]',dragFrom=null;
  const panels=new Map();
  let panelTaken=new Set();
  const loopList=el('div',{class:'applist tiles'});
  const bgList=el('div',{class:'applist'});
  const disabledList=el('div',{class:'applist'});
  const modList=el('div',{class:'applist'});
  const bgCard=el('div',{class:'card wide'},el('h2',null,t('background')),
    el('div',{class:'ghelp'},t('backgroundH')),bgList);
  const disabledCard=el('div',{class:'card wide'},el('h2',null,t('disabledapps')),
    el('div',{class:'ghelp'},t('disabledH')),disabledList);
  const modCard=el('div',{class:'card wide'},el('h2',null,t('modules')),
    el('div',{class:'ghelp'},t('modulesH')),modList);
  const sceneSelect=el('select');
  const sceneName=el('input',{placeholder:t('sceneName'),maxlength:'32'});
  const sceneSave=el('button',{class:'pri'},t('sceneSave'));
  const sceneApply=el('button',null,t('sceneApply'));
  const sceneDelete=el('button',{class:'danger'},t('sceneDelete'));
  const sceneCard=el('div',{class:'card wide'},el('h2',null,t('scenes')),
    el('div',{class:'ghelp'},t('scenesH')),
    el('div',{class:'frow full'},sceneSelect,sceneName,sceneSave,sceneApply,sceneDelete));
  const{bar,saveBtn,discBtn,show:showBar}=saveBar();
  const names=()=>[...loop.map(a=>a.name),...background.map(a=>a.name)];
  const offNames=()=>disabled.map(a=>a.name);
  const mark=()=>JSON.stringify([names(),offNames()]);
  const dirty=()=>mark()!==orig;
  const offBanner=el('div',{class:'banner',style:'display:none'},'⏸ ',
    el('span',{class:'grow'},t('appsscroff')));

  function paintScenes(){
    sceneSelect.replaceChildren(el('option',{value:''},t('sceneNone')),
      ...scenes.map(s=>el('option',{value:s.name},s.name)));
    sceneSelect.value=scenes.some(s=>s.name===activeScene)?activeScene:'';
    sceneApply.disabled=sceneDelete.disabled=!sceneSelect.value;
  }

  const saveOrder=body=>req('PUT','/api/v1/apps/order',body);
  sceneSelect.addEventListener('change',()=>{
    activeScene=sceneSelect.value;
    sceneName.value=activeScene;
    sceneApply.disabled=sceneDelete.disabled=!activeScene;
  });
  sceneSave.addEventListener('click',async()=>{
    const name=sceneName.value.trim();
    if(!name){sceneName.focus();return;}
    const next={name,order:names(),disabled:offNames()};
    const at=scenes.findIndex(s=>s.name===name);
    if(at<0)scenes.push(next);else scenes[at]=next;
    activeScene=name;sceneSave.disabled=true;
    try{await saveOrder({order:names(),disabled:offNames(),scenes,activeScene});toast(t('saved'));await reload();}
    catch(e){toast(e.message,false);}
    sceneSave.disabled=false;
  });
  sceneApply.addEventListener('click',async()=>{
    const s=scenes.find(x=>x.name===sceneSelect.value);if(!s)return;
    sceneApply.disabled=true;
    try{await saveOrder({order:s.order,disabled:s.disabled,scenes,activeScene:s.name});toast(t('saved'));await reload();}
    catch(e){toast(e.message,false);}
    sceneApply.disabled=false;
  });
  sceneDelete.addEventListener('click',async()=>{
    const name=sceneSelect.value;if(!name)return;
    scenes=scenes.filter(s=>s.name!==name);activeScene='';sceneDelete.disabled=true;
    try{await saveOrder({order:names(),disabled:offNames(),scenes,activeScene});toast(t('deleted'));await reload();}
    catch(e){toast(e.message,false);}
    sceneDelete.disabled=false;
  });

  function closeCfgBtn(box){
    const b=el('button',{class:'mbtn icon pri',title:t('cfgHide')},'✕');
    b.addEventListener('click',()=>{box.hidden=true;render();});
    return b;
  }

  function cfgPanel(a){
    if(!a.config||panelTaken.has(a.name))return[null,null];
    panelTaken.add(a.name);
    let box=panels.get(a.name);
    if(!box){box=el('div',{class:'appcfg',hidden:'hidden'});panels.set(a.name,box);}
    const toggle=async()=>{
      const open=box.hidden;
      box.hidden=!open;
      render();
      if(open&&!box.dataset.loaded&&await fillConfigPanel(a.name,box))box.dataset.loaded='1';
    };
    return[toggle,box];
  }

  function appRow(a,idx,mode){
    const inLoop=mode==='loop';
    const row=el('div',{class:'approw '+mode+(mode==='off'?' off':'')});
    const grip=inLoop?el('span',{class:'grip',title:t('dragord')},'⠿'):null;
    if(inLoop){
      grip.addEventListener('pointerdown',e=>{
        e.preventDefault();
        try{grip.setPointerCapture(e.pointerId);}catch(_){}
        dragFrom=idx;
        const doc=row.ownerDocument;
        const rect=row.getBoundingClientRect();
        const offsetX=e.clientX-rect.left;
        const offsetY=e.clientY-rect.top;
        const dragLayer=el('div',{class:'draglayer tiles'});
        const dragGhost=row.cloneNode(true);
        dragGhost.classList.add('dragghost');
        dragGhost.style.width=rect.width+'px';
        dragGhost.style.height=rect.height+'px';
        dragLayer.append(dragGhost);
        doc.body.append(dragLayer);
        doc.body.classList.add('dragging-app');
        const moveGhost=ev=>{
          dragGhost.style.transform='translate3d('+(ev.clientX-offsetX)+'px,'+(ev.clientY-offsetY)+'px,0)';
        };
        moveGhost(e);
        row.classList.add('dragplace');
        const over=ev=>{
          moveGhost(ev);
          const at=doc.elementFromPoint?doc.elementFromPoint(ev.clientX,ev.clientY):null;
          const cell=at&&at.closest?at.closest('.approw'):null;
          const under=cell?[...loopList.children].indexOf(cell):-1;
          if(under<0||dragFrom==null||under===dragFrom)return;
          const[m]=loop.splice(dragFrom,1);loop.splice(under,0,m);
          if(under>dragFrom)loopList.insertBefore(row,cell.nextSibling);
          else loopList.insertBefore(row,cell);
          dragFrom=under;
          [...loopList.children].forEach((item,pos)=>{
            const label=item.querySelector('.pos');
            if(label)label.textContent=pos+1;
          });
        };
        const done=()=>{
          doc.removeEventListener('pointermove',over);
          doc.removeEventListener('pointerup',done);
          doc.removeEventListener('pointercancel',done);
          dragLayer.remove();
          doc.body.classList.remove('dragging-app');
          dragFrom=null;render();
        };
        doc.addEventListener('pointermove',over);
        doc.addEventListener('pointerup',done);
        doc.addEventListener('pointercancel',done);
      });
    }
    const showNow=async()=>{
      try{await req('PUT','/api/v1/apps/active',{name:a.name});toast(t('shown'));}
      catch(e){toast(e.message,false);}
    };
    const deactivate=()=>{
      if(inLoop){
        loop.splice(idx,1);
        if(loop.some(x=>x.name===a.name)){render();return;}
      }else background=background.filter(x=>x!==a);
      disabled.push(a);
      render();
    };
    const duplicate=()=>{loop.splice(idx+1,0,a);render();};
    const activate=()=>{
      disabled=disabled.filter(x=>x!==a);
      if(a.headless)background=[...background,a].sort((x,y)=>x.name<y.name?-1:1);
      else loop.push(a);
      render();
    };
    const scr=a.origin==='script';
    const pushed=a.origin==='pushed';
    const own=scr||pushed;
    const drop=()=>{
      loop=loop.filter(x=>x!==a);
      background=background.filter(x=>x!==a);
      disabled=disabled.filter(x=>x!==a);
      render();
    };
    const remove=async()=>{
      try{
        await req('DELETE','/api/v1/apps/'+encodeURIComponent(a.name));
        toast(t('deleted'));drop();
      }catch(e){toast(e.message,false);}
    };
    let[toggleCfg,cfgBox]=(scr||a.name==='GIFGallery')
      ?cfgPanel(a.name==='GIFGallery'?{...a,config:true}:a):[null,null];
    if(a.name==='GIFGallery'&&toggleCfg){
      toggleCfg=async()=>{
        const open=cfgBox.hidden;
        cfgBox.hidden=!open;
        render();
        if(open)await fillGifGalleryPanel(cfgBox);
      };
    }
    const menu=cfgBox&&!cfgBox.hidden
      ?el('div',{class:'rowmenu'},closeCfgBtn(cfgBox))
      :rowMenu([
        inLoop?[t('switchto'),showNow]:null,
        inLoop?[t('dupapp'),duplicate]:null,
        toggleCfg?[t('cfgTitle'),toggleCfg]:null,
        scr?[t('edit'),()=>{scrPending={name:a.name,error:a.error||null};location.hash='#/scripts';}]:null,
        mode==='off'?[t('activate'),activate]:[t('deactivate'),deactivate],
        (pushed||a.present===false)?[t('del'),remove,true]:null,
      ]);
    const m=a.meta||{};
    const bits=[m.name&&m.name!==a.name?a.name:null,...metaBits(m)].filter(Boolean);
    row.title=[m.name||a.name,...bits].join(' · ');
    [grip,
     inLoop?el('span',{class:'pos'},String(idx+1)):null,
     el('div',{class:'rowmain'},
       el('span',{class:'nm'},m.name||a.name,
         bits.length?el('span',{class:'sub'},bits.join(' · ')):null),
       el('span',{class:'rowbadges'},
         own?el('span',{class:'chip'+(scr?' s':'')},t(scr?'chipScript':'chipPushed')):null,
         inLoop&&a.skipped?el('span',{class:'chip skip',title:t('chipSkipH')},t('chipSkip')):null,
         a.present===false?el('span',{class:'chip skip',title:t('chipGoneH')},t('chipGone')):null,
         a.error?errBadge(a.name,a.error):null)),
     menu,
     cfgBox,
    ].forEach(n=>{if(n)row.append(n);});
    return row;
  }

  function modRow(a){
    const row=el('div',{class:'approw'});
    const m=a.meta||{};
    const bits=[t('modimport')+' '+(a.import||a.name),...metaBits(m)].filter(Boolean);
    const[toggleCfg,cfgBox]=cfgPanel(a);
    [el('div',{class:'rowmain'},
       el('span',{class:'nm'},m.name||a.name,el('span',{class:'sub'},bits.join(' · '))),
       el('span',{class:'chip s'},t('chipModule')),
       a.error?errBadge(a.name,a.error):null),
     rowMenu([
       toggleCfg?[t('cfgTitle'),toggleCfg]:null,
       [t('edit'),()=>{scrPending={name:a.name,error:a.error||null};location.hash='#/scripts';}],
     ]),
     cfgBox,
    ].forEach(n=>{if(n)row.append(n);});
    return row;
  }

  function render(){
    panelTaken=new Set();
    loopList.replaceChildren(...loop.map((a,i)=>appRow(a,i,'loop')));
    if(!loop.length)loopList.replaceChildren(el('div',{class:'mono'},t('noapps')));
    bgList.replaceChildren(...background.map(a=>appRow(a,-1,'bg')));
    if(!background.length)bgList.replaceChildren(el('div',{class:'mono'},t('nobackground')));
    bgCard.style.display=background.length?'':'none';
    disabledList.replaceChildren(...disabled.map(a=>appRow(a,-1,'off')));
    disabledCard.style.display=disabled.length?'':'none';
    const shown=modules.filter(a=>a.config||a.error);
    modList.replaceChildren(...shown.map(modRow));
    modCard.style.display=shown.length?'':'none';
    showBar(dirty()?1:0);
  }

  async function reload(){
    const{data}=await api('/api/v1/apps');
    let all=Array.isArray(data)?data:[];
    const scrOff=await scriptsOff();
    if(scrOff)all=all.filter(a=>a.origin!=='script'&&a.origin!=='module');
    offBanner.style.display=scrOff?'':'none';
    modules=all.filter(a=>a.origin==='module').sort((x,y)=>x.name<y.name?-1:1);
    all=all.filter(a=>a.origin!=='module');
    loop=all.filter(a=>a.inLoop||(a.enabled&&!a.headless));
    background=all.filter(a=>!a.inLoop&&a.enabled&&a.headless)
                  .sort((x,y)=>x.name<y.name?-1:1);
    disabled=all.filter(a=>!a.enabled);
    try{
      const r=await fetch('/apploop.json',{cache:'no-store'});
      if(r.ok){const saved=await r.json();scenes=Array.isArray(saved.scenes)?saved.scenes:[];activeScene=saved.activeScene||'';}
    }catch(_){scenes=[];activeScene='';}
    orig=mark();
    paintScenes();
    render();
  }

  saveBtn.addEventListener('click',async()=>{
    saveBtn.disabled=true;
    try{
      await saveOrder({order:names(),disabled:offNames(),scenes,activeScene:''});
      toast(t('orderSaved'));
      await reload();
    }catch(e){toast(e.message,false);}
    saveBtn.disabled=false;
  });
  discBtn.addEventListener('click',()=>reload().catch(e=>toast(e.message,false)));

  view.append(offBanner);
  view.append(
    el('div',{class:'card wide'},el('h2',null,t('apploop')),
      el('div',{class:'ghelp'},t('apploopH')),loopList),
    bgCard,
    disabledCard,
    modCard,
    sceneCard,
    bar);
  try{await reload();}
  catch(e){view.replaceChildren(el('div',{class:'card wide'},t('neterr')));}
}
