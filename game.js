(() => {
  "use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const W = canvas.width, H = canvas.height;
  const keys = new Set();
  const platforms = [
    {x:0,y:630,w:1280,h:90},
    {x:145,y:520,w:230,h:18},
    {x:470,y:455,w:220,h:18},
    {x:790,y:520,w:220,h:18},
    {x:1030,y:405,w:150,h:18},
    {x:40,y:390,w:150,h:18}
  ];
  const player = {x:180,y:540,vx:0,vy:0,w:34,h:54,hp:100,maxHp:100,ammo:30,reserve:90,facing:1,onGround:false,jet:100,fireCooldown:0,invuln:0,grenades:3,melee:0};
  const enemy = {x:930,y:550,vx:0,vy:0,w:34,h:54,hp:100,maxHp:100,onGround:false,fireCooldown:1.1,invuln:0,alive:true,respawn:0};
  let bullets=[], grenades=[], particles=[], kills=0, running=false, last=0, elapsed=0, mouse={x:850,y:480,down:false}, aimVector={x:1,y:-.1}, moveAxis=0, aimAxis={x:0,y:0}, jetHeld=false, toastTimer=0;
  const gravity=1550, speed=270, jumpV=-560;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);
  function toast(msg){$("toast").textContent=msg;toastTimer=2.2}
  function resetPlayer(){Object.assign(player,{x:180,y:540,vx:0,vy:0,hp:100,ammo:30,reserve:90,jet:100,grenades:3,invuln:1});}
  function resetEnemy(){Object.assign(enemy,{x:rand(760,1100),y:540,vx:0,vy:0,hp:100,fireCooldown:1.1,invuln:0,alive:true,respawn:0});}
  function start(){
    running=true;$("startOverlay").classList.add("hidden");toast("TRAINING STARTED — TAKE YOUR SHOT");
    // Mobile browsers generally allow fullscreen/orientation requests only after a user gesture.
    if(window.matchMedia("(max-height: 600px), (pointer: coarse)").matches){
      const root=document.documentElement;
      if(root.requestFullscreen){root.requestFullscreen().then(()=>{if(screen.orientation&&screen.orientation.lock)return screen.orientation.lock("landscape");}).catch(()=>{});}
    }
  }
  $("startBtn").addEventListener("click",start);
  $("restartBtn").addEventListener("click",()=>{resetPlayer();resetEnemy();bullets=[];grenades=[];kills=0;updateHud();start();toast("ARENA RESET");});
  window.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==="Enter")start();if(e.code==="KeyR")reload();if(e.code==="KeyG")throwGrenade();if(e.code==="KeyF")melee();});
  window.addEventListener("keyup",e=>keys.delete(e.code));
  canvas.addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width*W;mouse.y=(e.clientY-r.top)/r.height*H;});
  canvas.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"){mouse.down=true;canvas.setPointerCapture(e.pointerId);}});
  window.addEventListener("pointerup",e=>{if(e.pointerType==="mouse")mouse.down=false;});
  canvas.addEventListener("contextmenu",e=>e.preventDefault());
  function reload(){if(player.ammo===30||player.reserve<=0){toast("MAGAZINE ALREADY FULL");return;}const n=Math.min(30-player.ammo,player.reserve);player.ammo+=n;player.reserve-=n;toast("RELOADED");updateHud();}
  function shoot(){if(!running||player.fireCooldown>0)return;if(player.ammo<=0){toast("PRESS R TO RELOAD");player.fireCooldown=.2;return;}player.ammo--;player.fireCooldown=.16;const px=player.x+player.w/2,py=player.y+player.h*.42;let dx,dy;if(Math.abs(aimAxis.x)+Math.abs(aimAxis.y)>.2){dx=aimAxis.x;dy=aimAxis.y;}else{dx=mouse.x-px;dy=mouse.y-py;}const mag=Math.hypot(dx,dy)||1;dx/=mag;dy/=mag;aimVector={x:dx,y:dy};bullets.push({x:px+dx*22,y:py+dy*22,vx:dx*760,vy:dy*760,owner:"player",life:1.5,damage:18});makeParticles(px+dx*24,py+dy*24,"#ffe18a",3);updateHud();}
  function throwGrenade(){if(!running||player.grenades<=0)return;player.grenades--;const dx=aimAxis.x||player.facing;const dy=aimAxis.y||-.5;grenades.push({x:player.x+player.w/2,y:player.y+18,vx:dx*360,vy:dy*360-100,t:1.25,owner:"player"});toast("GRENADE OUT");}
  function melee(){if(!running||player.melee>0)return;player.melee=.28;const range=68,px=player.x+player.w/2,ex=enemy.x+enemy.w/2;if(enemy.alive&&Math.abs(px-ex)<range&&Math.abs(player.y-enemy.y)<60){damageEnemy(28);toast("MELEE HIT");}else toast("MELEE SWING");}
  function makeParticles(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-160,160),vy:rand(-180,80),life:rand(.15,.4),color});}
  function damageEnemy(d){if(!enemy.alive)return;enemy.hp=Math.max(0,enemy.hp-d);enemy.invuln=.12;makeParticles(enemy.x+enemy.w/2,enemy.y+enemy.h/2,"#ff795c",8);if(enemy.hp<=0){enemy.alive=false;enemy.respawn=2.2;kills++;toast("BOT ELIMINATED +1");}updateHud();}
  function damagePlayer(d){if(player.invuln>0)return;player.hp=Math.max(0,player.hp-d);player.invuln=.5;makeParticles(player.x+player.w/2,player.y+player.h/2,"#c8ff4d",6);if(player.hp<=0){toast("YOU WERE ELIMINATED — RESPAWNING");setTimeout(()=>{resetPlayer();updateHud();},850);}updateHud();}
  function updateHud(){$("playerHealthText").textContent=Math.ceil(player.hp)+" HP";$("playerHealthBar").style.width=player.hp+"%";$("enemyHealthText").textContent=(enemy.alive?Math.ceil(enemy.hp):0)+" HP";$("enemyHealthBar").style.width=(enemy.alive?enemy.hp:0)+"%";$("ammoText").textContent=`RIFLE · ${player.ammo} / ${player.reserve} · GREN ${player.grenades}`;$("scoreText").textContent=`ELIMINATIONS · ${kills}`;}
  function moveEntity(p,dt){p.onGround=false;p.vy+=gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=clamp(p.x,0,W-p.w);for(const plat of platforms){if(p.vy>=0&&p.x+p.w>plat.x&&p.x<plat.x+plat.w&&p.y+p.h>=plat.y&&p.y+p.h-p.vy*dt<=plat.y){p.y=plat.y-p.h;p.vy=0;p.onGround=true;}}if(p.y>H+120){p.y=500;p.vy=0;}}
  function update(dt){if(!running)return;elapsed+=dt;player.fireCooldown=Math.max(0,player.fireCooldown-dt);player.invuln=Math.max(0,player.invuln-dt);player.melee=Math.max(0,player.melee-dt);enemy.invuln=Math.max(0,enemy.invuln-dt);
    let axis=moveAxis;if(!axis){axis=(keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0);}player.vx=axis*speed;if(axis)player.facing=Math.sign(axis);
    const jump=keys.has("Space")||keys.has("KeyW")||keys.has("ArrowUp");if(jump&&player.onGround){player.vy=jumpV;player.onGround=false;}
    const jet=jetHeld||keys.has("ShiftLeft")||keys.has("ShiftRight");if(jet&&player.jet>0){player.vy-=900*dt;player.jet=Math.max(0,player.jet-35*dt);}else player.jet=Math.min(100,player.jet+15*dt);
    moveEntity(player,dt);
    const px=player.x+player.w/2,py=player.y+player.h*.42;
    if(mouse.down)shoot();
    if(enemy.alive){const ex=enemy.x+enemy.w/2,dist=px-ex;enemy.vx=Math.abs(dist)>220?Math.sign(dist)*100:Math.sign(dist)*-45;if(Math.abs(dist)<310&&enemy.fireCooldown<=0){const dx=px-ex,dy=py-(enemy.y+enemy.h*.4),m=Math.hypot(dx,dy)||1;bullets.push({x:ex,y:enemy.y+20,vx:dx/m*440,vy:dy/m*440,owner:"enemy",life:1.7,damage:8});enemy.fireCooldown=rand(1.0,1.7);}enemy.fireCooldown-=dt;moveEntity(enemy,dt);}else{enemy.respawn-=dt;if(enemy.respawn<=0)resetEnemy();}
    for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let hit=false;if(b.owner==="player"&&enemy.alive&&b.x>enemy.x&&b.x<enemy.x+enemy.w&&b.y>enemy.y&&b.y<enemy.y+enemy.h){damageEnemy(b.damage);hit=true;}else if(b.owner==="enemy"&&b.x>player.x&&b.x<player.x+player.w&&b.y>player.y&&b.y<player.y+player.h){damagePlayer(b.damage);hit=true;}if(hit||b.life<=0||b.x<0||b.x>W||b.y<0||b.y>H)bullets.splice(i,1);}
    for(let i=grenades.length-1;i>=0;i--){const g=grenades[i];g.t-=dt;g.vy+=gravity*.65*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.y>600){g.y=600;g.vy*=-.45;g.vx*=.8;}if(g.t<=0){if(enemy.alive&&Math.hypot(g.x-(enemy.x+enemy.w/2),g.y-(enemy.y+enemy.h/2))<150)damageEnemy(45);makeParticles(g.x,g.y,"#ffb347",22);grenades.splice(i,1);}}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
    updateHud();if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$("toast").textContent="WASD MOVE · MOUSE FIRE · SPACE JUMP";}
  }
  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function drawBackground(){const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#182a42");sky.addColorStop(.62,"#536579");sky.addColorStop(1,"#d18a58");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#d8a46a";ctx.beginPath();ctx.arc(1030,150,55,0,Math.PI*2);ctx.fill();
    // Distant Delhi-inspired skyline
    for(let i=0;i<20;i++){const x=i*72-10,h=100+(i*47%120);ctx.fillStyle=i%3===0?"#2c4354":"#30475a";ctx.fillRect(x,430-h,55,h);ctx.fillStyle="#d9c28b66";for(let y=445-h;y<420;y+=20)for(let xx=x+9;xx<x+48;xx+=17)ctx.fillRect(xx,y,6,8);}
    // distant monument silhouette
    ctx.fillStyle="#283d4d";ctx.fillRect(520,360,110,80);ctx.fillRect(536,340,78,20);ctx.beginPath();ctx.moveTo(530,340);ctx.quadraticCurveTo(575,260,620,340);ctx.fill();ctx.fillRect(568,260,14,80);
    ctx.fillStyle="#182638";ctx.fillRect(0,625,W,95);
    for(let i=0;i<15;i++){ctx.fillStyle=i%2?"#28384a":"#243346";ctx.fillRect(i*95,610,70,15);ctx.fillStyle="#718093";ctx.fillRect(i*95+10,614,12,3);}
    ctx.fillStyle="#101b29";ctx.fillRect(0,650,W,70);ctx.strokeStyle="#6d7b8c66";ctx.lineWidth=3;ctx.setLineDash([34,28]);ctx.beginPath();ctx.moveTo(0,690);ctx.lineTo(W,690);ctx.stroke();ctx.setLineDash([]);
    platforms.slice(1).forEach(p=>{ctx.fillStyle="#263849";ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle="#c8ff4d";ctx.fillRect(p.x,p.y,p.w,4);ctx.fillStyle="#152333";ctx.fillRect(p.x+8,p.y+p.h,p.w-16,6);});
  }
  function drawCharacter(p,isEnemy){ctx.save();ctx.translate(p.x+p.w/2,p.y);if((isEnemy?-1:player.facing)<0)ctx.scale(-1,1);
    if(p.invuln>0&&Math.floor(elapsed*20)%2===0)ctx.globalAlpha=.5;
    // legs
    ctx.fillStyle=isEnemy?"#a44d40":"#c8ff4d";ctx.fillRect(-12,34,9,18);ctx.fillRect(3,34,9,18);ctx.fillStyle="#111a27";ctx.fillRect(-14,49,13,5);ctx.fillRect(2,49,13,5);
    // torso and vest
    ctx.fillStyle=isEnemy?"#d16a50":"#e5edf5";roundedRect(-15,15,30,25,5);ctx.fill();ctx.fillStyle=isEnemy?"#542d31":"#405467";ctx.fillRect(-11,21,22,15);
    ctx.fillStyle="#c89c75";ctx.beginPath();ctx.arc(0,8,12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#202b3a";ctx.fillRect(-12,0,24,6);ctx.fillStyle=isEnemy?"#ff7448":"#c8ff4d";ctx.fillRect(-5,4,10,3);
    // weapon
    ctx.fillStyle="#111821";ctx.fillRect(8,22,26,6);ctx.fillRect(26,19,8,4);ctx.fillStyle="#7e8b9a";ctx.fillRect(17,20,8,2);
    // jetpack
    ctx.fillStyle="#7f8da0";ctx.fillRect(-19,21,7,17);ctx.fillStyle="#ffb347";if(!isEnemy&&jetHeld)ctx.fillRect(-18,39,5,13);
    ctx.restore();}
  function render(){ctx.clearRect(0,0,W,H);drawBackground();bullets.forEach(b=>{ctx.fillStyle=b.owner==="player"?"#ffe18a":"#ff755b";ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle=b.owner==="player"?"#ffe18a88":"#ff755b88";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x-b.vx*.025,b.y-b.vy*.025);ctx.lineTo(b.x,b.y);ctx.stroke();});grenades.forEach(g=>{ctx.fillStyle="#ffb347";ctx.beginPath();ctx.arc(g.x,g.y,8,0,Math.PI*2);ctx.fill();});if(enemy.alive)drawCharacter(enemy,true);drawCharacter(player,false);
    if(player.melee>0){ctx.strokeStyle="#c8ff4d";ctx.lineWidth=5;ctx.beginPath();ctx.arc(player.x+player.w/2+player.facing*22,player.y+25,32,-.8,.8);ctx.stroke();}
    particles.forEach(p=>{ctx.globalAlpha=clamp(p.life/.4,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);});ctx.globalAlpha=1;
    // crosshair
    const cx=player.x+player.w/2,cy=player.y+player.h*.42;let ax=mouse.x,ay=mouse.y;if(Math.abs(aimAxis.x)+Math.abs(aimAxis.y)>.2){ax=cx+aimAxis.x*100;ay=cy+aimAxis.y*100;}ctx.strokeStyle="#ffffffb5";ctx.lineWidth=2;ctx.beginPath();ctx.arc(ax,ay,10,0,Math.PI*2);ctx.moveTo(ax-15,ay);ctx.lineTo(ax-5,ay);ctx.moveTo(ax+5,ay);ctx.lineTo(ax+15,ay);ctx.moveTo(ax,ay-15);ctx.lineTo(ax,ay-5);ctx.moveTo(ax,ay+5);ctx.lineTo(ax,ay+15);ctx.stroke();
    // jet meter
    ctx.fillStyle="#0b111bc9";ctx.fillRect(18,105,125,24);ctx.fillStyle="#ffffffb8";ctx.font="bold 10px Inter";ctx.fillText("JETPACK",27,120);ctx.fillStyle="#3c4c60";ctx.fillRect(27,125,105,4);ctx.fillStyle="#4d9dff";ctx.fillRect(27,125,105*player.jet/100,4);
  }
  function loop(t){const dt=Math.min((t-last)/1000||0,.033);last=t;update(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

  // Reusable virtual joysticks; movement stick controls horizontal movement, aim stick controls direction and autofire while held.
  function setupStick(id,onChange,onRelease){const el=$(id),knob=el.querySelector(".stick-knob");let active=false,pid=null;const max=el.id==="aimStick"?Math.max(25,(el.clientWidth-40)/2):Math.max(25,(el.clientWidth-40)/2);
    function move(e){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const m=Math.hypot(dx,dy);if(m>max){dx=dx/m*max;dy=dy/m*max;}knob.style.transform=`translate(${dx}px,${dy}px)`;onChange(dx/max,dy/max);}
    el.addEventListener("pointerdown",e=>{active=true;pid=e.pointerId;el.setPointerCapture(pid);move(e);e.preventDefault();});
    el.addEventListener("pointermove",e=>{if(active&&e.pointerId===pid)move(e);});
    const end=e=>{if(!active||e.pointerId!==pid)return;active=false;pid=null;knob.style.transform="translate(0,0)";onRelease();};
    el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);el.addEventListener("lostpointercapture",()=>{active=false;knob.style.transform="translate(0,0)";onRelease();});
  }
  setupStick("moveStick",(x)=>{moveAxis=Math.abs(x)<.12?0:x;},()=>{moveAxis=0;});
  setupStick("aimStick",(x,y)=>{const m=Math.hypot(x,y);if(m>.18){aimAxis={x:x/m,y:y/m};shoot();mouse.down=true;}},()=>{aimAxis={x:0,y:0};mouse.down=false;});
  $("jumpBtn").addEventListener("pointerdown",e=>{e.preventDefault();if(player.onGround){player.vy=jumpV;player.onGround=false;}});
  $("jetBtn").addEventListener("pointerdown",e=>{e.preventDefault();jetHeld=true;});["pointerup","pointercancel","pointerleave"].forEach(ev=>$("jetBtn").addEventListener(ev,()=>jetHeld=false));
  $("grenadeBtn").addEventListener("pointerdown",e=>{e.preventDefault();throwGrenade();});
  $("meleeBtn").addEventListener("pointerdown",e=>{e.preventDefault();melee();});
  updateHud();
})();