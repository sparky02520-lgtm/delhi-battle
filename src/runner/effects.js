import * as THREE from 'three';

// Per-effect particle look. Particles live in a fixed pool (no allocation while playing).
const FX = {
  gold:     { color: 0xffd24a, shape: 'sphere', size: 0.14, rise: 0.5 },
  laser:    { color: 0xff2a2a, shape: 'box',    size: 0.12, rise: 0.0 },
  electric: { color: 0x4ad8ff, shape: 'box',    size: 0.1,  rise: 0.2 },
  cyber:    { color: 0x39ff9c, shape: 'box',    size: 0.11, rise: 0.0 },
  dog:      { color: 0xc98a4b, shape: 'sphere', size: 0.16, rise: 0.3 },
  burger:   { color: 0xf2a03d, shape: 'sphere', size: 0.24, rise: 0.8 },
  aura:     { color: 0xb35cff, shape: 'sphere', size: 0.13, rise: 1.4 },
  mic:      { color: 0xff5ca8, shape: 'torus',  size: 0.16, rise: 0.6 },
  shock:    { color: 0xffffff, shape: 'torus',  size: 0.22, rise: 0.0 },
};

export class Particles {
  constructor(scene, max = 110) {
    this.geo = {
      sphere: new THREE.SphereGeometry(1, 8, 6),
      box: new THREE.BoxGeometry(1, 1, 1),
      torus: new THREE.TorusGeometry(1, 0.3, 6, 12),
    };
    this.mat = {};
    for (const k of Object.keys(FX)) {
      this.mat[k] = new THREE.MeshBasicMaterial({ color: FX[k].color, transparent: true, opacity: 0.9 });
    }
    this.active = [];
    this.free = [];
    for (let i = 0; i < max; i++) {
      const mesh = new THREE.Mesh(this.geo.sphere, this.mat.gold);
      mesh.visible = false;
      scene.add(mesh);
      this.free.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 1 });
    }
  }
  emit(kind, x, y, z, vx, vy, vz, life) {
    const p = this.free.pop();
    if (!p) return; // pool exhausted: cap on particle count
    const fx = FX[kind];
    p.mesh.geometry = this.geo[fx.shape];
    p.mesh.material = this.mat[kind];
    p.mesh.position.set(x, y, z);
    p.mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.max = life; p.size = fx.size;
    p.mesh.scale.setScalar(fx.size);
    p.mesh.visible = true;
    this.active.push(p);
  }
  // Continuous trail behind the runner while an ability is active
  trail(kind, x, y, z) {
    const r = () => Math.random() - 0.5;
    this.emit(kind, x + r() * 0.7, y + 0.2 + Math.random() * 1.5, z + 0.4,
      r() * 1.2, FX[kind].rise * (0.5 + Math.random()), 2, 0.5 + Math.random() * 0.4);
  }
  // One-off burst when transforming / reverting
  burst(kind, x, y, z, n = 26) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, s = 3 + Math.random() * 3;
      this.emit(kind, x, y, z, Math.cos(a) * s, 1 + Math.random() * 3, Math.sin(a) * s, 0.6 + Math.random() * 0.3);
    }
  }
  update(dt, worldSpeed) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        this.free.push(p);
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += (p.vz + worldSpeed) * dt; // drift back with the scrolling world
      p.mesh.rotation.x += dt * 4;
      p.mesh.scale.setScalar(Math.max(0.001, p.size * (p.life / p.max)));
    }
  }
}
