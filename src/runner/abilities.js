// Ability state machine: ready -> active -> cooldown -> ready.
// Pure logic (no rendering) so it is easy to test and rebalance.
export class AbilityController {
  constructor({ duration, cooldown, onStart, onEnd }) {
    this.duration = duration;
    this.cooldown = cooldown;
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.state = 'ready';
    this.timer = 0;
  }
  get active() { return this.state === 'active'; }
  activate() {
    if (this.state !== 'ready') return false; // no re-activation before cooldown ends
    this.state = 'active';
    this.timer = this.duration;
    if (this.onStart) this.onStart();
    return true;
  }
  update(dt) {
    if (this.state === 'ready') return;
    this.timer -= dt;
    if (this.timer > 0) return;
    if (this.state === 'active') {
      this.state = 'cooldown';
      this.timer = this.cooldown;
      if (this.onEnd) this.onEnd();
    } else {
      this.state = 'ready';
      this.timer = 0;
    }
  }
  // 0..1 HUD fill: drains while active, refills while cooling down
  get fraction() {
    if (this.state === 'active') return this.timer / this.duration;
    if (this.state === 'cooldown') return 1 - this.timer / this.cooldown;
    return 1;
  }
}
