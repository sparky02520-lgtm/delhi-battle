import * as THREE from 'three';
import { GAME } from '../app/config.js';

const PALETTE = [0xe86a4a, 0xf2b84b, 0xd94f8a, 0x2bb3a3, 0xf08a3c, 0x8e6ad8, 0xe9d8a6, 0x4f8fe8];
const ADS = ['CHAI & CO.', 'DILLI DRIVE', 'METRO MAZA', 'SAMOSA SUPREME', 'DESI DEALS']; // original fictional brands
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const matCache = new Map();
const matFor = (color, extra = {}) => {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra }));
  return matCache.get(key);
};
const BOX = new THREE.BoxGeometry(1, 1, 1);

function billboardTexture(text, color) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#' + color.toString(16).padStart(6, '0'); g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(6, 6, 244, 116);
  g.fillStyle = '#fff'; g.font = 'bold 30px Impact, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------- City: recycled road/building segments (Delhi look) ----------
export class City {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.L = GAME.segmentLength;
    this.billMats = ADS.map((t, i) => new THREE.MeshBasicMaterial({ map: billboardTexture(t, PALETTE[(i * 2) % PALETTE.length]) }));
    this.billGeo = new THREE.PlaneGeometry(6, 3);
    this.segments = [];
    for (let i = 0; i < GAME.segmentCount; i++) {
      const seg = this.makeSegment();
      seg.position.z = 20 - i * this.L;
      this.randomize(seg);
      this.group.add(seg);
      this.segments.push(seg);
    }
  }
  makeSegment() {
    const seg = new THREE.Group(), L = this.L;
    const add = (mat, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); seg.add(m); return m; };
    add(matFor(0x3a3a48), 10, 0.2, L, 0, -0.1, 0);                 // road
    add(matFor(0xb9a58a), 4, 0.3, L, -7, 0.05, 0);                  // sidewalks
    add(matFor(0xb9a58a), 4, 0.3, L, 7, 0.05, 0);
    for (const x of [-1.3, 1.3]) for (let k = 0; k < 5; k++) add(matFor(0xffffff, { emissive: 0x555555 }), 0.12, 0.02, 3, x, 0.01, -L / 2 + 4 + k * 8); // lane dashes
    seg.userData.buildings = [];
    for (const side of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const z = -L / 2 + 5 + k * 10;
        const b = add(matFor(0xffffff), 1, 1, 1, 0, 0, z);
        const awning = add(matFor(0xffffff), 1, 0.3, 6, 0, 3.2, z);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), matFor(0xf4d27a, { metalness: 0.3 }));
        seg.add(dome);
        seg.userData.buildings.push({ b, awning, dome, side, z, bill: null });
      }
      for (const z of [-10, 10]) { // streetlights
        add(matFor(0x444444), 0.15, 5, 0.15, side * 5.4, 2.5, z);
        add(matFor(0xfff2a8, { emissive: 0xffd24a, emissiveIntensity: 0.8 }), 0.5, 0.25, 0.5, side * 5.0, 5.1, z);
      }
    }
    seg.userData.bill = new THREE.Mesh(this.billGeo, this.billMats[0]);
    seg.add(seg.userData.bill);
    return seg;
  }
  randomize(seg) {
    const L = this.L;
    seg.userData.buildings.forEach((o, i) => {
      const w = rnd(6.5, 8.5);
      const h = rnd(7, 18);
      o.b.material = matFor(pick(PALETTE));
      o.b.scale.set(w, h, 8);
      o.b.position.set(o.side * (9.5 + w / 2), h / 2, o.z);
      o.awning.material = matFor(pick(PALETTE));
      o.awning.position.set(o.side * 8.6, 3.2, o.z);
      const hasDome = Math.random() < 0.4;
      o.dome.visible = hasDome;
      o.dome.position.set(o.side * (9.5 + w / 2), h, o.z);
    });
    // one billboard per segment on a building front
    const o = seg.userData.buildings[1 + Math.floor(Math.random() * 6) % 6];
    const bill = seg.userData.bill;
    o.b.scale.y = Math.max(o.b.scale.y, 11); o.b.position.y = o.b.scale.y / 2;
    bill.material = pick(this.billMats);
    bill.position.set(o.side * 9.45, 7.5, o.z);
    bill.rotation.y = o.side > 0 ? -Math.PI / 2 : Math.PI / 2;
  }
  update(dz) {
    for (const seg of this.segments) {
      seg.position.z += dz;
      if (seg.position.z - this.L / 2 > 45) { // fully behind the camera: recycle ahead
        seg.position.z -= this.segments.length * this.L;
        this.randomize(seg);
      }
    }
  }
}

