import { ACHIEVEMENTS } from './config.js';

const KEY = 'delhibattle.v1';

const defaults = () => ({
  selectedCharacter: 'trump',
  stats: { runs: 0, bestScore: 0, bestDistance: 0, bestRunCoins: 0, totalCoins: 0,
    battleMatches: 0, kills: 0, deaths: 0, wins: 0, rating: 1000 },
  achievements: [],
  settings: { music: 0.5, sfx: 0.8, muted: false, quality: 'high' },
});

function load() {
  const d = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') {
      return {
        ...d, ...raw,
        stats: { ...d.stats, ...(raw.stats || {}) },
        settings: { ...d.settings, ...(raw.settings || {}) },
        achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
      };
    }
  } catch (e) { /* corrupted or blocked storage: use defaults */ }
  return d;
}

const state = load();
export const getState = () => state;

export function saveState() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
}

// Called when a runner game ends. Returns what changed so the UI can show it.
export function recordRun({ score, distance, coins }) {
  const s = state.stats;
  const result = { newBestScore: score > s.bestScore, newBestDistance: distance > s.bestDistance, unlocked: [] };
  s.runs += 1;
  s.totalCoins += coins;
  s.bestScore = Math.max(s.bestScore, score);
  s.bestDistance = Math.max(s.bestDistance, distance);
  s.bestRunCoins = Math.max(s.bestRunCoins, coins);
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.check(s)) {
      state.achievements.push(a.id);
      result.unlocked.push(a.name);
    }
  }
  saveState();
  return result;
}
