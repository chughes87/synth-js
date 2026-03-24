/**
 * ClockModule — a tempo clock that fires ticks at a configurable BPM and subdivision.
 * Connect to sequencer clock inputs to drive step advancement.
 * No audio output — control only.
 */

const SUBDIVISIONS = {
  '1/4': 1,
  '1/8': 2,
  '1/16': 4,
};

const SUBDIVISION_NAMES = Object.keys(SUBDIVISIONS);

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

export { SUBDIVISION_NAMES };

export class ClockModule {
  constructor(audioContext) {
    this.context = audioContext;
    this._bpm = 120;
    this._subdivision = '1/16';
    this._timerId = null;
    this._nextTickTime = 0;
    this._onTick = null;
  }

  get bpm() { return this._bpm; }
  set bpm(value) { this._bpm = value; }

  get subdivision() { return this._subdivision; }
  set subdivision(value) { this._subdivision = value; }

  get running() { return this._timerId !== null; }

  get tickDuration() {
    const subsPerBeat = SUBDIVISIONS[this._subdivision] ?? 4;
    return 60 / this._bpm / subsPerBeat;
  }

  set onTick(fn) { this._onTick = fn; }

  start() {
    if (this.running) return;
    this._nextTickTime = this.context.currentTime;
    this._timerId = setInterval(() => this._schedule(), LOOKAHEAD_MS);
  }

  stop() {
    if (!this.running) return;
    clearInterval(this._timerId);
    this._timerId = null;
  }

  _schedule() {
    while (this._nextTickTime < this.context.currentTime + SCHEDULE_AHEAD) {
      if (this._onTick) this._onTick();
      this._nextTickTime += this.tickDuration;
    }
  }
}
