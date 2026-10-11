import { CHARACTERS, ACHIEVEMENTS, getCharacter, GAME } from '../app/config.js';
import { getState, saveState } from '../app/state.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('');
const avatar = (c, cls = '') =>
  `<div class="avatar ${cls}" style="--a:${hex(c.colors.outfit)};--b:${hex(c.colors.glow)}"><span>${initials(c.name)}</span></div>`;

const NAV = [['home', 'Home'], ['runner', 'Endless Runner'], ['battle', 'Battle Mode'],
  ['characters', 'Characters'], ['leaderboards', 'Leaderboards'], ['profile', 'Profile'], ['settings', 'Settings']];

export class Menu {
  constructor(root, ctx) {
    this.root = root; this.ctx = ctx; this.screen = 'home';
    root.addEventListener('click', (e) => this.onClick(e));
    root.addEventListener('input', (e) => this.onInput(e));
    this.render();
  }
  show() { this.root.hidden = false; this.render(); }
  hide() { this.root.hidden = true; }
  go(screen) { this.screen = screen; this.render(); }

  onClick(e) {
    const t = e.target.closest('[data-nav],[data-action],[data-pick]');
    if (!t) return;
    this.ctx.audio.unlock();
    this.ctx.audio.sfx('click');
    const s = getState();
    if (t.dataset.nav) this.go(t.dataset.nav);
    else if (t.dataset.pick) { s.selectedCharacter = t.dataset.pick; saveState(); this.render(); }
    else if (t.dataset.action === 'play') this.ctx.startRunner();
    else if (t.dataset.action === 'reset') {
      if (confirm('Erase all local progress on this device?')) { localStorage.removeItem('delhibattle.v1'); location.reload(); }
    }
  }
  onInput(e) {
    const s = getState().settings, el = e.target;
    if (el.id === 'set-music') s.music = +el.value;
    else if (el.id === 'set-sfx') s.sfx = +el.value;
    else if (el.id === 'set-mute') s.muted = el.checked;
    else if (el.id === 'set-quality') s.quality = el.value;
    else return;
    saveState();
    this.ctx.audio.unlock();
    this.ctx.audio.apply();
  }

  render() {
    const body = this[this.screen] ? this[this.screen]() : this.home();
    this.root.innerHTML = `
      <header class="topbar">
        <div class="logo" data-nav="home" role="button" tabindex="0" aria-label="DELHI BATTLE home">DELHI<span>BATTLE</span></div>
        <nav>${NAV.map(([id, label]) => `<button class="nav-btn ${id === this.screen ? 'on' : ''}" data-nav="${id}">${label}</button>`).join('')}</nav>
      </header>
      <main class="screen">${body}</main>`;
  }

  home() {
    const s = getState(), c = getCharacter(s.selectedCharacter);
    return `
      <section class="hero">
        <h1>DELHI<span>BATTLE</span></h1>
        <p>Run the city. Transform. Battle it out.</p>
      </section>
      <section class="cards">
        <article class="card mode runner">
          <span class="tag">3D • PLAYABLE NOW</span>
          <h2>Endless Runner</h2>
          <p>Sprint through Delhi in full 3D. Dodge, jump, slide, grab coins and trigger your character's transformation.</p>
          <button class="btn" data-action="play">▶ Play as ${c.name}</button>
        </article>
        <article class="card mode battle soon">
          <span class="tag warn">MULTIPLAYER • COMING SOON</span>
          <h2>Battle Mode</h2>
          <p>Side-view multiplayer action with jetpacks and arcade weapons. Not built yet; Phase 3 adds a practice mode, Phase 4 adds online play.</p>
          <button class="btn ghost" data-nav="battle">Details</button>
        </article>
      </section>
      <section class="strip">
        <h3>Pick your runner</h3>
        <div class="avatars">${CHARACTERS.map((ch) => `<button class="avatar-btn ${ch.id === c.id ? 'on' : ''}" data-pick="${ch.id}" aria-label="Select ${ch.name}">${avatar(ch)}</button>`).join('')}</div>
      </section>
      <section class="card mini">
        <h3>Your records <small>(saved on this device)</small></h3>
        <p>Best score <b>${s.stats.bestScore.toLocaleString()}</b> · Best distance <b>${s.stats.bestDistance} m</b> · Total coins <b>${s.stats.totalCoins}</b></p>
      </section>`;
  }

  runner() {
    const s = getState(), c = getCharacter(s.selectedCharacter);
    return `
      <section class="card wide">
        <div class="row">${avatar(c, 'big')}
          <div><h2>${c.name}</h2><p class="muted">${c.tagline}</p>
            <p><b>${c.abilityName}:</b> ${c.abilityDesc}</p>
            <p class="muted">${GAME.ability.duration}s boost × ${GAME.ability.multiplier} speed, ${GAME.ability.cooldown}s cooldown.${c.placeholder ? ' Placeholder look until you provide references.' : ''}</p></div></div>
        <button class="btn big" data-action="play">▶ PLAY — Delhi</button>
        <button class="btn ghost" data-nav="characters">Change character</button>
      </section>
      <section class="card wide"><h3>Controls</h3>
        <table class="plain">
          <tr><td>Move lanes</td><td>← → / A D · swipe left/right</td></tr>
          <tr><td>Jump</td><td>↑ / W · swipe up</td></tr>
          <tr><td>Slide</td><td>↓ / S · swipe down</td></tr>
          <tr><td>Ability</td><td>Space · on-screen button</td></tr>
          <tr><td>Pause</td><td>Esc · pause button</td></tr>
        </table></section>`;
  }

