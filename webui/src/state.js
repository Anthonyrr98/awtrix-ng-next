const S={transitions:[],stats:null,ap:false,sysHost:'',sysUid:'',gpio:null,aud:null,
  scriptMax:0,scriptLimit:16,scriptsOff:null};
function readAudioCaps(caps){
  const a=caps.audio||{};
  S.aud={buzzer:a.buzzer===true,track:a.track===true,mp3:a.mp3===true,radio:a.radio===true};
}
// Unknown counts as present, so nothing is hidden before the capabilities have arrived.
const hasSink=(...k)=>!S.aud||k.some(x=>S.aud[x]);
const anyAudioCap=()=>hasSink('buzzer','track','mp3','radio');
async function scriptsOff(){
  if(S.scriptsOff===null){
    try{S.scriptsOff=(await api('/api/v1/device',{timeout:4000})).data.scriptingRunning===false;}
    catch(e){S.scriptsOff=false;}
  }
  return S.scriptsOff;
}
