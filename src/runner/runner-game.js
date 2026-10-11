import * as THREE from 'three';
import { GAME } from '../app/config.js';
import { AbilityController } from './abilities.js';
import { createCharacter } from './characters3d.js';
import { Particles } from './effects.js';
import { City, ObstacleSpawner } from './world.js';
import { Input } from './input.js';

const SKY = 0xffb36b;

export class RunnerGame {
  // opts: { audio, quality, reducedMotion, onGameOver(stats), onQuit() }
  constructor(container, def, opts) {
    this.container = container; this.def = def; this.opts = opts;
    this.state = 'running'; this.disposed = false;
    const hi = opts.quality !== 'low';

    this.renderer = new THREE.WebGLRenderer({ antialias: hi, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hi ? 2 : 1));
    this.renderer.domElement.className = 'runner-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SKY);
    this.scene.fog = new THREE.Fog(SKY, 40, hi ? 170 : 110);
    this.scene.add(new THREE.HemisphereLight(0xfff0d8, 0x6a5a7a, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(-8, 20, 10);
    this.scene.add(sun);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
    this.camera.position.set(0, 4.6, 7.5);

    this.city = new City(this.scene);
    this.spawner = new ObstacleSpawner(this.scene);
    this.particles = new Particles(this.scene, hi ? 110 : 50);
    this.character = createCharacter(def);
    this.scene.add(this.character.root);

    // run state
    this.time = 0; this.distance = 0; this.coins = 0; this.bonus = 0;
    this.lane = 1; this.x = 0; this.y = 0; this.vy = 0; this.slideT = 0; this.queuedSlide = false;
    this.mult = 1; this.shake = 0; this.trailT = 0; this.wasAir = false;

    this.ability = new AbilityController({
      ...GAME.ability,
      onStart: () => { this.character.setTransformed(true); this.particles.burst(def.effect, this.x, 1.2, 0); opts.audio.sfx('ability'); },
      onEnd: () => { this.character.setTransformed(false); this.particles.burst(def.effect, this.x, 1.2, 0, 14); },
    });

    this.buildHud();
    this.input = new Input(container, {
      left: () => this.moveLane(-1), right: () => this.moveLane(1),
      jump: () => this.jump(), slide: () => this.slide(),
      ability: () => this.useAbility(), pause: () => this.togglePause(),
    });
    this.onResize = () => this.resize();
    this.ro = new ResizeObserver(this.onResize); this.ro.observe(container);
    this.onHide = () => { if (document.hidden) this.pause(); };
    document.addEventListener('visibilitychange', this.onHide);
    window.addEventListener('blur', this.onHide2 = () => this.pause());
    this.resize();

    this.last = performance.now();
    this.loop = (now) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(this.loop);
      const dt = Math.min(0.05, (now - this.last) / 1000 || 0);
      this.last = now;
      if (this.state === 'running') this.update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    this.raf = requestAnimationFrame(this.loop);
  }

  buildHud() {
    const h = (this.hud = document.createElement('div'));
    h.className = 'hud';
    h.innerHTML = `
      <div class="hud-top">
        <div class="hud-stat"><small>SCORE</small><b data-r="score">0</b></div>
        <div class="hud-stat"><small>DISTANCE</small><b data-r="dist">0 m</b></div>
        <div class="hud-stat"><small>COINS</small><b data-r="coins">0</b></div>
        <button class="hud-pause" data-r="pause" aria-label="Pause">❚❚</button>
      </div>
      <button class="hud-ability" data-r="ability" aria-label="Activate ability (Space)">
        <span class="fill" data-r="fill"></span><span class="lbl" data-r="alabel"></span>
      </button>
      <div class="pause-overlay" data-r="pausebox" hidden>
        <h2>PAUSED</h2>
        <button class="btn" data-r="resume">Resume</button>
        <button class="btn ghost" data-r="quit">Quit to menu</button>
      </div>`;
    this.container.appendChild(h);
    const q = (k) => h.querySelector(`[data-r="${k}"]`);
    this.el = Object.fromEntries(['score', 'dist', 'coins', 'pause', 'ability', 'fill', 'alabel', 'pausebox', 'resume', 'quit'].map((k) => [k, q(k)]));
    this.el.pause.onclick = () => this.togglePause();
    this.el.resume.onclick = () => this.resume();
    this.el.quit.onclick = () => this.opts.onQuit();
    this.el.ability.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.useAbility(); });
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth, h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ----- controls -----
  moveLane(d) {
    if (this.state !== 'running') return;
    const n = Math.max(0, Math.min(2, this.lane + d));
    if (n !== this.lane) { this.lane = n; this.opts.audio.sfx('lane'); }
  }
  jump() {
    if (this.state !== 'running' || this.y > 0.01) return;
    this.vy = GAME.jumpVelocity; this.slideT = 0; this.opts.audio.sfx('jump');
  }
  slide() {
    if (this.state !== 'running') return;
    if (this.y > 0.01) { this.vy = -24; this.queuedSlide = true; return; } // fast-fall, then slide on landing
    this.slideT = GAME.slideTime; this.opts.audio.sfx('slide');
  }
  useAbility() { if (this.state === 'running') this.ability.activate(); }

  pause() { if (this.state === 'running') { this.state = 'paused'; this.el.pausebox.hidden = false; } }
  resume() { if (this.state === 'paused') { this.state = 'running'; this.el.pausebox.hidden = true; } }
  togglePause() { this.state === 'running' ? this.pause() : this.resume(); }

  // ----- per-frame update -----
  get score() { return Math.floor(this.distance) + this.coins * GAME.coinScore + this.bonus; }

  update(dt) {
    this.time += dt;
    this.ability.update(dt);
    const baseSpeed = Math.min(GAME.maxSpeed, GAME.baseSpeed + GAME.accel * this.time);
    const target = this.ability.active ? GAME.ability.multiplier : 1;
    this.mult += (target - this.mult) * Math.min(1, dt * 6); // smooth in/out
    const speed = baseSpeed * this.mult, dz = speed * dt;
    this.distance += dz;

    this.city.update(dz);
    this.spawner.update(dt, dz, speed, this.distance);

    // player motion
    this.x += (GAME.lanes[this.lane] - this.x) * Math.min(1, dt * GAME.laneChangeSpeed);
    const wasAir = this.y > 0.01;
    this.vy -= GAME.gravity * dt;
    this.y += this.vy * dt;
    if (this.y <= 0) {
      this.y = 0; this.vy = 0;
      if (wasAir) {
        this.opts.audio.sfx('land');
        if (this.queuedSlide) { this.slideT = GAME.slideTime; this.queuedSlide = false; }
      }
    }
    if (this.slideT > 0) this.slideT -= dt;
    const sliding = this.slideT > 0 && this.y <= 0.01, height = sliding ? 0.8 : 1.8;

    this.character.root.position.set(this.x, this.y, 0);
    this.character.update(dt, this.time, speed, { airborne: this.y > 0.05, sliding });

    // ability trails
    if (this.ability.active) {
      this.trailT += dt;
      while (this.trailT > 0.03) { this.trailT -= 0.03; this.particles.trail(this.def.effect, this.x, this.y, 0); }
    }
    this.particles.update(dt, speed);

    // collectibles
    const got = this.spawner.collect(this.x, this.y, height);
    if (got.coins || got.gems) {
      this.coins += got.coins + got.gems * GAME.gemCoins;
      this.bonus += got.gems * GAME.gemBonus;
      this.opts.audio.sfx('coin');
    }

    // collision -> game over
    if (this.spawner.hits(this.x, this.y, height)) { this.crash(); return; }

    // camera follow + speed feel
    const cam = this.camera;
    cam.position.x += (this.x * 0.55 - cam.position.x) * Math.min(1, dt * 5);
    const rm = this.opts.reducedMotion;
    const fov = 60 + (rm ? 0 : (this.mult - 1) * 14);
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 5); cam.updateProjectionMatrix(); }
    cam.position.y = 4.6 + this.y * 0.25 + (this.shake > 0 && !rm ? (Math.random() - 0.5) * this.shake : 0);
    cam.lookAt(this.x * 0.3, 1.6, -9);
    this.shake = Math.max(0, this.shake - dt * 2);

