let gen=0;
function poller(fn,ms){
  const g=gen;let fails=0;
  (async function run(){
    if(g!==gen)return;
    const base=typeof ms==='function'?ms():ms;
    const t0=Date.now();
    let d=base;
    if(!document.hidden){
      try{await fn();fails=0;d=Math.max(0,base-(Date.now()-t0));}
      catch(e){fails++;d=Math.min(base*4*fails,10000);}
    }
    setTimeout(run,d);
  })();
}
function setStats(d){
  S.stats=d;
  S.scriptsOff=d.scriptingRunning===false;
  if(d.hostname)S.sysHost=d.hostname;
  if(d.uid)S.sysUid=d.uid;
}
async function loadSystemInfo(){
  try{
    const d=(await api('/api/v1/system')).data;
    if(d.scriptMaxBytes)S.scriptMax=d.scriptMaxBytes;
    if(Number.isInteger(d.scriptLimit))S.scriptLimit=d.scriptLimit;
  }catch(e){}
}
const TABS=[['','dash',viewDash],['apps','appsTab',viewApps],['scripts','scriptsTab',viewScripts],
  ['icons','icons',viewIcons],['editor','editorTab',viewEditor],['audio','audioTab',viewAudio],
  ['palettes','palettes',viewPalettes],['display','display',viewDisplay],
  ['system','system',viewSystem],['log','log',viewLog]];
function currentRoute(){
  const r=location.hash.replace(/^#\/?/,'');
  // The Sounds and Radio tabs merged into Audio; old bookmarks still land somewhere sensible.
  return S.ap?'system':({sounds:'audio',radio:'audio'}[r]||r);
}
function nav(){
  const cur=currentRoute();
  const tabs=S.ap?TABS.filter(([r])=>r==='system')
    :TABS.filter(([r])=>r!=='audio'||anyAudioCap());
  $('#nav').replaceChildren(...tabs.map(([r,k])=>el('a',{href:'#/'+r,class:cur===r?'on':''},t(k))));
}
function render(){
  gen++;
  document.documentElement.lang=LANG==='zh'?'zh-CN':LANG;
  const r=currentRoute();
  nav();
  const view=el('main',{id:'view'});
  $('#view').replaceWith(view);
  (TABS.find(([n])=>n===r)||TABS[0])[2](view);
}
window.addEventListener('hashchange',render);
const languageCodes=Object.keys(LANGUAGES);
const paintLanguage=()=>{
  const info=LANGUAGES[LANG];
  $('#langbtn').replaceChildren(LANG==='zh'?'中':LANG.toUpperCase());
  $('#langbtn').title=info.label;
  $('#langbtn').setAttribute('aria-label',info.label);
};
$('#langbtn').addEventListener('click',()=>{
  LANG=languageCodes[(languageCodes.indexOf(LANG)+1)%languageCodes.length];
  localStorage.awtrixLang=LANG;
  paintLanguage();
  render();
});
$('#kofibtn').addEventListener('click',()=>window.open('https://ko-fi.com/blueforcer','_blank','noopener'));
$('#docsbtn').addEventListener('click',()=>window.open('https://blueforcer.github.io/awtrix-ng/','_blank','noopener'));
const themeUse=$('#themebtn').querySelector('use');
function paintTheme(){themeUse.setAttribute('href',document.documentElement.dataset.theme==='light'?'#i-moon':'#i-sun');}
$('#themebtn').addEventListener('click',()=>{
  const d=document.documentElement.dataset;
  d.theme=d.theme==='light'?'dark':'light';
  try{localStorage.awtrixTheme=d.theme;}catch(e){}
  paintTheme();
  notifyPiskelTheme();
});
