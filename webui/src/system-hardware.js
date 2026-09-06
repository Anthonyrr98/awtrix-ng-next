function applyGpioCaps(c){
  const dflt=c.defaults||{};
  const gp=p=>'GPIO '+p;
  const inR=(rs,p)=>(rs||[]).some(r=>p>=r[0]&&p<=r[1]);
  const usable=[];
  for(let p=0;p<=c.max;p++)
    if(!inR(c.missing,p)&&!(c.reserved||[]).some(r=>p>=r.lo&&p<=r.hi))usable.push(p);
  const drive=usable.filter(p=>!inR(c.inputOnly,p));
  const adc=usable.filter(p=>inR(c.adc1,p));
  const opts=(k,pool,off)=>{
    const o=pool.map(p=>[p,p===dflt[k]?gp(p)+' (default)|'+gp(p)+' (Standard)':gp(p)]);
    SYSF[k].w='select';SYSF[k].fmt=gp;
    SYSF[k].opt=off?[[-1,'- not connected -|- nicht angeschlossen -']].concat(o):o;
  };
  opts('pinMatrix',c.matrix||[],false);
  ['pinBattery','pinLdr'].forEach(k=>opts(k,adc,true));
  ['pinBtnLeft','pinBtnSelect','pinBtnRight','pinBuzzer','pinI2cSda','pinI2cScl','pinDfTx',
   'pinI2sBclk','pinI2sLrclk','pinI2sDout'].forEach(k=>opts(k,drive,true));
  opts('pinDfRx',usable,true);
  const i2s=dflt.pinI2sBclk>=0?'gpio':'hidden';
  ['pinI2sBclk','pinI2sLrclk','pinI2sDout'].forEach(k=>{SYSF[k].g=i2s;});
}
const PINKEYS=['pinMatrix','pinBtnLeft','pinBtnSelect','pinBtnRight','pinBattery','pinLdr',
  'pinBuzzer','pinI2cSda','pinI2cScl','pinDfRx','pinDfTx','pinI2sBclk','pinI2sLrclk','pinI2sDout'];
const REBOOT_KEYS=new Set(['wifiSsid','wifiPass','netStatic','ip','gateway','subnet','dns1','dns2',
  'wifiConnectTimeout','hostname','webPort','mqttEnabled','mqttTls','mqttHost','mqttPort','mqttUser',
  'mqttPass','mqttPrefix','statsInterval','dfplayer','scriptingEnabled'].concat(PINKEYS));
function paintPinUse(fields){
  const by=new Map();
  PINKEYS.forEach(k=>{
    const f=fields[k];if(!f)return;
    const v=f.get();if(v>=0&&!by.has(v))by.set(v,tt(SYSF[k].l));
  });
  PINKEYS.forEach(k=>{
    const f=fields[k],sel=f&&f.row.querySelector('select');if(!sel)return;
    const mine=f.get();
    for(const o of sel.options){
      const v=Number(o.value),who=by.get(v);
      o.textContent=o.textContent.split(' · ')[0]+
        (v>=0&&who&&v!==mine?' · '+t('pinUsed')+': '+who:'');
    }
  });
}
function paintWakePin(fields,out){
  const f=fields.pinBtnSelect,rtc=S.gpio&&S.gpio.rtc;
  if(!f||!rtc)return;
  const p=f.get();
  out.textContent=(p>=0&&!rtc.some(r=>p>=r[0]&&p<=r[1]))?t('wakeNo'):'';
}
function paintPanelSize(fields,out){
  const pw=Number(fields.panelWidth.get()),n=Number(fields.panels.get()),w=pw*n;
  const bad=(w<32||w>128)?t('pnBadWidth'):'';
  out.className='badge '+(bad?'bad':'good');
  out.replaceChildren(bad||w+' × 8 = '+(w*8)+' '+t('pnLeds')+' · '+
    (n>1?n+' '+t('pnPanelsOf')+' '+pw+' × 8':t('pnOne')));
}
