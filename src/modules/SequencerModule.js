/**
 * SequencerModule — a 16-step sequencer driven by an external clock.
 *
 * Does not have its own timer. Call tick() to advance one step.
 * Connect a ClockModule to seq.clock in the trigger routing grid.
 */

const NOTE_FREQS = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
  'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
  'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25,
};

const NOTE_NAMES = Object.keys(NOTE_FREQS);

export { NOTE_FREQS, NOTE_NAMES };

export class SequencerModule {
  constructor(_audioContext, { steps = 16 } = {}) {
    this.numSteps = steps;
    this._currentStep = 0;
    this._running = false;
    this._onStep = null;
    this._onStepChange = null;

    // Each step: { active: bool, note: string }
    this.steps = [];
    for (let i = 0; i < this.numSteps; i++) {
      this.steps.push({
        active: i % 4 === 0,
        note: 'C4',
      });
    }
  }

  get running() { return this._running; }
  get currentStep() { return this._currentStep; }

  set onStep(fn) { this._onStep = fn; }
  set onStepChange(fn) { this._onStepChange = fn; }

  /** Arm the sequencer — tick() will now advance steps. */
  start() {
    if (this._running) return;
    this._currentStep = 0;
    this._running = true;
  }

  /** Disarm the sequencer — tick() becomes a no-op. */
  stop() {
    this._running = false;
  }

  /** Advance one step. Called by an external clock or trigger. */
  tick() {
    if (!this._running) return;

    const step = this.steps[this._currentStep];
    if (step.active && this._onStep) {
      this._onStep(this._currentStep, step);
    }
    if (this._onStepChange) {
      this._onStepChange(this._currentStep);
    }
    this._currentStep = (this._currentStep + 1) % this.numSteps;
  }
}
