const PISKEL_URL_DEFAULT='https://blueforcer.github.io/awtrix-piskel/';
function getPiskelUrl(){try{return localStorage.awtrixPiskelUrl||PISKEL_URL_DEFAULT;}catch(e){return PISKEL_URL_DEFAULT;}}
function piskelOrigin(){try{return new URL(getPiskelUrl()).origin;}catch(e){return'';}}
function postToPiskel(msg){
  const f=$('#piskelFrame'),o=piskelOrigin();
  if(f&&f.contentWindow&&o)f.contentWindow.postMessage(Object.assign({ns:'awtrix'},msg),o);
}
function notifyPiskelTheme(){postToPiskel({type:'theme',theme:document.documentElement.dataset.theme==='light'?'light':'dark'});}
let pendingEditIcon=null;
let piskelReady=false;
function b64ToBlob(b64,mime){
  const bin=atob(b64),len=bin.length,arr=new Uint8Array(len);
  for(let i=0;i<len;i++)arr[i]=bin.charCodeAt(i);
  return new Blob([arr],{type:mime||'application/octet-stream'});
}
function blobToB64(blob){return new Promise((res,rej)=>{
  const fr=new FileReader();
  fr.onload=()=>res(String(fr.result).split(',')[1]||'');
  fr.onerror=()=>rej(new Error(t('neterr')));
  fr.readAsDataURL(blob);
});}
function iconIdFrom(name){return(String(name||'').replace(/\.[^.]+$/,'').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,32))||'icon';}
async function piskelSendList(){
  try{const{data}=await api('/api/v1/files?dir='+encodeURIComponent('/ICONS'),{cache:'no-store'});
    postToPiskel({type:'list-result',files:data.files||[],usedBytes:data.usedBytes,totalBytes:data.totalBytes});
  }catch(e){postToPiskel({type:'list-result',files:[],error:e.message});}
}
async function piskelSendIcon(name){
  try{const r=await fetch('/ICONS/'+encodeURIComponent(name),{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const blob=await r.blob();
    postToPiskel({type:'load-result',name,mime:blob.type||'image/gif',dataBase64:await blobToB64(blob)});
  }catch(e){toast(e.message,false);}
}
async function piskelSave(m){
  const id=iconIdFrom(m.name),fn=id+'.gif';
  let blob=b64ToBlob(m.dataBase64,m.mime||'image/gif');
  try{
    if(m.mime==='image/jpeg')blob=await imgToGif(blob);
    await uploadFile(blob,'/ICONS',fn,null);
    await dropStale('/ICONS',id+'.jpg',fn);
    postToPiskel({type:'save-result',ok:true,name:fn});
    toast(fn+' '+t('uploaded'));
  }catch(e){postToPiskel({type:'save-result',ok:false,name:fn,error:e.message});toast(e.message,false);}
}
const LIVE_NAME='draw-preview';
let piskelLiveOn=false,lastLiveErr='';
async function piskelLive(m){
  piskelLiveOn=true;
  const body=m.mode==='bitmap'
    ?{hold:true,stack:false,name:LIVE_NAME,text:'',draw:[['bitmap',0,0,m.w,m.h,m.dataBase64]]}
    :{hold:true,stack:false,name:LIVE_NAME,text:'',icon:m.dataBase64};
  try{await post('/api/v1/notifications',body);lastLiveErr='';}
  catch(e){if(e.message!==lastLiveErr){lastLiveErr=e.message;toast(e.message,false);}}
}
async function piskelLiveOff(){
  piskelLiveOn=false;
  try{await api('/api/v1/notifications/'+LIVE_NAME,{method:'DELETE'});}catch(e){}
}
window.addEventListener('message',e=>{
  if(!$('#piskelFrame'))return;
  if(e.origin!==piskelOrigin())return;
  const m=e.data;if(!m||m.ns!=='awtrix')return;
  if(m.type==='ready'){
    piskelReady=true;
    const l=$('#piskelFrame')&&document.querySelector('.piskelload');if(l)l.remove();
    notifyPiskelTheme();
    postToPiskel({type:'config',sizes:['8x8','32x8']});
    if(pendingEditIcon){const n=pendingEditIcon;pendingEditIcon=null;piskelSendIcon(n);}
  }else if(m.type==='save')piskelSave(m);
  else if(m.type==='list')piskelSendList();
  else if(m.type==='load'&&m.name)piskelSendIcon(m.name);
  else if(m.type==='live')piskelLive(m);
  else if(m.type==='live-off')piskelLiveOff();
});
window.addEventListener('hashchange',()=>{if(piskelLiveOn&&currentRoute()!=='editor')piskelLiveOff();});
window.addEventListener('pagehide',()=>{if(piskelLiveOn){try{fetch('/api/v1/notifications/'+LIVE_NAME,{method:'DELETE',keepalive:true});}catch(e){}}});
function viewEditor(view){
  if(piskelLiveOn)piskelLiveOff();
  piskelReady=false;
  const url=getPiskelUrl();
  const theme=document.documentElement.dataset.theme==='light'?'light':'dark';
  const src=url+(url.includes('?')?'&':'?')+'theme='+encodeURIComponent(theme)+'&sizes=8x8,32x8&host=awtrix';
  const loading=el('div',{class:'piskelload'},el('span',{class:'spin'}),el('span',null,t('edLoading')));
  const frame=el('iframe',{id:'piskelFrame',src,title:t('editorTab'),allow:'clipboard-read; clipboard-write'});
  view.append(el('div',{class:'piskelwrap wide'},loading,frame));
  setTimeout(()=>{
    if(!piskelReady&&document.contains(loading)){
      loading.classList.add('err');
      loading.replaceChildren(el('div',null,t('edUnreachable')));
    }
  },6000);
}
