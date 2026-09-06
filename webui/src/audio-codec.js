const RTTTL_FREQ=[0,
  262,277,294,311,330,349,370,392,415,440,466,494,
  523,554,587,622,659,698,740,784,831,880,932,988,
  1047,1109,1175,1245,1319,1397,1480,1568,1661,1760,1865,1976,
  2093,2217,2349,2489,2637,2794,2960,3136,3322,3520,3729,3951];
const RTTTL_SEMI={c:1,d:3,e:5,f:6,g:8,a:10,b:12};
const RTTTL_MAX=512;
const RTTTL_GAP=0.006;
const noteMs=(d,timeUnit)=>Math.floor(d*timeUnit/2);
function rtttlParse(s){
  const bad=(error,index)=>({ok:false,error,index});
  if(s.length>RTTTL_MAX)return bad('melody is longer than '+RTTTL_MAX+' characters',RTTTL_MAX);
  const c1=s.indexOf(':');if(c1<0)return bad("missing ':' after the melody name",s.length);
  const c2=s.indexOf(':',c1+1);if(c2<0)return bad("missing ':' before the notes",s.length);
  const title=s.slice(0,c1).trim();
  if(!title)return bad('the melody name is empty',0);
  if(title.length>24)return bad('the melody name is longer than 24 characters',24);
  const def={d:4,o:6,b:63},seen={};
  const dtxt=s.slice(c1+1,c2);
  for(const part of dtxt.split(',')){
    const at=c1+1+dtxt.indexOf(part);
    if(!part.trim())continue;
    const m=/^\s*([dobDOB])\s*=\s*(\d+)\s*$/.exec(part);
    if(!m)return bad("expected 'd=', 'o=' or 'b=' here",at);
    const k=m[1].toLowerCase(),v=+m[2];
    if(seen[k])return bad("'"+k+"' is set twice",at);
    seen[k]=1;
    if(k==='d'&&![1,2,4,8,16,32].includes(v))return bad("'d' must be 1, 2, 4, 8, 16 or 32",at);
    if(k==='o'&&(v<4||v>7))return bad("'o' must be 4, 5, 6 or 7",at);
    if(k==='b'&&(v<10||v>300))return bad("'b' must be between 10 and 300",at);
    def[k]=v;
  }
  const timeUnit=Math.floor(Math.floor(60*1000*4/def.b)/32);
  const notes=[];
  let i=c2+1;
  const rest=s.slice(c2+1);
  const parts=rest.split(',');
  for(const part of parts){
    const at=i;i+=part.length+1;
    const m=/^\s*(\d+)?([a-gpA-GP])(#)?(\.)?(\d)?(\.)?\s*$/.exec(part);
    if(!m)return bad(part.trim()?"'"+part.trim()+"' is not a note":'empty note',at);
    const dur=m[1]===undefined?def.d:+m[1];
    if(![1,2,4,8,16,32].includes(dur))return bad('note length must be 1, 2, 4, 8, 16 or 32',at);
    const letter=m[2].toLowerCase(),isRest=letter==='p';
    if(m[3]&&isRest)return bad('a rest cannot be sharp',at);
    if(m[3]&&(letter==='b'||letter==='e'))return bad("'"+letter+"#' is not a note; use the next letter",at);
    if(m[4]&&m[6])return bad('note is dotted twice',at);
    const oct=m[5]===undefined?def.o:+m[5];
    if(oct<4||oct>7)return bad('octave must be 4, 5, 6 or 7',at);
    let units=64/dur;
    if(m[4]||m[6])units+=units/2;
    notes.push({f:isRest?0:RTTTL_FREQ[(oct-4)*12+RTTTL_SEMI[letter]+(m[3]?1:0)],d:units});
  }
  if(!notes.length)return bad('the melody has no notes',c2+1);
  const ms=notes.reduce((a,n)=>a+noteMs(n.d,timeUnit),0);
  return{ok:true,title,timeUnit,notes,durationMs:ms};
}
