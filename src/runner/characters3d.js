import * as THREE from 'three';

const SIL = { tall: [0.95, 1.12], round: [1.2, 0.92], slim: [0.85, 1.05], broad: [1.15, 1.0], normal: [1, 1] };
const std = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05, emissive: 0x000000 });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

// Builds a procedural cartoon runner (no model files). Faces -Z (away from camera).
// Returns { root, update, setTransformed, dispose }.
export function createCharacter(def) {
  const c = def.colors;
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);
  const mats = { skin: std(c.skin), outfit: std(c.outfit), accent: std(c.accent), hair: std(c.hair), dog: std(def.dogColor || 0xc98a4b), dark: std(0x2a1a12) };

  const human = new THREE.Group();
  rig.add(human);
  const [sx, sy] = SIL[def.silhouette] || SIL.normal;
  human.scale.set(sx * 0.8, sy * 0.8, sx * 0.8);

  human.add(mesh(new THREE.CapsuleGeometry(0.36, 0.55, 4, 10), mats.outfit, 0, 1.15, 0));
  human.add(mesh(new THREE.BoxGeometry(0.76, 0.1, 0.5), mats.accent, 0, 0.78, 0)); // belt / trim
  const head = mesh(new THREE.SphereGeometry(0.3, 16, 12), mats.skin, 0, 2.05, 0);
  human.add(head);
  // eyes
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff }), pupil = new THREE.MeshBasicMaterial({ color: 0x111111 });
  for (const s of [-1, 1]) {
    human.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), white, s * 0.11, 2.08, -0.25));
    human.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), pupil, s * 0.11, 2.08, -0.31));
  }
  const eyeGlow = new THREE.Group();
  const glowMat = new THREE.MeshBasicMaterial({ color: c.glow });
  for (const s of [-1, 1]) eyeGlow.add(mesh(new THREE.SphereGeometry(0.095, 8, 6), glowMat, s * 0.11, 2.08, -0.27));
  eyeGlow.visible = false;
  human.add(eyeGlow);

  // hats / hair (silhouette identifiers)
  const hairCap = () => human.add(mesh(new THREE.SphereGeometry(0.315, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.hair, 0, 2.06, 0.01));
  switch (def.hat) {
    case 'quiff': hairCap(); human.add(mesh(new THREE.BoxGeometry(0.5, 0.22, 0.45), mats.hair, 0, 2.4, -0.12)); break;
    case 'hair': hairCap(); break;
    case 'cap':
      human.add(mesh(new THREE.SphereGeometry(0.33, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.accent, 0, 2.1, 0));
      human.add(mesh(new THREE.BoxGeometry(0.42, 0.04, 0.3), mats.accent, 0, 2.14, -0.32)); break;
    case 'beanie':
      human.add(mesh(new THREE.SphereGeometry(0.34, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.accent, 0, 2.1, 0));
      human.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mats.outfit, 0, 2.47, 0)); break;
    case 'bun': hairCap(); human.add(mesh(new THREE.SphereGeometry(0.17, 10, 8), mats.hair, 0, 2.44, 0.05)); break;
    case 'spikes': hairCap();
      for (const x of [-0.15, 0, 0.15]) human.add(mesh(new THREE.ConeGeometry(0.1, 0.3, 6), mats.hair, x, 2.45, 0)); break;
    case 'headset': {
      hairCap();
      const band = mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 16, Math.PI), mats.accent, 0, 2.05, 0);
      human.add(band);
      for (const s of [-1, 1]) human.add(mesh(new THREE.BoxGeometry(0.1, 0.2, 0.2), mats.accent, s * 0.34, 2.05, 0));
      break;
    }
    default: break;
  }

  // limbs (pivots so they can swing)
  const limb = (geo, mat, px, py) => { const g = new THREE.Group(); g.position.set(px, py, 0); g.add(mesh(geo, mat, 0, -geo.parameters.height / 2, 0)); human.add(g); return g; };
  const legGeo = new THREE.BoxGeometry(0.22, 0.62, 0.24), armGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
  const legL = limb(legGeo, mats.accent, -0.17, 0.66), legR = limb(legGeo, mats.accent, 0.17, 0.66);
  const armL = limb(armGeo, mats.skin, -0.5, 1.5), armR = limb(armGeo, mats.skin, 0.5, 1.5);

  // cape (Modi-style effect)
  const cape = mesh(new THREE.PlaneGeometry(1.1, 1.5), new THREE.MeshStandardMaterial({ color: c.accent, side: THREE.DoubleSide, emissive: 0x000000 }), 0, 1.2, 0.38);
  cape.visible = false;
  human.add(cape);

  // glowing halo ring used by most transformations
  const halo = mesh(new THREE.TorusGeometry(0.75, 0.035, 6, 24), new THREE.MeshBasicMaterial({ color: c.glow, transparent: true, opacity: 0.8 }), 0, 1.2, 0);
  halo.rotation.x = Math.PI / 2;
  halo.visible = false;
  rig.add(halo);

  // cartoon dog form (Dhruvrati)
  const dog = new THREE.Group();
  dog.add(mesh(new THREE.BoxGeometry(0.55, 0.5, 1.1), mats.dog, 0, 0.7, 0));
  dog.add(mesh(new THREE.BoxGeometry(0.46, 0.42, 0.46), mats.dog, 0, 1.0, -0.68));
  dog.add(mesh(new THREE.BoxGeometry(0.24, 0.2, 0.26), mats.dark, 0, 0.92, -0.98));
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.BoxGeometry(0.12, 0.3, 0.16), mats.dark, s * 0.2, 1.3, -0.62); ear.rotation.z = s * 0.3; dog.add(ear);
    dog.add(mesh(new THREE.SphereGeometry(0.05, 6, 6), pupil, s * 0.12, 1.08, -0.9));
  }
  const tail = mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), mats.dog, 0, 0.95, 0.7); tail.rotation.x = -0.6; dog.add(tail);
  const dogLegs = [[-0.2, -0.4], [0.2, -0.4], [-0.2, 0.4], [0.2, 0.4]].map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0.5, z);
    g.add(mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), mats.dog, 0, -0.25, 0)); dog.add(g); return g;
  });
  dog.scale.setScalar(1.25);
  dog.visible = false;
  rig.add(dog);

  const lit = [mats.skin, mats.outfit, mats.accent, mats.hair, mats.dog, cape.material];
  let transformed = false, pop = 1, glowK = 0;

  function setTransformed(on) {
    if (on === transformed) return;
    transformed = on; pop = 0; // restart pop animation
    const isDog = def.effect === 'dog';
    human.visible = !(on && isDog);
    dog.visible = on && isDog;
    eyeGlow.visible = on && def.effect === 'laser';
    cape.visible = on && def.effect === 'laser';
    halo.visible = on && !isDog;
  }

  function update(dt, t, speed, flags) {
    glowK += ((transformed ? 1 : 0) - glowK) * Math.min(1, dt * 8);
    for (const m of lit) { m.emissive.setHex(c.glow); m.emissiveIntensity = 0.55 * glowK; }
    pop = Math.min(1, pop + dt / 0.45);
    const popScale = 1 + 0.4 * Math.sin(pop * Math.PI) * (1 - pop); // squash-pop on transform
    const air = flags.airborne, cyc = t * speed * 0.55, sw = air ? 0 : Math.sin(cyc) * 0.9;
    legL.rotation.x = sw; legR.rotation.x = -sw;
    armL.rotation.x = air ? 2.4 : -sw; armR.rotation.x = air ? 2.4 : sw;
    human.position.y = air ? 0 : Math.abs(Math.sin(cyc)) * 0.06;
    dogLegs.forEach((g, i) => { g.rotation.x = (i % 2 ? -sw : sw) * 0.8; });
    tail.rotation.y = Math.sin(t * 14) * 0.5;
    // slide: lean back and drop
    const targetRot = flags.sliding ? 1.35 : 0, targetY = flags.sliding ? 0.3 : 0;
    rig.rotation.x += (targetRot - rig.rotation.x) * Math.min(1, dt * 18);
    rig.position.y += (targetY - rig.position.y) * Math.min(1, dt * 18);
    rig.scale.setScalar(popScale);
    halo.rotation.z += dt * 6;
    halo.position.y = 1.2 + Math.sin(t * 6) * 0.1;
    cape.rotation.x = 0.3 + Math.sin(t * 12) * 0.15;
  }

  function dispose() {
    root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  }

  return { root, update, setTransformed, dispose };
}
