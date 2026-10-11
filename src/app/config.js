// Central game configuration. Edit values here to rebalance or rename things.

export const GAME = {
  lanes: [-2.6, 0, 2.6],
  laneChangeSpeed: 14,
  baseSpeed: 16,
  maxSpeed: 34,
  accel: 0.2, // speed gained per second of play (before ability multiplier)
  gravity: 38,
  jumpVelocity: 14,
  slideTime: 0.7,
  segmentLength: 40,
  segmentCount: 7,
  spawnZ: -150,
  coinScore: 10,
  gemCoins: 10,
  gemBonus: 100,
  // Ability balance (same for all characters in v1)
  ability: { duration: 5, cooldown: 15, multiplier: 1.5 },
};

// effect = visual style of the ability (see runner/effects.js + characters3d.js)
// silhouette: tall | round | slim | broad | normal
// hat: quiff | hair | cap | bun | spikes | headset | beanie | none
// `placeholder: true` = generic stand-in look until you provide references.
// All designs are simple stylized cartoon figures, not realistic likenesses.
export const CHARACTERS = [
  { id: 'trump', name: 'Donald Trump', tagline: 'Big. Golden. Fast.', abilityName: 'Golden Rush',
    abilityDesc: 'Turns solid gold with a glittering trail and a speed boost.',
    effect: 'gold', silhouette: 'tall', hat: 'quiff',
    colors: { skin: 0xf2b38c, outfit: 0x1b2a5c, accent: 0xc8102e, hair: 0xf4c95d, glow: 0xffd24a } },
  { id: 'modi', name: 'Narendra Modi', tagline: 'Calm. Focused. Cape on.', abilityName: 'Laser Eyes',
    abilityDesc: 'Eyes glow with a stylised laser effect, a cape appears, speed boost.',
    effect: 'laser', silhouette: 'normal', hat: 'hair',
    colors: { skin: 0xd9a07a, outfit: 0xf28c28, accent: 0xffffff, hair: 0xe8e8e8, glow: 0xff3b30 } },
  { id: 'rahul', name: 'Rahul Gandhi', tagline: 'Fully charged.', abilityName: 'Voltage',
    abilityDesc: 'Electric energy and trails crackle around you, speed boost.',
    effect: 'electric', silhouette: 'slim', hat: 'hair',
    colors: { skin: 0xd9a27c, outfit: 0xf4f4f4, accent: 0x1f8f4e, hair: 0x2a2a2a, glow: 0x4ad8ff } },
  { id: 'musk', name: 'Elon Musk', tagline: 'Ship it. Run faster.', abilityName: 'Cyber Surge',
    abilityDesc: 'Futuristic cyber glow with digital trails, speed boost.',
    effect: 'cyber', silhouette: 'broad', hat: 'hair',
    colors: { skin: 0xf0c4a0, outfit: 0x15151f, accent: 0x39ff9c, hair: 0x4a3a2a, glow: 0x39ff9c } },
  { id: 'dhruvrati', name: 'Dhruvrati', tagline: 'Who let the dog out?', abilityName: 'Dog Mode', placeholder: true,
    abilityDesc: 'Transforms into a cartoon dog and keeps running, speed boost.',
    effect: 'dog', silhouette: 'round', hat: 'beanie',
    colors: { skin: 0xc98f6b, outfit: 0x7a3cff, accent: 0xffd24a, hair: 0x1a1a1a, glow: 0xffa24a } },
  { id: 'vijeta', name: 'Vijeta Dhaiya', tagline: 'Extra cheese.', abilityName: 'Burger Blast', placeholder: true,
    abilityDesc: 'Floating cartoon burgers swirl around you, speed boost.',
    effect: 'burger', silhouette: 'slim', hat: 'bun',
    colors: { skin: 0xe6b08e, outfit: 0xff5a36, accent: 0xffd24a, hair: 0x2a1a12, glow: 0xffb347 } },
  { id: 'amisha', name: 'Amisha', tagline: 'Main character energy.', abilityName: 'Power Aura', placeholder: true,
    abilityDesc: 'A dramatic aura with rising energy particles, speed boost.',
    effect: 'aura', silhouette: 'normal', hat: 'spikes',
    colors: { skin: 0xe3a98a, outfit: 0x2dd4bf, accent: 0xb35cff, hair: 0x1a1a1a, glow: 0xb35cff } },
  { id: 'abhijit', name: 'Abhijit Jipke', tagline: 'Mic check, one two.', abilityName: 'Sound Wave', placeholder: true,
    abilityDesc: 'Microphone vibes with musical energy trails, speed boost.',
    effect: 'mic', silhouette: 'normal', hat: 'headset',
    colors: { skin: 0xcf9770, outfit: 0xff3d81, accent: 0xffffff, hair: 0x2a1a12, glow: 0xff5ca8 } },
  { id: 'shehbaz', name: 'Shehbaz Sharif', tagline: 'Impact incoming.', abilityName: 'Impact Burst', placeholder: true,
    abilityDesc: 'Shockwave rings and impact particles, speed boost.',
    effect: 'shock', silhouette: 'broad', hat: 'cap',
    colors: { skin: 0xd9a27c, outfit: 0x0f6b3f, accent: 0xffffff, hair: 0xdddddd, glow: 0xff7a1a } },
];

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];

export const ACHIEVEMENTS = [
  { id: 'first_run', name: 'First Run', desc: 'Finish one runner game.', check: (s) => s.runs >= 1 },
  { id: 'coins100', name: 'First 100 Coins', desc: 'Collect 100 coins in total.', check: (s) => s.totalCoins >= 100 },
  { id: 'long_distance', name: 'Long-Distance Runner', desc: 'Run 1000 m in one go.', check: (s) => s.bestDistance >= 1000 },
  { id: 'first_win', name: 'First Battle Win', desc: 'Win a battle match. (Battle mode: coming soon)', check: (s) => s.wins >= 1 },
  { id: 'ten_kills', name: 'Ten Eliminations', desc: 'Get 10 kills. (Battle mode: coming soon)', check: (s) => s.kills >= 10 },
  { id: 'city_explorer', name: 'City Explorer', desc: 'Run in all 3 cities. (Bengaluru & Mumbai: coming soon)', check: () => false },
];
