const $=s=>document.querySelector(s);
function el(tag,attrs,...kids){
  const n=document.createElement(tag);
  if(attrs)for(const[k,v]of Object.entries(attrs)){
    if(v==null)continue;
    if(k==='class')n.className=v;
    else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);
    else if(k==='checked'||k==='disabled'||k==='selected'){if(v)n[k]=true;}
    else if(k==='value')n.value=v;
    else n.setAttribute(k,v);
  }
  for(const k of kids.flat(9)){if(k==null)continue;n.append(k.nodeType?k:String(k));}
  return n;
}
function toast(msg,ok=true,actions){
  const d=el('div',{class:'toast'+(ok?'':' err')},msg);
  if(actions&&actions.length){
    d.append(el('div',{class:'tacts'},...actions.map(a=>{
      const b=el('button',{class:a.pri?'pri':''},a.label);
      b.addEventListener('click',()=>{d.remove();a.fn();});
      return b;
    })));
  }else setTimeout(()=>d.remove(),ok?3000:6000);
  $('#toasts').append(d);
  return d;
}
let netOk=true;
function setNet(ok){
  if(ok===netOk)return;
  netOk=ok;$('#brand').classList.toggle('off',!ok);
}
async function api(path,opts={}){
  const ctrl=new AbortController();
  const to=setTimeout(()=>ctrl.abort(),opts.timeout||12000);
  let r;
  try{r=await fetch(path,{signal:ctrl.signal,...opts});}
  catch(e){clearTimeout(to);setNet(false);throw new Error(t('neterr'));}
  clearTimeout(to);setNet(true);
  const text=await r.text();
  let data=text;try{data=JSON.parse(text);}catch(e){}
  if(!r.ok&&r.status!==202){
    const err=data&&data.error;
    const e=new Error(err?(err.message||err.code)+(err.field?' ('+err.field+')':''):'HTTP '+r.status);
    e.status=r.status;e.code=err&&err.code;
    throw e;
  }
  return{status:r.status,data,text};
}
const req=(m,p,body)=>api(p,body===undefined?{method:m}:{method:m,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const post=(p,body)=>req('POST',p,body);
function fmtBytes(b){return b>=1048576?(b/1048576).toFixed(1)+' MB':b>=1024?(b/1024).toFixed(1)+' KB':b+' B';}
function toHex(v){
  if(typeof v==='string')return v.startsWith('#')?v.toUpperCase():'#'+v.toUpperCase();
  return'#'+(Number(v)>>>0&0xFFFFFF).toString(16).padStart(6,'0').toUpperCase();
}
function inkOn(hex){
  const n=parseInt(hex.slice(1),16)||0;
  const lin=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
  const L=0.2126*lin(n>>16&255)+0.7152*lin(n>>8&255)+0.0722*lin(n&255);
  return L>0.179?'#000':'#fff';
}
function colorPick(value,onInput,cls){
  const input=el('input',{type:'color',value:toHex(value)});
  const hex=el('span',{class:'chex'});
  const wrap=el('span',{class:'cpick'+(cls?' '+cls:'')},input,hex);
  const paint=()=>{
    const h=input.value.toUpperCase();
    hex.replaceChildren(h);
    hex.style.color=inkOn(h);
  };
  input.addEventListener('input',()=>{paint();onInput&&onInput();});
  paint();
  return{node:wrap,input,get:()=>input.value.toUpperCase(),
         set:v=>{input.value=toHex(v);paint();}};
}
function debounce(fn,ms){let h;return(...a)=>{clearTimeout(h);h=setTimeout(()=>fn(...a),ms);};}
function copyText(s){
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(s);
  const ta=el('textarea',{value:s});document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();
  return Promise.resolve();
}
function closeRowMenus(){
  document.querySelectorAll('.rowmenu .mlist').forEach(m=>{m.hidden=true;});
  document.querySelectorAll('.rowmenu .mbtn').forEach(b=>b.setAttribute('aria-expanded','false'));
}
document.addEventListener('click',closeRowMenus);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeRowMenus();});

function rowMenu(items){
  const list=el('div',{class:'mlist',hidden:'hidden'});
  const btn=el('button',{class:'mbtn icon',title:t('more'),'aria-haspopup':'menu',
    'aria-expanded':'false'},'⋯');
  list.addEventListener('click',e=>e.stopPropagation());
  for(const it of items){
    if(!it)continue;
    const[label,fn,danger]=it;
    const b=el('button',danger?{class:'danger'}:null,label);
    if(danger)armable(b,()=>{closeRowMenus();fn();});
    else b.addEventListener('click',()=>{closeRowMenus();fn();});
    list.append(b);
  }
  if(!list.children.length)return null;
  btn.addEventListener('click',e=>{
    e.stopPropagation();
    const open=list.hidden;
    closeRowMenus();
    if(open){list.hidden=false;btn.setAttribute('aria-expanded','true');}
  });
  return el('div',{class:'rowmenu'},btn,list);
}

function armable(btn,fn){
  let armed=null,saved=null;
  btn.addEventListener('click',()=>{
    if(armed){clearTimeout(armed);armed=null;btn.classList.remove('armed');btn.replaceChildren(...saved);fn();return;}
    saved=[...btn.childNodes];
    btn.classList.add('armed');btn.replaceChildren(t('sure'));
    armed=setTimeout(()=>{armed=null;btn.classList.remove('armed');btn.replaceChildren(...saved);},3000);
  });
  return btn;
}
