let audioCtx=null,audioStop=null;
function previewStop(){if(audioStop){audioStop();audioStop=null;}}
function previewPlay(p){
  previewStop();
  try{
    audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();
  }catch(e){toast(t('neterr'),false);return;}
  if(audioCtx.state==='suspended')audioCtx.resume();
  const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
  osc.type='square';
  const t0=audioCtx.currentTime+0.02;
  let at=t0;
  gain.gain.setValueAtTime(0,t0);
  for(const n of p.notes){
    const dur=noteMs(n.d,p.timeUnit)/1000;
    if(n.f){
      osc.frequency.setValueAtTime(n.f,at);
      const gap=dur>2*RTTTL_GAP?RTTTL_GAP:0;
      gain.gain.setValueAtTime(0.13,at);
      gain.gain.setValueAtTime(0,at+dur-gap);
    }else gain.gain.setValueAtTime(0,at);
    at+=dur;
  }
  osc.connect(gain);gain.connect(audioCtx.destination);
  osc.start(t0);osc.stop(at+0.05);
  audioStop=()=>{try{gain.gain.cancelScheduledValues(audioCtx.currentTime);
    gain.gain.setValueAtTime(0,audioCtx.currentTime);osc.stop();}catch(e){}};
  osc.onended=()=>{audioStop=null;};
}
function melodiesSection(){
  const list=el('div',{class:'melolist'});
  let saved=[];

  async function reload(){
    try{
      const{data}=await api('/api/v1/audio/melodies');
      const melodies=(data.melodies||[]).sort((a,b)=>a.name.localeCompare(b.name));
      saved=melodies.map(m=>m.name);
      list.replaceChildren(...melodies.map(m=>meloRow(m)));
      if(!melodies.length)list.replaceChildren(el('div',{class:'empty'},t('melonone')));
    }catch(e){toast(e.message,false);}
  }

  function meloRow(m){
    const isNew=!m;
    const orig=isNew?'':m.name;
    const nameIn=el('input',{type:'text',placeholder:t('meloname'),maxlength:'24',
      value:orig,'aria-label':t('meloname')});
    const body=isNew?'':String(m.rtttl||'').split(':').slice(1).join(':');
    const rtIn=el('input',{type:'text',class:'rt',placeholder:t('melortttl'),
      value:body,'aria-label':'RTTTL'});
    const meta=el('div',{class:'meta'});
    const row=el('div',{class:'melorow'+(isNew?' dirty':'')});

    const pre=el('button',{class:'icon',title:t('melopre'),'aria-label':t('melopre')},'🎧');
    const play=el('button',{class:'icon',title:t('meloplay'),'aria-label':t('meloplay')},'▶');
    const save=el('button',{class:'icon pri',title:t('save'),'aria-label':t('save'),disabled:true},'💾');
    const del=armable(el('button',{class:'danger icon',title:t('del'),'aria-label':t('del')},icon('trash')),
      async()=>{
        if(isNew){row.remove();return;}
        try{await api('/api/v1/audio/melodies/'+encodeURIComponent(orig),{method:'DELETE'});
          toast(t('deleted'));reload();}
        catch(e){toast(e.message,false);}
      });

    const full=()=>(nameIn.value.trim()||'x')+':'+rtIn.value.trim();
    const dirty=()=>isNew||nameIn.value.trim()!==orig||rtIn.value.trim()!==body;

    function check(){
      const p=rtttlParse(full());
      const nameOk=/^[A-Za-z0-9_-]{1,24}$/.test(nameIn.value.trim());
      const dup=nameIn.value.trim()!==orig&&saved.includes(nameIn.value.trim());
      row.classList.toggle('bad',!p.ok);
      row.classList.toggle('dirty',dirty());
      if(!p.ok)meta.replaceChildren(p.error);
      else if(dup)meta.replaceChildren(t('meloexists'));
      else if(!nameOk&&nameIn.value.trim())meta.replaceChildren(t('melobadname'));
      else meta.replaceChildren(p.notes.length+' '+t('melonotes')+' · '+(p.durationMs/1000).toFixed(1)+' s');
      save.disabled=!(p.ok&&nameOk&&!dup&&dirty());
      pre.disabled=play.disabled=!p.ok;
      return p;
    }
    rtIn.addEventListener('paste',e=>{
      const txt=(e.clipboardData||window.clipboardData).getData('text').trim();
      const parts=txt.split(':');
      if(parts.length<3)return;
      e.preventDefault();
      if(!nameIn.value.trim())nameIn.value=parts[0].trim().replace(/[^A-Za-z0-9_-]/g,'').slice(0,24);
      rtIn.value=parts.slice(1).join(':');
      check();
    });
    const recheck=debounce(check,150);
    nameIn.addEventListener('input',recheck);
    rtIn.addEventListener('input',recheck);

    pre.addEventListener('click',()=>{const p=check();if(p.ok)previewPlay(p);});
    play.addEventListener('click',async()=>{
      try{await post('/api/v1/audio/play',{rtttl:full()});toast(t('playing'));}
      catch(e){toast(e.message,false);}
    });
    save.addEventListener('click',async()=>{
      const name=nameIn.value.trim();
      save.disabled=true;
      try{
        await req('PUT','/api/v1/audio/melodies/'+encodeURIComponent(name),{rtttl:rtIn.value.trim()});
        if(!isNew&&name!==orig)
          await api('/api/v1/audio/melodies/'+encodeURIComponent(orig),{method:'DELETE'});
        toast(t('saved'));reload();
      }catch(e){toast(e.message,false);save.disabled=false;}
    });

    row.append(nameIn,rtIn,el('div',{class:'acts'},pre,play,save,del),meta);
    if(m&&m.valid===false)meta.replaceChildren(t('melobroken')+': '+(m.error||''));
    else check();
    return row;
  }

  const addBtn=el('button',null,'+ '+t('newmelo'));
  addBtn.addEventListener('click',()=>{
    const empty=list.querySelector('.empty');
    if(empty)list.replaceChildren();
    const row=meloRow(null);
    list.append(row);
    row.querySelector('input').focus();
  });
  reload();
  return[list,el('div',{class:'row',style:'margin:10px 0 0'},addBtn)];
}
function radioSection(onState){
  const status=el('div',{class:'ghelp',style:'margin-left:auto'},t('radiostopped'));
  const list=el('div',{class:'melolist'});
  let stations=[];

  function rows(){return[...list.querySelectorAll('.melorow')];}
  function read(){
    return rows().map(r=>({name:r.querySelector('.rn').value.trim(),
                           url:r.querySelector('.ru').value.trim()}))
                 .filter(s=>s.name&&s.url);
  }
  // The API takes the whole list, so a row's save sends every row - unfinished ones excluded.
  async function put(){
    await req('PUT','/api/v1/audio/stations',{stations:read()});
  }
  function checkAll(){rows().forEach(r=>r.check&&r.check());}
  function row(st){
    const isNew=!st;
    const orig=st||{name:'',url:''};
    const r=el('div',{class:'melorow'+(isNew?' dirty':'')});
    const name=el('input',{class:'rn',value:orig.name,placeholder:t('radioname'),
      maxlength:'24','aria-label':t('radioname')});
    const url=el('input',{class:'ru',value:orig.url,placeholder:t('radiourl'),
      'aria-label':t('radiourl')});
    const msg=el('div',{class:'rm meta'});
    const play=el('button',{class:'icon',title:t('meloplay'),'aria-label':t('meloplay')},'▶');
    const save=el('button',{class:'icon pri',title:t('save'),'aria-label':t('save'),disabled:true},'💾');
    const del=armable(el('button',{class:'danger icon',title:t('del'),'aria-label':t('del')},icon('trash')),
      async()=>{
        if(isNew){r.remove();checkAll();return;}
        r.remove();
        try{await put();toast(t('deleted'));reload();}
        catch(e){toast(e.message,false);reload();}
      });

    const dirty=()=>isNew||name.value.trim()!==orig.name||url.value.trim()!==orig.url;
    r.check=function(){
      const n=name.value.trim(),u=url.value.trim();
      const dup=rows().some(o=>o!==r&&o.querySelector('.rn').value.trim()===n&&n);
      let bad='';
      if(n.length>24)bad=t('radiolong');
      else if(u&&!/^https?:\/\//i.test(u))bad=t('radiobadurl');
      else if(dup)bad=t('radiodupe');
      r.classList.toggle('bad',!!bad);
      r.classList.toggle('dirty',dirty());
      msg.replaceChildren(bad);
      save.disabled=!(n&&u&&!bad&&dirty());
      play.disabled=!(n&&u)||!!bad;
      return !bad;
    };

    // An edited row plays by URL so a station can be tried before it is saved.
    play.addEventListener('click',async()=>{
      const n=name.value.trim();
      try{await post('/api/v1/audio/play',dirty()?{url:url.value.trim()}:{station:n});refresh();}
      catch(e){toast(e.message,false);}
    });
    save.addEventListener('click',async()=>{
      save.disabled=true;
      try{await put();toast(t('saved'));reload();}
      catch(e){toast(e.message,false);save.disabled=false;}
    });
    const recheck=debounce(()=>checkAll(),150);
    [name,url].forEach(i=>i.addEventListener('input',recheck));
    r.replaceChildren(name,url,el('div',{class:'acts'},play,save,del),msg);
    return r;
  }
  function paint(){
    list.replaceChildren(...(stations.length?stations.map(row)
                                            :[el('div',{class:'empty'},t('radionone'))]));
    checkAll();
  }

  const add=el('button',null,t('radioadd'));
  add.addEventListener('click',()=>{
    const empty=list.querySelector('.empty');
    if(empty)list.replaceChildren();
    const r=row(null);
    list.appendChild(r);
    checkAll();
    r.querySelector('input').focus();
  });
  async function reload(){
    try{
      const{data}=await api('/api/v1/audio');
      stations=data.stations||[];
      paint();
    }catch(e){}
  }
  async function refresh(){
    try{
      const{data}=await api('/api/v1/audio');
      status.replaceChildren(data.radio.playing
        ?t('radioplaying')+': '+data.radio.station+(data.radio.title?' - '+data.radio.title:'')
        :(data.radio.error||t('radiostopped')));
      if(!list.childElementCount){stations=data.stations||[];paint();}
      if(onState)onState(data);
    }catch(e){}
  }

  refresh();
  poller(refresh,4000);
  return[list,el('div',{class:'row',style:'margin:10px 0 0'},add,status)];
}
function mp3Section(){
  const storSlot=el('div');
  const list=el('div',{class:'melolist'});
  let playing='';

  function mark(name){
    playing=name||'';
    list.querySelectorAll('.melorow').forEach(r=>{
      const on=r.dataset.mp3===playing&&playing!=='';
      r.classList.toggle('on',on);
      // Cleared with no argument, not with '': .meta:empty is what keeps idle rows compact.
      const m=r.querySelector('.meta');
      if(on)m.replaceChildren('▶ '+t('radioplaying'));else m.replaceChildren();
    });
  }

  function mp3Row(f){
    const base=f.name.replace(/\.mp3$/i,'');
    const pre=el('button',{class:'icon',title:t('melopre'),'aria-label':t('melopre')},'🎧');
    // Through the shared preview handle, so Stopp reaches it and a second click cannot stack.
    pre.addEventListener('click',()=>{
      previewStop();
      const a=new Audio('/MP3/'+encodeURIComponent(f.name)+'?v='+f.size+'.'+assetRev);
      audioStop=()=>a.pause();
      a.play().catch(()=>{});
    });
    const play=el('button',{class:'icon',title:t('meloplay'),'aria-label':t('meloplay')},'▶');
    play.addEventListener('click',async()=>{
      try{await post('/api/v1/audio/play',{mp3:base});toast(t('playing'));}
      catch(e){toast(e.message,false);}
    });
    const del=armable(el('button',{class:'danger icon',title:t('del'),'aria-label':t('del')},icon('trash')),
      async()=>{
        try{await api('/api/v1/audio/mp3/'+encodeURIComponent(base),{method:'DELETE'});toast(t('deleted'));reload();}
        catch(e){toast(e.message,false);}
      });
    const row=el('div',{class:'melorow mp3','data-mp3':base},
      el('span',{class:'nm',title:f.name},base),
      el('span',{class:'sz'},fmtBytes(f.size)),
      el('div',{class:'acts'},pre,play,del),
      el('div',{class:'meta'}));
    return row;
  }

  async function reload(){
    try{
      const{data}=await api('/api/v1/audio/mp3',{cache:'no-store'});
      const files=(data.files||[]).filter(f=>/\.mp3$/i.test(f.name))
        .sort((a,b)=>a.name.localeCompare(b.name));
      storSlot.replaceChildren(storageCard(data));
      list.replaceChildren(...files.map(mp3Row));
      if(!files.length)list.replaceChildren(el('div',{class:'empty'},t('nofiles')));
      mark(playing);
    }catch(e){toast(e.message,false);}
  }

  reload();
  const nodes=[
    uploadZone('/api/v1/audio/mp3','.mp3,audio/mpeg','⬆ '+t('upload')+' (.mp3)',reload,false),
    list];
  return{nodes,mark,storSlot};
}
async function viewAudio(view){
  const g=gen;
  if(!S.aud){
    try{readAudioCaps((await api('/api/v1/capabilities')).data||{});}
    catch(e){view.append(el('div',{class:'card wide'},t('neterr')));return;}
    if(g!==gen)return;
  }
  if(!anyAudioCap()){view.append(el('div',{class:'card wide'},t('audnone')));return;}
  const{section,panel}=sectionShell(view);
  const muted=el('div',{class:'ghelp',style:'display:none;color:var(--warn)'},t('melomuted'));
  // One transport control for the page: the browser preview, the device sound and the stream.
  const stopAll=el('button',null,'■ '+t('melostop'));
  stopAll.addEventListener('click',async()=>{
    previewStop();
    try{await post('/api/v1/audio/stop',{});}catch(e){toast(e.message,false);}
  });
  panel.prepend(el('div',{class:'row audbar'},stopAll));
  panel.prepend(muted);

  // Each section carries the volume of the output it belongs to, so a level is set where the
  // sound is, not two tabs away. No help line here - the section heading already says which
  // output this is.
  const vols=[];
  const withVol=(key,nodes)=>{
    let timer=null;
    const f=mkField(key,Object.assign({},SYSF[key],{h:''}),0,()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>req('PATCH','/api/v1/settings',{[key]:f.get()})
        .catch(e=>toast(e.message,false)),300);
    });
    vols.push([key,f]);
    return [f.row].concat(nodes);
  };

  (async()=>{
    try{
      const{data}=await api('/api/v1/settings');
      muted.style.display=data.soundEnabled===false?'':'none';
      vols.forEach(([k,f])=>{if(k in data)f.set(data[k]);});
    }catch(e){}
  })();

  let markMp3=()=>{},storage=null;
  if(hasSink('mp3')){
    const mp3s=mp3Section();
    markMp3=mp3s.mark;
    section('mp3',t('mp3s'),t('mp3shelp'),withVol('mp3Volume',mp3s.nodes),1);
    storage=mp3s.storSlot;
  }
  if(hasSink('radio')){
    section('radio',t('radioTab'),t('radioH'),
      withVol('radioVolume',radioSection(d=>markMp3(d.mp3.playing?d.mp3.name:''))),1);
  }else if(hasSink('mp3')){
    // No radio section polling on this build, so the MP3 indicator needs its own timer.
    const refresh=async()=>{
      try{
        const{data}=await api('/api/v1/audio');
        markMp3(data.mp3.playing?data.mp3.name:'');
      }catch(e){}
    };
    refresh();
    poller(refresh,4000);
  }
  if(hasSink('buzzer'))
    section('melodies',t('melodies'),t('melodieshelp'),withVol('buzzerVolume',melodiesSection()),1);
  if(storage)panel.prepend(storage);
}
