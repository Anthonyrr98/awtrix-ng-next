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
async function viewApps(view){
  let loop=[],background=[],disabled=[],modules=[],scenes=[],activeScene='',orig='[]',dragFrom=null;
  const panels=new Map();
  let panelTaken=new Set();
  const loopList=el('div',{class:'applist'});
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
    const row=el('div',{class:'approw'+(mode==='off'?' off':'')});
    const grip=inLoop?el('span',{class:'grip',title:t('dragord')},'⠿'):null;
    if(inLoop){
      grip.addEventListener('pointerdown',e=>{
        e.preventDefault();
        try{grip.setPointerCapture(e.pointerId);}catch(_){}
        dragFrom=idx;
        row.classList.add('dover');
        const doc=row.ownerDocument;
        const over=ev=>{
          const at=doc.elementFromPoint(ev.clientX,ev.clientY);
          const cell=at&&at.closest?at.closest('.approw'):null;
          const under=cell?[...loopList.children].indexOf(cell):-1;
          if(under<0||dragFrom==null||under===dragFrom)return;
          const[m]=loop.splice(dragFrom,1);loop.splice(under,0,m);
          dragFrom=under;render();
          const moved=loopList.children[under];
          if(moved)moved.classList.add('dover');
        };
        const done=()=>{
          doc.removeEventListener('pointermove',over);
          doc.removeEventListener('pointerup',done);
          doc.removeEventListener('pointercancel',done);
          dragFrom=null;row.classList.remove('dover');render();
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
    const[toggleCfg,cfgBox]=scr?cfgPanel(a):[null,null];
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
    [grip,
     inLoop?el('span',{class:'pos'},String(idx+1)):null,
     el('div',{class:'rowmain'},
       el('span',{class:'nm'},m.name||a.name,
         bits.length?el('span',{class:'sub'},bits.join(' · ')):null),
       own?el('span',{class:'chip'+(scr?' s':'')},t(scr?'chipScript':'chipPushed')):null,
       inLoop&&a.skipped?el('span',{class:'chip skip',title:t('chipSkipH')},t('chipSkip')):null,
       a.present===false?el('span',{class:'chip skip',title:t('chipGoneH')},t('chipGone')):null,
       a.error?errBadge(a.name,a.error):null),
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
