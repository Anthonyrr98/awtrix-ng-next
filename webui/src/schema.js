const F=(g,w,l,h,x)=>Object.assign({g,w,l,h},x);
const HHELP='Black = use the global text colour.|Schwarz = globale Textfarbe verwenden.';
const OVERLAYS=['rain','snow','drizzle','storm','thunder','frost'];
const NULLABLE={timeColor:'#000000',dateColor:'#000000',humidityColor:'#000000',
 temperatureColor:'#000000',batteryColor:'#000000',colorCorrection:'#FFFFFF',colorTint:'#FFFFFF'};
const FIELDS={
 brightness:F('bright','slider','Brightness|Helligkeit','Ignored while auto brightness is on.|Ohne Wirkung bei automatischer Helligkeit.',{min:0,max:255}),
 autoBrightness:F('bright','toggle','Auto brightness|Automatische Helligkeit','Follows the ambient light sensor.|Folgt dem Umgebungslichtsensor.'),
 power:F('bright','toggle','Display on|Anzeige an','Turns the matrix off without cutting power.|Schaltet die Matrix aus, ohne den Strom zu trennen.'),
 appDurationMs:F('apps','number','Time per app|Zeit pro App','How long each app stays.|Wie lange jede App bleibt.',{min:1000,max:3600000,step:500,unit:'ms'}),
 autoTransition:F('apps','toggle','Auto rotation|Automatischer Wechsel','Moves to the next app on its own.|Wechselt von selbst zur nächsten App.'),
 gifGalleryMode:F('apps','select','GIF Gallery mode|GIF-Galerie-Modus','Continuous stays in GIF Gallery; rotation resumes where it stopped.|Fortlaufend bleibt in der GIF-Galerie; Rotation setzt an der letzten Stelle fort.',{opt:[['rotation','App rotation|App-Rotation'],['continuous','Continuous loop|Endlosschleife']]}),
 transitionDurationMs:F('apps','number','Transition duration|Übergangsdauer','Length of the switch. 0 = instant.|Dauer des Wechsels. 0 = sofort.',{min:0,max:5000,unit:'ms'}),
 transitionEffect:F('apps','select','Transition effect|Übergangseffekt','Animation between two apps.|Animation zwischen zwei Apps.',{opt:'transitions'}),
 blockNavigation:F('apps','toggle','Block buttons|Tasten sperren','Ignore buttons and API for app switching.|App-Wechsel per Taste und API ignorieren.'),
 timeMode:F('clock','select','Clock layout|Uhr-Layout','What the clock app draws.|Was die Uhr-App zeichnet.',{opt:[
   [0,'Time only|Nur Uhrzeit'],[1,'Calendar, weekday bar below|Kalenderblatt, Wochentage unten'],
   [2,'Calendar, weekday bar on top|Kalenderblatt, Wochentage oben'],[3,'Spiral calendar, weekday below|Ringkalender, Wochentage unten'],
   [4,'Spiral calendar, weekday on top|Ringkalender, Wochentage oben'],[5,'Big clock|Große Uhr'],[6,'Binary clock|Binäruhr']]}),
 time24h:F('clock','toggle','24-hour clock|24-Stunden-Uhr','Off = 12-hour clock.|Aus = 12-Stunden-Uhr.'),
 timeLeadingZero:F('clock','toggle','Leading zero|Führende Null','Show 07:05 instead of 7:05.|07:05 statt 7:05 anzeigen.'),
 timeShowSeconds:F('clock','toggle','Show seconds|Sekunden anzeigen','Plain clock layout only.|Nur im einfachen Uhr-Layout.'),
 timeShowAmPm:F('clock','toggle','AM/PM indicator|AM/PM anzeigen','12-hour clock only; hidden while seconds show.|Nur bei 12-Stunden-Uhr; entfällt bei Sekunden.'),
 timeSeparatorMode:F('clock','select','Colon between hours and minutes|Doppelpunkt zwischen Stunden und Minuten','Blinking shows the seconds without digits.|Blinken zeigt die Sekunden ohne Ziffern.',{opt:[
   ['steady','Steady on|Dauerhaft an'],['blink','Blinking every second|Blinkt im Sekundentakt'],
   ['pulse','Pulsing (soft fade)|Pulsierend (weiches Ein-/Ausblenden)']]}),
 dateOrder:F('clock','select','Date order|Datums-Reihenfolge','Applies everywhere a date is shown.|Gilt überall, wo ein Datum erscheint.',{opt:[
   ['dayMonthYear','Day, month, year (31.12.25)|Tag, Monat, Jahr (31.12.25)'],
   ['monthDayYear','Month, day, year (12/31/25)|Monat, Tag, Jahr (12/31/25)'],
   ['yearMonthDay','Year, month, day (25-12-31)|Jahr, Monat, Tag (25-12-31)']]}),
 dateSeparator:F('clock','select','Date separator|Datums-Trennzeichen','Character between day and month.|Zeichen zwischen Tag und Monat.',{opt:[
   ['dot','Dot (31.12.)|Punkt (31.12.)'],['slash','Slash (31/12)|Schrägstrich (31/12)'],
   ['dash','Dash (31-12)|Bindestrich (31-12)']]}),
 dateYearMode:F('clock','select','Year in the date|Jahr im Datum','Hiding it leaves more room on the panel.|Ausblenden schafft mehr Platz auf dem Panel.',{opt:[
   ['none','Hidden|Ausblenden'],['twoDigit','2 digits (25)|2-stellig (25)'],
   ['fourDigit','4 digits (2025)|4-stellig (2025)']]}),
 dateShowWeekday:F('clock','toggle','Weekday prefix|Wochentags-Kürzel','Short weekday name before the date (Wed 31.12.).|Kürzel vor dem Datum (Wed 31.12.).'),
 dateMonthNames:F('clock','toggle','Month as name|Monat als Name','Show “31 Dec” instead of “31.12”.|„31 Dec“ statt „31.12“ anzeigen.'),
 'weekdayBar.show':F('clock','toggle','Weekday bar|Wochentagsleiste','Row of seven marks for the days of the week.|Reihe aus sieben Strichen für die Wochentage.'),
 'weekdayBar.startOnMonday':F('clock','toggle','Week starts Monday|Woche beginnt Montag','Display order only.|Nur die Anzeigereihenfolge.'),
 'weekdayBar.weekendDays':F('clock','days','Weekend days|Wochenendtage','Days that use the weekend colours.|Tage mit Wochenendfarben.'),
 'weekdayBar.activeColor':F('clock','color','Today|Heute','Mark of the current day.|Strich des heutigen Tages.'),
 'weekdayBar.inactiveColor':F('clock','color','Other workdays|Übrige Werktage','Marks of the remaining days.|Striche der übrigen Tage.'),
 'weekdayBar.weekendActiveColor':F('clock','color','Today on a weekend|Heute am Wochenende','Used when today is a weekend day.|Gilt, wenn heute ein Wochenendtag ist.'),
 'weekdayBar.weekendInactiveColor':F('clock','color','Other weekend days|Übrige Wochenendtage','The rest of the weekend list.|Der Rest der Wochenendliste.'),
 timeColor:F('clock','color','Time colour|Uhrzeit-Farbe',HHELP),
 dateColor:F('clock','color','Date colour|Datums-Farbe',HHELP),
 calendarHeaderColor:F('clock','color','Calendar header|Kalender-Kopf','Only in the calendar layouts.|Nur in den Kalender-Layouts.'),
 calendarTextColor:F('clock','color','Calendar text|Kalender-Text','Day number.|Tageszahl.'),
 calendarBodyColor:F('clock','color','Calendar body|Kalender-Blatt','Background.|Hintergrund.'),
 textColor:F('text','color','Text colour|Textfarbe','Applies to all text.|Gilt für alle Texte.'),
 uppercase:F('text','toggle','Uppercase|Großbuchstaben','Shows every text in capitals.|Zeigt alle Texte in Großbuchstaben.'),
 'scroll.mode':F('text','select','Scroll mode|Lauftext-Modus','What text does when it is too long for the panel.|Was Text macht, der zu lang fürs Panel ist.',{opt:[
   ['static','Stand still, clip the rest|Stehen bleiben, Rest abschneiden'],
   ['wrap','Start over after each pass|Nach jedem Durchlauf neu beginnen'],
   ['loop','Run continuously|Durchgehend laufen'],
   ['bounce','Sweep back and forth|Vor und zurück laufen']]}),
 'scroll.direction':F('text','select','Scroll direction|Laufrichtung','Which way the text moves.|In welche Richtung der Text läuft.',{opt:[
   ['left','Right to left|Von rechts nach links'],
   ['right','Left to right|Von links nach rechts']]}),
 'scroll.entry':F('text','select','Text entry|Texteinstieg','Where a text starts its first pass.|Wo ein Text seinen ersten Durchlauf beginnt.',{opt:[
   ['inline','Visible right away|Sofort sichtbar'],
   ['offscreen','Run in from off-panel|Von außerhalb einlaufen']]}),
 'scroll.whenFits':F('text','select','Text that fits|Text, der passt','Only affects text short enough for the panel.|Betrifft nur Text, der kurz genug fürs Panel ist.',{opt:[
   ['static','Stays still|Bleibt stehen'],
   ['scroll','Moves anyway|Läuft trotzdem']]}),
 'scroll.speed':F('text','slider','Scroll speed|Lauftext-Tempo','100 % = normal, 0 stops.|100 % = normal, 0 hält an.',{min:0,max:200,unit:'%'}),
 'scroll.gap':F('text','slider','Loop gap|Abstand im Durchlauf','Space between repetitions.|Abstand zwischen Wiederholungen.',{min:0,max:64,unit:'px'}),
 'scroll.holdMs':F('text','slider','Pause|Pause','Before the text starts, and at each bounce turn.|Vor dem Start und an jedem Wendepunkt.',{min:0,max:5000,step:100,unit:'ms'}),
 overlay:F('overlay','select','Overlay|Overlay','Set by hand, not from real weather data.|Manuell gesetzt, nicht aus echten Wetterdaten.',{opt:[['','- none -|- keins -']].concat(OVERLAYS.map(o=>[o,o]))}),
 overlaySpeed:F('overlay','slider','Overlay speed|Overlay-Tempo','100 % is the overlay’s own pace.|100 % ist das Eigentempo des Overlays.',{min:10,max:200,step:5,unit:'%'}),
 useCelsius:F('sensors','toggle','Celsius|Celsius','Off = Fahrenheit.|Aus = Fahrenheit.'),
 temperatureColor:F('sensors','color','Temperature colour|Temperatur-Farbe',HHELP),
 humidityColor:F('sensors','color','Humidity colour|Luftfeuchte-Farbe',HHELP),
 batteryColor:F('sensors','color','Battery colour|Akku-Farbe',HHELP),
 saturation:F('color','slider','Saturation|Sättigung','0 % = grayscale.|0 % = Graustufen.',{min:0,max:100,unit:'%'}),
 gamma:F('color','number','Gamma|Gamma','Higher = darker mid-tones.|Höher = dunklere Mitteltöne.',{min:1,max:3,step:0.1}),
 colorCorrection:F('color','color','Colour correction|Farbkorrektur','Fixes a colour cast. White = off.|Korrigiert einen Farbstich. Weiß = aus.'),
 colorTint:F('color','color','Colour tint|Farbtönung','Tints the whole panel. White = off.|Färbt das gesamte Panel ein. Weiß = aus.'),
};
const SET_GROUPS=[['bright','grpBright','grpBrightH'],['color','grpColor','grpColorH'],
 ['apps','grpApps','grpAppsH'],['clock','grpClock','grpClockH'],
 ['text','grpText','grpTextH'],['overlay','grpOverlay','grpOverlayH'],
 ['sensors','grpSensors','grpSensorsH']];
