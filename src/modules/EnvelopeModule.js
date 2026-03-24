/**
 * EnvelopeModule applies an ADSR envelope to a GainNode.
 * Signal passes through: inputNode → gain (envelope) → outputNode
 * Call trigger() on note-on and release() on note-off.
 */
export class EnvelopeModule {
  constructor(audioContext) {
    this.context = audioContext;
    this._gain = audioContext.createGain();
    this._gain.gain.value = 0;
    this.inputNode = this._gain;
    this.outputNode = this._gain;

    this.attack = 0.01;
    this.decay = 0.1;
    this.sustain = 0.7;
    this.releaseTime = 0.3;
  }

  connect(target) {
    const destination = target.inputNode ?? target;
    this.outputNode.connect(destination);
  }

  trigger() {
    const now = this.context.currentTime;
    const gain = this._gain.gain;

    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0, now);
    gain.linearRampToValueAtTime(1, now + this.attack);
    gain.linearRampToValueAtTime(this.sustain, now + this.attack + this.decay);
  }

  release() {
    const now = this.context.currentTime;
    const gain = this._gain.gain;

    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + this.releaseTime);
  }
}
