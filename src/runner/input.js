// Keyboard + touch-swipe input. Handlers: left, right, jump, slide, ability, pause.
export class Input {
  constructor(el, h) {
    this.el = el; this.h = h;
    this.keys = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'jump', KeyW: 'jump', ArrowDown: 'slide', KeyS: 'slide',
      Space: 'ability', Escape: 'pause',
    };
    this.sx = 0; this.sy = 0; this.done = true;
    this.onKey = (e) => {
      const a = this.keys[e.code];
      if (!a) return;
      e.preventDefault();
      if (!e.repeat) this.h[a]();
    };
    this.onStart = (e) => {
      const t = e.changedTouches[0];
      this.sx = t.clientX; this.sy = t.clientY; this.done = false;
    };
    this.onMove = (e) => {
      e.preventDefault(); // stop page scrolling while playing
      if (this.done) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this.sx, dy = t.clientY - this.sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
      this.done = true;
      if (Math.abs(dx) > Math.abs(dy)) this.h[dx > 0 ? 'right' : 'left']();
      else this.h[dy > 0 ? 'slide' : 'jump']();
    };
    window.addEventListener('keydown', this.onKey);
    el.addEventListener('touchstart', this.onStart, { passive: true });
    el.addEventListener('touchmove', this.onMove, { passive: false });
  }
  dispose() {
    window.removeEventListener('keydown', this.onKey);
    this.el.removeEventListener('touchstart', this.onStart);
    this.el.removeEventListener('touchmove', this.onMove);
  }
}