// ---------- Obstacles & collectibles ----------
// y = height of the bottom of the hitbox, h = hitbox height. need = how the player passes it.
const TYPES = {
  barrier:  { w: 2.0, h: 0.9, d: 0.6, y: 0,   color: 0xff7a1a, need: 'jump',  weight: 3 },
  roadwork: { w: 2.0, h: 1.1, d: 1.2, y: 0,   color: 0xffcc00, need: 'jump',  weight: 2 },
  crate:    { w: 1.8, h: 1.5, d: 1.8, y: 0,   color: 0xb07a3c, need: 'jump',  weight: 2 },
  overhead: { w: 2.4, h: 0.9, d: 0.6, y: 1.2, color: 0x2fd1ff, need: 'slide', weight: 3 },
  rickshaw: { w: 1.7, h: 2.0, d: 3.2, y: 0,   color: 0x2fbf71, need: 'dodge', weight: 3 },
  train:    { w: 2.3, h: 3.2, d: 12,  y: 0,   color: 0x4a7bff, need: 'dodge', weight: 2 },
};
const TYPE_LIST = Object.entries(TYPES).flatMap(([k, t]) => Array(t.weight).fill(k));

function buildObstacle(type) {
  const t = TYPES[type], g = new THREE.Group();
  const add = (mat, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); };
  add(matFor(t.color), t.w, t.h, t.d, 0, t.y + t.h / 2, 0);
  if (type === 'barrier' || type === 'roadwork') add(matFor(0xffffff), t.w + 0.02, 0.18, t.d + 0.02, 0, t.y + t.h * 0.7, 0);
  if (type === 'overhead') for (const s of [-1, 1]) add(matFor(0x555555), 0.15, 2.1, 0.15, s * (t.w / 2 - 0.1), 1.05, 0);
  if (type === 'rickshaw') { add(matFor(0xffd23a), t.w, 0.25, t.d * 0.8, 0, t.h + 0.1, 0.1); add(matFor(0x222222), t.w + 0.05, 0.5, 0.6, 0, 0.4, -t.d / 2 + 0.3); }
  if (type === 'train') { add(matFor(0x1b2438), t.w + 0.05, 0.8, t.d - 1, 0, 2.1, 0); add(matFor(0xffffff, { emissive: 0xffffcc }), 0.8, 0.4, 0.1, 0, 1.2, t.d / 2 + 0.05); }
  if (type === 'crate') add(matFor(0x8a5a26), t.w + 0.04, 0.12, t.d + 0.04, 0, t.h / 2, 0);
  return g;
}

