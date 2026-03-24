import { BaseModule } from './BaseModule.js';

/**
 * VCAModule is a voltage-controlled amplifier — a simple GainNode pass-through.
 * Its gain AudioParam can be modulated by envelope, LFO, or other sources.
 * Signal flow: inputNode (GainNode) → outputNode (same GainNode)
 */
export class VCAModule extends BaseModule {
  constructor(audioContext) {
    super(audioContext);
    this._gain = audioContext.createGain();
    this._gain.gain.value = 1;
    this.inputNode = this._gain;
    this.outputNode = this._gain;
  }

  get gain() {
    return this._gain.gain.value;
  }

  set gain(value) {
    this._gain.gain.value = Math.max(0, Math.min(1, value));
  }

  getModParam(name) {
    if (name === 'gain') return this._gain.gain;
    return undefined;
  }
}