    this.updateHud();
  }

  updateHud() {
    const e = this.el, a = this.ability;
    e.score.textContent = this.score.toLocaleString();
    e.dist.textContent = Math.floor(this.distance) + ' m';
    e.coins.textContent = this.coins;
    e.fill.style.transform = `scaleY(${a.fraction})`;
    e.ability.classList.toggle('active', a.state === 'active');
    e.ability.classList.toggle('cooling', a.state === 'cooldown');
    e.alabel.textContent = a.state === 'ready' ? this.def.abilityName.toUpperCase() + ' (SPACE)'
      : a.state === 'active' ? `ACTIVE ${Math.ceil(a.timer)}s` : `COOLDOWN ${Math.ceil(a.timer)}s`;
  }

  crash() {
    this.state = 'over';
    this.shake = 0.8;
    this.opts.audio.sfx('crash');
    this.character.setTransformed(false);
    this.updateHud();
    const stats = { score: this.score, distance: Math.floor(this.distance), coins: this.coins, character: this.def.id };
    setTimeout(() => { if (!this.disposed) this.opts.onGameOver(stats); }, 700);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.input.dispose();
    this.ro.disconnect();
    document.removeEventListener('visibilitychange', this.onHide);
    window.removeEventListener('blur', this.onHide2);
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); });
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.hud.remove();
  }
}
