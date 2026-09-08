const themeRegistry=new Map();
let appliedThemeVars=[];
const validThemeId=/^[a-z][a-z0-9-]*$/;
const validThemeVar=/^[a-z][a-z0-9-]*$/;

function registerTheme(id,options={}){
  if(!validThemeId.test(id))throw new Error('Invalid theme id: '+id);
  const vars={};
  Object.entries(options.vars||{}).forEach(([key,value])=>{
    if(!validThemeVar.test(key))throw new Error('Invalid theme variable: '+key);
    vars[key]=String(value);
  });
  const theme=Object.freeze({
    id,
    label:String(options.label||id),
    mode:options.mode==='light'?'light':'dark',
    vars:Object.freeze(vars),
  });
  themeRegistry.set(id,theme);
  return theme;
}

registerTheme('dark',{label:'Dark',mode:'dark'});
registerTheme('light',{label:'Light',mode:'light'});
registerTheme('liquid-glass-white',{
  label:'White Liquid Glass',
  mode:'light',
  vars:{
    bg:'#eaf4fb',card:'rgba(255,255,255,.54)',card2:'rgba(255,255,255,.38)',
    border:'rgba(255,255,255,.72)',brd2:'rgba(112,147,171,.18)',fg:'#152738',
    dim:'#526b7e',acc:'#087eb8',pri:'#087eb8',ok:'#18794e',err:'#c93445',warn:'#8a6500',
    errbrd:'rgba(201,52,69,.3)',bnw:'rgba(255,241,174,.62)',bna:'rgba(194,233,255,.58)',
    badbg:'rgba(255,223,226,.7)',badfg:'#8d1425',con:'rgba(245,251,255,.72)',
    sh:'rgba(32,69,94,.16)',trk:'rgba(78,114,139,.22)',tsel:'#b7e5fb',
    tselo:'rgba(92,190,235,.26)',tcur:'rgba(255,255,255,.5)',top:'#20384a',
    'glass-line':'rgba(47,96,128,.3)','glass-surface':'rgba(255,255,255,.48)',
  },
});
registerTheme('liquid-glass-color',{
  label:'Color Liquid Glass',
  mode:'dark',
  vars:{
    bg:'#071019',card:'rgba(17,35,49,.62)',card2:'rgba(39,61,76,.55)',
    border:'rgba(190,226,255,.22)',brd2:'rgba(190,226,255,.12)',fg:'#f3f9ff',
    dim:'#a9bfd0',acc:'#78d7ff',pri:'#087fab',ok:'#5de6a1',err:'#ff7e88',warn:'#ffd166',
    errbrd:'rgba(255,126,136,.42)',bnw:'rgba(91,70,20,.62)',bna:'rgba(8,77,108,.58)',
    badbg:'rgba(116,27,39,.64)',badfg:'#ffe6e8',con:'rgba(2,10,16,.78)',
    sh:'rgba(0,5,12,.42)',trk:'rgba(190,226,255,.2)',tsel:'#245a76',
    tselo:'rgba(56,153,202,.38)',tcur:'rgba(40,66,82,.6)',top:'#d6eaff',
    'glass-line':'rgba(218,240,255,.32)','glass-surface':'rgba(22,38,58,.58)',
  },
});
registerTheme('pixel-frame',{
  label:'Pixel Frame Dark',
  mode:'dark',
  vars:{
    bg:'#090b0a',card:'#111612',card2:'#1a211b',border:'#526052',brd2:'#29322a',fg:'#f3f7df',
    dim:'#9aa890',acc:'#b8f34a',pri:'#577f16',ok:'#6fe7a5',err:'#ff6b6b',warn:'#ffd166',
    errbrd:'#8d3838',bnw:'#3b3214',bna:'#102d32',badbg:'#411d21',badfg:'#ffd9d9',
    con:'#050706',sh:'#000',trk:'#344035',tsel:'#395f1d',tselo:'rgba(184,243,74,.24)',
    tcur:'#172018',top:'#eaf5d1',
  },
});
registerTheme('pixel-frame-light',{
  label:'Pixel Frame Light',
  mode:'light',
  vars:{
    bg:'#f4f0dc',card:'#fffced',card2:'#e8e3ca',border:'#30382f',brd2:'#a7ad98',fg:'#182019',
    dim:'#596457',acc:'#087f5b',pri:'#087f5b',ok:'#16794b',err:'#bd2c32',warn:'#8d6500',
    errbrd:'#bd6a6e',bnw:'#fff1a8',bna:'#cceff0',badbg:'#ffd9d9',badfg:'#721a20',
    con:'#fffef5',sh:'#596457',trk:'#a7ad98',tsel:'#a9e6c4',tselo:'rgba(8,127,91,.2)',
    tcur:'#e1eadb',top:'#1f2d21',
  },
});

function preferredTheme(){
  try{
    const saved=localStorage.awtrixTheme;
    if(themeRegistry.has(saved))return saved;
    return matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';
  }catch(_){return'dark';}
}
let activeTheme=preferredTheme();

function applyTheme(id,options={}){
  const theme=themeRegistry.get(id)||themeRegistry.get(preferredTheme())||themeRegistry.get('dark');
  const root=document.documentElement;
  appliedThemeVars.forEach(key=>root.style.removeProperty('--'+key));
  appliedThemeVars=Object.keys(theme.vars);
  appliedThemeVars.forEach(key=>root.style.setProperty('--'+key,theme.vars[key]));
  activeTheme=theme.id;
  root.dataset.theme=theme.id;
  root.dataset.themeMode=theme.mode;
  if(options.persist!==false){try{localStorage.awtrixTheme=theme.id;}catch(_){}}
  window.dispatchEvent(new CustomEvent('awtrix-theme-change',{detail:theme}));
  return theme;
}

function nextTheme(){
  const ids=[...themeRegistry.keys()];
  return applyTheme(ids[(ids.indexOf(activeTheme)+1)%ids.length]);
}

window.AWTRIX_THEMES=Object.freeze({
  register:registerTheme,
  apply:applyTheme,
  current:()=>activeTheme,
  info:()=>themeRegistry.get(activeTheme)||themeRegistry.get('dark'),
  all:()=>[...themeRegistry.values()],
  next:nextTheme,
});
