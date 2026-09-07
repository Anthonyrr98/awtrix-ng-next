const NESTED=['scroll','weekdayBar'];
function mergeDisplayData(settings,display){
  const data={...settings,power:!!display.power,overlay:display.overlay||'',
    overlaySpeed:Math.round(((display.overlaySettings||{}).speed??1)*100)};
  for(const n of NESTED){
    for(const[k,v]of Object.entries(data[n]||{}))data[n+'.'+k]=v;
    delete data[n];
  }
  for(const k in NULLABLE)if(k in data&&data[k]==null)data[k]=NULLABLE[k];
  return data;
}
async function viewDisplay(view){
  let data;
  try{
    if(!S.transitions.length||!S.aud){
      const caps=(await api('/api/v1/capabilities')).data||{};
      if(!S.transitions.length)S.transitions=caps.transitions||[];
      if(!S.aud)readAudioCaps(caps);
    }
    data=mergeDisplayData((await api('/api/v1/settings')).data,(await api('/api/v1/display')).data);
  }catch(e){view.append(el('div',{class:'card wide'},t('neterr')));return;}
  const page=settingsPage(view,async(payload)=>{
    const disp={},set={};
    for(const[k,v]of Object.entries(payload)){
      if(k==='power')disp.power=v;
      else if(k==='overlay')disp.overlay=v===''?null:v;
      else if(k==='overlaySpeed')disp.overlaySettings={speed:v/100};
      else{
        const n=NESTED.find(p=>k.startsWith(p+'.'));
        if(n)(set[n]||(set[n]={}))[k.slice(n.length+1)]=v;
        else set[k]=(k in NULLABLE&&v===NULLABLE[k])?null:v;
      }
    }
    if(Object.keys(set).length)await req('PATCH','/api/v1/settings',set);
    if(Object.keys(disp).length)await req('PATCH','/api/v1/display',disp);
  },async()=>{});
  renderSettingsInto(page,data,FIELDS,SET_GROUPS);
  advancedSection(page,data,FIELDS,SOUND_KEYS);
}
async function viewSystem(view){
  let data;
  try{data=(await api('/api/v1/system')).data;}
  catch(e){view.append(el('div',{class:'card wide'},t('neterr')));return;}
  if(!S.sysHost){try{setStats((await api('/api/v1/device',{timeout:4000})).data);}catch(e){}}
  if(!S.gpio||!S.aud){
    try{
      const caps=(await api('/api/v1/capabilities')).data||{};
      readAudioCaps(caps);
      S.gpio=caps.gpio||null;
    }catch(e){}
    if(S.gpio)applyGpioCaps(S.gpio);
  }
  if(!S.ap){
    try{
      const set=(await api('/api/v1/settings')).data;
      SOUND_KEYS.forEach(k=>{if(k in set)data[k]=set[k];});
    }catch(e){}
    // One slider per output, each shown only where that output exists.
    const g=on=>on?'sndhw':'hidden';
    SYSF.buzzerVolume.g=g(hasSink('buzzer'));
    SYSF.dfplayerVolume.g=g(hasSink('track'));
    SYSF.mp3Volume.g=g(hasSink('mp3'));
    SYSF.radioVolume.g=g(hasSink('radio'));
    SYSF.radioMeta.g=g(hasSink('radio'));
    SYSF.soundEnabled.g=g(hasSink('buzzer','track','mp3'));
  }
  ['wifiPass','mqttPass','authPass'].forEach(k=>{if(!(k in data))data[k]='';});
  (S.ap?provisioningPage:systemPage)(view,data);
}
function systemSettingsPage(view,data){
  const rbBtn=el('button',{class:'pri'},t('rebootnow'));
  const closeBtn=el('button',{class:'bx',title:t('rbclose'),'aria-label':t('rbclose')},'✕');
  closeBtn.addEventListener('click',()=>{banner.style.display='none';});
  const banner=el('div',{class:'banner rbstick',style:'display:none'},'⚠️ ',el('span',{class:'grow'},t('rebootreq')),rbBtn,closeBtn);
  rbBtn.addEventListener('click',()=>doReboot(rbBtn));
  view.append(banner);
  const toSettings=k=>!!(SYSF[k]&&SYSF[k].api==='settings');
  const num=v=>Number(v)||0;
  let width=num(data&&data.panelWidth)*num(data&&data.panels);
  return settingsPage(view,async payload=>{
    const cfg={},set={};
    for(const[k,v]of Object.entries(payload))(toSettings(k)?set:cfg)[k]=v;
    if(Object.keys(set).length)await req('PATCH','/api/v1/settings',set);
    if(Object.keys(cfg).length)await req('PUT','/api/v1/system',cfg);
  },async payload=>{
    const keys=Object.keys(payload).filter(k=>!toSettings(k));
    const w=width?num(payload.panelWidth??data.panelWidth)*num(payload.panels??data.panels):0;
    if(keys.some(k=>REBOOT_KEYS.has(k)||!SYSF[k])||(w&&w!==width))banner.style.display='';
    if(w)width=w;
    if('panelWidth'in payload)data.panelWidth=payload.panelWidth;
    if('panels'in payload)data.panels=payload.panels;
    await loadSystemInfo();
  });
}
function provisioningPage(view,data){
  view.append(el('div',{class:'banner blue'},'📶 ',t('apbanner')));
  const page=systemSettingsPage(view,data);
  renderSettingsInto(page,data,SYSF,[['wifi','grpWifi','grpWifiH']]);
  page.section('maint',t('maint'),t('apmaintH'),
    [actionRow(t('reboot'),null,[armable(el('button',null,t('reboot')),()=>doReboot())])]);
  backupSection(page,false);
}
function systemPage(view,data){
  if(TZRULE.get(data.tzName)!==data.tz)
    data.tzName=TZFIRST.get(data.tz)||'UTC';
  const page=systemSettingsPage(view,data);
  const sysFields=renderSettingsInto(page,data,SYSF,SYS_GROUPS);
  advancedSection(page,data,SYSF);
  if(sysFields.hostname&&S.sysHost)
    sysFields.hostname.row.querySelector('input').placeholder=S.sysHost;
  if(sysFields.mqttPrefix&&S.sysUid)
    sysFields.mqttPrefix.row.querySelector('input').placeholder=S.sysUid;
  const panelSec=sysFields.panelWidth?page.panel.querySelector('#sec-panel'):null;
  if(panelSec){
    const size=el('div',{class:'badge good'});
    panelSec.querySelector('.rows').prepend(actionRow(t('pnSize'),t('pnSizeH'),[size]));
    page.onUpdate.push(()=>paintPanelSize(sysFields,size));
    page.update();
  }
  const mqSec=page.panel.querySelector('#sec-mqtt');
  if(mqSec){
    const mq=el('div',{class:'badge'});
    const testState=el('div',{class:'badge'},t('mqTestRun'));
    const testBtn=el('button',null,t('mqTestRun'));
    testBtn.addEventListener('click',async()=>{
      testBtn.disabled=true;testState.className='badge';testState.replaceChildren(t('mqTestBusy'));
      try{
        await post('/api/v1/mqtt/test');
        testState.className='badge good';testState.replaceChildren(t('mqTestOk'));
      }catch(e){
        testState.className='badge bad';testState.replaceChildren(t('mqTestFail'));
        toast(e.message,false);
      }finally{testBtn.disabled=false;}
    });
    mqSec.querySelector('.rows').prepend(
      actionRow(t('mqStatus'),t('mqStatusH'),[mq]),
      actionRow(t('mqTest'),t('mqTestH'),[testState,testBtn]));
    paintMqtt(mq,S.stats&&S.stats.mqtt);
    poller(async()=>{
      const{data}=await api('/api/v1/device',{timeout:4000});
      setStats(data);paintMqtt(mq,data.mqtt);
    },5000);
  }
  const gpioSec=(S.gpio&&S.gpio.soc!=='esp32')?null:page.panel.querySelector('#sec-gpio');
  if(gpioSec){
    const PRESETS={
      ulanzi:{pinMatrix:32,pinBtnLeft:26,pinBtnSelect:27,pinBtnRight:14,pinBattery:34,pinLdr:35,
        pinBuzzer:15,pinI2cSda:21,pinI2cScl:22,pinDfRx:23,pinDfTx:18,dfplayer:false},
      awtrix2:{pinMatrix:21,pinBtnLeft:26,pinBtnSelect:16,pinBtnRight:5,pinBattery:-1,pinLdr:36,
        pinBuzzer:-1,pinI2cSda:17,pinI2cScl:22,pinDfRx:23,pinDfTx:18,dfplayer:true}};
    const presetBtn=(lbl,id)=>{
      const b=el('button',null,lbl);
      b.addEventListener('click',()=>{
        Object.entries(PRESETS[id]).forEach(([k,v])=>{if(sysFields[k])sysFields[k].fill(v);});
        page.update();toast(t('presetApplied'));
      });
      return b;
    };
    gpioSec.querySelector('.rows').prepend(
      actionRow(t('preset'),t('presetH'),[presetBtn(t('presetUlanzi'),'ulanzi'),presetBtn(t('presetAwtrix2'),'awtrix2')]));
  }
  if(S.gpio){
    page.onUpdate.push(()=>paintPinUse(sysFields));
    const sel=sysFields.pinBtnSelect;
    if(sel&&S.gpio.rtc){
      const note=el('div',{class:'help'});
      sel.row.querySelector('.lab').append(note);
      page.onUpdate.push(()=>paintWakePin(sysFields,note));
    }
    page.update();
  }
  maintenanceSection(page);
  backupSection(page,true);
}
async function doReboot(btn){
  if(btn)btn.disabled=true;
  try{await post('/api/v1/device/reboot');}
  catch(e){toast(e.message,false);if(btn)btn.disabled=false;return;}
  toast(t('rebooting'));
  setTimeout(()=>location.reload(),9000);
}
const MQERR={noWifi:'mqeNoWifi',hostNotFound:'mqeHost',refused:'mqeRefused',
  badCredentials:'mqeAuth',rejected:'mqeRejected',timeout:'mqeTimeout',lost:'mqeLost'};