export class ObstacleSpawner {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.coins = [];
    this.pool = new Map();
    this.coinPool = [];
    this.gemPool = [];
    this.coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16).rotateX(Math.PI / 2);
    this.gemGeo = new THREE.OctahedronGeometry(0.5);
    this.coinMat = new THREE.MeshStandardMaterial({ color: 0xffd24a, emissive: 0xaa7a00, metalness: 0.6, roughness: 0.3 });
    this.gemMat = new THREE.MeshStandardMaterial({ color: 0x35e0ff, emissive: 0x0a7a99, metalness: 0.4, roughness: 0.2 });
    this.sinceRow = 999; // spawn first row quickly
    this.gap = 0;
  }
  acquireObstacle(type) {
    const list = this.pool.get(type) || [];
    const m = list.pop() || buildObstacle(type);
    this.scene.add(m);
    return m;
  }
  releaseObstacle(o) {
    this.scene.remove(o.mesh);
    if (!this.pool.has(o.type)) this.pool.set(o.type, []);
    this.pool.get(o.type).push(o.mesh);
  }
  addCoin(x, y, z, gem) {
    const pool = gem ? this.gemPool : this.coinPool;
    const mesh = pool.pop() || new THREE.Mesh(gem ? this.gemGeo : this.coinGeo, gem ? this.gemMat : this.coinMat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.coins.push({ mesh, gem });
  }
  releaseCoin(c) {
    this.scene.remove(c.mesh);
    (c.gem ? this.gemPool : this.coinPool).push(c.mesh);
  }
  reset() {
    this.obstacles.forEach((o) => this.releaseObstacle(o)); this.obstacles.length = 0;
    this.coins.forEach((c) => this.releaseCoin(c)); this.coins.length = 0;
    this.sinceRow = 999;
  }
  // Fairness rule: every row always leaves at least one lane completely free.
  spawnRow(distance, speed) {
    const z0 = GAME.spawnZ, free = Math.floor(Math.random() * 3);
    const p = Math.min(0.85, 0.45 + distance / 4000); // more blockers as you progress
    for (let lane = 0; lane < 3; lane++) {
      if (lane === free || Math.random() > p) continue;
      const type = pick(TYPE_LIST), t = TYPES[type];
      const mesh = this.acquireObstacle(type);
      mesh.position.set(GAME.lanes[lane], 0, z0 - t.d / 2);
      this.obstacles.push({ mesh, type, def: t });
      if (type === 'barrier' && Math.random() < 0.6) { // coin arc over a jumpable barrier
        for (let i = 0; i < 5; i++) this.addCoin(GAME.lanes[lane], 1.0 + Math.sin((i / 4) * Math.PI) * 1.8, z0 - t.d / 2 + (i - 2) * 1.6, false);
      }
    }
    const r = Math.random();
    if (r < 0.65) for (let i = 0; i < 6; i++) this.addCoin(GAME.lanes[free], 0.9, z0 - i * 2.2, false); // coin line
    else if (r < 0.75) this.addCoin(GAME.lanes[free], 1.0, z0 - 3, true); // special gem
    this.gap = speed * 0.95 + 9; // distance until next row (~1s of travel + spacing for long vehicles)
  }
  update(dt, dz, speed, distance) {
    this.sinceRow += dz;
    if (this.sinceRow >= this.gap) { this.sinceRow = 0; this.spawnRow(distance, speed); }
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.mesh.position.z += dz;
      if (o.mesh.position.z - o.def.d / 2 > 14) { this.releaseObstacle(o); this.obstacles.splice(i, 1); }
    }
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.mesh.position.z += dz;
      c.mesh.rotation.y += dt * 4;
      if (c.mesh.position.z > 14) { this.releaseCoin(c); this.coins.splice(i, 1); }
    }
  }
  // AABB test against the player at z=0. Returns true on collision.
  hits(px, py, ph) {
    for (const o of this.obstacles) {
      const d = o.def, m = o.mesh.position;
      if (Math.abs(m.x - px) < d.w / 2 + 0.4 && Math.abs(m.z) < d.d / 2 + 0.35 && py < d.y + d.h && py + ph > d.y) return true;
    }
    return false;
  }
  // Returns { coins, gems } collected this frame
  collect(px, py, ph) {
    let coins = 0, gems = 0;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i], m = c.mesh.position;
      if (Math.abs(m.x - px) < 0.8 && Math.abs(m.z) < 0.9 && m.y > py - 0.3 && m.y < py + ph + 0.3) {
        c.gem ? gems++ : coins++;
        this.releaseCoin(c); this.coins.splice(i, 1);
      }
    }
    return { coins, gems };
  }
}
