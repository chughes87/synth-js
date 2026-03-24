import { BaseModule } from './BaseModule.js';

/**
 * OscillatorModule wraps a Web Audio OscillatorNode.
 * Because OscillatorNode is one-shot, start() creates a fresh node each time.
 */
export class OscillatorModule extends BaseModule {
  constructor(audioContext) {
    super(audioContext);
    this._oscillator = null;
    this._frequency = 440;
    this._type = 'sine';
    this.outputNode = audioContext.createGain();
  }

  get frequency() {
    return this._frequency;
  }

  set frequency(value) {
    this._frequency = value;
    if (this._oscillator) {
      this._oscillator.frequency.value = value;
    }
  }

  get type() {
    return this._type;
  }

  set type(value) {
    this._type = value;
    if (this._oscillator) {
      this._oscillator.type = value;
    }
  }

  get running() {
    return this._oscillator !== null;
  }

  start() {
    if (this._oscillator) {
      return;
    }
    this._oscillator = this.context.createOscillator();
    this._oscillator.type = this._type;
    this._oscillator.frequency.value = this._frequency;
    this._oscillator.connect(this.outputNode);
    this._oscillator.start();
  }

  getModParam(name) {
    if (name === 'freq') return this._oscillator?.frequency;
    return undefined;
  }

  stop() {
    if (!this._oscillator) {
      return;
    }
    this._oscillator.stop();
    this._oscillator.disconnect();
    this._oscillator = null;
  }
}
