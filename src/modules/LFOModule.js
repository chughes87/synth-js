/**
 * LFOModule is a low-frequency oscillator for modulating AudioParams.
 * Instead of connect(target), use modulate(audioParam) to control a parameter.
 * Uses an OscillatorNode → GainNode (depth) → target AudioParam.
 */
export class LFOModule {
  constructor(audioContext) {
    this.context = audioContext;
    this._oscillator = null;
    this._depthNode = audioContext.createGain();
    this._rate = 5;
    this._depth = 100;
    this._type = 'sine';
    this._depthNode.gain.value = this._depth;
  }

  get rate() {
    return this._rate;
  }

  set rate(value) {
    this._rate = value;
    if (this._oscillator) {
      this._oscillator.frequency.value = value;
    }
  }

  get depth() {
    return this._depth;
  }

  set depth(value) {
    this._depth = value;
    this._depthNode.gain.value = value;
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

  /**
   * Connect the LFO output to an AudioParam for modulation.
   */
  modulate(audioParam) {
    this._depthNode.connect(audioParam);
  }

  start() {
    if (this._oscillator) {
      return;
    }
    this._oscillator = this.context.createOscillator();
    this._oscillator.type = this._type;
    this._oscillator.frequency.value = this._rate;
    this._oscillator.connect(this._depthNode);
    this._oscillator.start();
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