  battle() {
    return `<section class="card wide soon"><span class="tag warn">COMING SOON</span>
      <h2>Battle Mode</h2>
      <p>Planned: jetpack movement, arcade weapons, health/respawns, practice bots (Phase 3), then server-authoritative online rooms (Phase 4).</p>
      <p class="muted">Nothing here is playable yet. The runner is the working part of the game.</p>
      <button class="btn" data-nav="runner">Play the Runner instead</button></section>`;
  }

  characters() {
    const sel = getState().selectedCharacter;
    return `<h2 class="title">Characters</h2><div class="grid">${CHARACTERS.map((c) => `
      <button class="card char ${c.id === sel ? 'on' : ''}" data-pick="${c.id}" aria-label="Select ${c.name}" style="--a:${hex(c.colors.outfit)};--b:${hex(c.colors.glow)}">
        ${avatar(c, 'big')}
        <h3>${c.name}</h3><p class="muted">${c.tagline}</p>
        <p><b>${c.abilityName}</b><br><small>${c.abilityDesc}</small></p>
        ${c.placeholder ? '<span class="tag warn">PLACEHOLDER LOOK</span>' : ''}
        ${c.id === sel ? '<span class="tag">SELECTED</span>' : ''}
      </button>`).join('')}</div>
      <p class="center"><button class="btn" data-action="play">▶ Play as ${getCharacter(sel).name}</button></p>`;
  }

  leaderboards() {
    const s = getState().stats;
    return `<h2 class="title">Leaderboards</h2>
      <section class="card wide"><span class="tag warn">LOCAL ONLY</span>
        <p>Online leaderboards need accounts and a database (Phase 5). Until then, this shows your personal records on this device. No fake global players are shown.</p>
        <table class="plain">
          <tr><th></th><th>Runner</th></tr>
          <tr><td>Highest score</td><td><b>${s.bestScore.toLocaleString()}</b></td></tr>
          <tr><td>Longest distance</td><td><b>${s.bestDistance} m</b></td></tr>
          <tr><td>Most coins in one run</td><td><b>${s.bestRunCoins}</b></td></tr>
        </table>
        <p class="muted">Battle rankings: coming with Battle Mode.</p></section>`;
  }

  profile() {
    const st = getState(), s = st.stats, c = getCharacter(st.selectedCharacter);
    return `<h2 class="title">Player Profile</h2>
      <section class="card wide"><div class="row">${avatar(c, 'big')}<div><h3>Guest runner</h3><p class="muted">Accounts arrive in Phase 5. Progress is saved on this device.</p></div></div>
        <table class="plain">
          <tr><td>Total runs</td><td>${s.runs}</td></tr>
          <tr><td>Best score</td><td>${s.bestScore.toLocaleString()}</td></tr>
          <tr><td>Longest distance</td><td>${s.bestDistance} m</td></tr>
          <tr><td>Total coins</td><td>${s.totalCoins}</td></tr>
          <tr><td>Battle matches / kills / deaths / wins</td><td>${s.battleMatches} / ${s.kills} / ${s.deaths} / ${s.wins}</td></tr>
          <tr><td>Rating</td><td>${s.rating}</td></tr>
        </table></section>
      <section class="card wide"><h3>Achievements</h3>
        ${ACHIEVEMENTS.map((a) => `<p class="ach ${st.achievements.includes(a.id) ? 'done' : ''}">${st.achievements.includes(a.id) ? '🏆' : '🔒'} <b>${a.name}</b> <small>${a.desc}</small></p>`).join('')}</section>`;
  }

  settings() {
    const s = getState().settings;
    return `<h2 class="title">Settings</h2>
      <section class="card wide settings">
        <label>Music volume <input id="set-music" type="range" min="0" max="1" step="0.05" value="${s.music}"></label>
        <label>Effects volume <input id="set-sfx" type="range" min="0" max="1" step="0.05" value="${s.sfx}"></label>
        <label class="inline"><input id="set-mute" type="checkbox" ${s.muted ? 'checked' : ''}> Mute all audio</label>
        <label>Graphics quality
          <select id="set-quality"><option value="high" ${s.quality === 'high' ? 'selected' : ''}>High</option><option value="low" ${s.quality === 'low' ? 'selected' : ''}>Low (faster on weak devices)</option></select></label>
        <button class="btn ghost" data-action="reset">Reset local progress</button>
      </section>`;
  }
}
