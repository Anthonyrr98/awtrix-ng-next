AWTRIX_THEMES.apply(AWTRIX_THEMES.current(),{persist:false});
paintLanguage();
paintTheme();
render();
const topbar=$('.topbar');
const setChromeH=()=>document.documentElement.style.setProperty('--chrome-h',topbar.offsetHeight+'px');
setChromeH();
new ResizeObserver(setChromeH).observe(topbar);
(async()=>{
  try{
    const{data}=await api('/api/v1/device',{timeout:5000});
    setStats(data);
    S.ap=!data.ipAddress||data.ipAddress==='0.0.0.0';
    if(S.ap)render();
  }catch(e){}
  try{
    const caps=(await api('/api/v1/capabilities')).data||{};
    if(!S.transitions.length)S.transitions=caps.transitions||[];
    readAudioCaps(caps);
    if(!anyAudioCap())nav();
  }catch(e){}
  await loadSystemInfo();
})();
