/**
 * SequencerModule — a 16-step sequencer that outputs note CV and triggers.
 *
 * Uses a lookahead scheduler (setInterval + AudioContext.currentTime)
 * for tight timing without blocking the UI thread.
 *
 * modOutputNode is a ConstantSourceNode whose offset is set to the
 * current step's note frequency — connect it to AudioParams via ModPatchBay.
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

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1; // seconds

export { NOTE_FREQS, NOTE_NAMES };

export class SequencerModule {
  constructor(audioContext, { steps = 16 } = {}) {
    this.context = audioContext;
    this.numSteps = steps;
    this.bpm = 120;
    this._currentStep = 0;
    this._nextStepTime = 0;
    this._timerId = null;
    this._onStep = null;

    // No audio-rate CV output — sequencer uses direct property setting via onStep callback

    // Each step: { active: bool, note: string }
    this.steps = [];
    for (let i = 0; i < this.numSteps; i++) {
      this.steps.push({
        active: i % 4 === 0,
        note: 'C4',
      });
    }
  }

  // No modOutputNode — sequencer routes via onStep callback, not audio-rate CV.
  // ModPatchBay stores the connection but _wire is a no-op (modOutputNode is undefined).

  get stepDuration() {
    return 60 / this.bpm / 4; // sixteenth notes
  }

  get running() {
    return this._timerId !== null;
  }

  get currentStep() {
    return this._currentStep;
  }

  /**
   * Register a callback: onStep(stepIndex, step)
   * Called for each active step so the Rack can trigger connected envelopes.
   */
  set onStep(fn) {
    this._onStep = fn;
  }

  start() {
    if (this.running) return;
    this._currentStep = 0;
    this._nextStepTime = this.context.currentTime;
    this._timerId = setInterval(() => this._schedule(), LOOKAHEAD_MS);
  }

  stop() {
    if (!this.running) return;
    clearInterval(this._timerId);
    this._timerId = null;
  }

  _schedule() {
    while (this._nextStepTime < this.context.currentTime + SCHEDULE_AHEAD) {
      const step = this.steps[this._currentStep];
      if (step.active) {
        if (this._onStep) {
          this._onStep(this._currentStep, step);
        }
      }
      // Notify UI of step change even for inactive steps
      if (this._onStepChange) {
        this._onStepChange(this._currentStep);
      }
      this._nextStepTime += this.stepDuration;
      this._currentStep = (this._currentStep + 1) % this.numSteps;
    }
  }

  /**
   * Register a callback for UI step highlighting.
   */
  set onStepChange(fn) {
    this._onStepChange = fn;
  }
}