const MQSTATE={disabled:'mqoff',offline:'mqdown',connecting:'mqbusy',connected:'mqup'};
function paintMqtt(node,m){
  if(!m){node.replaceChildren();node.className='badge';return;}
  const parts=[t(MQSTATE[m.state]||'mqdown')];
  if(m.state==='connected'&&m.endpoint)parts.push(m.endpoint);
  if(m.error)parts.push(MQERR[m.error]?t(MQERR[m.error]):m.error);
  if(m.retryInMs>0)parts.push(t('mqRetry')+' '+Math.ceil(m.retryInMs/1000)+' s');
  node.className='badge'+(m.state==='connected'?' good':m.state==='offline'?' bad':'');
  node.replaceChildren(parts.join(' · '));
}
function actionRow(label,help,ctls,key){
  return el('div',{class:'frow'},
    el('div',{class:'lab'},
      el('div',{class:'l1'},el('b',null,label),key?el('span',{class:'key'},key):null),
      help?el('div',{class:'help'},help):null),
    el('div',{class:'ctl'},ctls));
}
function progressRow(){
  const fill=el('i',{style:'width:0%'});
  const row=el('div',{class:'frow full',style:'display:none'},el('div',{class:'bar'},fill));
  return{row,
    show(){fill.style.width='0%';row.style.display='';},
    hide(){row.style.display='none';},
    set(p){fill.style.width=(p*100).toFixed(1)+'%';}};
}
function maintenanceSection(page){
  const fwIn=el('input',{type:'file',accept:'.bin'});
  const fwBtn=el('button',null,t('choose'));
  const fw=progressRow();
  fwBtn.addEventListener('click',()=>fwIn.click());
  fwIn.addEventListener('change',async()=>{
    const f=fwIn.files[0];if(!f)return;
    fwBtn.disabled=true;fw.show();
    try{
      const x=await xhrPost('/update','firmware',f,f.name,
        p=>fw.set(p));
      if(x.status<300){toast(t('rebooting'));setTimeout(()=>location.reload(),12000);return;}
      throw new Error('HTTP '+x.status+' - '+x.responseText.slice(0,80));
    }catch(e){toast(e.message,false);fwBtn.disabled=false;fw.hide();}
  });
  fwIn.addEventListener('click',()=>{fwIn.value='';});
  const onlineState=el('div',{class:'badge'},t('fwCheck'));
  const onlineBtn=el('button',null,t('fwCheck'));
  const installBtn=armable(el('button',{class:'pri',style:'display:none'},t('fwInstall')),async()=>{
    if(!installBtn.asset)return;
    installBtn.disabled=true;onlineBtn.disabled=true;fw.show();
    onlineState.className='badge';onlineState.replaceChildren(t('fwDownloading'));
    try{
      onlineState.replaceChildren(t('fwBackingUp'));
      const backupCats={wifi:true,settings:true,icons:true,melodies:true,palettes:true,mp3:false,
        scripts:true,apporder:true,radio:true};
      const safety=zipStore(await collectBackup(backupCats));
      download('awtrix-pre-update-'+(S.sysHost||'awtrix')+'-'+new Date().toISOString().slice(0,10)+'.zip',
        safety,'application/zip');
      fw.set(.08);onlineState.replaceChildren(t('fwDownloading'));
      const r=await fetch(installBtn.asset.browser_download_url,{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const blob=await r.blob();fw.set(.25);
      onlineState.replaceChildren(t('fwVerifying'));
      const updateUrl='/update?sha256='+encodeURIComponent(installBtn.asset.sha256);
      onlineState.replaceChildren(t('fwUploading'));
      const x=await xhrPost(updateUrl,'firmware',blob,installBtn.asset.name,p=>fw.set(.25+p*.75));
      if(x.status<300){toast(t('rebooting'));setTimeout(()=>location.reload(),12000);return;}
      throw new Error('HTTP '+x.status+' - '+x.responseText.slice(0,80));
    }catch(e){toast(e.message,false);installBtn.disabled=false;onlineBtn.disabled=false;fw.hide();}
  });
  const releaseLink=el('a',{target:'_blank',rel:'noopener',style:'display:none'},t('fwRelease'));
  onlineBtn.addEventListener('click',async()=>{
    onlineBtn.disabled=true;installBtn.style.display='none';releaseLink.style.display='none';
    onlineState.className='badge';onlineState.replaceChildren(t('fwChecking'));
    try{
      const local=await api('/api/v1/version',{cache:'no-store'}),image=local.data.updateImage;
      const firmwareBase='https://blueforcer.github.io/awtrix-ng/firmware/';
      const manifestResponse=await fetch(firmwareBase+'release-manifest.json',{cache:'no-store'});
      if(!manifestResponse.ok)throw new Error('manifest HTTP '+manifestResponse.status);
      const manifest=await manifestResponse.json();
      const latest=String(manifest.version||'').replace(/^v/,'');
      const asset=manifest.assets&&manifest.assets[image];
      const sha256=asset&&String(asset.sha256||'').toLowerCase();
      if(!/^[0-9a-f]{64}$/.test(sha256))throw new Error('invalid release manifest');
      if(!latest||!image)throw new Error(t('fwNoAsset'));
      const current=String(local.data.version||'0');
      releaseLink.href='https://github.com/Anthonyrr98/awtrix-ng-next/releases/tag/v'+latest;releaseLink.style.display='';
      if(compareVersions(latest,current)<=0){
        onlineState.className='badge good';onlineState.replaceChildren(t('fwCurrent')+' · '+current);
      }else{
        onlineState.className='badge good';onlineState.replaceChildren('v'+latest+' '+t('fwAvailable')+' · '+t('fwVerified'));
        installBtn.asset={name:image,sha256,browser_download_url:firmwareBase+image};
        installBtn.style.display='';
      }
    }catch(e){onlineState.className='badge bad';onlineState.replaceChildren(t('fwCheckFail'));toast(e.message,false);}
    finally{onlineBtn.disabled=false;}
  });
  const rebootBtn=armable(el('button',null,t('reboot')),()=>doReboot());
  const resetBtn=armable(el('button',{class:'danger'},t('resetset')),async()=>{
    try{await post('/api/v1/settings/reset');toast(t('saved'));}catch(e){toast(e.message,false);}
  });
  const hostIn=el('input',{type:'text',placeholder:S.sysHost,autocomplete:'off'});
  const eraseBtn=el('button',{class:'danger'},t('erase'));
  eraseBtn.addEventListener('click',async()=>{
    if(!S.sysHost||hostIn.value!==S.sysHost){toast(t('eraseNo'),false);return;}
    eraseBtn.disabled=true;
    try{await post('/api/v1/device/factory-reset');toast(t('rebooting'));setTimeout(()=>location.reload(),12000);}
    catch(e){toast(e.message,false);eraseBtn.disabled=false;}
  });
  const ver=S.stats&&S.stats.version;
  page.section('maint',t('maint'),t('mainthelp'),[
    actionRow(t('fwOnline'),t('fwOnlineH'),[onlineState,releaseLink,installBtn,onlineBtn]),
    actionRow(t('fwfile'),ver?t('version')+' '+ver:null,[fwBtn,fwIn]),
    fw.row,
    actionRow(t('reboot'),null,[rebootBtn]),
    actionRow(t('resetset'),t('resetsetH'),[resetBtn]),
    actionRow(t('factory'),t('factoryH'),[hostIn,eraseBtn]),
  ]);
}
function compareVersions(a,b){
  const pa=String(a).split('.').map(Number),pb=String(b).split('.').map(Number);
  for(let i=0;i<Math.max(pa.length,pb.length);i++){
    const d=(pa[i]||0)-(pb[i]||0);if(d)return d;
  }
  return 0;
}
const BK_CATS=[['wifi','bkWifi'],['settings','bkSettings'],['icons','bkIcons'],
  ['melodies','bkMelodies'],['palettes','bkPalettes'],['mp3','bkMp3'],
  ['scripts','bkScripts'],['apporder','bkApporder'],['radio','bkRadio']];
function backupSection(page,allowBackup){
  const rows=[];
  if(allowBackup){
    const checks={};
    const avail=BK_CATS.filter(([id])=>
      (id!=='melodies'||hasSink('buzzer'))&&(id!=='mp3'||hasSink('mp3')));
    const allCb=el('input',{type:'checkbox',checked:''});
    const boxes=avail.map(([id,lbl])=>{
      const cb=el('input',{type:'checkbox',checked:''});checks[id]=cb;
      cb.addEventListener('change',()=>{allCb.checked=avail.every(([x])=>checks[x].checked);});
      return el('label',{style:'display:inline-flex;align-items:center;gap:.3rem;margin-right:1rem'},cb,t(lbl));
    });
    allCb.addEventListener('change',()=>avail.forEach(([id])=>{checks[id].checked=allCb.checked;}));
    boxes.unshift(el('label',{style:'display:inline-flex;align-items:center;gap:.3rem;margin-right:1rem;font-weight:600'},allCb,t('bkAll')));
    const dl=el('button',{class:'pri'},t('bkDownload'));
    dl.addEventListener('click',async()=>{
      const cats={};let any=false;
      avail.forEach(([id])=>{cats[id]=checks[id].checked;if(cats[id])any=true;});
      if(!any){toast(t('bkNone'),false);return;}
      dl.disabled=true;dl.replaceChildren(t('bkWorking'));
      try{
        const blob=zipStore(await collectBackup(cats));
        download('awtrix-backup-'+(S.sysHost||'awtrix')+'-'+new Date().toISOString().slice(0,10)+'.zip',blob,'application/zip');
        toast(t('bkDone'));
      }catch(e){toast(e.message,false);}
      dl.disabled=false;dl.replaceChildren(t('bkDownload'));
    });
    rows.push(el('div',{class:'frow full'},el('div',null,...boxes)));
    rows.push(actionRow(t('bkTitle'),t('bkDownloadH'),[dl]));
  }
  if(!allowBackup)
    rows.push(el('div',{class:'banner blue captive-hint'},
      el('span',null,t('bkCaptiveHint')),
      el('a',{href:'http://192.168.4.1/'},'192.168.4.1')));
  const rsIn=el('input',{type:'file',accept:'.zip,application/zip'});
  const rsBtn=el('button',null,t('bkRestore'));
  const rs=progressRow();
  rsBtn.addEventListener('click',()=>rsIn.click());
  rsIn.addEventListener('click',()=>{rsIn.value='';});
  rsIn.addEventListener('change',async()=>{
    const f=rsIn.files[0];if(!f)return;
    rsBtn.disabled=true;rs.show();
    try{
      const r=await restoreBackup(f,p=>rs.set(p));
      const a=r.applied||{},wl=r.warnings||[];
      toast(t('bkRestored')+(wl.length?' - '+wl.length+' '+t('bkWarnings'):''));
      wl.slice(0,5).forEach(w=>toast(w,false));
      if(a.wifi||a.system||a.settings||a.appLoop)
        toast(t('bkRebootQ'),true,[{label:t('rebootnow'),pri:true,fn:()=>doReboot()}]);
    }catch(e){toast(e.message,false);}
    rsBtn.disabled=false;rs.hide();
  });
  rows.push(actionRow(t('bkRestoreT'),allowBackup?t('bkRestoreH'):null,[rsBtn,rsIn]));
  rows.push(rs.row);
  page.section('backup',allowBackup?t('bkSection'):t('bkSectionAp'),allowBackup?t('bkSectionH'):t('bkSectionApH'),rows);
}
function storageCard(listData){
  const used=listData.usedBytes||0,total=listData.totalBytes||1;
  return el('div',{class:'card storage wide'},
    el('h2',null,t('storage')),
    el('div',{class:'bar'},el('i',{class:used/total>0.9?'hot':'',style:'width:'+(used/total*100).toFixed(1)+'%'})),
    el('div',{class:'lbl'},el('span',null,fmtBytes(used)+' '+t('of')+' '+fmtBytes(total)),
      el('span',null,fmtBytes(total-used)+' '+t('free'))));
}
function uploadZone(dir,accept,hint,onDone,asGif){
  const fileIn=el('input',{type:'file',accept,multiple:''});
  const list=el('div',{class:'uplist'});
  const zone=el('div',{class:'drop'},hint,list);
  zone.addEventListener('click',()=>fileIn.click());
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('over');});
  zone.addEventListener('dragleave',()=>zone.classList.remove('over'));
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('over');handle(e.dataTransfer.files);});
  fileIn.addEventListener('change',()=>{handle(fileIn.files);fileIn.value='';});
  async function handle(files){
    for(const f of files){
      const row=el('div',null,f.name+' - 0%');
      list.append(row);
      try{
        const conv=asGif?await iconAsGif(f,f.name):null;
        const nm=conv?conv.name:f.name;
        await uploadFile(conv?conv.blob:f,dir,nm,p=>row.replaceChildren(nm+' - '+(p*100).toFixed(0)+'%'));
        if(conv)await dropStale(dir,f.name,nm);
        row.replaceChildren(nm+' ✓ '+t('uploaded'));
      }catch(e){row.replaceChildren(f.name+' ✗ '+e.message);toast(f.name+': '+e.message,false);}
    }
    setTimeout(()=>list.replaceChildren(),4000);
    onDone();
  }
  return el('div',null,zone,fileIn);
}
