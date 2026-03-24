import { BaseModule } from './BaseModule.js';

/**
 * EnvelopeModule generates an ADSR control signal for modulating AudioParams.
 * Uses ConstantSourceNode(1) → GainNode with ADSR scheduled on the gain.
 * The GainNode output (_outputNode) connects to target AudioParams (e.g. VCA gain).
 * Call trigger() on note-on and release() on note-off.
 */
export class EnvelopeModule extends BaseModule {
  constructor(audioContext) {
    super(audioContext);
    this._source = null;
    this._outputNode = audioContext.createGain();
    this._outputNode.gain.value = 0;

    this.attack = 0.01;
    this.decay = 0.1;
    this.sustain = 0.7;
    this.releaseTime = 0.3;
  }

  get running() {
    return this._source !== null;
  }

  start() {
    if (this._source) return;
    this._source = this.context.createConstantSource();
    this._source.offset.value = 1;
    this._source.connect(this._outputNode);
    this._source.start();
  }

  stop() {
    if (!this._source) return;
    this._source.stop();
    this._source.disconnect();
    this._source = null;
  }

  trigger() {
    const now = this.context.currentTime;
    const gain = this._outputNode.gain;

    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0, now);
    gain.linearRampToValueAtTime(1, now + this.attack);
    gain.linearRampToValueAtTime(this.sustain, now + this.attack + this.decay);
  }

  release() {
    const now = this.context.currentTime;
    const gain = this._outputNode.gain;

    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + this.releaseTime);
  }
}
