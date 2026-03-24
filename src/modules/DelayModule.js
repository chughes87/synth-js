/**
 * DelayModule wraps a DelayNode with a feedback loop.
 * Signal flow: inputNode (gain) → delay → outputNode (gain)
 *                                   ↑          ↓
 *                                   ← feedback ←
 */
export class DelayModule {
  constructor(audioContext, { maxDelay = 2 } = {}) {
    this.context = audioContext;
    this._delay = audioContext.createDelay(maxDelay);
    this._feedback = audioContext.createGain();
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();

    // dry signal: input → output
    this.inputNode.connect(this.outputNode);
    // wet signal: input → delay → output
    this.inputNode.connect(this._delay);
    this._delay.connect(this.outputNode);
    // feedback loop: delay → feedback gain → delay
    this._delay.connect(this._feedback);
    this._feedback.connect(this._delay);

    this._feedback.gain.value = 0.3;
    this._delay.delayTime.value = 0.3;
  }

  get delayTime() {
    return this._delay.delayTime.value;
  }

  set delayTime(value) {
    this._delay.delayTime.value = value;
  }

  get feedback() {
    return this._feedback.gain.value;
  }

  set feedback(value) {
    this._feedback.gain.value = Math.max(0, Math.min(0.95, value));
  }

  connect(target) {
    const destination = target.inputNode ?? target;
    this.outputNode.connect(destination);
  }
}
