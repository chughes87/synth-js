/**
 * TriggerModule — a manual trigger button.
 * When fired, calls onFire callback so connected targets can be triggered.
 * No audio output — control only.
 */
export class TriggerModule {
  constructor(_audioContext) {
    this._onFire = null;
  }

  set onFire(fn) {
    this._onFire = fn;
  }

  fire() {
    if (this._onFire) this._onFire();
  }

  // Control-only module — no audio nodes
  get running() { return false; }
  stop() {}
}
