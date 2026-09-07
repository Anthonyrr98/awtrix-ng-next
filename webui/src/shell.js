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
const languageMenu=$('#langmenu');
const closeLanguageMenu=()=>{
  languageMenu.hidden=true;
  $('#langbtn').setAttribute('aria-expanded','false');
};
const paintLanguage=()=>{
  const info=LANGUAGES[LANG];
  $('#langbtn').replaceChildren(LANG==='zh'?'中':LANG.toUpperCase());
  $('#langbtn').title=info.label;
  $('#langbtn').setAttribute('aria-label',info.label);
  languageMenu.replaceChildren(...languageCodes.map(code=>{
    const b=el('button',{role:'menuitem',class:code===LANG?'on':'',lang:code},LANGUAGES[code].label);
    b.addEventListener('click',()=>{
      LANG=code;localStorage.awtrixLang=LANG;closeLanguageMenu();paintLanguage();paintTheme();render();
    });
    return b;
  }));
};
$('#langbtn').addEventListener('click',e=>{
  e.stopPropagation();
  closeThemeMenu();
  languageMenu.hidden=!languageMenu.hidden;
  $('#langbtn').setAttribute('aria-expanded',String(!languageMenu.hidden));
});
languageMenu.addEventListener('click',e=>e.stopPropagation());
document.addEventListener('click',closeLanguageMenu);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLanguageMenu();});
$('#kofibtn').addEventListener('click',()=>window.open('https://ko-fi.com/blueforcer','_blank','noopener'));
$('#docsbtn').addEventListener('click',()=>window.open('https://blueforcer.github.io/awtrix-ng/','_blank','noopener'));
const themeUse=$('#themebtn').querySelector('use');
const themeMenu=$('#thememenu');
const themeLabel=id=>({dark:t('themeDark'),light:t('themeLight'),
  'liquid-glass-white':t('themeLiquidWhite'),'liquid-glass-color':t('themeLiquidColor')})[id];
const closeThemeMenu=()=>{
  themeMenu.hidden=true;
  $('#themebtn').setAttribute('aria-expanded','false');
};
function paintTheme(){
  const info=AWTRIX_THEMES.info();
  themeUse.setAttribute('href',info.mode==='light'?'#i-moon':'#i-sun');
  $('#themebtn').title=t('theme')+' · '+(themeLabel(info.id)||info.label);
  $('#themebtn').setAttribute('aria-label',t('theme'));
  themeMenu.replaceChildren(...AWTRIX_THEMES.all().map(theme=>{
    const b=el('button',{role:'menuitemradio','aria-checked':String(theme.id===info.id),
      class:theme.id===info.id?'on':''},
      el('span',{class:'themeswatch '+theme.id}),
      el('span',null,themeLabel(theme.id)||theme.label),
      theme.id===info.id?el('span',{class:'themecheck'},'✓'):null);
    b.addEventListener('click',()=>{AWTRIX_THEMES.apply(theme.id);closeThemeMenu();});
    return b;
  }));
}
window.addEventListener('awtrix-theme-change',()=>{
  paintTheme();
  notifyPiskelTheme();
});
$('#themebtn').addEventListener('click',e=>{
  e.stopPropagation();
  closeLanguageMenu();
  themeMenu.hidden=!themeMenu.hidden;
  $('#themebtn').setAttribute('aria-expanded',String(!themeMenu.hidden));
});
themeMenu.addEventListener('click',e=>e.stopPropagation());
document.addEventListener('click',closeThemeMenu);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeThemeMenu();});
