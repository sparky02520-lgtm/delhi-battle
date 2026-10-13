(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),$=id=>document.getElementById(id);
const VIEW_W=1280,VIEW_H=720,WORLD_W=2400,WORLD_H=720,GROUND=550;
let activeArena=0;
const arenaNames=["PARLIAMENT DISTRICT","INDIA GATE BATTLEFIELD","POLITICAL RALLY GROUND","EPSTEIN ISLAND","FUTURISTIC TECH LAB"];
const keys=new Set();let running=false,paused=false,ended=false,last=0,elapsed=0,matchLeft=180,toastTimer=0,camX=0;
let mouse={x:900,y:350,down:false},moveAxis=0,aimAxis={x:0,y:0},jetHeld=false,touchFireHeld=false,grenadeMode=false;
let reloadTimer=0,reloadWeapon=null;
const fighterNames=["Narendra Modi","Rahul Gandhi","Amit Shah","Dhruv Rathee","Abhijeet Dipke","Sourav Das","Vijeta Dahiya","Donald Trump","Elon Musk"];
let selectedFighter="Narendra Modi",playerTeam="BJP",enemyFighter="Rahul Gandhi",enemyTeam="CJP";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a);
// Lightweight synthesized arcade SFX: no external files or downloads required.
let audioCtx=null,soundEnabled=true,lastShotSound=0;
function sfx(kind){if(!soundEnabled)return;try{audioCtx=audioCtx||(new (window.AudioContext||window.webkitAudioContext)());if(audioCtx.state==='suspended')audioCtx.resume();const t=audioCtx.currentTime;const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);let f=kind==='boom'?78:kind==='hit'?165:kind==='pickup'?720:kind==='ability'?390:kind==='shot'?145:kind==='jump'?300:kind==='drop'?230:kind==='melee'?115:kind==='ricochet'?540:480;osc.type=(kind==='boom'||kind==='melee')?'sawtooth':kind==='shot'?'square':'triangle';osc.frequency.setValueAtTime(f,t);osc.frequency.exponentialRampToValueAtTime(Math.max(38,f*(kind==='boom'?.25:kind==='shot'?.42:kind==='melee'?.45:.68)),t+(kind==='boom'?.38:kind==='shot'?.07:kind==='melee'?.16:.14));gain.gain.setValueAtTime(kind==='shot'?.035:kind==='boom'?.12:kind==='melee'?.10:.055,t);gain.gain.exponentialRampToValueAtTime(.001,t+(kind==='boom'?.4:kind==='shot'?.08:kind==='melee'?.18:.16));osc.start(t);osc.stop(t+(kind==='boom'?.41:kind==='shot'?.085:kind==='melee'?.19:.17));}catch(e){}}
const voiceLines={
 'Narendra Modi':['Achhe din, full power!','Banka laser, ready!'],'Rahul Gandhi':['Bharat Jodo! Chalo, chalo!','Mohabbat ki dukaan is open!'],
 'Amit Shah':['Plan A is now in motion!','Operation lockdown!'],'Dhruv Rathee':['Wait, let us fact-check that!','Context matters! Exposed!'],
 'Abhijeet Dipke':['Commentary mode on!','That is a spicy political take!'],'Sourav Das':['Breaking news! Attack incoming!','Big headline, bigger hit!'],
 'Vijeta Dahiya':['Precision strike!','Clean finish!'],'Donald Trump':['Big hit! Huge!','You are fired! Big league!'],'Elon Musk':['To the moon!','Innovation incoming!']
};
function speakParody(name,ultimate=false){if(!soundEnabled||!('speechSynthesis' in window))return;try{window.speechSynthesis.cancel();const lines=voiceLines[name]||['Power move!'];const utter=new SpeechSynthesisUtterance(lines[ultimate?1:0]);utter.rate=name==='Donald Trump'?.88:name==='Elon Musk'?1.12:1;utter.pitch=name==='Rahul Gandhi'?1.16:name==='Narendra Modi'?.82:name==='Donald Trump'?.72:name==='Vijeta Dahiya'?1.22:1;utter.volume=.85;window.speechSynthesis.speak(utter)}catch(e){}}
const memeLines={
 'Narendra Modi':{special:'ACHHE DIN LASER!',ultimate:'BANKA APOCALYPSE! · PROMISES AT MAX POWER'},
 'Rahul Gandhi':{special:'BHARAT JODO CHARGE!',ultimate:'MOHABBAT KI DUKAAN · COMEBACK CHARGE!'},
 'Amit Shah':{special:'MASTER STRATEGIST: PLAN A!',ultimate:'OPERATION LOCKDOWN · ROUTE CLOSED!'},
 'Dhruv Rathee':{special:'FACT-CHECKED! SOURCE: BOOM!',ultimate:'EXPOSED! CONTEXT LOADING…'},
 'Abhijeet Dipke':{special:'COMMENTARY MODE: ON!',ultimate:'POLITICAL ROAST · SPICY TAKE!'},
 'Sourav Das':{special:'BREAKING NEWS DASH!',ultimate:'RAPID RESPONSE · HEADLINE HIT!'},
 'Vijeta Dahiya':{special:'PRECISION ENTRY!',ultimate:'CLEAN FINISH · NO CLICKBAIT!'},
 'Donald Trump':{special:'BIG LEAGUE MODE!',ultimate:'TRUMP TOWER · HUGE WALL!'},
 'Elon Musk':{special:'HYPERLOOP DASH!',ultimate:'CYBERTRUCK SHIELD · TO THE MOON!'}
};
function memeAttack(name,ultimate=false){const line=memeLines[name]?.[ultimate?'ultimate':'special'];if(line){toast(line);comicPop(line.split(' · ')[0],player.x+player.w/2,player.y-7,fighterData[name]?.accent||'#ffe36e');sfx(ultimate?'boom':'ability');speakParody(name,ultimate)}}