/* TZ-DATA-START */
/* GENERATED by scripts/tz_data.py from IANA tzdata 2026a - DO NOT EDIT BY HAND.
   Each row is one POSIX TZ rule and the zones that follow it. */
const TZ_TABLE=[
['<+00>0<+02>-2,M3.5.0/1,M10.5.0/3','Antarctica/Troll'],
['<+01>-1','Africa/Casablanca Africa/El_Aaiun'],
['<+0330>-3:30','Asia/Tehran'],
['<+03>-3','Asia/Amman Asia/Baghdad Asia/Damascus Asia/Qatar Asia/Riyadh Europe/Istanbul Europe/Minsk'],
['<+0430>-4:30','Asia/Kabul'],
['<+04>-4','Asia/Baku Asia/Dubai Asia/Tbilisi Asia/Yerevan Europe/Astrakhan Europe/Samara Europe/Saratov Europe/Ulyanovsk Indian/Mauritius'],
['<+0530>-5:30','Asia/Colombo'],
['<+0545>-5:45','Asia/Kathmandu'],
['<+05>-5','Asia/Almaty Asia/Aqtau Asia/Aqtobe Asia/Ashgabat Asia/Atyrau Asia/Dushanbe Asia/Oral Asia/Qostanay Asia/Qyzylorda Asia/Samarkand Asia/Tashkent Asia/Yekaterinburg Indian/Maldives Antarctica/Mawson Antarctica/Vostok'],
['<+0630>-6:30','Asia/Yangon'],
['<+06>-6','Asia/Bishkek Asia/Dhaka Asia/Omsk Asia/Thimphu Asia/Urumqi Indian/Chagos'],
['<+07>-7','Asia/Bangkok Asia/Barnaul Asia/Ho_Chi_Minh Asia/Hovd Asia/Krasnoyarsk Asia/Novokuznetsk Asia/Novosibirsk Asia/Tomsk Antarctica/Davis'],
['<+0845>-8:45','Australia/Eucla'],
['<+08>-8','Asia/Irkutsk Asia/Kuching Asia/Singapore Asia/Ulaanbaatar Antarctica/Casey'],
['<+09>-9','Asia/Chita Asia/Dili Asia/Khandyga Asia/Yakutsk Pacific/Palau'],
['<+1030>-10:30<+11>-11,M10.1.0,M4.1.0','Australia/Lord_Howe'],
['<+10>-10','Asia/Ust-Nera Asia/Vladivostok Pacific/Port_Moresby'],
['<+11>-11','Asia/Magadan Asia/Sakhalin Asia/Srednekolymsk Pacific/Bougainville Pacific/Efate Pacific/Guadalcanal Pacific/Kosrae Pacific/Noumea'],
['<+11>-11<+12>,M10.1.0,M4.1.0/3','Pacific/Norfolk'],
['<+1245>-12:45<+1345>,M9.5.0/2:45,M4.1.0/3:45','Pacific/Chatham'],
['<+12>-12','Asia/Anadyr Asia/Kamchatka Pacific/Fiji Pacific/Kwajalein Pacific/Nauru Pacific/Tarawa'],
['<+13>-13','Pacific/Apia Pacific/Fakaofo Pacific/Kanton Pacific/Tongatapu'],
['<+14>-14','Pacific/Kiritimati'],
['<-01>1','Atlantic/Cape_Verde'],
['<-01>1<+00>,M3.5.0/0,M10.5.0/1','Atlantic/Azores'],
['<-02>2','America/Noronha Atlantic/South_Georgia'],
['<-02>2<-01>,M3.5.0/-1,M10.5.0/0','America/Nuuk America/Scoresbysund'],
['<-03>3','America/Araguaina America/Argentina/Buenos_Aires America/Argentina/Catamarca America/Argentina/Cordoba America/Argentina/Jujuy America/Argentina/La_Rioja America/Argentina/Mendoza America/Argentina/Rio_Gallegos America/Argentina/Salta America/Argentina/San_Juan America/Argentina/San_Luis America/Argentina/Tucuman America/Argentina/Ushuaia America/Asuncion America/Bahia America/Belem America/Cayenne America/Coyhaique America/Fortaleza America/Maceio America/Montevideo America/Paramaribo America/Punta_Arenas America/Recife America/Santarem America/Sao_Paulo Atlantic/Stanley Antarctica/Palmer Antarctica/Rothera'],
['<-03>3<-02>,M3.2.0,M11.1.0','America/Miquelon'],
['<-04>4','America/Boa_Vista America/Campo_Grande America/Caracas America/Cuiaba America/Guyana America/La_Paz America/Manaus America/Porto_Velho'],
['<-04>4<-03>,M9.1.6/24,M4.1.6/24','America/Santiago'],
['<-05>5','America/Bogota America/Eirunepe America/Guayaquil America/Lima America/Rio_Branco'],
['<-06>6','Pacific/Galapagos'],
['<-06>6<-05>,M9.1.6/22,M4.1.6/22','Pacific/Easter'],
['<-08>8','Pacific/Pitcairn'],
['<-0930>9:30','Pacific/Marquesas'],
['<-09>9','Pacific/Gambier'],
['<-10>10','Pacific/Rarotonga Pacific/Tahiti'],
['<-11>11','Pacific/Niue'],
['ACST-9:30','Australia/Darwin'],
['ACST-9:30ACDT,M10.1.0,M4.1.0/3','Australia/Adelaide Australia/Broken_Hill'],
['AEST-10','Australia/Brisbane Australia/Lindeman'],
['AEST-10AEDT,M10.1.0,M4.1.0/3','Australia/Hobart Australia/Melbourne Australia/Sydney Antarctica/Macquarie'],
['AKST9AKDT,M3.2.0,M11.1.0','America/Anchorage America/Juneau America/Metlakatla America/Nome America/Sitka America/Yakutat'],
['AST4','America/Barbados America/Martinique America/Puerto_Rico America/Santo_Domingo'],
['AST4ADT,M3.2.0,M11.1.0','America/Glace_Bay America/Goose_Bay America/Halifax America/Moncton America/Thule Atlantic/Bermuda'],
['AWST-8','Australia/Perth'],
['CAT-2','Africa/Juba Africa/Khartoum Africa/Maputo Africa/Windhoek'],
['CET-1','Africa/Algiers Africa/Tunis'],
['CET-1CEST,M3.5.0,M10.5.0/3','Africa/Ceuta Europe/Andorra Europe/Belgrade Europe/Berlin Europe/Brussels Europe/Budapest Europe/Gibraltar Europe/Madrid Europe/Malta Europe/Paris Europe/Prague Europe/Rome Europe/Tirane Europe/Vienna Europe/Warsaw Europe/Zurich'],
['CST-8','Asia/Macau Asia/Shanghai Asia/Taipei'],
['CST5CDT,M3.2.0/0,M11.1.0/1','America/Havana'],
['CST6','America/Bahia_Banderas America/Belize America/Chihuahua America/Costa_Rica America/El_Salvador America/Guatemala America/Managua America/Merida America/Mexico_City America/Monterrey America/Regina America/Swift_Current America/Tegucigalpa'],
['CST6CDT,M3.2.0,M11.1.0','America/Chicago America/Indiana/Knox America/Indiana/Tell_City America/Matamoros America/Menominee America/North_Dakota/Beulah America/North_Dakota/Center America/North_Dakota/New_Salem America/Ojinaga America/Rankin_Inlet America/Resolute America/Winnipeg'],
['ChST-10','Pacific/Guam'],
['EAT-3','Africa/Nairobi'],
['EET-2','Africa/Tripoli Europe/Kaliningrad'],
['EET-2EEST,M3.4.4/50,M10.4.4/50','Asia/Gaza Asia/Hebron'],
['EET-2EEST,M3.5.0/0,M10.5.0/0','Asia/Beirut'],
['EET-2EEST,M3.5.0/3,M10.5.0/4','Asia/Famagusta Asia/Nicosia Europe/Athens Europe/Bucharest Europe/Chisinau Europe/Helsinki Europe/Kyiv Europe/Riga Europe/Sofia Europe/Tallinn Europe/Vilnius'],
['EET-2EEST,M4.5.5/0,M10.5.4/24','Africa/Cairo'],
['EST5','America/Cancun America/Jamaica America/Panama'],
['EST5EDT,M3.2.0,M11.1.0','America/Detroit America/Grand_Turk America/Indiana/Indianapolis America/Indiana/Marengo America/Indiana/Petersburg America/Indiana/Vevay America/Indiana/Vincennes America/Indiana/Winamac America/Iqaluit America/Kentucky/Louisville America/Kentucky/Monticello America/New_York America/Port-au-Prince America/Toronto'],
['GMT0','Africa/Abidjan Africa/Bissau Africa/Monrovia Africa/Sao_Tome America/Danmarkshavn'],
['GMT0BST,M3.5.0/1,M10.5.0','Europe/London'],
['HKT-8','Asia/Hong_Kong'],
['HST10','Pacific/Honolulu'],
['HST10HDT,M3.2.0,M11.1.0','America/Adak'],
['IST-1GMT0,M10.5.0,M3.5.0/1','Europe/Dublin'],
['IST-2IDT,M3.4.4/26,M10.5.0','Asia/Jerusalem'],
['IST-5:30','Asia/Kolkata'],
['JST-9','Asia/Tokyo'],
['KST-9','Asia/Pyongyang Asia/Seoul'],
['MSK-3','Europe/Kirov Europe/Moscow Europe/Simferopol Europe/Volgograd'],
['MST7','America/Dawson America/Dawson_Creek America/Fort_Nelson America/Hermosillo America/Mazatlan America/Phoenix America/Whitehorse'],
['MST7MDT,M3.2.0,M11.1.0','America/Boise America/Cambridge_Bay America/Ciudad_Juarez America/Denver America/Edmonton America/Inuvik'],
['NST3:30NDT,M3.2.0,M11.1.0','America/St_Johns'],
['NZST-12NZDT,M9.5.0,M4.1.0/3','Pacific/Auckland'],
['PKT-5','Asia/Karachi'],
['PST-8','Asia/Manila'],
['PST8PDT,M3.2.0,M11.1.0','America/Los_Angeles America/Tijuana America/Vancouver'],
['SAST-2','Africa/Johannesburg'],
['SST11','Pacific/Pago_Pago'],
['UTC0','UTC'],
['WAT-1','Africa/Lagos Africa/Ndjamena'],
['WET0WEST,M3.5.0/1,M10.5.0','Atlantic/Canary Atlantic/Faroe Atlantic/Madeira Europe/Lisbon'],
['WIB-7','Asia/Jakarta Asia/Pontianak'],
['WIT-9','Asia/Jayapura'],
['WITA-8','Asia/Makassar']];
/* TZ-DATA-END */
const TZRULE=new Map(),TZFIRST=new Map();
TZ_TABLE.forEach(([rule,zones])=>{
  const list=zones.split(' ');
  TZFIRST.set(rule,list[0]);
  list.forEach(n=>TZRULE.set(n,rule));
});
const TZNAMES=[...TZRULE.keys()].sort();
const TZFMT=new Map();
function tzOffset(zone,at){
  let f=TZFMT.get(zone);
  if(!f)TZFMT.set(zone,f=new Intl.DateTimeFormat('en',{timeZone:zone,timeZoneName:'longOffset'}));
  const s=f.formatToParts(at).find(p=>p.type==='timeZoneName').value;
  const m=/GMT([+-])(\d+)(?::(\d+))?/.exec(s);
  return m?(m[1]==='-'?-1:1)*(Number(m[2])*60+Number(m[3]||0)):0;
}
const tzOffsetStr=o=>'UTC'+(o<0?'-':'+')+Math.floor(Math.abs(o)/60)+(Math.abs(o)%60?':'+String(Math.abs(o)%60).padStart(2,'0'):'');
function tzState(zone){
  const now=new Date(),cur=tzOffset(zone,now);
  const DAY=864e5;
  let win=cur,sum=cur,next=null;
  for(let i=1;i<=366;i++){
    const o=tzOffset(zone,new Date(+now+i*DAY));
    win=Math.min(win,o);sum=Math.max(sum,o);
    if(next===null&&o!==cur)next=new Date(+now+i*DAY);
  }
  return{off:cur,dst:sum>win&&cur===sum,changes:sum>win,next};
}
const SYSF={
 wifiSsid:F('wifi','wifi','WiFi network|WLAN-Netz','Pick a network or type its name.|Netz wählen oder Namen eintippen.'),
 wifiPass:F('wifi','secret','WiFi password|WLAN-Passwort','Leave empty to keep the saved password.|Leer lassen, um das gespeicherte Passwort zu behalten.'),
 hostname:F('wifi','text','Hostname|Hostname','Name on the network (mDNS). Empty = derived from the MAC address.|Name im Netzwerk (mDNS). Leer = automatisch aus der MAC-Adresse.'),
 netStatic:F('wifi','toggle','Static IP|Feste IP','Off = DHCP (recommended).|Aus = DHCP (empfohlen).'),
 ip:F('wifi','text','IP address|IP-Adresse','With the mask as a prefix, e.g. 192.168.1.50/24.|Mit Maske als Präfix, z. B. 192.168.1.50/24.',
   {showIf:'netStatic',load:(v,d)=>{
     if(!v||!d.subnet)return v;
     const q=(d.subnet.split('.').map(Number).reduce((a,b)=>(a<<8)|b)>>>0);
     const inv=(~q)>>>0;
     if(((inv+1)&inv)!==0)return v;
     return v+'/'+(32-Math.round(Math.log2(inv+1)));
   }}),
 gateway:F('wifi','text','Gateway|Gateway','Usually your router.|Meist dein Router.',{showIf:'netStatic'}),
 subnet:F('hidden','text','Subnet mask|Subnetzmaske',''),
 dns1:F('wifi','text','DNS 1|DNS 1','Name server, usually your router.|Namensserver, meist dein Router.',{showIf:'netStatic'}),
 dns2:F('wifi','text','DNS 2|DNS 2','Fallback if the first one does not answer.|Ersatz, wenn der erste nicht antwortet.',{showIf:'netStatic'}),
 wifiConnectTimeout:F('wifi','number','Connect timeout|Verbindungs-Zeitlimit','How long to wait for WiFi at boot before opening the setup hotspot.|Wie lange beim Start auf WLAN gewartet wird, bevor der Einrichtungs-Hotspot aufgeht.',{min:5000,max:120000,unit:'ms'}),
 wifiRoamRssi:F('wifi','number','Roam below|Wechseln unterhalb','Switch access point when the signal stays this weak. 0 = off.|Access Point wechseln, wenn das Signal dauerhaft so schwach ist. 0 = aus.',{min:-90,max:0,unit:'dBm'}),
 webPort:F('web','number','Port|Port','HTTP port of this interface (default 80).|HTTP-Port dieser Oberfläche (Standard 80).',{min:1,max:65535}),
 authEnabled:F('web','toggle','Enable login|Login aktivieren','Require a login for the UI and API.|Login für UI und API verlangen.'),
 authUser:F('web','text','Username|Benutzername','Needed once a login is required.|Nötig, sobald ein Login verlangt wird.'),
 authPass:F('web','secret','Password|Passwort','Leave empty to keep the saved password.|Leer lassen, um das gespeicherte Passwort zu behalten.'),
 mqttEnabled:F('mqtt','toggle','Enable MQTT|MQTT aktivieren','Connect to the broker below.|Mit dem Broker unten verbinden.'),
 mqttTls:F('mqtt','toggle','TLS encryption|TLS-Verschlüsselung','Verify the broker certificate and encrypt the connection (usually port 8883).|Broker-Zertifikat prüfen und die Verbindung verschlüsseln (meist Port 8883).'),
 mqttHost:F('mqtt','text','Broker host|Broker-Host','IP or hostname.|IP oder Hostname.'),
 mqttPort:F('mqtt','number','Broker port|Broker-Port','1883 on most brokers.|1883 bei den meisten Brokern.',{min:1,max:65535}),
 mqttUser:F('mqtt','text','Username|Benutzername','Leave empty if the broker allows anonymous access.|Leer lassen, wenn der Broker anonymen Zugriff erlaubt.'),
 mqttPass:F('mqtt','secret','Password|Passwort','Leave empty to keep the saved password.|Leer lassen, um das gespeicherte Passwort zu behalten.'),
 mqttPrefix:F('mqtt','text','Topic prefix|Topic-Präfix','Empty = device ID.|Leer = Geräte-ID.'),
 haDiscovery:F('mqtt','toggle','HA discovery|HA-Discovery','Announce the device to Home Assistant.|Gerät bei Home Assistant anmelden.'),
 haPrefix:F('mqtt','text','HA prefix|HA-Präfix','Empty = homeassistant.|Leer = homeassistant.'),
 ntpServer:F('time','text','NTP server|NTP-Server','Time source. Default: pool.ntp.org.|Zeitquelle. Standard: pool.ntp.org.'),
 tzName:F('time','tz','Timezone|Zeitzone','Local time of AWTRIX. Daylight saving switches automatically.|Lokale Uhrzeit von AWTRIX. Sommer-/Winterzeit schaltet automatisch.',
   {derive:v=>({tz:TZRULE.get(v)||'UTC0'})}),
 tz:F('hidden','text','Timezone rule|Zeitzonen-Regel',''),
 panelWidth:F('panel','number','Panel width|Panel-Breite','Pixels across one panel.|Pixel in der Breite eines Panels.',{min:1,max:128,unit:'px'}),
 panels:F('panel','number','Panels|Panels','How many panels are chained.|Wie viele Panels verkettet sind.',{min:1,max:128}),
 panelStart:F('panel','select','First LED|Erste LED','Corner the data cable arrives at.|Ecke, an der das Datenkabel ankommt.',{opt:[
   ['topLeft','Top left|Oben links'],['topRight','Top right|Oben rechts'],
   ['bottomLeft','Bottom left|Unten links'],['bottomRight','Bottom right|Unten rechts']]}),
 panelWiring:F('panel','select','Wiring direction|Verdrahtungsrichtung','How the strip runs in a panel.|Wie der Strang im Panel läuft.',{opt:[
   ['rows','Along the rows|Entlang der Zeilen'],['columns','Along the columns|Entlang der Spalten']]}),
 panelSerpentine:F('panel','toggle','Serpentine|Serpentine','Every second run goes backwards (zigzag).|Jede zweite Reihe läuft rückwärts (Zickzack).'),
 panelChainReverse:F('panel','toggle','Reverse chain|Kette umkehren','The cable enters the panels at the other end.|Das Kabel betritt die Panels am anderen Ende.'),
 panelChainSerpentine:F('panel','toggle','Alternating panels|Wechselnde Panels','Every second panel is mounted rotated 180°.|Jedes zweite Panel ist um 180° gedreht montiert.'),
 mirror:F('panel','toggle','Mirror|Spiegeln','Flips the picture left to right.|Kippt das Bild links/rechts.'),
 rotate:F('panel','toggle','Rotate 180°|180° drehen','Upside down, and swaps the left and right button.|Bild auf den Kopf, tauscht linke und rechte Taste.'),
 minBrightness:F('hw','number','Min brightness|Min. Helligkeit','Lower limit for auto brightness.|Untergrenze der Auto-Helligkeit.',{min:0,max:255}),
 maxBrightness:F('hw','number','Max brightness|Max. Helligkeit','Upper limit for auto brightness.|Obergrenze der Auto-Helligkeit.',{min:0,max:255}),
 ldrFactor:F('hw','number','LDR factor|LDR-Faktor','Scales the light sensor reading.|Skaliert den Lichtsensor-Messwert.',{min:0,max:10,step:0.1}),
 ldrGamma:F('hw','number','LDR gamma|LDR-Gamma','Higher = dimmer at moderate light. 1.0 = off.|Höher = dunkler bei mittlerem Licht. 1,0 = aus.',{min:0.1,max:10,step:0.1}),
 ldrOnGround:F('hw','toggle','LDR on GND|LDR an GND','Set if the light sensor is wired to ground.|Setzen, wenn der Lichtsensor gegen Masse verdrahtet ist.'),
 brightnessSmoothing:F('hw','number','Brightness smoothing|Helligkeits-Dämpfung','Higher = calmer response to light changes.|Höher = ruhigere Reaktion auf Lichtwechsel.',{min:0,max:60000,unit:'ms'}),
 batteryDividerRatio:F('hw','number','Battery divider|Akku-Teiler','Only change it if the percentage is wrong.|Nur ändern, wenn die Prozentanzeige falsch ist.',{min:0.1,max:10,step:0.01}),
 tempOffset:F('hw','number','Temperature offset|Temperatur-Offset','Added to the reading. -9 cancels the case heat.|Wird zum Messwert addiert. -9 gleicht die Gehäusewärme aus.',{min:-20,max:20,step:0.1,unit:'°'}),
 humOffset:F('hw','number','Humidity offset|Luftfeuchte-Offset','Added to the reading.|Wird zum Messwert addiert.',{min:-50,max:50,step:0.1,unit:'%'}),
 tempDecimals:F('hw','number','Temperature decimals|Temperatur-Nachkommastellen','Digits after the decimal point.|Stellen nach dem Komma.',{min:0,max:2}),
 lowBatteryThreshold:F('hw','number','Low-battery threshold|Akku-Warnschwelle','Warn below this charge. 0 = off.|Warnen unter diesem Ladestand. 0 = aus.',{min:0,max:100,unit:'%'}),
 swapButtons:F('btn','toggle','Swap buttons|Tasten tauschen','Use it if left and right act the wrong way round.|Nutzen, wenn links und rechts verkehrt herum reagieren.'),
 buttonCallback:F('btn','text','Button webhook|Tasten-Webhook','HTTP URL called on button press.|HTTP-URL, die bei Tastendruck aufgerufen wird.'),
 pinMatrix:F('gpio','select','Matrix data|Matrix-Daten','Data line to the LED matrix.|Datenleitung zur LED-Matrix.',{opt:[2,4,5,13,14,15,16,18,21,25,26,27,32,33].map(p=>[p,'GPIO '+p+(p===32?' (Ulanzi)':'')])}),
 pinBtnLeft:F('gpio','number','Button left|Taste links','Goes to the previous app.|Springt zur vorherigen App.',{min:-1,max:39}),
 pinBtnSelect:F('gpio','number','Button select|Taste Mitte','Clears notifications; press twice to toggle the display.|Blendet Meldungen aus; zweimal drücken schaltet die Anzeige um.',{min:-1,max:39}),
 pinBtnRight:F('gpio','number','Button right|Taste rechts','Goes to the next app.|Springt zur nächsten App.',{min:-1,max:39}),
 pinBattery:F('gpio','number','Battery|Akku','Analogue input of the battery divider.|Analogeingang des Akku-Teilers.',{min:-1,max:39}),
 pinLdr:F('gpio','number','Light sensor|Lichtsensor','Analogue input of the LDR.|Analogeingang des LDR.',{min:-1,max:39}),
 pinBuzzer:F('gpio','number','Buzzer|Buzzer','Piezo buzzer for tones and melodies.|Piezo-Summer für Töne und Melodien.',{min:-1,max:39}),
 pinI2cSda:F('gpio','number','I2C SDA|I2C SDA','Sensor bus data.|Sensor-Bus, Daten.',{min:-1,max:39}),
 pinI2cScl:F('gpio','number','I2C SCL|I2C SCL','Sensor bus clock.|Sensor-Bus, Takt.',{min:-1,max:39}),
 pinDfRx:F('gpio','number','DFPlayer RX|DFPlayer RX','Only with DFPlayer enabled.|Nur bei aktiviertem DFPlayer.',{min:-1,max:39}),
 pinDfTx:F('gpio','number','DFPlayer TX|DFPlayer TX','Only with DFPlayer enabled.|Nur bei aktiviertem DFPlayer.',{min:-1,max:39}),
 pinI2sBclk:F('gpio','number','I2S BCLK|I2S BCLK','External DAC for internet radio and MP3s.|Externer DAC für Internetradio und MP3s.',{min:-1,max:39}),
 pinI2sLrclk:F('gpio','number','I2S LRCLK|I2S LRCLK','Same DAC, word select.|Selber DAC, Wortauswahl.',{min:-1,max:39}),
 pinI2sDout:F('gpio','number','I2S DOUT|I2S DOUT','Same DAC, data.|Selber DAC, Daten.',{min:-1,max:39}),
 soundEnabled:F('sndhw','toggle','Sound|Ton','Master switch for one-shot sounds. Radio keeps playing.|Hauptschalter für Einzelklänge. Radio läuft weiter.',{api:'settings'}),
 buzzerVolume:F('sndhw','slider','Buzzer volume|Buzzer-Lautstärke','RTTTL melodies.|RTTTL-Melodien.',{min:0,max:100,api:'settings'}),
 dfplayerVolume:F('sndhw','slider','DFPlayer volume|DFPlayer-Lautstärke','Tracks.|Titel.',{min:0,max:100,api:'settings'}),
 mp3Volume:F('sndhw','slider','MP3 volume|MP3-Lautstärke','Stored MP3s.|Gespeicherte MP3s.',{min:0,max:100,api:'settings'}),
 radioVolume:F('sndhw','slider','Radio volume|Radio-Lautstärke','Internet radio.|Internetradio.',{min:0,max:100,api:'settings'}),
 radioMeta:F('sndhw','toggle','Radio track info|Radio-Titelanzeige','Show the station and every new track title.|Sender und jeden neuen Titel anzeigen.',{api:'settings'}),
 dfplayer:F('sndhw','toggle','DFPlayer|DFPlayer','External audio module on the DFPlayer pins. |Externes Audiomodul an den DFPlayer-Pins.'),
 statsInterval:F('misc','number','Stats interval|Stats-Intervall','How often stats go out over MQTT.|Wie oft Stats per MQTT gesendet werden.',{min:1000,max:600000,unit:'ms'}),
 artnet:F('misc','toggle','Art-Net|Art-Net','Receive Art-Net DMX on UDP 6454.|Art-Net DMX auf UDP 6454 empfangen.'),
 debugMode:F('misc','toggle','Debug mode|Debug-Modus','Verbose serial logging.|Ausführliches serielles Logging.'),
 scriptingEnabled:F('script','toggle','Run scripts|Skripte ausführen','Off frees about 40 KB of RAM and stops every script. Installed scripts are kept. Applies after a reboot.|Aus spart ca. 40 KB RAM und stoppt alle Skripte. Installierte Skripte bleiben erhalten. Wirkt nach einem Neustart.'),
 scriptLimit:F('script','number','Script limit|Skript-Limit','How many scripts may run at the same time.|Wie viele Skripte gleichzeitig laufen dürfen.',{min:0,max:32}),
 scriptMaxBytes:F('script','number','Max script size|Max. Skriptgröße','Largest script AWTRIX accepts.|Größtes Skript, das AWTRIX annimmt.',{min:1024,max:32768,unit:'B'}),
};
const SYS_GROUPS=[['wifi','grpWifi','grpWifiH'],['web','grpWeb','grpWebH'],['mqtt','grpMqtt','grpMqttH'],
 ['time','grpTime','grpTimeH'],['panel','grpPanel','grpPanelH'],['hw','grpHw','grpHwH'],
 ['gpio','grpGpio','grpGpioH'],['btn','grpBtn','grpBtnH'],
 ['sndhw','grpSndHw','grpSndHwH'],['script','grpScript','grpScriptH'],['misc','grpMisc','grpMiscH']];
const SOUND_KEYS=Object.keys(SYSF).filter(k=>SYSF[k].api==='settings');
