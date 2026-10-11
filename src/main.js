import './styles/main.css';
import { getCharacter } from './app/config.js';
import { getState, recordRun } from './app/state.js';
import { AudioService } from './services/audio.js';
import { Menu } from './ui/menu.js';
import { RunnerGame } from './runner/runner-game.js';

const audio = new AudioService(() => getState().settings);
const menuRoot = document.getElementById('app');
const gameRoot = document.getElementById('game-root');
const loading = document.getElementById('loading');
let runner = null;
let menu;

function disposeRunner() {
  if (runner) { runner.dispose(); runner = null; }
  gameRoot.querySelectorAll('.gameover').forEach((n) => n.remove());
}

function exitToMenu() {
  disposeRunner();
  gameRoot.hidden = true;
  audio.stopMusic();
  menu.show();
}

function startRunner() {
  audio.unlock(); // first user gesture: allowed to start audio
  disposeRunner();
  menu.hide();
  loading.hidden = false;
  document.getElementById('loading-text').textContent = 'Loading Delhi…';
  setTimeout(() => { // let the loading screen paint before heavy setup
    loading.hidden = true;
    gameRoot.hidden = false;
    audio.startMusic();
    try {
      runner = new RunnerGame(gameRoot, getCharacter(getState().selectedCharacter), {
        audio,
        quality: getState().settings.quality,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onGameOver: showGameOver,
        onQuit: exitToMenu,
      });
    } catch (err) {
      console.error(err);
      gameRoot.hidden = true; menu.show();
      alert('Could not start the 3D game (WebGL may be unavailable). Try another browser or device.');
    }
  }, 350);
}

function showGameOver(stats) {
  const res = recordRun(stats);
  audio.sfx('result');
  const box = document.createElement('div');
  box.className = 'gameover';
  box.innerHTML = `
    <div class="card">
      <h2>GAME OVER</h2>
      <p class="big-score">${stats.score.toLocaleString()}</p>
      ${res.newBestScore ? '<p class="tag">NEW BEST SCORE!</p>' : `<p class="muted">Best: ${getState().stats.bestScore.toLocaleString()}</p>`}
      <p>${stats.distance} m · ${stats.coins} coins</p>
      ${res.unlocked.map((n) => `<p class="tag">🏆 Achievement: ${n}</p>`).join('')}
      <button class="btn" data-g="again">↻ Restart</button>
      <button class="btn ghost" data-g="menu">Main menu</button>
    </div>`;
  box.addEventListener('click', (e) => {
    const g = e.target.dataset.g;
    if (g === 'again') startRunner();
    if (g === 'menu') exitToMenu();
  });
  gameRoot.appendChild(box);
}

menu = new Menu(menuRoot, { audio, startRunner });