const solids=[
{x:0,y:GROUND,w:WORLD_W,h:70,kind:"ground"},
// Platforms: one-way landing surfaces
{x:150,y:520,w:260,h:18,kind:"platform"},{x:485,y:450,w:230,h:18,kind:"platform"},
{x:800,y:530,w:210,h:18,kind:"platform"},{x:1090,y:445,w:250,h:18,kind:"platform"},
{x:1435,y:375,w:250,h:18,kind:"platform"},{x:1740,y:500,w:235,h:18,kind:"platform"},
{x:2040,y:420,w:220,h:18,kind:"platform"},{x:590,y:335,w:145,h:16,kind:"platform"},
{x:1530,y:275,w:160,h:16,kind:"platform"},
// Solid barriers and building structures
{x:440,y:GROUND-85,w:34,h:85,kind:"wall"},{x:740,y:GROUND-78,w:55,h:78,kind:"barrier"},
{x:1035,y:GROUND-85,w:66,h:85,kind:"barrier"},{x:1370,y:GROUND-100,w:38,h:100,kind:"wall"},
{x:1695,y:GROUND-85,w:64,h:85,kind:"barrier"},{x:1985,y:GROUND-90,w:40,h:90,kind:"wall"},
// Parliament building block and room geometry
{x:855,y:365,w:26,h:165,kind:"wall"},{x:1000,y:365,w:26,h:165,kind:"wall"},
{x:855,y:365,w:171,h:22,kind:"wall"},{x:880,y:500,w:58,h:18,kind:"platform"},
{x:1180,y:330,w:28,h:115,kind:"wall"},{x:1320,y:330,w:28,h:115,kind:"wall"},
{x:1208,y:330,w:112,h:18,kind:"platform"},
// low walls across alternate routes
{x:560,y:GROUND-40,w:70,h:40,kind:"barrier"},{x:1510,y:GROUND-50,w:90,h:50,kind:"barrier"},{x:2180,y:GROUND-55,w:100,h:55,kind:"barrier"}
];
solids.forEach(s=>{if(s.kind==="wall"||s.kind==="barrier"){s.destructible=true;s.hp=s.kind==="wall"?95:65;}});
let platforms=solids.filter(s=>s.kind==="platform");
const bushes=[
{x:90,y:GROUND-8,w:92,h:48},{x:300,y:GROUND-8,w:78,h:50},{x:650,y:GROUND-8,w:94,h:50},
{x:925,y:GROUND-8,w:76,h:50},{x:1250,y:GROUND-8,w:110,h:50},{x:1600,y:GROUND-8,w:80,h:50},
{x:1850,y:GROUND-8,w:95,h:50},{x:2260,y:GROUND-8,w:90,h:50},{x:700,y:485,w:62,h:45},
{x:1830,y:455,w:72,h:45}
];
const pickups=[
{x:365,y:GROUND-20,type:"health",taken:false},{x:690,y:GROUND-40,type:"smg",taken:false},
{x:1140,y:400,type:"health",taken:false},{x:1585,y:330,type:"sniper",taken:false},
{x:1905,y:GROUND-40,type:"ammo",taken:false},{x:2220,y:375,type:"health",taken:false}
];
const parliamentSolids=solids.map(s=>({...s})),parliamentBushes=bushes.map(b=>({...b})),parliamentPickups=pickups.map(p=>({...p}));
const mapData=[
 null,
 {s:[[120,500,230,18,"platform"],[405,430,170,18,"platform"],[650,490,190,18,"platform"],[900,400,260,18,"platform"],[1230,470,210,18,"platform"],[1500,365,200,18,"platform"],[1770,470,240,18,"platform"],[2070,410,210,18,"platform"],[360,480,60,70,"barrier"],[600,445,34,105,"wall"],[850,500,100,50,"barrier"],[1170,460,45,90,"barrier"],[1450,485,95,65,"barrier"],[1710,440,38,110,"wall"],[2010,490,90,60,"barrier"],[1020,300,30,100,"wall"],[1150,300,30,100,"wall"],[1050,300,100,16,"platform"]],b:[[180,542,85,48],[510,542,80,48],[760,542,90,48],[1320,542,85,48],[1620,542,90,48],[2180,542,95,48]],p:[[300,530,"health"],[720,450,"smg"],[1080,270,"sniper"],[1390,530,"ammo"],[1880,530,"health"]]},
 {s:[[90,500,260,18,"platform"],[390,420,210,18,"platform"],[670,475,160,18,"platform"],[890,340,280,18,"platform"],[1220,450,230,18,"platform"],[1500,390,180,18,"platform"],[1740,320,230,18,"platform"],[2020,455,240,18,"platform"],[350,460,36,90,"wall"],[625,495,90,55,"barrier"],[835,445,40,105,"wall"],[1170,495,70,55,"barrier"],[1455,455,40,95,"wall"],[1685,485,85,65,"barrier"],[1980,450,40,100,"wall"],[940,250,30,90,"wall"],[1090,250,30,90,"wall"],[970,250,120,16,"platform"]],b:[[150,542,95,48],[470,542,80,48],[720,542,75,48],[1280,542,100,48],[1830,542,95,48]],p:[[280,530,"health"],[550,390,"smg"],[1030,220,"sniper"],[1380,530,"ammo"],[1900,530,"health"]]},
 {s:[[110,495,190,18,"platform"],[355,420,180,18,"platform"],[590,350,160,18,"platform"],[810,465,210,18,"platform"],[1090,390,220,18,"platform"],[1390,300,170,18,"platform"],[1615,435,220,18,"platform"],[1890,355,180,18,"platform"],[2110,470,170,18,"platform"],[310,480,75,70,"barrier"],[550,430,38,120,"wall"],[765,495,75,55,"barrier"],[1040,455,40,95,"wall"],[1330,485,80,65,"barrier"],[1580,450,38,100,"wall"],[1850,490,70,60,"barrier"],[2070,460,35,90,"wall"],[1160,255,25,135,"wall"],[1290,255,25,135,"wall"],[1185,255,105,16,"platform"]],b:[[165,542,70,48],[700,542,75,48],[980,542,70,48],[1490,542,70,48],[1980,542,75,48]],p:[[260,530,"health"],[625,320,"smg"],[1235,225,"sniper"],[1710,395,"ammo"],[2160,530,"health"]]},
 {s:[[100,470,210,18,"platform"],[365,390,190,18,"platform"],[610,300,180,18,"platform"],[850,430,220,18,"platform"],[1120,345,210,18,"platform"],[1390,255,190,18,"platform"],[1635,405,230,18,"platform"],[1920,315,200,18,"platform"],[2160,455,120,18,"platform"],[325,455,35,95,"wall"],[570,490,80,60,"barrier"],[810,440,35,110,"wall"],[1080,485,70,65,"barrier"],[1350,430,35,120,"wall"],[1600,475,80,75,"barrier"],[1880,450,35,100,"wall"],[2130,485,60,65,"barrier"],[970,255,30,175,"wall"],[1050,255,30,175,"wall"],[1000,255,50,16,"platform"]],b:[[160,542,70,48],[720,542,70,48],[1240,542,75,48],[1770,542,80,48],[2040,542,70,48]],p:[[260,530,"health"],[690,270,"smg"],[1015,220,"sniper"],[1720,365,"ammo"],[2210,530,"health"]]}
];
function applyArenaLayout(i){
 const m=mapData[i];
 solids.splice(0,solids.length,...(i===0?parliamentSolids.map(s=>({...s})): [{x:0,y:GROUND,w:WORLD_W,h:70,kind:"ground"},...m.s.map(a=>({x:a[0],y:a[1],w:a[2],h:a[3],kind:a[4]}))]));
 bushes.splice(0,bushes.length,...(i===0?parliamentBushes.map(b=>({...b})):m.b.map(a=>({x:a[0],y:a[1],w:a[2],h:a[3]}))));
 pickups.splice(0,pickups.length,...(i===0?parliamentPickups.map(p=>({...p})):m.p.map(a=>({x:a[0],y:a[1],type:a[2],taken:false}))));
 solids.forEach(s=>{if(s.kind==="wall"||s.kind==="barrier"){s.destructible=true;s.hp=s.kind==="wall"?95:65;}});platforms=solids.filter(s=>s.kind==="platform");eventGate=null;eventState="idle";eventClock=18;eventCooldown=0;eventNotice=i===0?"SECURITY SYSTEM STANDBY":"ENVIRONMENTAL SYSTEM STANDBY";
}
const weaponDefs={
pistol:{label:"PISTOL",mag:12,reserve:48,damage:13,rate:.28,speed:800,color:"#c8ff4d"},
rifle:{label:"RIFLE",mag:30,reserve:90,damage:18,rate:.16,speed:900,color:"#ffe18a"},
smg:{label:"SMG",mag:36,reserve:108,damage:10,rate:.085,speed:820,color:"#7de5ff"},
sniper:{label:"SNIPER",mag:5,reserve:20,damage:42,rate:.72,speed:1200,color:"#ff9a82"}
};
const player={characterName:"Narendra Modi",team:"BJP",x:110,y:GROUND-54,vx:0,vy:0,w:32,h:54,hp:100,maxHp:100,invuln:0,lastDamage:0,onGround:false,jumps:0,jet:100,fireCd:0,grenades:3,facing:1,meleeCd:0,attackAnim:0,hitStun:0,knockFlash:0,weapons:["pistol","rifle"],weaponIndex:1,ammo:{pistol:12,rifle:30,smg:0,sniper:0},reserve:{pistol:48,rifle:90,smg:0,sniper:0}};
const enemy={characterName:"Rahul Gandhi",team:"CJP",x:2220,y:GROUND-54,vx:0,vy:0,w:32,h:54,hp:100,maxHp:100,invuln:0,lastDamage:0,onGround:false,jumps:0,jet:100,fireCd:1,alive:true,respawn:0,facing:-1,grenades:2,hitStun:0,knockFlash:0};
let bullets=[],grenades=[],particles=[],comicPopups=[],playerKills=0,botKills=0,grenadeCd=0;
let eventState="idle",eventClock=20,eventCooldown=0,eventGate=null,eventNotice="SECURITY SYSTEM STANDBY";
let abilityCooldown=0,ultimateCharge=0,abilityEffect=null,abilityEffectTimer=0,ultimateWall=null,ultimateWallTimer=0,scanTimer=0;
let supplyClock=22,supplyDrops=[],chaosClock=34,chaosTimer=0,chaosName="",chaosPulse=0;
const gravity=1450,moveSpeed=330,jumpV=-800;
function toast(s){
 const el=$("toast");el.textContent=s;toastTimer=2.25;el.classList.remove("toast-visible","toast-pop");void el.offsetWidth;el.classList.add("toast-visible","toast-pop");
}
function comicPop(text,x,y,color="#ffe36e"){
 comicPopups.push({text,x,y,life:.72,maxLife:.72,color,spin:rand(-.12,.12)});
 if(comicPopups.length>8)comicPopups.shift();
}
function currentWeapon(){return player.weapons[player.weaponIndex]||"rifle"}
function updateHud(){
 const w=currentWeapon(),d=weaponDefs[w];$("playerHealthText").textContent=Math.ceil(player.hp)+" HP";$("playerHealthBar").style.width=player.hp+"%";
 $("enemyHealthText").textContent=(enemy.alive?Math.ceil(enemy.hp):0)+" HP";$("enemyHealthBar").style.width=(enemy.alive?enemy.hp:0)+"%";
 $("ammoText").textContent=reloadTimer>0?`${d.label} · RELOADING ${reloadTimer.toFixed(1)}s`:`${d.label} · ${player.ammo[w]} / ${player.reserve[w]}`;$("jetBar").style.width=player.jet+"%";
 const wh=$("weaponHud");if(wh){const silhouettes={pistol:'<path d="M8 18h35v8H27l-2 15h-8l-2-15H8z"/><path d="M15 14h25v4H15z"/>',rifle:'<path d="M3 18h50v7H3z"/><path d="M15 25h8v13h-8z"/><path d="M32 13h10v5H32z"/><path d="M44 16h11v3H44z"/>',smg:'<path d="M7 18h39v8H7z"/><path d="M17 26h8v12h-8z"/><path d="M28 13h12v5H28z"/><path d="M42 16h9v3h-9z"/>',sniper:'<path d="M2 19h56v5H2z"/><path d="M14 24h7v13h-7z"/><path d="M20 13h22v5H20z"/><path d="M28 10h7v3h-7z"/><path d="M50 16h9v3h-9z"/>'};const ammo=reloadTimer>0?`RELOADING ${reloadTimer.toFixed(1)}s`:`${player.ammo[w]} <i>/</i> ${player.reserve[w]}`;wh.innerHTML=`<div class="weapon-card-top"><span class="weapon-slot">${String(player.weaponIndex+1).padStart(2,"0")}</span><span class="weapon-label">${d.label}</span><span class="weapon-mode-tag ${grenadeMode?"active":""}">${grenadeMode?"GREN":"EQUIPPED"}</span></div><svg class="weapon-silhouette" viewBox="0 0 64 44" aria-label="${d.label} icon" role="img"><g fill="${d.color}" stroke="#f4f7fb" stroke-width=".7">${silhouettes[w]||silhouettes.rifle}</g></svg><div class="weapon-ammo-row"><strong>${grenadeMode?`GRENADES ${player.grenades}`:ammo}</strong><span>${grenadeMode?"TAP THROW":"AMMO"}</span></div><div class="ammo-track"><i style="width:${grenadeMode?Math.min(100,player.grenades/6*100):Math.max(0,player.ammo[w]/d.mag*100)}%;background:${d.color}"></i></div><div class="weapon-swipe-hint">◀ SWIPE TO SWITCH ▶</div>`;}const gm=$("grenadeBtn");if(gm){gm.querySelector("small").textContent=grenadeMode?"GUN MODE":"GREN";gm.classList.toggle("mode-active",grenadeMode)}const fb=$("fireBtn");if(fb){fb.querySelector("small").textContent=grenadeMode?"THROW":"FIRE";fb.querySelector("b").textContent=grenadeMode?"R2":"R2";}
 $("scoreText").textContent=`${playerTeam} ${playerKills} · ${enemyTeam} ${botKills}`;const arenaLabel=$("arenaName");if(arenaLabel)arenaLabel.textContent=arenaNames[activeArena];const arenaIndex=$("arenaIndexLabel");if(arenaIndex)arenaIndex.textContent=`ARENA 0${activeArena+1}`;$("timerText").textContent=`${String(Math.floor(matchLeft/60)).padStart(2,"0")}:${String(Math.floor(matchLeft%60)).padStart(2,"0")}`;
 $("coverText").textContent=inBush(player)?"COVER: CONCEALED":nearestSolidCover(player,enemy)?"COVER: WALL NEARBY":"COVER: EXPOSED";
}
function start(){if(ended)return;paused=false;$("pauseOverlay").classList.add("hidden");activeArena=Number($("arenaSelect").value)||0;applyArenaLayout(activeArena);player.x=110;player.y=GROUND-player.h;enemy.x=WORLD_W-180;enemy.y=GROUND-enemy.h;selectedFighter=$("fighterSelect").value;playerTeam=$("teamSelect").value;enemyTeam=playerTeam==="BJP"?"CJP":"BJP";enemyFighter=selectedFighter==="Rahul Gandhi"?"Narendra Modi":"Rahul Gandhi";player.characterName=selectedFighter;player.team=playerTeam;abilityCooldown=0;ultimateCharge=0;abilityEffect=null;abilityEffectTimer=0;ultimateWall=null;ultimateWallTimer=0;scanTimer=0;enemy.characterName=enemyFighter;enemy.team=enemyTeam;$("playerNameLabel").textContent=`YOU · ${player.characterName.toUpperCase()}`;$("enemyNameLabel").textContent=`${enemy.team} · ${enemy.characterName.toUpperCase()}`;running=true;$("startOverlay").classList.add("hidden");sfx("pickup");toast("USE COVER. FIND THE HIGH GROUND.");try{if(matchMedia("(max-width:850px)").matches){document.querySelector(".game-shell").requestFullscreen?.().catch?.(()=>{});screen.orientation?.lock?.("landscape")?.catch?.(()=>{});}}catch(e){}}
function resetPlayer(){grenadeMode=false;touchFireHeld=false;Object.assign(player,{x:110,y:GROUND-54,vx:0,vy:0,hp:100,invuln:1,lastDamage:elapsed,onGround:true,jumps:0,jet:100,fireCd:0,grenades:3,meleeCd:0,attackAnim:0,hitStun:0,knockFlash:0,weapons:["pistol","rifle"],weaponIndex:1,ammo:{pistol:12,rifle:30,smg:0,sniper:0},reserve:{pistol:48,rifle:90,smg:0,sniper:0}})}
function resetEnemy(){Object.assign(enemy,{x:rand(1800,2260),y:GROUND-54,vx:0,vy:0,hp:100,invuln:1,lastDamage:elapsed,onGround:true,jumps:0,jet:100,fireCd:rand(.4,1.1),alive:true,respawn:0,facing:-1,grenades:2,hitStun:0,knockFlash:0})}
function restart(){running=false;paused=false;ended=false;$("pauseOverlay").classList.add("hidden");if(ultimateWall){const wi=solids.indexOf(ultimateWall);if(wi>=0)solids.splice(wi,1);ultimateWall=null;}abilityCooldown=0;ultimateCharge=0;abilityEffect=null;abilityEffectTimer=0;ultimateWallTimer=0;scanTimer=0;reloadTimer=0;reloadWeapon=null;elapsed=0;matchLeft=180;playerKills=0;botKills=0;bullets=[];grenades=[];particles=[];comicPopups=[];pickups.forEach(p=>p.taken=false);eventState="idle";eventClock=20;eventCooldown=0;eventGate=null;eventNotice="SECURITY SYSTEM STANDBY";supplyClock=18;supplyDrops=[];chaosClock=30;chaosTimer=0;chaosName="";resetPlayer();resetEnemy();$("endOverlay").classList.add("hidden");$("startOverlay").classList.remove("hidden");updateHud();toast("TACTICAL MATCH RESET")}
function pauseMatch(){if(!running||ended)return;paused=true;keys.clear();mouse.down=false;touchFireHeld=false;jetHeld=false;moveAxis=0;aimAxis={x:0,y:0};$("pauseOverlay").classList.remove("hidden")}
function resumeMatch(){paused=false;$("pauseOverlay").classList.add("hidden");last=performance.now()}
function restartCurrentMatch(){const arena=$("arenaSelect").value,fighter=$("fighterSelect").value,team=$("teamSelect").value;paused=false;$("pauseOverlay").classList.add("hidden");restart();$("arenaSelect").value=String(activeArena);$("fighterSelect").value=fighter;$("teamSelect").value=team;start()}
function returnToSetup(){paused=false;$("pauseOverlay").classList.add("hidden");restart();$("arenaSelect").value=String(activeArena)}
$("pauseGameBtn").addEventListener("click",()=>{if(paused){resumeMatch()}else if(running){pauseMatch()}else{$("startOverlay").classList.remove("hidden")}});
$("resumeBtn").addEventListener("click",resumeMatch);
$("restartMatchBtn").addEventListener("click",restartCurrentMatch);
$("changeArenaBtn").addEventListener("click",returnToSetup);
$("mainMenuBtn").addEventListener("click",returnToSetup);
$("startBtn").addEventListener("click",start);$("playAgainBtn").addEventListener("click",restart);$("restartBtn").addEventListener("click",restart);
$("soundBtn").addEventListener("click",()=>{soundEnabled=!soundEnabled;$("soundBtn").textContent=soundEnabled?"🔊 SFX ON":"🔇 SFX OFF";$("soundBtn").setAttribute("aria-pressed",String(soundEnabled));if(soundEnabled)sfx("pickup")});
window.addEventListener("keydown",e=>{if(e.code==="Escape"||e.code==="KeyP"){e.preventDefault();if(paused)resumeMatch();else if(running)pauseMatch();return;}if(paused)return;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(!keys.has(e.code)&&["Space","KeyW","ArrowUp"].includes(e.code))jumpPlayer();keys.add(e.code);if(e.code==="Enter"&&!running&&!ended)start();if(e.code==="KeyR")reload();if(e.code==="KeyG")throwGrenade();if(e.code==="KeyF")meleeAttack();if(e.code==="KeyE")triggerSecurityEvent();if(e.code==="KeyQ")useSpecial();if(e.code==="KeyX")useUltimate();if(e.code==="Digit1")selectWeapon(0);if(e.code==="Digit2")selectWeapon(1);if(e.code==="Digit3")selectWeapon(2);if(e.code==="Tab"){e.preventDefault();selectWeapon((player.weaponIndex+1)%player.weapons.length)}});
window.addEventListener("keyup",e=>keys.delete(e.code));
canvas.addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width*VIEW_W;mouse.y=(e.clientY-r.top)/r.height*VIEW_H;if(e.pointerType==="mouse")aimAxis={x:0,y:0};});
canvas.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"){mouse.down=true;canvas.setPointerCapture(e.pointerId);}});
window.addEventListener("pointerup",e=>{if(e.pointerType==="mouse")mouse.down=false;});
canvas.addEventListener("contextmenu",e=>e.preventDefault());
function selectWeapon(i){if(i<player.weapons.length){player.weaponIndex=i;player.switchFx=.5;const label=weaponDefs[currentWeapon()].label;toast("EQUIPPED "+label);const wh=$("weaponHud");if(wh){wh.classList.remove("weapon-switch-pop");void wh.offsetWidth;wh.classList.add("weapon-switch-pop");setTimeout(()=>wh.classList.remove("weapon-switch-pop"),520)}sfx("pickup");updateHud()}}
function reload(manual=true){
 const w=currentWeapon(),d=weaponDefs[w];
 if(reloadTimer>0){if(manual)toast("ALREADY RELOADING");return}
 if(player.ammo[w]>=d.mag){if(manual)toast("MAGAZINE ALREADY FULL");return}
 if(player.reserve[w]<=0){if(manual)toast("NO RESERVE AMMO");return}
 reloadWeapon=w;reloadTimer=1.5;toast((manual?"RELOADING ":"AUTO-RELOAD ")+d.label);updateHud();
}
function finishReload(){
 if(!reloadWeapon)return;
 const w=reloadWeapon,d=weaponDefs[w],needed=Math.max(0,d.mag-player.ammo[w]),n=Math.min(needed,player.reserve[w]);
 player.ammo[w]+=n;player.reserve[w]-=n;reloadTimer=0;reloadWeapon=null;toast("RELOADED "+d.label);updateHud();
}

