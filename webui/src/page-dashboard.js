const TONE={ok:'var(--ok)',warn:'var(--warn)',err:'var(--err)',neutral:'var(--acc)'};
function vitalDefs(st){
  const V=[];
  if('batteryPercent'in st){
    const p=st.batteryPercent;
    V.push({ic:'bat',k:t('battery'),v:String(p),u:'%',bar:clamp(p,0,100),
      tone:p>=40?'ok':p>=20?'warn':'err',s:(st.batteryVoltage??0).toFixed(2)+' V'});
  }
  const r=st.wifiRssi;
  V.push({ic:'wifi',k:t('wifi'),v:String(r),u:'dBm',bar:clamp((r+100)*100/60,0,100),
    tone:r>=-65?'ok':r>=-75?'warn':'err',s:wifiWord(r)});
  if('lightLevel'in st){
    const l=st.lightLevel;
    V.push({ic:'sun',k:t('light'),v:String(Math.round(l)),u:'%',bar:clamp(l,0,100),
      tone:'neutral',s:(st.ldrRaw??0)+' raw'});
  }
  if('temperature'in st)
    V.push({ic:'temp',k:t('temp'),v:String(Math.round(st.temperature*10)/10),u:'°',tone:'neutral'});
  if('humidity'in st)
    V.push({ic:'hum',k:t('hum'),v:String(Math.round(st.humidity)),u:'%',
      bar:clamp(st.humidity,0,100),tone:'neutral'});
  if('fps'in st)
    V.push({ic:'fps',k:'FPS',v:String(st.fps),u:'',bar:clamp(st.fps*100/42,0,100),
      tone:st.fps>=40?'ok':st.fps>=32?'warn':'err',s:'/ 42'});
  return V;
}
function vitalTile(d){
  return el('div',{class:'vit'},
    el('div',{class:'k'},icon(d.ic),el('span',null,d.k)),
    el('div',{class:'v'},d.v,d.u?el('u',null,d.u):null),
    d.bar==null?null:el('div',{class:'b','aria-hidden':'true'},
      el('i',{style:'width:'+d.bar.toFixed(1)+'%;background:'+TONE[d.tone]})),
    d.s?el('div',{class:'s'},d.s):null);
}
const metaItem=(k,v,cls)=>el('span',null,k+' ',el('b',cls?{class:cls}:null,String(v)));
function healthDefs(st){
  const badReset=['brownout','panic','interruptWatchdog','taskWatchdog','watchdog'].includes(st.resetReason);
  const heap=Number(st.freeHeapBytes||0),block=Number(st.largestFreeBlockBytes||0);
  const links=[st.wifi,st.mqtt].filter(x=>x&&x.enabled!==false);
  const netBad=links.some(x=>x.state!=='online'&&x.state!=='connected');
  return[
    {k:t('healthReset'),v:st.resetReason||'unknown',tone:badReset?'err':'ok',h:t(badReset?'healthResetBad':'healthResetOk')},
    {k:t('healthHeap'),v:fmtBytes(heap),tone:heap<24576?'err':heap<49152?'warn':'ok',h:t(heap<49152?'healthHeapLow':'healthHeapOk')},
    {k:t('healthBlock'),v:fmtBytes(block),tone:block<16384?'warn':'ok',h:t(block<16384?'healthBlockLow':'healthHeapOk')},
    {k:t('healthNet'),v:links.map(x=>x.state).join(' · ')||'offline',tone:netBad?'warn':'ok',h:t(netBad?'healthNetBad':'healthNetOk')},
    {k:t('healthFps'),v:String(st.fps||0)+' FPS',tone:st.fps<32?'warn':'ok',h:t(st.fps<32?'healthFpsLow':'healthFpsOk')},
  ];
}
function healthRow(d){return el('div',{class:'healthrow '+d.tone},el('i'),el('div',null,el('b',null,d.k+' · '+d.v),el('small',null,d.h)));}
function viewDash(view){
  const SC=10;
  const cv=el('canvas',{id:'screen',width:32*SC,height:8*SC,role:'img','aria-label':t('livepre')});
  const ctx=cv.getContext('2d');
  let pw=32,ph=8;
  const bri=el('input',{type:'range',min:0,max:255,value:S.stats?S.stats.brightness:120,
    'aria-label':t('brightness')});
  const briVal=el('span',{class:'val'},String(S.stats?S.stats.brightness:120));
  bri.addEventListener('input',()=>briVal.replaceChildren(bri.value));
  bri.addEventListener('input',debounce(()=>req('PATCH','/api/v1/settings',{brightness:Number(bri.value)}).catch(e=>toast(e.message,false)),300));
  const powerSw=mkSwitch(S.stats?!!S.stats.matrixPower:true,async()=>{
    try{await req('PATCH','/api/v1/display',{power:powerSw.input.checked});}catch(e){toast(e.message,false);}
  });
  powerSw.input.setAttribute('aria-label',t('power'));
  const iconBtn=(ic,lbl,fn)=>{
    const b=el('button',{class:'icon',title:lbl,'aria-label':lbl});
    b.append(icon(ic));b.addEventListener('click',fn);return b;
  };
  const appBtn=(ic,url,lbl)=>iconBtn(ic,lbl,()=>post(url).catch(e=>toast(e.message,false)));
  const REC_MAX=300,PNG_SC=100,GIF_SC=20;
  let rec=null,shot=null;
  const stamp=()=>new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
  const snapBtn=iconBtn('import',t('snap'),()=>{
    if(!shot)return;
    const c=el('canvas',{width:pw*PNG_SC,height:ph*PNG_SC});
    paint(c.getContext('2d'),shot,pw,ph,PNG_SC);
    c.toBlob(b=>download('awtrix-'+stamp()+'.png',b));
  });
  const recBtn=iconBtn('rec',t('rec'),()=>toggleRec());
  function toggleRec(){
    const done=rec;
    rec=done?null:[];
    const lbl=t(rec?'recstop':'rec');
    recBtn.classList.toggle('danger',!!rec);
    recBtn.title=lbl;recBtn.setAttribute('aria-label',lbl);
    if(done&&done.length)
      download('awtrix-'+stamp()+'.gif',new Blob([gifEncode(done,pw,ph,GIF_SC)],{type:'image/gif'}));
  }
  view.append(el('div',{class:'hero'},cv,
    el('div',{class:'hctl'},
      powerSw.node,el('span',{class:'lab'},t('power')),
      el('span',{class:'lab'},t('brightness')),bri,briVal,
      appBtn('prev','/api/v1/apps/previous',t('prevapp')),
      appBtn('next','/api/v1/apps/next',t('nextapp')),
      iconBtn('bell',t('dismiss'),async()=>{
        try{await req('DELETE','/api/v1/notifications/active');toast(t('dismissed'));}
        catch(e){toast(e.message,false);}}),
      snapBtn,recBtn)));
  poller(async()=>{
    const{data}=await api('/api/v1/display/screen',{timeout:4000});
    const px=data&&data.pixels;
    if(!Array.isArray(px))return;
    const W=data.width||32,H=data.height||8;
    if(W!==pw||H!==ph){cv.width=W*SC;cv.height=H*SC;cv.style.aspectRatio=W+'/'+H;pw=W;ph=H;}
    shot=px;
    if(rec){
      rec.push({t:Date.now(),px:px.slice(0,W*H)});
      if(rec.length>=REC_MAX)toggleRec();
    }
    paint(ctx,px,W,H,SC);
  },()=>rec?40:250);
  const vg=el('div',{class:'vitals'});
  const meta=el('div',{class:'meta'});
  const healthGrid=el('div',{class:'healthgrid'}),healthState=el('span',{class:'badge'});
  const reportBtn=el('button',null,t('diagDownload'));
  reportBtn.addEventListener('click',()=>{
    if(!S.stats)return;
    const report={generatedAt:new Date().toISOString(),device:S.stats,assessment:healthDefs(S.stats)};
    download('awtrix-diagnostic-'+stamp()+'.json',JSON.stringify(report,null,2),'application/json');
  });
  const health=el('section',{class:'card wide health'},
    el('div',{class:'healthtop'},el('div',null,el('h2',null,t('health')),el('p',{class:'ghelp'},t('healthH'))),healthState),
    healthGrid,el('div',{class:'healthactions'},reportBtn));
  view.append(vg,meta,health);
  function renderVitals(st){
    vg.replaceChildren(...vitalDefs(st).map(vitalTile));
    meta.replaceChildren(
      metaItem(t('version'),st.version),metaItem(t('host'),st.hostname||S.sysHost),metaItem(t('ip'),st.ipAddress),
      metaItem(t('uptime'),uptimeStr(st.uptimeSeconds)),
      metaItem(t('ram'),fmtBytes(st.freeHeapBytes)),
      ...(st.psramTotalBytes?[metaItem(t('psram'),fmtBytes(st.psramFreeBytes)+' / '+fmtBytes(st.psramTotalBytes))]
        :st.soc==='esp32s3'?[metaItem(t('psram'),t('psramnone'),'warn')]:[]),
      metaItem(t('curapp'),st.currentApp));
    const defs=healthDefs(st),attention=defs.some(x=>x.tone==='err'||x.tone==='warn');
    healthGrid.replaceChildren(...defs.map(healthRow));
    healthState.className='badge '+(attention?'bad':'good');
    healthState.replaceChildren(t(attention?'healthAttention':'healthGood'));
  }
  if(S.stats)renderVitals(S.stats);
  poller(async()=>{
    const{data}=await api('/api/v1/device',{timeout:4000});
    setStats(data);
    powerSw.input.checked=!!data.matrixPower;
    if(document.activeElement!==bri){bri.value=data.brightness;briVal.replaceChildren(String(data.brightness));}
    renderVitals(data);
  },2000);
}