function triggerSecurityEvent(){
 if(!running||eventCooldown>0||eventState!=="idle"){toast(eventCooldown>0?`SECURITY CONSOLE RECHARGING · ${Math.ceil(eventCooldown)}s`:"SECURITY SYSTEM ALREADY ACTIVE");return}
 const nearConsole=Math.min(Math.abs(player.x-700),Math.abs(player.x-1640))<150;
 if(!nearConsole){toast("MOVE NEAR A SECURITY CONSOLE TO PRESS E");return}
 beginSecurityEvent(true);
}
function beginSecurityEvent(manual=false){eventState="warning";eventClock=3.5;eventNotice=manual?"CONSOLE OVERRIDE — SHUTTERS INCOMING":"SECURITY ALERT — SHUTTERS INCOMING";eventCooldown=45;toast(eventNotice);}
function updateSecurityEvent(dt){
 if(eventCooldown>0)eventCooldown=Math.max(0,eventCooldown-dt);
 if(eventState==="idle"){eventClock-=dt;if(eventClock<=0)beginSecurityEvent(false);return}
 eventClock-=dt;
 if(eventState==="warning"&&eventClock<=0){eventState="active";eventClock=9;eventNotice="LOCKDOWN ACTIVE — ROUTES CHANGED";eventGate={x:1380,y:520,w:42,h:130,kind:"barrier",eventGate:true};solids.push(eventGate);toast("LOCKDOWN ACTIVE · FIND ANOTHER ROUTE");}
 else if(eventState==="active"&&eventClock<=0){if(eventGate){const i=solids.indexOf(eventGate);if(i>=0)solids.splice(i,1);eventGate=null;}eventState="idle";eventClock=32;eventNotice="SECURITY SYSTEM STANDBY";toast("SECURITY SHUTTERS RETRACTED");}
}
function jumpPlayer(){if(!running||player.jumps>=2)return;player.vy=player.jumps===0?jumpV:jumpV*.9;player.jumps++;player.onGround=false;particlesAt(player.x+player.w/2,player.y+player.h,"#8ef5ff",7);if(player.jumps===2)toast("DOUBLE JUMP")}
function shootPlayer(){
 if(!running||ended)return;
 const w=currentWeapon(),d=weaponDefs[w];
 if(reloadTimer>0||player.fireCd>0)return;
 if(player.ammo[w]<=0){reload(false);return}
 player.ammo[w]--;player.fireCd=d.rate;player.recoil={timer:w==="sniper"?.24:w==="rifle"?.13:w==="smg"?.055:.085,amount:w==="sniper"?8:w==="rifle"?4.5:w==="smg"?2.1:3.2,weapon:w};
 const px=player.x+player.w/2,py=player.y+player.h*.42;let dx,dy;
 if(Math.hypot(aimAxis.x,aimAxis.y)>.18){dx=aimAxis.x;dy=aimAxis.y}else{dx=(mouse.x+camX)-px;dy=mouse.y-py}
 const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;player.facing=dx>=0?1:-1;
 bullets.push({x:px+dx*22,y:py+dy*22,vx:dx*d.speed,vy:dy*d.speed,owner:"player",life:1.7,damage:d.damage,weapon:w});
 particlesAt(px+dx*22,py+dy*22,d.color,3);if(performance.now()-lastShotSound>75){sfx("shot");lastShotSound=performance.now()}updateHud();
 if(player.ammo[w]===0&&player.reserve[w]>0)reload(false);
}
function shootEnemy(){if(!enemy.alive||enemy.fireCd>0)return;enemy.fireCd=rand(.45,.7);const px=enemy.x+enemy.w/2,py=enemy.y+enemy.h*.42,tx=player.x+player.w/2,ty=player.y+player.h*.42;let dx=tx-px,dy=ty-py,m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;enemy.facing=dx>=0?1:-1;bullets.push({x:px+dx*20,y:py+dy*20,vx:dx*650,vy:dy*650,owner:"enemy",life:1.5,damage:9,weapon:"bot"});}
function throwGrenade(){if(!running||player.grenades<=0||grenadeCd>0)return;player.grenades--;sfx("drop");grenadeCd=.55;let dx=aimAxis.x,dy=aimAxis.y;if(Math.hypot(dx,dy)<.18){dx=(mouse.x+camX)-(player.x+player.w/2);dy=mouse.y-(player.y+player.h*.42);if(Math.hypot(dx,dy)<1){dx=player.facing;dy=-.35}}const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;const speed=570;grenades.push({x:player.x+player.w/2+dx*20,y:player.y+18,vx:dx*speed,vy:dy*speed-105,t:1.65,owner:"player",bounces:0});comicPop("PULL!",player.x+player.w/2,player.y-8,"#ffb347");toast("GRENADE OUT · AIM DIRECTION LOCKED");updateHud()}
function meleeAttack(){if(!running||paused||ended||player.meleeCd>0)return;player.meleeCd=.48;player.attackAnim=.24;sfx("melee");const px=player.x+player.w/2,py=player.y+player.h*.48,ex=enemy.x+enemy.w/2,ey=enemy.y+enemy.h*.5,dx=ex-px,dy=ey-py;player.facing=dx>=0?1:-1;if(enemy.alive&&Math.abs(dx)<88&&Math.abs(dy)<58&&!lineBlocked(px,py,ex,ey)){damageEnemy(13,{x:px,y:py,force:360,stun:.30,up:210});comicPop(Math.random()<.5?"BONK!":"WHAM!",ex,enemy.y-6,"#ffd166");particlesAt(ex,ey,"#ffd166",12);toast("CLOSE-RANGE HIT!")}else{comicPop("WHOOSH!",px+player.facing*45,player.y+18,"#dbeaff");particlesAt(px+player.facing*40,py,"#dbeaff",5)}}
const fighterData={
 "Narendra Modi":{skin:"#b9825e",hair:"#e7e4d9",shirt:"#f0eadb",accent:"#ff9933",beard:true,eyes:"#243042",tag:"BANKA LASER"},
 "Rahul Gandhi":{skin:"#bd8969",hair:"#30251f",shirt:"#f4f4ed",accent:"#3477b9",beard:true,eyes:"#263446",tag:"QUICK ESCAPE"},
 "Amit Shah":{skin:"#a97553",hair:"#33251e",shirt:"#d8c4a3",accent:"#c78b45",beard:true,glasses:true,eyes:"#1c2736",tag:"MASTER STRATEGIST"},
 "Dhruv Rathee":{skin:"#d09a76",hair:"#49362b",shirt:"#263b58",accent:"#45d5e8",glasses:true,eyes:"#263446",tag:"FACT CHECK"},
 "Abhijeet Dipke":{skin:"#c48c68",hair:"#33251f",shirt:"#28354a",accent:"#ffcf6d",beard:true,glasses:true,eyes:"#253044",tag:"POLITICAL ROAST"},
 "Sourav Das":{skin:"#c28b68",hair:"#2b2522",shirt:"#315447",accent:"#b4ef79",eyes:"#253044",tag:"RAPID RESPONSE"},
 "Vijeta Dahiya":{skin:"#d7a17e",hair:"#29222a",shirt:"#422b50",accent:"#e48cff",eyes:"#253044",tag:"PRECISION STRIKE"},
 "Donald Trump":{skin:"#e2b18a",hair:"#f1bd4c",shirt:"#182640",accent:"#e43d45",tie:"#e43d45",eyes:"#263446",tag:"MAGA MODE"},
 "Elon Musk":{skin:"#d2a181",hair:"#4a413c",shirt:"#202c3d",accent:"#51d9ff",eyes:"#253044",tag:"TESLA OVERDRIVE"}
};
function useSpecial(){
 if(!running||abilityCooldown>0)return;
 abilityCooldown=10;const name=player.characterName;abilityEffectTimer=0.9;abilityEffect={name,type:"special",x:player.x+player.w/2,y:player.y+player.h/2};
 const dx=enemy.x-player.x,dist=Math.abs(dx),clear=!lineBlocked(player.x+player.w/2,player.y+player.h*.4,enemy.x+enemy.w/2,enemy.y+enemy.h*.4);
 if(name==="Narendra Modi") { if(dist<560&&clear){damageEnemy(24);particlesAt(enemy.x+enemy.w/2,enemy.y+20,"#ff6b39",18)} }
 else if(name==="Rahul Gandhi"||name==="Vijeta Dahiya"||name==="Elon Musk"){player.vx=player.facing*720;player.vy=-120;player.invuln=Math.max(player.invuln,.28);if(name==="Elon Musk"&&dist<210){damageEnemy(20);particlesAt(enemy.x,enemy.y+20,"#53e7ff",16)}}
 else if(name==="Amit Shah"){scanTimer=5;toast("MASTER STRATEGIST · RIVAL REVEALED")}
 else if(name==="Dhruv Rathee"){scanTimer=4;toast("FACT CHECK · TARGET SCANNED");if(dist<650&&clear)damageEnemy(12)}
 else if(name==="Abhijeet Dipke"){if(dist<230){damageEnemy(16);enemy.vx+=Math.sign(dx||1)*210}toast("COMMENTARY MODE · DISRUPTION")}
 else if(name==="Sourav Das"){player.speedBoost=3;toast("RAPID RESPONSE · SPEED BOOST")}
 else if(name==="Donald Trump"){player.damageShield=3;toast("MAGA MODE · DAMAGE RESISTANCE")}
 particlesAt(player.x+player.w/2,player.y+player.h/2,fighterData[name].accent,14);memeAttack(name,false);updateHud();
}
function useUltimate(){
 if(!running||ultimateCharge<100){toast(`ULTIMATE CHARGING · ${Math.floor(ultimateCharge)}%`);return}
 ultimateCharge=0;const name=player.characterName,dx=enemy.x-player.x,dist=Math.abs(dx),clear=!lineBlocked(player.x+player.w/2,player.y+player.h*.4,enemy.x+enemy.w/2,enemy.y+enemy.h*.4);
 abilityEffect={name,type:"ultimate",x:player.x+player.w/2,y:player.y+player.h/2};abilityEffectTimer=1.25;
 if(name==="Narendra Modi"){if(dist<850&&clear){damageEnemy(52);enemy.vx+=Math.sign(dx||1)*320;particlesAt(enemy.x+enemy.w/2,enemy.y+20,"#ff572e",36)}toast("BANKA APOCALYPSE!")}
 else if(name==="Rahul Gandhi"){player.vx=player.facing*920;player.invuln=.65;if(dist<240){damageEnemy(34);enemy.vx+=player.facing*500}toast("COMEBACK CHARGE!")}
 else if(name==="Amit Shah"){scanTimer=8;ultimateWall={x:clamp(player.x+player.facing*110,100,WORLD_W-100),y:GROUND-105,w:28,h:105,kind:"barrier",temporary:true};ultimateWallTimer=5;solids.push(ultimateWall);toast("OPERATION LOCKDOWN!")}
 else if(name==="Dhruv Rathee"){if(dist<800&&clear)damageEnemy(38);scanTimer=8;toast("EXPOSÉ · TARGET MARKED")}
 else if(name==="Abhijeet Dipke"){if(dist<330){damageEnemy(42);enemy.vx+=Math.sign(dx||1)*420}particlesAt(player.x+player.w/2,player.y+player.h/2,"#ffcf6d",40);toast("POLITICAL ROAST!")}
 else if(name==="Sourav Das"){for(let i=-1;i<=1;i++){bullets.push({x:player.x+player.w/2,y:player.y+player.h*.4+i*8,vx:player.facing*980,vy:i*110,owner:"player",life:1.2,damage:18,weapon:"rifle"})}toast("RAPID RESPONSE BURST!")}
 else if(name==="Vijeta Dahiya"){if(dist<900&&clear){damageEnemy(46);particlesAt(enemy.x+enemy.w/2,enemy.y+20,"#e48cff",24)}toast("PRECISION STRIKE!")}
 else if(name==="Donald Trump"){player.damageShield=6;ultimateWall={x:clamp(player.x+player.facing*85,40,WORLD_W-90),y:GROUND-92,w:25,h:92,kind:"barrier",temporary:true};ultimateWallTimer=6;solids.push(ultimateWall);toast("TRUMP TOWER DEPLOYED!")}
 else if(name==="Elon Musk"){ultimateWall={x:clamp(player.x+player.facing*85,40,WORLD_W-90),y:GROUND-100,w:30,h:100,kind:"barrier",temporary:true,energy:true};ultimateWallTimer=6;particlesAt(ultimateWall.x,ultimateWall.y+40,"#51d9ff",30);solids.push(ultimateWall);toast("CYBERTRUCK SHIELD!")}
 memeAttack(name,true);updateHud();
}
function particlesAt(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-180,180),vy:rand(-190,90),life:rand(.15,.48),color})}
function inBush(p){const cx=p.x+p.w/2,foot=p.y+p.h;return bushes.some(b=>cx>b.x&&cx<b.x+b.w&&foot>b.y+3&&p.y<b.y+b.h)}
function nearestSolidCover(a,b){const ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2;return solids.some(s=>s.kind!=="platform"&&segmentRect(ax,ay,bx,by,s))}
function segmentRect(x1,y1,x2,y2,r){let t0=0,t1=1,dx=x2-x1,dy=y2-y1;const p=[-dx,dx,-dy,dy],q=[x1-r.x,r.x+r.w-x1,y1-r.y,r.y+r.h-y1];for(let i=0;i<4;i++){if(Math.abs(p[i])<1e-9){if(q[i]<0)return false}else{const t=q[i]/p[i];if(p[i]<0){if(t>t1)return false;t0=Math.max(t0,t)}else{if(t<t0)return false;t1=Math.min(t1,t)}}}return true}
function pointBlocked(x,y){return solids.some(s=>s.kind!=="ground"&&x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h)}
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function moveEntity(p,dt,isPlayer){
 p.onGround=false;
 const left=keys.has("KeyA")||keys.has("ArrowLeft"),right=keys.has("KeyD")||keys.has("ArrowRight");
 let axis=isPlayer?((right?1:0)-(left?1:0)):0;
 if(isPlayer&&Math.abs(moveAxis)>.08)axis=moveAxis;
 if(p.hitStun>0){p.hitStun=Math.max(0,p.hitStun-dt);p.vx*=Math.pow(.90,dt*60)}else if(isPlayer){p.vx=axis*moveSpeed;if(axis)p.facing=axis>0?1:-1}
 // Directional jetpack: hold jet and steer with A/D or the left movement stick.
 // Lift is deliberately capped so a tap cannot send the fighter off-screen.
 const usingJet=isPlayer?(jetHeld||keys.has("ShiftLeft")||keys.has("ShiftRight")):(p.jet>1&&p.vy>50&&Math.abs(enemy.x-player.x)>180&&Math.random()<.07);
 if(usingJet&&p.jet>0){
   p.vy=Math.max(p.vy-1450*dt,-560);
   if(isPlayer){
     const steerLeft=keys.has("KeyA")||keys.has("ArrowLeft"),steerRight=keys.has("KeyD")||keys.has("ArrowRight");
     let steer=(steerRight?1:0)-(steerLeft?1:0);
     if(Math.abs(moveAxis)>.08)steer=moveAxis;
     if(steer!==0){p.vx=steer*moveSpeed*1.12;p.facing=steer>0?1:-1;}
   }
   p.jet=Math.max(0,p.jet-30*dt);
   if(Math.random()<.55)particlesAt(p.x+p.w/2-18,p.y+p.h-3,"#57c8ff",1);
 }
 p.vy+=gravity*dt;p.vy=clamp(p.vy,-600,900);
 // horizontal collision against solid walls/barriers, not one-way platforms
 p.x+=p.vx*dt;
 for(const s of solids){if(s.kind==="platform"||s.kind==="ground")continue;if(rectsOverlap(p,s)){if(p.vx>0)p.x=s.x-p.w;else if(p.vx<0)p.x=s.x+s.w;p.vx=0}}
 p.x=clamp(p.x,0,WORLD_W-p.w);
 const oldY=p.y;p.y+=p.vy*dt;
 for(const s of solids){
   if(s.kind==="ground")continue; // Ground is resolved once below to avoid sinking into it.
   if(s.kind==="platform"){if(p.vy>=0&&oldY+p.h<=s.y+5&&p.y+p.h>=s.y&&p.x+p.w>s.x&&p.x<s.x+s.w){p.y=s.y-p.h;p.vy=0;p.onGround=true;p.jumps=0}}
   else if(rectsOverlap(p,s)){if(p.vy>0){p.y=s.y-p.h;p.onGround=true;p.jumps=0}else if(p.vy<0)p.y=s.y+s.h;p.vy=0}
 }
 // Keep the whole character above the ground line at all times.
 if(p.y+p.h>=GROUND){p.y=GROUND-p.h;p.vy=0;p.onGround=true;p.jumps=0}
 // Clamp the top of the arena; the jetpack can never carry the fighter out of view.
 if(p.y<8){p.y=8;if(p.vy<0)p.vy=0}
 if(p.onGround)p.jet=Math.min(100,p.jet+43*dt);
 if(p.y>WORLD_H+120){if(isPlayer)damagePlayer(100);else damageEnemy(100)}
}
function applyImpact(p,sourceX,sourceY,force=360,stun=.24,up=180){const cx=p.x+p.w/2,cy=p.y+p.h/2,dx=cx-sourceX,dy=cy-sourceY,m=Math.hypot(dx,dy)||1;p.vx+=(dx/m)*force;p.vy=Math.min(p.vy,(dy/m)*force-up);p.hitStun=Math.max(p.hitStun||0,stun);p.knockFlash=.22;p.invuln=Math.max(p.invuln||0,.12)}
function damagePlayer(d,impact=null){if(player.invuln>0||!running)return;sfx('hit');if(player.damageShield>0)d*=.55;player.hp=Math.max(0,player.hp-d);player.invuln=.22;player.lastDamage=elapsed;if(impact)applyImpact(player,impact.x,impact.y,impact.force||300,impact.stun||.2,impact.up||130);particlesAt(player.x+player.w/2,player.y+player.h/2,'#c8ff4d',12);comicPop(['BONK!','OOF!','PEEKABOO!'][Math.floor(Math.random()*3)],player.x+player.w/2,player.y+8,'#c8ff4d');if(player.hp<=0){botKills++;player.invuln=3;toast('ELIMINATED — RESPAWNING');setTimeout(()=>{if(running){resetPlayer();updateHud()}},1500)}updateHud()}
function damageEnemy(d,impact=null){if(!enemy.alive)return;sfx('hit');ultimateCharge=Math.min(100,ultimateCharge+d*.65);enemy.hp=Math.max(0,enemy.hp-d);enemy.invuln=.12;enemy.lastDamage=elapsed;if(impact)applyImpact(enemy,impact.x,impact.y,impact.force||330,impact.stun||.24,impact.up||140);else{enemy.hitStun=Math.max(enemy.hitStun||0,.12);enemy.knockFlash=.18}particlesAt(enemy.x+enemy.w/2,enemy.y+enemy.h/2,'#ff795c',12);comicPop(['POW!','BAM!','NICE SHOT!','PEEKABOO!'][Math.floor(Math.random()*4)],enemy.x+enemy.w/2,enemy.y+8,'#ffb85c');if(enemy.hp<=0){enemy.alive=false;enemy.respawn=3;playerKills++;comicPop('K.O.!',enemy.x+enemy.w/2,enemy.y-8,'#ff675e');toast('BOT ELIMINATED +1')}updateHud()}
function update(dt){
 if(!running||paused||ended)return;elapsed+=dt;ultimateCharge=Math.min(100,ultimateCharge+dt*1.25);updateSecurityEvent(dt);matchLeft=Math.max(0,matchLeft-dt);if(matchLeft<=0){finishMatch();return}
 player.fireCd=Math.max(0,player.fireCd-dt);if(player.recoil)player.recoil.timer=Math.max(0,player.recoil.timer-dt);if(player.switchFx)player.switchFx=Math.max(0,player.switchFx-dt);abilityCooldown=Math.max(0,abilityCooldown-dt);if(abilityEffectTimer>0)abilityEffectTimer=Math.max(0,abilityEffectTimer-dt);if(scanTimer>0)scanTimer=Math.max(0,scanTimer-dt);if(ultimateWallTimer>0){ultimateWallTimer=Math.max(0,ultimateWallTimer-dt);if(ultimateWallTimer===0&&ultimateWall){const wi=solids.indexOf(ultimateWall);if(wi>=0)solids.splice(wi,1);ultimateWall=null;}}if(player.damageShield>0)player.damageShield=Math.max(0,player.damageShield-dt);if(player.speedBoost>0)player.speedBoost=Math.max(0,player.speedBoost-dt);if(reloadTimer>0){reloadTimer=Math.max(0,reloadTimer-dt);if(reloadTimer===0)finishReload()}player.invuln=Math.max(0,player.invuln-dt);player.meleeCd=Math.max(0,player.meleeCd-dt);player.attackAnim=Math.max(0,(player.attackAnim||0)-dt);grenadeCd=Math.max(0,grenadeCd-dt);enemy.invuln=Math.max(0,enemy.invuln-dt);
 if((mouse.down||touchFireHeld)&&running&&!grenadeMode)shootPlayer();
 moveEntity(player,dt,true);
 // Regeneration starts 4 seconds after the most recent hit.
 if(player.hp<player.maxHp&&elapsed-player.lastDamage>4)player.hp=Math.min(100,player.hp+8*dt);
 if(enemy.alive){
   enemy.fireCd=Math.max(0,enemy.fireCd-dt);moveBot(dt);
   const dist=Math.hypot((enemy.x-player.x),(enemy.y-player.y));
   const concealed=inBush(player)&&dist>260;
   const clear=!lineBlocked(enemy.x+enemy.w/2,enemy.y+enemy.h*.42,player.x+player.w/2,player.y+player.h*.42);
   if(dist<760&&clear&&!concealed)shootEnemy();
   if(dist<60&&Math.abs(enemy.y-player.y)<55&&Math.random()<dt*1.2)damagePlayer(12,{x:enemy.x+enemy.w/2,y:enemy.y+enemy.h/2,force:240,stun:.22,up:120});
 }else{enemy.respawn-=dt;if(enemy.respawn<=0)resetEnemy()}
 updateBullets(dt);updateGrenades(dt);updatePickups();updateArenaChaos(dt);updateParticles(dt);comicPopups=comicPopups.filter(p=>(p.life-=dt)>0);for(const p of comicPopups)p.y-=34*dt;
 camX=clamp(player.x+player.w/2-VIEW_W*.45,0,WORLD_W-VIEW_W);
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0){$("toast").classList.remove("toast-visible");$("toast").textContent="COVER UP · MOVE SMART · CONTROL HIGH GROUND"}}
 updateHud();
}
function moveBot(dt){
 if((enemy.hitStun||0)>0){enemy.hitStun=Math.max(0,enemy.hitStun-dt);enemy.vx*=Math.pow(.90,dt*60);return}
 const dx=player.x-enemy.x,dy=player.y-enemy.y,dist=Math.abs(dx);let axis=0;
 if(dist>290)axis=Math.sign(dx);else if(dist<150)axis=-Math.sign(dx)*.5;
 enemy.vx=axis*210;if(axis)enemy.facing=axis>0?1:-1;
 // Bot tries to jump onto a higher platform if player is significantly above.
 const playerHigher=player.y+player.h<enemy.y+enemy.h-70;
 if(playerHigher&&enemy.onGround&&Math.random()<dt*2.0){enemy.vy=jumpV*.92;enemy.jumps=1}
 if(playerHigher&&enemy.jumps===1&&enemy.vy>0&&enemy.jet>15&&Math.random()<dt*2){enemy.vy-=900*dt;enemy.jet-=20*dt}
 // If a wall blocks the route, jump to try to clear a low barrier.
 if(Math.random()<dt*1.3&&enemy.onGround&&solids.some(s=>s.kind!=="platform"&&Math.abs((s.x+s.w/2)-(enemy.x+enemy.w/2))<42&&s.y>enemy.y+10))enemy.vy=jumpV*.9;
 moveEntity(enemy,dt,false);
}
function lineBlocked(x1,y1,x2,y2){return solids.some(s=>s.kind!=="ground"&&segmentRect(x1,y1,x2,y2,s))}
function updateBullets(dt){
 const next=[];
 for(const b of bullets){b.life-=dt;let hit=false;const steps=Math.max(1,Math.ceil(Math.hypot(b.vx*dt,b.vy*dt)/9));for(let i=0;i<steps;i++){b.x+=b.vx*dt/steps;b.y+=b.vy*dt/steps;
   const cover=solids.find(s=>s.destructible&&b.x>=s.x&&b.x<=s.x+s.w&&b.y>=s.y&&b.y<=s.y+s.h);
   if(cover){cover.hp-=b.damage;particlesAt(b.x,b.y,"#c4d0df",3);sfx("hit");if(cover.hp<=0){const ci=solids.indexOf(cover);if(ci>=0)solids.splice(ci,1);platforms=solids.filter(s=>s.kind==="platform");comicPop("COVER SMASH!",cover.x+cover.w/2,cover.y-4,"#ffe36e");sfx("boom");toast("BARRICADE DESTROYED · NEW ROUTE!")}hit=true;break}
   if(pointBlocked(b.x,b.y)){hit=true;particlesAt(b.x,b.y,"#9aa9bc",2);break}
   if(b.owner==="player"&&enemy.alive&&b.x>enemy.x&&b.x<enemy.x+enemy.w&&b.y>enemy.y&&b.y<enemy.y+enemy.h){damageEnemy(b.damage,{x:b.x-b.vx*.02,y:b.y-b.vy*.02,force:Math.min(260,90+b.damage*4),stun:.13,up:65});hit=true;break}
   if(b.owner==="enemy"&&b.x>player.x&&b.x<player.x+player.w&&b.y>player.y&&b.y<player.y+player.h){if(inBush(player)&&Math.random()<.72){hit=true;break}damagePlayer(b.damage,{x:b.x-b.vx*.02,y:b.y-b.vy*.02,force:210,stun:.14,up:60});hit=true;break}
 }if(!hit&&b.life>0&&b.x>=0&&b.x<=WORLD_W)next.push(b)}
 bullets=next;
}
function updateGrenades(dt){
 const next=[];for(const g of grenades){g.t-=dt;g.vy+=gravity*.82*dt;const ox=g.x,oy=g.y;g.x+=g.vx*dt;g.y+=g.vy*dt;
   let hitSolid=pointBlocked(g.x,g.y)||g.x<8||g.x>WORLD_W-8;
   if(hitSolid){g.x=ox;g.y=oy;g.vx*=-.42;g.vy*=-.38;g.bounces=(g.bounces||0)+1;sfx('ricochet');if(g.bounces>3){g.vx*=.45;g.vy*=.45}}
   if(g.y+7>=GROUND){g.y=GROUND-7;if(Math.abs(g.vy)>75){g.vy*=-.42;g.vx*=.76;sfx('ricochet')}else{g.vy=0;g.vx*=.86}}
   if(g.t<=0){sfx("boom");comicPop("KABOOM!",g.x,g.y,"#ffb347");particlesAt(g.x,g.y,"#ffb347",42);const targets=g.owner==="player"?[enemy]:[player];for(const target of targets){if(g.owner==="player"&&!enemy.alive)continue;const tx=target.x+target.w/2,ty=target.y+target.h/2,dist=Math.hypot(tx-g.x,ty-g.y);if(dist<190){const damage=Math.max(8,Math.round(58*(1-dist/210)));const impact={x:g.x,y:g.y,force:Math.max(170,570*(1-dist/230)),stun:.28,up:230*(1-dist/230)};if(g.owner==="player")damageEnemy(damage,impact);else damagePlayer(damage,impact);particlesAt(tx,ty,"#ffdc80",18)}}continue}
   next.push(g)}grenades=next;
}
function updatePickups(){for(const p of pickups){if(p.taken)continue;const box={x:p.x-13,y:p.y-20,w:26,h:26};if(rectsOverlap(player,box)){p.taken=true;
 if(p.type==="health"){player.hp=Math.min(100,player.hp+45);toast("HEALTH +45")}
 else if(p.type==="ammo"){for(const w of player.weapons)player.reserve[w]+=w==="sniper"?5:20;toast("AMMO PICKUP")}
 else if(p.type==="smg"||p.type==="sniper"){if(!player.weapons.includes(p.type))player.weapons.push(p.type);player.ammo[p.type]+=p.type==="sniper"?5:24;player.reserve[p.type]+=p.type==="sniper"?15:72;player.weaponIndex=player.weapons.indexOf(p.type);toast(p.type.toUpperCase()+" PICKED UP · "+(player.weapons.length)+" WEAPONS")}
 updateHud();
 }else if(p.taken&&Math.random()<0.0002)p.taken=false}}
function updateArenaChaos(dt){
 supplyClock-=dt;if(supplyClock<=0){supplyClock=rand(32,44);const x=clamp(player.x+rand(-430,650),100,WORLD_W-100);supplyDrops.push({x,y:-35,vy:0,landed:false,life:24,type:["supply","health","ammo"][Math.floor(Math.random()*3)]});toast("SUPPLY DROP INCOMING · WATCH THE SKY");sfx("drop")}
 for(const d of supplyDrops){if(!d.landed){d.vy+=520*dt;d.y+=d.vy*dt;if(d.y>=GROUND-18){d.y=GROUND-18;d.landed=true;comicPop("SUPPLY DROP!",d.x,d.y-15,"#83f3ff");sfx("pickup")}}else d.life-=dt;if(d.landed&&Math.abs(player.x-d.x)<28&&Math.abs(player.y+player.h-(d.y+18))<75){if(d.type==="health")player.hp=Math.min(100,player.hp+35);else if(d.type==="ammo"){for(const w of player.weapons)player.reserve[w]+=25}else{player.grenades=Math.min(6,player.grenades+2);player.hp=Math.min(100,player.hp+20);for(const w of player.weapons)player.reserve[w]+=12}d.life=0;toast("SUPPLY SECURED · +GEAR");sfx("pickup");updateHud()}}
 supplyDrops=supplyDrops.filter(d=>d.life>0);chaosClock-=dt;if(chaosClock<=0&&chaosTimer<=0){chaosTimer=8;chaosClock=rand(38,52);const names=[["PARLIAMENT POWER CUT","VISIBILITY LOW"],["INDIA GATE SMOKE WAVE","KEEP MOVING"],["RALLY CONFETTI STORM","CHAOS MODE"],["ISLAND TROPICAL SQUALL","HOLD YOUR GROUND"],["TECH LAB OVERLOAD","ENERGY SPIKE"]];chaosName=names[activeArena][0];toast(chaosName+"!");comicPop("ARENA CHAOS!",player.x+player.w/2,player.y-8,"#7feaff");sfx("boom")}if(chaosTimer>0)chaosTimer-=dt;
}
function updateParticles(dt){particles=particles.filter(p=>(p.life-=dt)>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt}}
function finishMatch(){ended=true;running=false;const title=playerKills>botKills?"YOU WIN":playerKills<botKills?"BOT WINS":"DRAW";$("endTitle").textContent=title;$("endSummary").textContent=`Final score — You ${playerKills} : ${botKills} Bot`;$("endOverlay").classList.remove("hidden")}
function drawBackground(){
 const palettes=[["#111d31","#25344a","#101a2a"],["#14263a","#46576a","#152333"],["#281c35","#5a3444","#171729"],["#12343b","#28736f","#0b232c"],["#101c3d","#254b75","#080e23"]];const pal=palettes[activeArena]||palettes[0];const g=ctx.createLinearGradient(0,0,0,VIEW_H);g.addColorStop(0,pal[0]);g.addColorStop(.65,pal[1]);g.addColorStop(1,pal[2]);ctx.fillStyle=g;ctx.fillRect(0,0,VIEW_W,VIEW_H);
 // distant Delhi skyline parallax
 ctx.save();ctx.translate(-camX*.16,0);for(let i=0;i<18;i++){const x=i*155;ctx.fillStyle=i%3===0?"#1a2b40":"#1a293c";ctx.fillRect(x,210+(i%4)*30,105,420);ctx.fillStyle="#ffcf7040";for(let j=0;j<5;j++)for(let k=0;k<4;k++)ctx.fillRect(x+12+k*21,235+(i%4)*30+j*42,7,11)}ctx.restore();
 // Decorative landmark and signs change with the selected arena; collision layouts are separate.
 if(activeArena===0){const bx=855-camX;ctx.fillStyle="#8c765d";ctx.fillRect(bx,235,170,130);ctx.fillStyle="#bba083";ctx.fillRect(bx-20,220,210,18);ctx.fillStyle="#6d5c4b";ctx.fillRect(bx+17,250,136,115);for(let x=bx+25;x<bx+155;x+=22){ctx.fillStyle="#d9c4a5";ctx.fillRect(x,267,8,75)}ctx.fillStyle="#f0d7ad";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText("PEOPLE'S PARLIAMENT",bx+85,205);ctx.textAlign="left";drawSign(40-camX,290,215,68,"PROMISES LOADING...","PLEASE WAIT",0);drawSign(1900-camX,290,225,68,"DEBATE MODE: ON","ANSWERS NOT FOUND",1);}
 else if(activeArena===1){const bx=570-camX;ctx.fillStyle="#b9c8d4";ctx.fillRect(bx,245,140,120);ctx.fillStyle="#dce7ef";ctx.beginPath();ctx.moveTo(bx-20,245);ctx.lineTo(bx+70,185);ctx.lineTo(bx+160,245);ctx.closePath();ctx.fill();ctx.fillStyle="#6b8298";ctx.fillRect(bx+58,265,24,100);drawSign(70-camX,285,200,64,"INDIA GATE ZONE","SMOKE ON STANDBY",0);drawSign(1810-camX,285,230,64,"TACTICAL CHECKPOINT","KEEP MOVING",1);}
 else if(activeArena===2){const bx=900-camX;ctx.fillStyle="#452d4b";ctx.fillRect(bx,260,360,100);ctx.fillStyle="#e94c78";ctx.fillRect(bx,260,360,12);ctx.fillStyle="#f7c6d6";ctx.font="bold 18px sans-serif";ctx.fillText("PUBLIC RALLY",bx+105,320);drawSign(50-camX,285,210,64,"PROMISES × 100","VOLUME: MAX",1);drawSign(1940-camX,285,200,64,"CAMPAIGN MODE","REALITY LOADING",0);}
 else if(activeArena===3){ctx.fillStyle="#15575a";ctx.fillRect(0,375,VIEW_W,130);ctx.fillStyle="#d2bc91";ctx.fillRect(0,460,VIEW_W,50);const bx=1080-camX;ctx.fillStyle="#d6d3c8";ctx.fillRect(bx,245,210,130);ctx.fillStyle="#b4b7ad";ctx.fillRect(bx-18,230,246,18);for(let i=0;i<5;i++){ctx.fillStyle="#7aaeb0";ctx.fillRect(bx+18+i*38,275,20,40)}drawSign(60-camX,280,225,64,"PRIVATE PROPERTY?","ACCOUNTABILITY ZONE",1);drawSign(1850-camX,280,225,64,"CAMERAS ONLINE","SECRECY: OFF",0);}
 else{for(let i=0;i<8;i++){const x=i*180-camX*.45;ctx.fillStyle="#1a3760";ctx.fillRect(x,215+(i%3)*32,115,190);ctx.strokeStyle="#5de3ff";ctx.lineWidth=2;ctx.strokeRect(x+8,225+(i%3)*32,98,160);ctx.fillStyle="#4e9cc2";ctx.fillRect(x+18,245+(i%3)*32,78,5)}const bx=960-camX;ctx.fillStyle="#223f64";ctx.fillRect(bx,240,220,130);ctx.strokeStyle="#6bf1ff";ctx.lineWidth=3;ctx.strokeRect(bx,240,220,130);drawSign(60-camX,285,205,64,"LAB ACCESS","POWER: UNSTABLE",0);drawSign(1900-camX,285,220,64,"PROTOTYPE ZONE","DO NOT TOUCH",1);}
 // distant street lights and road markings
 for(const cx of [700,1640]){const x=cx-camX;if(x>-30&&x<VIEW_W+30){ctx.fillStyle="#102a36";ctx.fillRect(x-12,GROUND-55,24,35);ctx.fillStyle="#65e6ff";ctx.fillRect(x-7,GROUND-48,14,7);ctx.fillStyle="#e5faff";ctx.font="bold 9px sans-serif";ctx.fillText("E",x-3,GROUND-30)}}
 for(let i=0;i<14;i++){const x=i*190-camX*.5;ctx.fillStyle="#263c50";ctx.fillRect(x,390,7,190);ctx.fillStyle="#ffdb85";ctx.beginPath();ctx.arc(x+3,390,9,0,Math.PI*2);ctx.fill()}
 // Arena-specific ambient details add movement and personality without obscuring combat.
 if(activeArena===1){ // India Gate: drifting ceremonial smoke and searchlights
   for(let i=0;i<5;i++){const x=((i*245+elapsed*22)%1450)-80-camX*.28;const y=350+Math.sin(elapsed*1.2+i)*28;ctx.globalAlpha=.10;ctx.fillStyle=i%2?"#d6e7ef":"#c9d8c9";ctx.beginPath();ctx.ellipse(x,y,30+i*3,10+i,Math.sin(elapsed+i)*.2,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
   const beamX=180+((elapsed*70)%1100);ctx.globalAlpha=.12;ctx.fillStyle="#ffe6a1";ctx.beginPath();ctx.moveTo(beamX,65);ctx.lineTo(beamX+105,390);ctx.lineTo(beamX-15,390);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
 }else if(activeArena===2){ // Rally: animated confetti around the stage
   const confettiColors=["#ff5e78","#ffd166","#62e7ff","#d5ff69"];for(let i=0;i<30;i++){const x=(i*97+Math.sin(elapsed*1.8+i)*24-camX*.12+2400)%1280;const y=(i*53+elapsed*(30+(i%4)*9))%390;ctx.globalAlpha=.35;ctx.fillStyle=confettiColors[i%confettiColors.length];ctx.save();ctx.translate(x,y);ctx.rotate(elapsed+i);ctx.fillRect(-2,-4,4,8);ctx.restore()}ctx.globalAlpha=1;
 }else if(activeArena===3){ // Island: moving water glints and distant birds
   ctx.globalAlpha=.30;ctx.strokeStyle="#9deee0";ctx.lineWidth=2;for(let i=0;i<14;i++){const x=((i*137+elapsed*48)%1500)-80-camX*.12;const y=405+(i%4)*18;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+28,y+Math.sin(elapsed*2+i)*3);ctx.stroke()}ctx.globalAlpha=1;
   ctx.strokeStyle="#172d38";ctx.lineWidth=2;for(let i=0;i<3;i++){const x=(100+i*180+elapsed*28)%1350;const y=120+i*19+Math.sin(elapsed*2+i)*5;ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x,y+4);ctx.lineTo(x+8,y);ctx.stroke()}
 }else if(activeArena===4){ // Tech lab: pulsing scan lines and hologram grids
   const scanY=120+((elapsed*95)%300);ctx.globalAlpha=.18;ctx.fillStyle="#59e6ff";ctx.fillRect(0,scanY,VIEW_W,3);ctx.strokeStyle="#59e6ff";ctx.lineWidth=1;for(let x=0;x<VIEW_W;x+=80){ctx.beginPath();ctx.moveTo(x,200);ctx.lineTo(x,390);ctx.stroke()}ctx.globalAlpha=.65;ctx.fillStyle="#80f4ff";ctx.font="900 11px sans-serif";ctx.fillText("SYSTEM: " + (Math.floor(elapsed/4)%2?"OVERCLOCKED":"ONLINE"),VIEW_W-160,190);ctx.globalAlpha=1;
 }else{ // Parliament: moving searchlight and occasional tiny camera flash
   const lx=(elapsed*85)%VIEW_W;ctx.globalAlpha=.10;ctx.fillStyle="#e5f3ff";ctx.beginPath();ctx.moveTo(lx,80);ctx.lineTo(lx+70,370);ctx.lineTo(lx-40,370);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
 }
 // ground and lane
 ctx.fillStyle="#26364a";ctx.fillRect(0,GROUND,VIEW_W,VIEW_H-GROUND);ctx.fillStyle="#3c4c60";ctx.fillRect(0,GROUND,VIEW_W,9);ctx.fillStyle="#111a28";ctx.fillRect(0,GROUND+30,VIEW_W,VIEW_H-(GROUND+30));ctx.strokeStyle="#ffc76e88";ctx.lineWidth=3;ctx.setLineDash([36,24]);ctx.beginPath();ctx.moveTo(0,GROUND+51);ctx.lineTo(VIEW_W,GROUND+51);ctx.stroke();ctx.setLineDash([]);
}
function drawSign(x,y,w,h,a,b,v){if(x+w<0||x>VIEW_W)return;ctx.fillStyle="#0d1727";ctx.fillRect(x,y,w,h);ctx.strokeStyle=v?"#ff765b":"#c8ff4d";ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);ctx.fillStyle=v?"#ff9a82":"#d8ff73";ctx.font="900 13px sans-serif";ctx.fillText(a,x+10,y+25);ctx.fillStyle="#f1f5fa";ctx.font="bold 10px sans-serif";ctx.fillText(b,x+10,y+47)}
function drawGeometry(){
 // draw solid geometry with a visible top edge, so collision reads clearly
 for(const s of solids){const x=s.x-camX;if(x+s.w<0||x>VIEW_W)continue;if(s.kind==="ground")continue;
  if(s.kind==="platform"){ctx.fillStyle="#18263a";ctx.fillRect(x,s.y,s.w,s.h);ctx.fillStyle="#c8ff4d";ctx.fillRect(x,s.y,s.w,5);ctx.fillStyle="#34465d";ctx.fillRect(x+8,s.y+s.h,s.w-16,7);ctx.fillStyle="#73849b";for(let xx=x+14;xx<x+s.w-8;xx+=30)ctx.fillRect(xx,s.y+s.h+1,3,5)}
  else{ctx.fillStyle=s.kind==="wall"?"#536174":"#68778a";ctx.fillRect(x,s.y,s.w,s.h);ctx.fillStyle="#9aabba";ctx.fillRect(x,s.y,s.w,5);ctx.fillStyle="#344357";for(let yy=s.y+18;yy<s.y+s.h;yy+=23)ctx.fillRect(x+4,yy,s.w-8,3)}
 }
 // bushes conceal characters but do not stop bullets
 for(const b of bushes){const x=b.x-camX;if(x+b.w<0||x>VIEW_W)continue;ctx.fillStyle="#214f45";ctx.fillRect(x,b.y+20,b.w,b.h-20);for(let i=0;i<6;i++){ctx.fillStyle=i%2?"#34745b":"#2b654f";ctx.beginPath();ctx.arc(x+8+i*(b.w-16)/5,b.y+17+(i%2)*4,17,0,Math.PI*2);ctx.fill()}ctx.fillStyle="#6ba77a";ctx.fillRect(x+8,b.y+12,b.w-16,3)}
 // pick ups
 for(const p of pickups){if(p.taken)continue;const x=p.x-camX;if(x< -30||x>VIEW_W+30)continue;ctx.save();ctx.translate(x,p.y);if(p.type==="health"){ctx.fillStyle="#1c9b70";ctx.fillRect(-12,-12,24,24);ctx.fillStyle="#effff7";ctx.fillRect(-3,-8,6,16);ctx.fillRect(-8,-3,16,6)}else if(p.type==="ammo"){ctx.fillStyle="#c6a04d";ctx.fillRect(-12,-10,24,20);ctx.fillStyle="#fff0a8";ctx.fillRect(-4,-7,4,14);ctx.fillRect(3,-7,4,14)}else{ctx.fillStyle=p.type==="smg"?"#5fd7f2":"#ff8d6f";ctx.fillRect(-15,-8,30,16);ctx.fillStyle="#101827";ctx.fillRect(-4,-4,16,5)}ctx.restore()}
 // Supply crates are intentionally bright enough to spot, with a parachute while falling.
 for(const d of supplyDrops){const x=d.x-camX;if(x<-40||x>VIEW_W+40)continue;ctx.save();if(!d.landed){ctx.strokeStyle="#e7f5ff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-14,d.y-22);ctx.lineTo(x-5,d.y);ctx.moveTo(x+14,d.y-22);ctx.lineTo(x+5,d.y);ctx.stroke();ctx.fillStyle="#eaf4ff";ctx.beginPath();ctx.arc(x,d.y-25,17,Math.PI,Math.PI*2);ctx.fill()}ctx.fillStyle=d.type==="health"?"#29b57d":d.type==="ammo"?"#d2a74b":"#50bfe5";ctx.fillRect(x-13,d.y-13,26,24);ctx.strokeStyle="#eff8ff";ctx.lineWidth=2;ctx.strokeRect(x-13,d.y-13,26,24);ctx.fillStyle="#102033";ctx.font="900 13px sans-serif";ctx.textAlign="center";ctx.fillText(d.type==="health"?"+":d.type==="ammo"?"A":"!",x,d.y+4);ctx.restore()}
}
function drawCharacter(p,isEnemy){
 const hidden=inBush(p),name=p.characterName||"Narendra Modi",d=fighterData[name]||fighterData["Narendra Modi"],teamColor=p.team==="BJP"?"#ff9b3d":"#5edbff";
 ctx.save();ctx.translate(p.x-camX+p.w/2,p.y);ctx.scale(p.facing<0?-1:1,1);if((p.hitStun||0)>0){ctx.translate(0,18);ctx.rotate(Math.sin(elapsed*70)*(p.hitStun>.2?.20:.10));ctx.translate(0,-18)}else if((p.attackAnim||0)>0){ctx.translate(p.facing*2,0)}if((p.knockFlash||0)>0){p.knockFlash=Math.max(0,p.knockFlash-.016);ctx.globalAlpha=.68+Math.sin(elapsed*80)*.28;}
 if(p.invuln>0&&Math.floor(elapsed*18)%2===0)ctx.globalAlpha=.45;else if(hidden)ctx.globalAlpha=.62;
 // Ground shadow and a compact, exaggerated-head 2D caricature silhouette.
 ctx.fillStyle="#050b13aa";ctx.beginPath();ctx.ellipse(0,54,20,4,0,0,Math.PI*2);ctx.fill();
 // Signature cape for Modi, coat tails for Trump.
 if(name==="Narendra Modi"){ctx.fillStyle="#e7dfd0";ctx.beginPath();ctx.moveTo(-10,17);ctx.lineTo(-22,27);ctx.lineTo(-17,48);ctx.lineTo(-7,39);ctx.closePath();ctx.fill();ctx.fillStyle="#ff9933";ctx.fillRect(-19,29,5,15)}
 // Legs and shoes
 ctx.fillStyle="#202a39";ctx.fillRect(-10,35,8,15);ctx.fillRect(3,35,8,15);ctx.fillStyle="#0b111a";ctx.fillRect(-13,48,13,5);ctx.fillRect(1,48,14,5);
 // Torso with clothing accents
 ctx.fillStyle=d.shirt;ctx.beginPath();ctx.moveTo(-13,17);ctx.lineTo(12,17);ctx.lineTo(15,39);ctx.lineTo(-14,39);ctx.closePath();ctx.fill();
 ctx.fillStyle=d.accent;ctx.fillRect(-13,18,5,20);ctx.fillRect(8,18,5,20);
 if(d.tie){ctx.fillStyle=d.tie;ctx.beginPath();ctx.moveTo(-2,18);ctx.lineTo(3,18);ctx.lineTo(5,31);ctx.lineTo(0,35);ctx.lineTo(-4,31);ctx.closePath();ctx.fill()}
 if(name==="Narendra Modi"){ctx.fillStyle="#d8cdb8";ctx.fillRect(-2,18,4,17);ctx.fillStyle="#ff9933";ctx.fillRect(-12,36,24,3)}
 if(name==="Rahul Gandhi"){ctx.fillStyle="#e6e8e4";ctx.fillRect(-9,21,18,3)}
 if(name==="Elon Musk"){ctx.strokeStyle="#51d9ff";ctx.lineWidth=2;ctx.strokeRect(-9,22,18,12)}
 if(name==="Vijeta Dahiya"){ctx.fillStyle="#e48cff";ctx.fillRect(-12,36,24,3)}
 // Arms, one arm angled toward the weapon
 ctx.fillStyle=d.skin;if((p.attackAnim||0)>0){ctx.fillRect(-17,20,6,17);ctx.fillRect(10,18,18,6);ctx.fillStyle="#fff0a8";ctx.beginPath();ctx.arc(28,21,5,0,Math.PI*2);ctx.fill()}else{ctx.fillRect(-17,20,6,17);ctx.fillRect(11,20,6,13)}
 // Head, enlarged for readable expression
 ctx.fillStyle=d.skin;ctx.beginPath();ctx.ellipse(0,9,14,15,0,0,Math.PI*2);ctx.fill();
 // Hair silhouettes vary by fighter
 ctx.fillStyle=d.hair;
 if(name==="Donald Trump"){ctx.beginPath();ctx.moveTo(-14,5);ctx.quadraticCurveTo(-17,-10,-2,-9);ctx.quadraticCurveTo(10,-13,15,-2);ctx.lineTo(10,1);ctx.quadraticCurveTo(0,-4,-12,7);ctx.closePath();ctx.fill();ctx.fillStyle="#f5cb66";ctx.beginPath();ctx.ellipse(1,-5,12,4,-.12,Math.PI,Math.PI*2);ctx.fill()}
 else if(name==="Narendra Modi"){ctx.beginPath();ctx.ellipse(0,0,14,8,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#f5f0e5";ctx.fillRect(-12,0,24,3)}
 else if(name==="Amit Shah"){ctx.beginPath();ctx.ellipse(0,3,13,8,0,Math.PI,Math.PI*2);ctx.fill()}
 else {ctx.beginPath();ctx.ellipse(0,1,14,9,0,Math.PI,Math.PI*2);ctx.fill();if(name==="Rahul Gandhi"||name==="Sourav Das"||name==="Dhruv Rathee"){ctx.fillRect(-12,-1,5,6);ctx.fillRect(7,-2,5,6)}}
 // Brows and expressive eyes
 ctx.strokeStyle=d.hair;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,5);ctx.lineTo(-3,4);ctx.moveTo(3,4);ctx.lineTo(9,5);ctx.stroke();
 ctx.fillStyle="#fff8eb";ctx.beginPath();ctx.ellipse(-5,8,3.2,2.8,0,0,Math.PI*2);ctx.ellipse(5,8,3.2,2.8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=d.eyes;ctx.beginPath();ctx.arc(-4,8,1.5,0,Math.PI*2);ctx.arc(6,8,1.5,0,Math.PI*2);ctx.fill();
 // Nose and character-specific beard/moustache
 ctx.fillStyle="#7e4e3c";ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(-2,13);ctx.lineTo(2,13);ctx.closePath();ctx.fill();
 if(d.beard){ctx.fillStyle=name==="Narendra Modi"?"#eee8db":d.hair;ctx.beginPath();ctx.moveTo(-11,13);ctx.quadraticCurveTo(0,20,11,13);ctx.lineTo(8,20);ctx.quadraticCurveTo(0,25,-8,20);ctx.closePath();ctx.fill();ctx.fillStyle=d.skin;ctx.fillRect(-3,15,6,2)}
 if(d.glasses){ctx.strokeStyle="#192536";ctx.lineWidth=1.8;ctx.strokeRect(-10,5,8,6);ctx.strokeRect(2,5,8,6);ctx.beginPath();ctx.moveTo(-2,7);ctx.lineTo(2,7);ctx.stroke()}
 // Mouth changes slightly during firing or ability use
 ctx.strokeStyle="#673c34";ctx.lineWidth=1.6;ctx.beginPath();if((mouse.down||touchFireHeld)&& !isEnemy){ctx.arc(0,16,3,0,Math.PI)}else{ctx.moveTo(-3,16);ctx.quadraticCurveTo(0,18,3,16)}ctx.stroke();
 // Elon-style tech earpiece, Vijeta hair strand, and Trump tie are small identifiers.
 if(name==="Elon Musk"){ctx.fillStyle="#51d9ff";ctx.fillRect(11,7,3,5)}
 if(name==="Vijeta Dahiya"){ctx.strokeStyle=d.hair;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,2);ctx.quadraticCurveTo(-18,13,-13,24);ctx.stroke()}
 // Weapon and compact jetpack
 // Weapon-specific silhouette and animated recoil/muzzle flash.
 const equipped=!isEnemy?currentWeapon():"rifle",recoil=!isEnemy&&p.recoil&&p.recoil.timer>0?p.recoil.amount*(p.recoil.timer/(p.recoil.weapon==="sniper"?.24:p.recoil.weapon==="rifle"?.13:p.recoil.weapon==="smg"?.055:.085)):0;
 ctx.save();ctx.translate(-recoil,0);
 ctx.fillStyle="#111a28";
 if(equipped==="pistol"){ctx.fillRect(11,24,18,5);ctx.fillRect(16,28,6,7);ctx.fillRect(25,22,5,3);ctx.fillStyle="#9aaec3";ctx.fillRect(20,23,5,1.5)}
 else if(equipped==="sniper"){ctx.fillRect(8,23,32,4);ctx.fillRect(12,20,22,2);ctx.fillRect(17,27,7,5);ctx.fillRect(36,22,5,6);ctx.fillStyle="#9aaec3";ctx.fillRect(23,20,8,2)}
 else if(equipped==="smg"){ctx.fillRect(10,23,23,6);ctx.fillRect(18,28,5,7);ctx.fillRect(30,21,5,3);ctx.fillStyle="#9aaec3";ctx.fillRect(17,22,7,2)}
 else {ctx.fillRect(10,23,25,6);ctx.fillRect(17,28,6,7);ctx.fillRect(31,20,5,4);ctx.fillStyle="#9aaec3";ctx.fillRect(18,21,8,2)}
 if(!isEnemy&&p.recoil&&p.recoil.timer>0){ctx.globalAlpha=Math.min(1,p.recoil.timer*16);ctx.fillStyle=equipped==="sniper"?"#fff0a8":equipped==="rifle"?"#ffe18a":"#d9f6ff";ctx.beginPath();ctx.moveTo(39,24);ctx.lineTo(49+Math.random()*4,21);ctx.lineTo(45,26);ctx.lineTo(51,29);ctx.lineTo(39,28);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(40,26,3,0,Math.PI*2);ctx.fill()}
 ctx.restore();
 ctx.fillStyle="#71849a";ctx.fillRect(-19,22,6,17);if(!isEnemy&&p.attackAnim>0){ctx.save();ctx.translate(12,28);ctx.rotate(-p.facing*0.25);ctx.strokeStyle=d.skin;ctx.lineWidth=9;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(p.facing*(34+18*(p.attackAnim/.24)), -5);ctx.stroke();ctx.fillStyle="#fff1df";ctx.beginPath();ctx.arc(p.facing*(34+18*(p.attackAnim/.24)),-5,6,0,Math.PI*2);ctx.fill();ctx.restore()}if(p.jet>0&&((isEnemy&&p.vy<0)||(!isEnemy&&(jetHeld||keys.has("ShiftLeft")||keys.has("ShiftRight"))))){ctx.fillStyle=d.accent;ctx.beginPath();ctx.moveTo(-13,37);ctx.lineTo(-16,48+Math.random()*3);ctx.lineTo(-20,37);ctx.closePath();ctx.fill()}
 // Nameplate and team pip
 ctx.scale(p.facing<0?-1:1,1);ctx.fillStyle=teamColor;ctx.beginPath();ctx.arc(0,-6,3,0,Math.PI*2);ctx.fill();ctx.font="900 10px sans-serif";ctx.textAlign="center";ctx.fillText(name.toUpperCase(),0,-14);
 if(scanTimer>0&&isEnemy){ctx.strokeStyle="#ffef8a";ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.strokeRect(-24,-5,48,63);ctx.setLineDash([])}
 if(p.damageShield>0&&!isEnemy){ctx.strokeStyle="#ffcf6d";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,26,29,-1.3,1.3);ctx.stroke()}
 ctx.restore();
}
function render(){
 ctx.clearRect(0,0,VIEW_W,VIEW_H);drawBackground();drawGeometry();
 // bullets and grenades
 for(const b of bullets){ctx.fillStyle=b.owner==="player"?(weaponDefs[b.weapon]?.color||"#ffe18a"):"#ff755b";ctx.beginPath();ctx.arc(b.x-camX,b.y,3.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffffff55";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x-camX-b.vx*.022,b.y-b.vy*.022);ctx.lineTo(b.x-camX,b.y);ctx.stroke()}
 for(const g of grenades){ctx.fillStyle="#ffb347";ctx.beginPath();ctx.arc(g.x-camX,g.y,7,0,Math.PI*2);ctx.fill()}
 if(enemy.alive)drawCharacter(enemy,true);drawCharacter(player,false);
 // Comic-book hit callouts: quick, semi-transparent and positioned at the action.
 for(const p of comicPopups){const alpha=clamp(p.life/p.maxLife,0,1);const x=p.x-camX,y=p.y;ctx.save();ctx.globalAlpha=alpha*.92;ctx.translate(x,y);ctx.rotate(p.spin);ctx.fillStyle=p.color;ctx.strokeStyle="#172033";ctx.lineWidth=3;ctx.lineJoin="round";ctx.font="1000 18px system-ui, sans-serif";const w=ctx.measureText(p.text).width+18;ctx.beginPath();ctx.moveTo(-w/2+7,-14);ctx.lineTo(w/2-7,-14);ctx.lineTo(w/2,0);ctx.lineTo(w/2-6,14);ctx.lineTo(-w/2+5,14);ctx.lineTo(-w/2,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#172033";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(p.text,0,0);ctx.restore();}ctx.globalAlpha=1;ctx.textAlign="left";ctx.textBaseline="alphabetic";
 if(abilityEffect&&abilityEffectTimer>0){const isUlt=abilityEffect.type==="ultimate",color=fighterData[abilityEffect.name]?.accent||"#c8ff4d";ctx.save();ctx.globalAlpha=Math.min(1,abilityEffectTimer/(isUlt?1.25:.9));ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=isUlt?10:5;const sx=player.x-camX+player.w/2,sy=player.y+player.h*.38;if(abilityEffect.name==="Narendra Modi"){ctx.beginPath();ctx.moveTo(sx+player.facing*12,sy);ctx.lineTo(sx+player.facing*(isUlt?850:540),sy+(isUlt?Math.sin(elapsed*8)*90:0));ctx.stroke();ctx.fillStyle="#ff9933";for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(sx+player.facing*(30+i*30),sy+Math.sin(elapsed*12+i)*8,3,0,Math.PI*2);ctx.fill()}}else if(abilityEffect.name==="Rahul Gandhi"){ctx.lineWidth=isUlt?12:6;ctx.beginPath();ctx.ellipse(sx+player.facing*(isUlt?70:40),sy,isUlt?92:54,28,0,0,Math.PI*2);ctx.stroke();ctx.font="900 14px sans-serif";ctx.fillText("♥ JODO",sx+player.facing*55,sy-34)}else if(abilityEffect.name==="Amit Shah"){ctx.setLineDash([7,5]);ctx.beginPath();ctx.rect(sx-(isUlt?130:75),sy-(isUlt?90:55),isUlt?260:150,isUlt?180:110);ctx.stroke();ctx.setLineDash([])}else if(abilityEffect.name==="Dhruv Rathee"){ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,isUlt?110:66,elapsed,elapsed+Math.PI*1.65);ctx.stroke();ctx.font="900 13px sans-serif";ctx.fillText("FACT CHECK",sx+44,sy-44)}else if(abilityEffect.name==="Abhijeet Dipke"){for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(i*Math.PI/3.5+elapsed*3)*(isUlt?180:90),sy+Math.sin(i*Math.PI/3.5+elapsed*3)*(isUlt?110:60));ctx.stroke()}}else if(abilityEffect.name==="Sourav Das"){ctx.font="1000 22px sans-serif";ctx.fillText("BREAKING!",sx+player.facing*70,sy-24);ctx.beginPath();ctx.moveTo(sx-player.facing*25,sy+15);ctx.lineTo(sx+player.facing*(isUlt?230:120),sy+15);ctx.stroke()}else if(abilityEffect.name==="Vijeta Dahiya"){ctx.beginPath();ctx.moveTo(sx+player.facing*8,sy-45);ctx.lineTo(sx+player.facing*(isUlt?220:100),sy+42);ctx.moveTo(sx+player.facing*8,sy+42);ctx.lineTo(sx+player.facing*(isUlt?220:100),sy-45);ctx.stroke()}else if(abilityEffect.name==="Donald Trump"){ctx.lineWidth=isUlt?12:7;ctx.beginPath();ctx.rect(sx-(isUlt?100:55),sy-(isUlt?70:40),isUlt?200:110,isUlt?140:80);ctx.stroke();ctx.font="1000 14px sans-serif";ctx.fillText("HUGE!",sx,sy-52)}else if(abilityEffect.name==="Elon Musk"){for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(sx+player.facing*12,sy-30+i*15);ctx.lineTo(sx+player.facing*(isUlt?210:115),sy-30+i*15);ctx.stroke()}ctx.font="1000 13px sans-serif";ctx.fillText("TO THE MOON",sx+player.facing*80,sy-48)}else{ctx.beginPath();ctx.arc(sx,sy,isUlt?95:55,0,Math.PI*2);ctx.stroke()}ctx.restore();}
 // Compact ability HUD: cooldown plus ultimate charge.
 ctx.fillStyle="#07101bd9";ctx.fillRect(VIEW_W/2-115,VIEW_H-58,230,22);ctx.fillStyle="#dce8f6";ctx.font="bold 10px sans-serif";ctx.textAlign="center";ctx.fillText(`Q SPECIAL ${abilityCooldown>0?Math.ceil(abilityCooldown)+"s":"READY"}   ·   X ULT ${Math.floor(ultimateCharge)}%`,VIEW_W/2,VIEW_H-44);ctx.textAlign="left";
 for(const p of particles){ctx.globalAlpha=clamp(p.life/.4,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-camX,p.y,4,4)}ctx.globalAlpha=1;
 if(chaosTimer>0){ctx.save();
   if(activeArena===0){ctx.globalAlpha=.16;ctx.fillStyle="#020711";ctx.fillRect(0,0,VIEW_W,VIEW_H)}
   else if(activeArena===1){ctx.globalAlpha=.12;for(let i=0;i<9;i++){ctx.fillStyle="#d9e5e9";ctx.beginPath();ctx.ellipse((i*173+elapsed*35)%VIEW_W,330+(i%3)*38,58,17,0,0,Math.PI*2);ctx.fill()}}
   else if(activeArena===2){const cc=["#ff5e78","#ffd166","#62e7ff"];ctx.globalAlpha=.7;for(let i=0;i<24;i++){ctx.fillStyle=cc[i%3];ctx.fillRect((i*71+elapsed*85)%VIEW_W,(i*43+elapsed*70)%VIEW_H,4,8)}}
   else if(activeArena===3){ctx.globalAlpha=.25;ctx.strokeStyle="#9deee0";ctx.lineWidth=2;for(let i=0;i<18;i++){const x=(i*83+elapsed*150)%VIEW_W;ctx.beginPath();ctx.moveTo(x,100+(i%5)*30);ctx.lineTo(x-20,180+(i%5)*30);ctx.stroke()}}
   else{ctx.globalAlpha=.23;ctx.strokeStyle="#59e6ff";ctx.lineWidth=2;for(let i=0;i<7;i++){const x=(i*177+elapsed*95)%VIEW_W;ctx.beginPath();ctx.moveTo(x,90);ctx.lineTo(x+rand(-20,20),450);ctx.stroke()}}
   ctx.globalAlpha=.72;ctx.fillStyle="#07101bcc";ctx.fillRect(VIEW_W/2-165,64,330,30);ctx.fillStyle="#ffe36e";ctx.font="900 12px sans-serif";ctx.textAlign="center";ctx.fillText(chaosName+" · "+Math.ceil(chaosTimer)+"s",VIEW_W/2,83);ctx.restore();ctx.textAlign="left"}
 // Dotted throw guide: aim with the right stick, then tap GREN.
 if(player.grenades>0&&running&&Math.hypot(aimAxis.x,aimAxis.y)>.18){ctx.save();ctx.fillStyle="#ffcf6d";let gx=player.x+player.w/2,gy=player.y+18,gvx=aimAxis.x*570,gvy=aimAxis.y*570-105;for(let i=0;i<12;i++){const t=i*.09,px=gx+gvx*t,py=gy+gvy*t+.5*gravity*.82*t*t;if(py>GROUND-7)break;ctx.globalAlpha=1-i/14;ctx.beginPath();ctx.arc(px-camX,py,2.6,0,Math.PI*2);ctx.fill()}ctx.restore()}
 // aim reticle
 let ax=mouse.x,ay=mouse.y;if(Math.hypot(aimAxis.x,aimAxis.y)>.18){ax=player.x-camX+player.w/2+aimAxis.x*100;ay=player.y+player.h*.42+aimAxis.y*100}ctx.strokeStyle="#ffffffc7";ctx.lineWidth=2;ctx.beginPath();ctx.arc(ax,ay,9,0,Math.PI*2);ctx.moveTo(ax-14,ay);ctx.lineTo(ax-5,ay);ctx.moveTo(ax+5,ay);ctx.lineTo(ax+14,ay);ctx.moveTo(ax,ay-14);ctx.lineTo(ax,ay-5);ctx.moveTo(ax,ay+5);ctx.lineTo(ax,ay+14);ctx.stroke();
 // event status banner and tactical labels
 ctx.fillStyle=eventState==="active"?"#7a241fdd":eventState==="warning"?"#6b4a12dd":"#07101bcc";ctx.fillRect(VIEW_W/2-190,12,380,42);ctx.textAlign="center";ctx.fillStyle=eventState==="active"?"#ffd5cb":eventState==="warning"?"#ffe7a6":"#b9d9e9";ctx.font="900 12px sans-serif";ctx.fillText(eventNotice,VIEW_W/2,29);ctx.font="bold 10px sans-serif";ctx.fillText(eventState==="active"?`SHUTTERS RETRACT IN ${Math.ceil(eventClock)}s`:eventState==="warning"?`ACTIVATION IN ${Math.ceil(eventClock)}s`:`AUTO EVENT IN ${Math.max(0,Math.ceil(eventClock))}s · PRESS E AT CONSOLE`,VIEW_W/2,44);ctx.textAlign="left";
 ctx.fillStyle="#07101bc9";ctx.fillRect(10,VIEW_H-31,210,20);ctx.fillStyle="#d9e5f4";ctx.font="bold 10px sans-serif";ctx.fillText(arenaNames[activeArena]+"  /  TACTICAL COVER",18,VIEW_H-17);
}
function loop(t){const dt=Math.min((t-last)/1000||0,.033);last=t;update(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function setupStick(id,onChange,onRelease){const el=$(id),knob=el.querySelector(".stick-knob");let active=false,pid=null;const max=29;function move(e){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,m=Math.hypot(dx,dy);if(m>max){dx=dx/m*max;dy=dy/m*max}knob.style.transform=`translate(${dx}px,${dy}px)`;onChange(dx/max,dy/max)}el.addEventListener("pointerdown",e=>{active=true;pid=e.pointerId;el.setPointerCapture(pid);move(e);e.preventDefault()});el.addEventListener("pointermove",e=>{if(active&&e.pointerId===pid)move(e)});const end=e=>{if(!active||e.pointerId!==pid)return;active=false;pid=null;knob.style.transform="translate(0,0)";onRelease()};el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);el.addEventListener("lostpointercapture",()=>{active=false;knob.style.transform="translate(0,0)";onRelease()})}
setupStick("moveStick",x=>moveAxis=Math.abs(x)<.12?0:x,()=>moveAxis=0);
setupStick("aimStick",(x,y)=>{const m=Math.hypot(x,y);if(m>.18){aimAxis={x:x/m,y:y/m};touchFireHeld=!grenadeMode}else{touchFireHeld=false}},()=>{touchFireHeld=false});
$("jumpBtn").addEventListener("pointerdown",e=>{e.preventDefault();jumpPlayer()});
$("jetBtn").addEventListener("pointerdown",e=>{e.preventDefault();jetHeld=true});["pointerup","pointercancel","lostpointercapture"].forEach(ev=>$("jetBtn").addEventListener(ev,()=>jetHeld=false));
$("grenadeBtn").addEventListener("pointerdown",e=>{e.preventDefault();grenadeMode=!grenadeMode;updateHud();toast(grenadeMode?"GRENADE EQUIPPED · AIM THEN TAP THROW":"GUN EQUIPPED · HOLD FIRE TO SHOOT");sfx("pickup")});$("fireBtn").addEventListener("pointerdown",e=>{e.preventDefault();$("fireBtn").setPointerCapture?.(e.pointerId);if(grenadeMode){throwGrenade();}else{touchFireHeld=true;shootPlayer()} });["pointerup","pointercancel","lostpointercapture"].forEach(ev=>$("fireBtn").addEventListener(ev,()=>touchFireHeld=false));$("swapBtn").addEventListener("pointerdown",e=>{e.preventDefault();if(player.weapons.length){selectWeapon((player.weaponIndex+1)%player.weapons.length);sfx("pickup")}});$("meleeBtn").addEventListener("pointerdown",e=>{e.preventDefault();meleeAttack()});$("reloadBtn").addEventListener("pointerdown",e=>{e.preventDefault();reload()});$("specialBtn").addEventListener("pointerdown",e=>{e.preventDefault();useSpecial()});$("ultimateBtn").addEventListener("pointerdown",e=>{e.preventDefault();useUltimate()});
const weaponHudEl=$("weaponHud");let weaponSwipeX=null;if(weaponHudEl){weaponHudEl.style.pointerEvents="auto";weaponHudEl.addEventListener("pointerdown",e=>{weaponSwipeX=e.clientX;weaponHudEl.setPointerCapture?.(e.pointerId)});weaponHudEl.addEventListener("pointerup",e=>{if(weaponSwipeX!==null&&Math.abs(e.clientX-weaponSwipeX)>28){selectWeapon((player.weaponIndex+(e.clientX<weaponSwipeX?1:player.weapons.length-1))%player.weapons.length);sfx("pickup")}weaponSwipeX=null});weaponHudEl.addEventListener("pointercancel",()=>weaponSwipeX=null)}
resetPlayer();resetEnemy();updateHud();
})();